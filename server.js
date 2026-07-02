#!/usr/bin/env node
'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const BASE_URL = process.env.BASE_URL || `http://${HOST}:${PORT}`;

// In-memory store — swap for a DB adapter without touching the HTTP layer
const links = new Map(); // code -> { code, url, shortUrl, hits, createdAt }

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
  const path = url.pathname;

  if (req.method === 'GET'  && path === '/api/links') return getLinks(req, res);
  if (req.method === 'POST' && path === '/api/links') return postLink(req, res);
  if (req.method === 'GET'  && /^\/[A-Za-z0-9]+$/.test(path)) {
    return redirect(req, res, path.slice(1));
  }
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

server.listen(PORT, () => {
  console.log(`Snip backend listening on http://${HOST}:${PORT}`);
});
