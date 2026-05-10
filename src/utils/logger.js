const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const today = new Date().toISOString().split('T')[0];
const logFile = path.join(LOG_DIR, `scraper-${today}.log`);

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LEVELS[process.env.LOG_LEVEL || 'INFO'];

function timestamp() {
  return new Date().toISOString();
}

function write(level, message, meta = {}) {
  const line = `[${timestamp()}] [${level}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    const metaStr = typeof meta === 'object' ? JSON.stringify(meta) : meta;
    console.log(line, metaStr);
    fs.appendFileSync(logFile, `${line} ${metaStr}\n`);
  } else {
    console.log(line);
    fs.appendFileSync(logFile, `${line}\n`);
  }
}

const logger = {
  debug: (msg, meta) => { if (CURRENT_LEVEL <= LEVELS.DEBUG) write('DEBUG', msg, meta); },
  info: (msg, meta) => { if (CURRENT_LEVEL <= LEVELS.INFO) write('INFO', msg, meta); },
  warn: (msg, meta) => { if (CURRENT_LEVEL <= LEVELS.WARN) write('WARN', msg, meta); },
  error: (msg, meta) => { if (CURRENT_LEVEL <= LEVELS.ERROR) write('ERROR', msg, meta); },
  success: (msg, meta) => write('SUCCESS', msg, meta),
};

module.exports = logger;
