const { chromium } = require('playwright');
const logger = require('./logger');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
  }

  getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  async launch() {
    if (this.browser) return this.browser;

    logger.info('Launching Chromium browser...');
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'es-MX',
      timezoneId: 'America/Mexico_City',
      permissions: ['geolocation'],
    });

    // Inject stealth script to hide automation
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      window.chrome = { runtime: {} };
    });

    logger.success('Browser launched with stealth context');
    return this.browser;
  }

  async newPage() {
    if (!this.context) await this.launch();
    const page = await this.context.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
    return page;
  }

  async close() {
    if (this.browser) {
      logger.info('Closing browser...');
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async safeGoto(page, url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        logger.info(`Navigating to ${url} (attempt ${i + 1}/${retries})`);
        const response = await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 60000,
        });

        if (response && response.status() >= 400) {
          logger.warn(`HTTP ${response.status()} for ${url}`);
          if (i < retries - 1) {
            const delay = 3000 * (i + 1);
            logger.info(`Retrying in ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }
        }

        // Random delay after page load to mimic human behavior
        const randomDelay = 2000 + Math.random() * 3000;
        await this.sleep(randomDelay);
        return response;
      } catch (err) {
        logger.error(`Navigation error: ${err.message}`, { url, attempt: i + 1 });
        if (i < retries - 1) {
          const delay = 3000 * (i + 1);
          logger.info(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        } else {
          throw err;
        }
      }
    }
  }

  async screenshot(page, platform, zoneName, suffix = '') {
    const dir = require('path').join(process.cwd(), 'screenshots', platform, zoneName);
    require('fs').mkdirSync(dir, { recursive: true });
    const filename = `screenshot_${Date.now()}${suffix ? '_' + suffix : ''}.png`;
    const filepath = require('path').join(dir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    logger.info(`Screenshot saved: ${filepath}`);
    return filepath;
  }
}

module.exports = BrowserManager;
