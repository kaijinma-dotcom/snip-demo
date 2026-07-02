#!/usr/bin/env node
'use strict';

const http = require('http');
const crypto = require('crypto');
const { readFileSync, statSync } = require('fs');
const { extname, join: joinPath, resolve, sep } = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const BASE_URL = process.env.BASE_URL || `http://${HOST}:${PORT}`;

// In-memory store — swap for a DB adapter without touching the HTTP layer
const links = new Map(); // code -> { code, url, shortUrl, hits, createdAt }

// Optional static-file serving — set PUBLIC_DIR to enable
const PUBLIC_DIR = process.env.PUBLIC_DIR ? resolve(process.env.PUBLIC_DIR) : null;
const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'text/javascript; charset=utf-8',
  '.mjs':   'text/javascript; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.json':  'application/json',
  '.ico':   'image/x-icon',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.svg':   'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff':  'font/woff',
  '.ttf':   'font/ttf',
  '.txt':   'text/plain; charset=utf-8',
};

// ── Tiny router ─────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const urlPath = url.pathname;

  if (req.method === 'GET'  && urlPath === '/api/links') return getLinks(req, res);
  if (req.method === 'POST' && urlPath === '/api/links') return postLink(req, res);
  if (req.method === 'GET'  && /^\/[A-Za-z0-9]+$/.test(urlPath)) {
    return redirect(req, res, urlPath.slice(1));
  }
  if (PUBLIC_DIR && req.method === 'GET') return serveStatic(req, res, urlPath);
  sendJson(res, 404, { error: 'Not found' });
});

// ── Handlers ─────────────────────────────────────────────────────────────────

function getLinks(_req, res) {
  sendJson(res, 200, [...links.values()]);
}

function postLink(req, res) {
  readBody(req, (err, body) => {
    if (err) return sendJson(res, 400, { error: 'Bad request' });

    let parsed;
    try { parsed = JSON.parse(body); } catch {
      return sendJson(res, 400, { error: 'Invalid JSON' });
    }

    const rawUrl = (parsed.url || '').trim();
    if (!rawUrl) return sendJson(res, 400, { error: 'url is required' });

    try {
      const u = new URL(rawUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
    } catch {
      return sendJson(res, 400, { error: 'url must be http or https' });
    }

    const code = crypto.randomBytes(3).toString('hex'); // 6 lowercase hex chars
    const link = {
      code,
      url: rawUrl,
      shortUrl: `${BASE_URL}/${code}`,
      hits: 0,
      createdAt: new Date().toISOString(),
    };
    links.set(code, link);
    sendJson(res, 201, link);
  });
}

function redirect(req, res, code) {
  const link = links.get(code);
  if (!link) return sendJson(res, 404, { error: `Unknown code: ${code}` });
  link.hits++;
  res.writeHead(302, { Location: link.url });
  res.end();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readBody(req, cb) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => cb(null, Buffer.concat(chunks).toString()));
  req.on('error', cb);
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(payload);
}

// ── Static file serving ──────────────────────────────────────────────────────

function serveStatic(_req, res, urlPath) {
  const rel  = decodeURIComponent(urlPath).replace(/^\//, '') || 'index.html';
  const abs  = joinPath(PUBLIC_DIR, rel);
  const safe = resolve(abs);
  // Guard against path traversal
  if (safe !== PUBLIC_DIR && !safe.startsWith(PUBLIC_DIR + sep)) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }
  let filePath = safe;
  try {
    if (statSync(filePath).isDirectory()) filePath = joinPath(filePath, 'index.html');
  } catch { /* not found — fall through to SPA fallback */ }
  try {
    const data = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    return res.end(data);
  } catch {
    // SPA fallback: serve index.html so Angular handles client-side routing
    try {
      const data = readFileSync(joinPath(PUBLIC_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(data);
    } catch {
      return sendJson(res, 404, { error: 'Not found' });
    }
  }
}

server.listen(PORT, () => {
  console.log(`Snip backend listening on http://${HOST}:${PORT}`);
});
