const fs = require('fs');
const path = require('path');
const RappiScraper = require('./scrapers/rappiScraper');
const UberEatsScraper = require('./scrapers/uberEatsScraper');
const DidiFoodScraper = require('./scrapers/didiFoodScraper');
const { addresses, getStats } = require('./utils/addressDataset');
const logger = require('./utils/logger');

/**
 * PRODUCTOS DE REFERENCIA
 * Se usan terminos de busqueda estandarizados para comparar
 * entre plataformas de manera consistente.
 */
const PRODUCTS = [
  { name: 'Big Mac', category: 'fast-food', searchTerm: 'Big Mac McDonalds' },
  { name: 'McCombo Mediano', category: 'fast-food', searchTerm: 'McCombo McDonalds' },
  { name: 'McNuggets 10 piezas', category: 'fast-food', searchTerm: 'McNuggets 10 McDonalds' },
  { name: 'Coca-Cola 600ml', category: 'retail', searchTerm: 'Coca Cola 600ml' },
  { name: 'Agua Bonafont 1L', category: 'retail', searchTerm: 'Agua Bonafont 1 litro' },
];

/**
 * ORQUESTADOR PRINCIPAL
 * Ejecuta scraping secuencial por plataforma para evitar sobrecarga.
 * Puede filtrar por ciudad o numero de direcciones (para pruebas rapidas).
 */
async function main(options = {}) {
  const startTime = Date.now();
  logger.info('========================================');
  logger.info('Rappi Competitive Intelligence System v1.0');
  logger.info('========================================');

  // Mostrar estadisticas del dataset
  const stats = getStats();
  logger.info('Dataset stats:', stats);

  // Filtrar direcciones
  let targetAddresses = addresses;
  if (options.city) {
    targetAddresses = targetAddresses.filter(a => a.city === options.city);
  }
  if (options.limit) {
    targetAddresses = targetAddresses.slice(0, options.limit);
  }

  logger.info(`Scraping ${targetAddresses.length} addresses`);
  logger.info(`Products per address: ${PRODUCTS.length}`);

  // Seleccionar scrapers
  const scrapers = [];
  if (!options.platform || options.platform === 'all') {
    scrapers.push(new RappiScraper(), new UberEatsScraper(), new DidiFoodScraper());
  } else {
    const map = { rappi: RappiScraper, uber: UberEatsScraper, didi: DidiFoodScraper };
    const ScraperClass = map[options.platform.toLowerCase()];
    if (!ScraperClass) throw new Error(`Unknown platform: ${options.platform}`);
    scrapers.push(new ScraperClass());
  }

  const allResults = [];

  for (const scraper of scrapers) {
    logger.info(`--- Starting ${scraper.platform} scraper ---`);
    await scraper.init();

    for (const address of targetAddresses) {
      const addressResults = await scraper.scrapeAddress(address, PRODUCTS);
      if (addressResults && addressResults.length > 0) {
        allResults.push(...addressResults);
        logger.success(`${scraper.platform} - ${address.zoneName}: ${addressResults.length} products scraped`);
      } else {
        logger.warn(`${scraper.platform} - ${address.zoneName}: No data collected`);
      }
    }

    await scraper.teardown();
    // Delay between platforms
    if (scrapers.indexOf(scraper) < scrapers.length - 1) {
      const delay = 5000 + Math.random() * 3000;
      logger.info(`Waiting ${Math.round(delay)}ms before next platform...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // Guardar outputs
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDir, `rawData_${timestamp}.json`);
  const csvPath = path.join(outputDir, `rawData_${timestamp}.csv`);

  fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2));
  logger.success(`JSON saved: ${jsonPath} (${allResults.length} records)`);

  // Generar CSV
  const csvContent = convertToCSV(allResults);
  fs.writeFileSync(csvPath, csvContent);
  logger.success(`CSV saved: ${csvPath}`);

  // Tambien guardar como archivos estandar (sin timestamp) para facilitar analisis
  fs.writeFileSync(path.join(outputDir, 'rawData.json'), JSON.stringify(allResults, null, 2));
  fs.writeFileSync(path.join(outputDir, 'rawData.csv'), csvContent);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.success(`Scraping completed in ${duration}s. Total records: ${allResults.length}`);

  return { results: allResults, jsonPath, csvPath };
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('\n') ? `"${str}"` : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// CLI args
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--city') options.city = args[i + 1];
  if (args[i] === '--limit') options.limit = parseInt(args[i + 1]);
  if (args[i] === '--platform') options.platform = args[i + 1];
}

if (require.main === module) {
  main(options).catch(err => {
    logger.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { main, PRODUCTS };
