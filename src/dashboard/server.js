const http = require('http');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const PORT = process.env.PORT || 3000;

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = req.url === '/' ? '/index.html' : req.url;

  if (url === '/index.html' || url === '/report') {
    const reportPath = path.join(process.cwd(), 'output', 'report.html');
    if (fs.existsSync(reportPath)) {
      serveFile(res, reportPath, 'text/html');
    } else {
      // Generate report on the fly if it doesn't exist
      try {
        const { main } = require('../analysis/generateReport');
        main();
        serveFile(res, reportPath, 'text/html');
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error</h1><p>Could not generate report: ${e.message}</p><p>Run: npm run analyze</p>`);
      }
    }
    return;
  }

  if (url === '/api/data') {
    const dataPath = path.join(process.cwd(), 'output', 'rawData.json');
    if (fs.existsSync(dataPath)) {
      serveFile(res, dataPath, 'application/json');
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No data available. Run npm run scrape first.' }));
    }
    return;
  }

  if (url === '/api/insights') {
    const insightsPath = path.join(process.cwd(), 'output', 'insights.json');
    if (fs.existsSync(insightsPath)) {
      serveFile(res, insightsPath, 'application/json');
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No insights available. Run npm run analyze first.' }));
    }
    return;
  }

  if (url === '/api/stats') {
    const insightsPath = path.join(process.cwd(), 'output', 'insights.json');
    if (fs.existsSync(insightsPath)) {
      const content = JSON.parse(fs.readFileSync(insightsPath, 'utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(content.stats));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No stats available' }));
    }
    return;
  }

  // Static files
  const ext = path.extname(url);
  const contentTypeMap = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };
  const contentType = contentTypeMap[ext] || 'text/plain';
  const staticPath = path.join(process.cwd(), 'output', url);
  if (fs.existsSync(staticPath)) {
    serveFile(res, staticPath, contentType);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  logger.success(`Dashboard server running at http://localhost:${PORT}`);
  logger.info(`View report: http://localhost:${PORT}/report`);
  logger.info(`API data: http://localhost:${PORT}/api/data`);
  logger.info(`API insights: http://localhost:${PORT}/api/insights`);
});

module.exports = server;
