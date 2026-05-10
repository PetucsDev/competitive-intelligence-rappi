const { addresses, getStats, getById } = require('../utils/addressDataset');
const logger = require('../utils/logger');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

function runTests() {
  logger.info('Running tests...');
  let passed = 0;
  let failed = 0;

  const tests = [
    {
      name: 'Dataset has 30 addresses',
      fn: () => assert(addresses.length === 30, `Expected 30, got ${addresses.length}`),
    },
    {
      name: 'Dataset covers 3 cities',
      fn: () => {
        const cities = [...new Set(addresses.map(a => a.city))];
        assert(cities.length === 3, `Expected 3 cities, got ${cities.length}`);
      },
    },
    {
      name: 'Each address has required fields',
      fn: () => {
        for (const addr of addresses) {
          assert(addr.id, `Missing id for ${addr.zoneName}`);
          assert(addr.city, `Missing city for ${addr.id}`);
          assert(addr.lat && addr.lng, `Missing coordinates for ${addr.id}`);
          assert(addr.zoneType, `Missing zoneType for ${addr.id}`);
          assert(addr.justification, `Missing justification for ${addr.id}`);
        }
      },
    },
    {
      name: 'getStats returns correct structure',
      fn: () => {
        const stats = getStats();
        assert(stats.total === 30, `Stats total wrong: ${stats.total}`);
        assert(stats.cities === 3, `Stats cities wrong: ${stats.cities}`);
        assert(stats.zoneTypes > 0, 'No zone types found');
      },
    },
    {
      name: 'getById finds existing address',
      fn: () => {
        const addr = getById('cdmx-01');
        assert(addr !== undefined, 'cdmx-01 not found');
        assert(addr.zoneName === 'Polanco', `Expected Polanco, got ${addr.zoneName}`);
      },
    },
    {
      name: 'getById returns undefined for invalid id',
      fn: () => {
        const addr = getById('invalid-id');
        assert(addr === undefined, 'Should return undefined for invalid id');
      },
    },
    {
      name: 'Logger creates log file',
      fn: () => {
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(process.cwd(), 'logs');
        assert(fs.existsSync(logDir), 'Log directory should exist');
      },
    },
  ];

  for (const test of tests) {
    try {
      test.fn();
      logger.success(`[PASS] ${test.name}`);
      passed++;
    } catch (err) {
      logger.error(`[FAIL] ${test.name}: ${err.message}`);
      failed++;
    }
  }

  logger.info(`\nTest Results: ${passed} passed, ${failed} failed, ${tests.length} total`);
  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
