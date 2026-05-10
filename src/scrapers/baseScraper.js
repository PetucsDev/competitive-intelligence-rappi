const BrowserManager = require('../utils/browserManager');
const logger = require('../utils/logger');

class BaseScraper {
  constructor(platformName) {
    this.platform = platformName;
    this.browserManager = new BrowserManager();
    this.results = [];
  }

  async init() {
    await this.browserManager.launch();
    logger.info(`${this.platform} scraper initialized`);
  }

  async teardown() {
    await this.browserManager.close();
    logger.info(`${this.platform} scraper closed`);
  }

  async scrapeWithRetry(scrapeFn, address, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        logger.info(`[${this.platform}] Scraping ${address.zoneName} (attempt ${i + 1}/${maxRetries})`);
        const result = await scrapeFn();
        if (result) {
          logger.success(`[${this.platform}] Success for ${address.zoneName}`);
          return result;
        }
        throw new Error('Empty result');
      } catch (err) {
        logger.error(`[${this.platform}] Error on ${address.zoneName}: ${err.message}`, { attempt: i + 1 });
        if (i < maxRetries - 1) {
          const delay = 5000 * (i + 1);
          logger.info(`[${this.platform}] Retrying in ${delay}ms...`);
          await this.browserManager.sleep(delay);
          // Recreate browser context on retry to avoid fingerprinting
          if (i === maxRetries - 2) {
            await this.browserManager.close();
            await this.browserManager.launch();
          }
        }
      }
    }
    return null;
  }

  createRecord(data) {
    return {
      platform: this.platform,
      scrapedAt: new Date().toISOString(),
      ...data,
    };
  }

  async safeEvaluate(page, fn, fallback = null) {
    try {
      return await page.evaluate(fn);
    } catch (e) {
      logger.warn(`Evaluation error: ${e.message}`);
      return fallback;
    }
  }

  parsePrice(text) {
    if (!text) return null;
    const match = text.replace(/,/g, '').match(/[\d]+\.?\d*/);
    return match ? parseFloat(match[0]) : null;
  }

  parseTime(text) {
    if (!text) return null;
    const match = text.match(/(\d+)[\s-]*(\d*)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return Math.round((min + max) / 2);
    }
    return null;
  }

  delay(ms) {
    return this.browserManager.sleep(ms);
  }
}

module.exports = BaseScraper;
