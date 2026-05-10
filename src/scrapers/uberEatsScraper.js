const BaseScraper = require('./baseScraper');
const logger = require('../utils/logger');

/**
 * Uber Eats Scraper
 * Uber Eats Mexico tiene URLs de busqueda por ubicacion.
 * Estrategia: Buscar producto especifico y extraer datos del restaurante.
 */
class UberEatsScraper extends BaseScraper {
  constructor() {
    super('UberEats');
    this.baseUrl = 'https://www.ubereats.com/mx';
  }

  buildSearchUrl(query, lat, lng) {
    // Uber Eats usa una URL de busqueda con query param
    return `${this.baseUrl}/search?diningMode=DELIVERY&q=${encodeURIComponent(query)}`;
  }

  async scrapeAddress(address, products) {
    return this.scrapeWithRetry(async () => {
      const page = await this.browserManager.newPage();
      const results = [];

      try {
        await page.context().setGeolocation({ latitude: address.lat, longitude: address.lng });

        // First, set location on Uber Eats
        await this.setLocation(page, address);

        for (const product of products) {
          try {
            const searchUrl = this.buildSearchUrl(product.searchTerm, address.lat, address.lng);
            await this.browserManager.safeGoto(page, searchUrl);

            await this.browserManager.screenshot(page, 'uber-eats', address.zoneName, product.name);

            const data = await this.extractProductData(page, product, address);
            if (data) {
              results.push(this.createRecord(data));
            }

            await this.delay(2000 + Math.random() * 2000);
          } catch (productErr) {
            logger.error(`[UberEats] Product error for ${product.name}: ${productErr.message}`);
          }
        }

        return results;
      } finally {
        await page.close();
      }
    }, address);
  }

  async setLocation(page, address) {
    try {
      // Navigate to home page to trigger location prompt
      await this.browserManager.safeGoto(page, this.baseUrl);

      // Uber Eats may show a location modal; try to dismiss or interact
      await page.evaluate(() => {
        // Dismiss location modal if present
        const buttons = Array.from(document.querySelectorAll('button'));
        const skipBtn = buttons.find(b => b.textContent.toLowerCase().includes('skip') ||
                                          b.textContent.toLowerCase().includes('omitir'));
        if (skipBtn) skipBtn.click();
      });

      await this.delay(1500);
    } catch (e) {
      logger.warn(`[UberEats] Location setup issue: ${e.message}`);
    }
  }

  async extractProductData(page, product, address) {
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

    // Uber Eats specific selectors and text extraction
    data.productPrice = await this.findPrice(page, product.name);
    data.deliveryFee = await this.findFee(page, ['envio', 'Envio', 'delivery', 'Delivery', 'entrega']);
    data.serviceFee = await this.findFee(page, ['servicio', 'Service', 'tarifa', 'fee']);
    data.deliveryTimeMinutes = await this.findDeliveryTime(page);
    data.discountDescription = await this.findDiscount(page);
    data.storeAvailable = await this.checkAvailability(page);

    if (data.productPrice !== null) {
      let total = data.productPrice;
      if (data.deliveryFee !== null) total += data.deliveryFee;
      if (data.serviceFee !== null) total += data.serviceFee;
      data.totalPrice = total;
    }

    return data;
  }

  async findPrice(page, productName) {
    return page.evaluate((name) => {
      // Look for elements containing product name
      const allElements = Array.from(document.querySelectorAll('*'));
      for (const el of allElements) {
        if (el.children.length === 0 && el.textContent) {
          const text = el.textContent.toLowerCase();
          if (text.includes(name.toLowerCase()) || text.includes(name.toLowerCase().replace(' ', ''))) {
            // Check siblings for price
            const parent = el.parentElement;
            if (parent) {
              const priceText = parent.innerText;
              const match = priceText.replace(/,/g, '').match(/\$\s*(\d+\.?\d*)/);
              if (match) return parseFloat(match[1]);
            }
          }
        }
      }

      // Generic fallback - find all prices in reasonable range
      const prices = allElements
        .filter(el => el.children.length === 0 && el.textContent && el.textContent.match(/^\$\s*\d+[\d,.]*$/))
        .map(el => {
          const match = el.textContent.replace(/,/g, '').match(/\$\s*(\d+\.?\d*)/);
          return match ? parseFloat(match[1]) : null;
        })
        .filter(p => p && p > 10 && p < 500);
      return prices.length > 0 ? prices[0] : null;
    }, productName);
  }

  async findFee(page, keywords) {
    return page.evaluate((kw) => {
      const allElements = Array.from(document.querySelectorAll('*'));
      for (const keyword of kw) {
        for (const el of allElements) {
          if (el.textContent && el.textContent.toLowerCase().includes(keyword.toLowerCase())) {
            const match = el.textContent.replace(/,/g, '').match(/\$\s*(\d+\.?\d*)/);
            if (match) {
              const val = parseFloat(match[1]);
              if (val < 100) return val;
            }
          }
        }
      }
      return null;
    }, keywords);
  }

  async findDeliveryTime(page) {
    return page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      for (const el of allElements) {
        if (el.textContent) {
          const text = el.textContent;
          const match = text.match(/(\d+)\s*[-–]\s*(\d+)\s*min/i);
          if (match) return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
          const singleMatch = text.match(/(\d+)\s*min/i);
          if (singleMatch) return parseInt(singleMatch[1]);
        }
      }
      return null;
    });
  }

  async findDiscount(page) {
    return page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      for (const el of allElements) {
        if (el.textContent) {
          const text = el.textContent;
          if ((text.includes('%') || text.toLowerCase().includes('descuento') ||
               text.toLowerCase().includes('promo') || text.toLowerCase().includes('oferta') ||
               text.toLowerCase().includes('gratis') || text.toLowerCase().includes('envio gratis') ||
               text.toLowerCase().includes('free delivery'))) {
            const trimmed = text.trim();
            if (trimmed.length < 200) return trimmed;
          }
        }
      }
      return null;
    });
  }

  async checkAvailability(page) {
    return page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      if (bodyText.includes('cerrado') || bodyText.includes('closed') ||
          bodyText.includes('no disponible') || bodyText.includes('unavailable') ||
          bodyText.includes('fuera de')) {
        return false;
      }
      if (bodyText.includes('abierto') || bodyText.includes('open') ||
          bodyText.includes('ordenar') || bodyText.includes('order') ||
          bodyText.includes('agregar al carrito')) {
        return true;
      }
      return null;
    });
  }
}

module.exports = UberEatsScraper;
