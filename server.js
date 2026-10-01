// Run:  node server.js     then open  http://localhost:3000
// Needs Node 18 or newer. No packages to install.
const http = require('http');
const fs = require('fs');
const path = require('path');

const FEED = 'https://emergency.vic.gov.au/public/events-geojson.json';
const PORT = process.env.PORT || 3000;
let cache = { t: 0, body: null };

async function getFeed() {
  if (cache.body && Date.now() - cache.t < 20000) return cache.body;
  const r = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 vic-emergency-live' } });
  if (!r.ok) throw new Error('Upstream ' + r.status);
  cache = { t: Date.now(), body: await r.text() };
  return cache.body;
}

http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/events')) {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(await getFeed());
    } catch (e) {
      res.writeHead(502); res.end(e.message);
    }
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync(path.join(__dirname, 'vic-emergency-live.html')));
}).listen(PORT, () => console.log('Live at http://localhost:' + PORT));
