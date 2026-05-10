const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * CAPTURA DE EVIDENCIA
 * Toma screenshots de las 3 plataformas navegando a paginas reales
 * para demostrar que el sistema de scraping funciona correctamente.
 * Uso: npm run evidence
 */

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots', 'evidence');

const TARGETS = [
  {
    platform: 'Rappi',
    urls: [
      { name: 'home', url: 'https://www.rappi.com.mx' },
      { name: 'restaurantes', url: 'https://www.rappi.com.mx/restaurantes' },
      { name: 'search-mcdonalds', url: 'https://www.rappi.com.mx/restaurantes/busqueda?term=mcdonalds' },
    ],
  },
  {
    platform: 'UberEats',
    urls: [
      { name: 'home', url: 'https://www.ubereats.com/mx' },
      { name: 'search-mcdonalds', url: 'https://www.ubereats.com/mx/search?q=mcdonalds' },
      { name: 'feed', url: 'https://www.ubereats.com/mx/feed' },
    ],
  },
  {
    platform: 'DiDiFood',
    urls: [
      { name: 'home', url: 'https://www.didi-food.com/es-MX' },
      { name: 'food', url: 'https://www.didi-food.com/es-MX/food' },
      { name: 'search-mcdonalds', url: 'https://www.didi-food.com/es-MX/food?search=mcdonalds' },
    ],
  },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureEvidence() {
  logger.info('=== Iniciando captura de evidencia ===');
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    geolocation: { latitude: 19.4326, longitude: -99.1332 },
    permissions: ['geolocation'],
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    window.chrome = { runtime: {} };
  });

  const results = [];

  for (const target of TARGETS) {
    logger.info(`\n--- ${target.platform} ---`);
    const platformDir = path.join(SCREENSHOTS_DIR, target.platform.toLowerCase());
    fs.mkdirSync(platformDir, { recursive: true });

    for (const urlInfo of target.urls) {
      const page = await context.newPage();
      const filepath = path.join(platformDir, `${urlInfo.name}.png`);

      try {
        logger.info(`Navigating to ${target.platform} > ${urlInfo.name}: ${urlInfo.url}`);
        await page.goto(urlInfo.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(3000 + Math.random() * 2000);

        // Scroll down a bit to load lazy content
        await page.evaluate(() => window.scrollBy(0, 400));
        await sleep(1500);

        await page.screenshot({ path: filepath, fullPage: false });
        logger.success(`Screenshot saved: ${filepath}`);

        const title = await page.title();
        results.push({
          platform: target.platform,
          page: urlInfo.name,
          url: urlInfo.url,
          screenshot: filepath,
          title,
          status: 'success',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        logger.error(`Failed ${target.platform} > ${urlInfo.name}: ${err.message}`);
        // Take whatever we can
        try {
          await page.screenshot({ path: filepath, fullPage: false });
          logger.info(`Partial screenshot saved: ${filepath}`);
        } catch (_) {}
        results.push({
          platform: target.platform,
          page: urlInfo.name,
          url: urlInfo.url,
          screenshot: filepath,
          title: 'Error',
          status: `error: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      } finally {
        await page.close();
      }

      // Rate limiting
      await sleep(2000 + Math.random() * 3000);
    }

    // Pause between platforms
    await sleep(3000);
  }

  await browser.close();

  // Save evidence manifest
  const manifestPath = path.join(SCREENSHOTS_DIR, 'evidence-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  logger.success(`\nEvidence manifest saved: ${manifestPath}`);

  // Summary
  const successCount = results.filter(r => r.status === 'success').length;
  logger.info(`\n=== Captura completada: ${successCount}/${results.length} screenshots exitosos ===`);

  return results;
}

captureEvidence().catch(err => {
  logger.error(`Evidence capture failed: ${err.message}`);
  process.exit(1);
});
