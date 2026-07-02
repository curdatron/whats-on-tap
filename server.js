const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const port = Number(process.env.PORT || 4173);
const root = path.join(__dirname, 'public');
const dataFile = path.join(__dirname, 'data.json');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  if (req.url === '/api/network' && req.method === 'GET') {
    const addresses = Object.values(os.networkInterfaces()).flat().filter(x => x && x.family === 'IPv4' && !x.internal).map(x => `http://${x.address}:${port}/display.html`);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(addresses));
  }
  if (req.url === '/api/board' && req.method === 'GET') {
    return fs.readFile(dataFile, (error, data) => {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(error ? 'null' : data);
    });
  }
  if (req.url === '/api/board' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 8_000_000) req.destroy(); });
    return req.on('end', () => {
      try {
        JSON.parse(body);
        fs.writeFile(dataFile, body, error => {
          res.writeHead(error ? 500 : 204, { 'Content-Type': 'application/json' });
          res.end(error ? JSON.stringify({ error: 'Could not save board' }) : '');
        });
      } catch { res.writeHead(400); res.end('Invalid JSON'); }
    });
  }
  const requestPath = req.url.split('?')[0];
  const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\//, '');
  const file = path.normalize(path.join(root, relative));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': `${types[path.extname(file)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(port, '0.0.0.0', () => {
  const addresses = Object.values(os.networkInterfaces()).flat().filter(x => x && x.family === 'IPv4' && !x.internal);
  console.log(`\nWhats On Tap is ready.\nEditor: http://localhost:${port}\nTV:     http://localhost:${port}/display.html`);
  addresses.forEach(({ address }) => console.log(`Network: http://${address}:${port}/display.html`));
  console.log('');
});
