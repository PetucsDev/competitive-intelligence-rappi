const BaseScraper = require('./baseScraper');
const logger = require('../utils/logger');

/**
 * Rappi Scraper
 * Enfoque: Usar la URL de restaurante directa con parametros de ubicacion
 * Los datos se extraen del DOM despues de que la pagina cargue completamente.
 */
class RappiScraper extends BaseScraper {
  constructor() {
    super('Rappi');
    this.baseUrl = 'https://www.rappi.com.mx';
  }

  buildSearchUrl(query, lat, lng) {
    // Rappi usa coordenadas en localStorage/session; la URL de busqueda directa:
    return `${this.baseUrl}/search?store_type=restaurant&query=${encodeURIComponent(query)}&page=1`;
  }

  buildStoreUrl(storeSlug, lat, lng) {
    return `${this.baseUrl}/restaurants/${storeSlug}`;
  }

  async scrapeAddress(address, products) {
    return this.scrapeWithRetry(async () => {
      const page = await this.browserManager.newPage();
      const results = [];

      try {
        // Set geolocation to simulate user in this address
        await page.context().setGeolocation({ latitude: address.lat, longitude: address.lng });

        for (const product of products) {
          try {
            const searchUrl = this.buildSearchUrl(product.searchTerm, address.lat, address.lng);
            await this.browserManager.safeGoto(page, searchUrl);

            // Screenshot for evidence
            await this.browserManager.screenshot(page, 'rappi', address.zoneName, product.name);

            // Extract data from the search results page
            const data = await this.extractProductData(page, product, address);
            if (data) {
              results.push(this.createRecord(data));
            }

            // Rate limiting between products
            await this.delay(2000 + Math.random() * 2000);
          } catch (productErr) {
            logger.error(`[Rappi] Product error for ${product.name}: ${productErr.message}`);
          }
        }

        return results;
      } finally {
        await page.close();
      }
    }, address);
  }

  async extractProductData(page, product, address) {
    // Try multiple selector strategies as Rappi's DOM may vary
    const selectors = {
      productPrice: [
        '[data-testid="product-price"]',
        '.product-price',
        '.price',
        '[class*="price"]',
        'span[class*="Price"]',
      ],
      deliveryFee: [
        '[data-testid="delivery-fee"]',
        '.delivery-fee',
        '[class*="delivery"]',
        '[class*="envio"]',
        'span:has-text("envío")',
        'span:has-text("Envío")',
      ],
      serviceFee: [
        '[data-testid="service-fee"]',
        '.service-fee',
        '[class*="service"]',
        'span:has-text("Servicio")',
      ],
      deliveryTime: [
        '[data-testid="delivery-time"]',
        '.delivery-time',
        '[class*="time"]',
        '[class*="tiempo"]',
        'span:has-text("min")',
        'span:has-text("Min")',
      ],
      discount: [
        '[data-testid="discount"]',
        '.discount',
        '[class*="promo"]',
        '[class*="descuento"]',
        'span:has-text("%")',
      ],
      storeAvailable: [
        '[data-testid="store-open"]',
        '.store-open',
        'button:has-text("Ordenar")',
        'button:has-text("Agregar")',
      ],
    };

    const data = {
      addressId: address.id,
      city: address.city,
      zoneName: address.zoneName,
      zoneType: address.zoneType,
      productName: product.name,
      productCategory: product.category,
      productPrice: null,
      deliveryFee: null,
      serviceFee: null,
      deliveryTimeMinutes: null,
      discountDescription: null,
      storeAvailable: null,
      totalPrice: null,
      url: page.url(),
    };

    // Extract product price - try to find exact product first
    data.productPrice = await this.findPrice(page, product.name);

    // Extract delivery fee from page text
    data.deliveryFee = await this.findFee(page, ['envio', 'Envio', 'ENVIO', 'delivery', 'Delivery', 'shipping']);

    // Extract service fee
    data.serviceFee = await this.findFee(page, ['servicio', 'Servicio', 'SERVICE', 'service fee', 'comision']);

    // Extract delivery time
    data.deliveryTimeMinutes = await this.findDeliveryTime(page);

    // Extract discounts
    data.discountDescription = await this.findDiscount(page);

    // Check availability
    data.storeAvailable = await this.checkAvailability(page);

    // Calculate total if possible
    if (data.productPrice !== null) {
      let total = data.productPrice;
      if (data.deliveryFee !== null) total += data.deliveryFee;
      if (data.serviceFee !== null) total += data.serviceFee;
      data.totalPrice = total;
    }

    return data;
  }

  async findPrice(page, productName) {
    // Strategy: Look for price elements near product name text
    const result = await page.evaluate((name) => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        if (el.textContent && el.textContent.toLowerCase().includes(name.toLowerCase())) {
          // Look for price in siblings or parent
          let parent = el.parentElement;
          for (let i = 0; i < 3 && parent; i++) {
            const priceEl = parent.querySelector('[class*="price"], [class*="Price"], .price, .cost');
            if (priceEl && priceEl.textContent.includes('$')) {
              const match = priceEl.textContent.replace(/,/g, '').match(/\$?\s*(\d+\.?\d*)/);
              if (match) return parseFloat(match[1]);
            }
            parent = parent.parentElement;
          }
        }
      }
      // Fallback: any price on page
      const prices = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent && el.textContent.match(/\$\s*\d+/))
        .map(el => {
          const match = el.textContent.replace(/,/g, '').match(/\$?\s*(\d+\.?\d*)/);
          return match ? parseFloat(match[1]) : null;
        })
        .filter(p => p && p > 10 && p < 500); // reasonable fast food price range
      return prices.length > 0 ? prices[0] : null;
    }, productName);
    return result;
  }

  async findFee(page, keywords) {
    const result = await page.evaluate((kw) => {
      for (const keyword of kw) {
        const elements = Array.from(document.querySelectorAll('*'));
        for (const el of elements) {
          if (el.textContent && el.textContent.toLowerCase().includes(keyword.toLowerCase())) {
            const text = el.textContent;
            const match = text.replace(/,/g, '').match(/\$?\s*(\d+\.?\d*)/);
            if (match) {
              const val = parseFloat(match[1]);
              if (val < 100) return val; // fees are usually under 100 MXN
            }
          }
        }
      }
      return null;
    }, keywords);
    return result;
  }

  async findDeliveryTime(page) {
    const result = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent) {
          const match = el.textContent.match(/(\d+)\s*-\s*(\d+)\s*min/i);
          if (match) return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
          const singleMatch = el.textContent.match(/(\d+)\s*min/i);
          if (singleMatch) return parseInt(singleMatch[1]);
        }
      }
      return null;
    });
    return result;
  }

  async findDiscount(page) {
    const result = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent) {
          const text = el.textContent;
          if (text.includes('%') || text.toLowerCase().includes('descuento') ||
              text.toLowerCase().includes('promo') || text.toLowerCase().includes('oferta') ||
              text.toLowerCase().includes('gratis') || text.toLowerCase().includes('free')) {
            return text.trim().substring(0, 200);
          }
        }
      }
      return null;
    });
    return result;
  }

  async checkAvailability(page) {
    const result = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      if (bodyText.includes('cerrado') || bodyText.includes('closed') ||
          bodyText.includes('no disponible') || bodyText.includes('no disponible')) {
        return false;
      }
      if (bodyText.includes('abierto') || bodyText.includes('open') ||
          bodyText.includes('ordenar') || bodyText.includes('agregar')) {
        return true;
      }
      return null; // unknown
    });
    return result;
  }
}

module.exports = RappiScraper;
