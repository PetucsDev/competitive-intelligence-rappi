const BaseScraper = require('./baseScraper');
const logger = require('../utils/logger');

/**
 * DiDi Food Scraper
 * DiDi Food opera en Mexico con didi-food.com/es-MX/food/
 * Estrategia similar: busqueda por producto y extraccion de datos del DOM.
 */
class DidiFoodScraper extends BaseScraper {
  constructor() {
    super('DiDiFood');
    this.baseUrl = 'https://www.didi-food.com/es-MX';
  }

  buildSearchUrl(query, lat, lng) {
    return `${this.baseUrl}/food?search=${encodeURIComponent(query)}`;
  }

  async scrapeAddress(address, products) {
    return this.scrapeWithRetry(async () => {
      const page = await this.browserManager.newPage();
      const results = [];

      try {
        await page.context().setGeolocation({ latitude: address.lat, longitude: address.lng });

        for (const product of products) {
          try {
            const searchUrl = this.buildSearchUrl(product.searchTerm, address.lat, address.lng);
            await this.browserManager.safeGoto(page, searchUrl);

            await this.browserManager.screenshot(page, 'didi-food', address.zoneName, product.name);

            const data = await this.extractProductData(page, product, address);
            if (data) {
              results.push(this.createRecord(data));
            }

            await this.delay(2000 + Math.random() * 2000);
          } catch (productErr) {
            logger.error(`[DiDiFood] Product error for ${product.name}: ${productErr.message}`);
          }
        }

        return results;
      } finally {
        await page.close();
      }
    }, address);
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

    data.productPrice = await this.findPrice(page, product.name);
    data.deliveryFee = await this.findFee(page, ['envio', 'Envio', 'delivery', 'Delivery', 'entrega', 'tarifa']);
    data.serviceFee = await this.findFee(page, ['servicio', 'Service', 'comision', 'fee']);
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
      const allElements = Array.from(document.querySelectorAll('*'));
      for (const el of allElements) {
        if (el.children.length === 0 && el.textContent) {
          const text = el.textContent.toLowerCase();
          const searchName = name.toLowerCase();
          if (text.includes(searchName) || text.includes(searchName.replace(' ', ''))) {
            const parent = el.parentElement;
            if (parent) {
              const match = parent.innerText.replace(/,/g, '').match(/\$\s*(\d+\.?\d*)/);
              if (match) return parseFloat(match[1]);
            }
          }
        }
      }

      // Generic price fallback
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
               text.toLowerCase().includes('gratis') || text.toLowerCase().includes('envio gratis'))) {
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
          bodyText.includes('no disponible') || bodyText.includes('unavailable')) {
        return false;
      }
      if (bodyText.includes('abierto') || bodyText.includes('open') ||
          bodyText.includes('ordenar') || bodyText.includes('order') ||
          bodyText.includes('agregar')) {
        return true;
      }
      return null;
    });
  }
}

module.exports = DidiFoodScraper;
