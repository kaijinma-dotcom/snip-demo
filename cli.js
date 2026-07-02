#!/usr/bin/env node
'use strict';

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/$/, '');
const [, , cmd, ...args] = process.argv;

main().catch((e) => die(e.message || String(e)));

async function main() {
  switch (cmd) {
    case 'add':   return cmdAdd(args[0]);
    case 'ls':    return cmdLs();
    case 'open':  return cmdOpen(args[0]);
    case 'help':
    case '--help':
    case '-h':
    default:      return printUsage();
  }
}

// ── snip add <url> ──────────────────────────────────────────────────────────

async function cmdAdd(url) {
  if (!url) die('Usage: snip add <url>');

  let res;
  try {
    res = await fetch(`${BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch (e) {
    die(`Backend unreachable: ${e.message}`);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    die(body.error || `HTTP ${res.status}`);
  }

  const link = await res.json();
  console.log(link.shortUrl);
}

// ── snip ls ─────────────────────────────────────────────────────────────────

async function cmdLs() {
  let res;
  try {
    res = await fetch(`${BASE}/api/links`);
  } catch (e) {
    die(`Backend unreachable: ${e.message}`);
  }

  if (!res.ok) die(`HTTP ${res.status}`);

  const links = await res.json();
  if (!links.length) {
    console.log('No links yet.');
    return;
  }

  const colCode = Math.max(4, ...links.map((l) => l.code.length));
  const colHits = Math.max(4, ...links.map((l) => String(l.hits).length));

  const row = (code, hits, url) =>
    `${code.padEnd(colCode)}  ${hits.padStart(colHits)}  ${url}`;

  console.log(row('CODE', 'HITS', 'URL'));
  console.log('-'.repeat(colCode + 2 + colHits + 2 + 40));
  for (const l of links) {
    console.log(row(l.code, String(l.hits), l.url));
  }
}

// ── snip open <code> ────────────────────────────────────────────────────────

async function cmdOpen(code) {
  if (!code) die('Usage: snip open <code>');

  let res;
  try {
    res = await fetch(`${BASE}/${code}`, { redirect: 'manual' });
  } catch (e) {
    die(`Backend unreachable: ${e.message}`);
  }

  const location = res.headers.get('location');
  if (!location) die(`Unknown code: ${code}`);

  const { exec } = require('child_process');
  const opener =
    process.platform === 'win32'  ? 'start ""' :
    process.platform === 'darwin' ? 'open'      :
                                    'xdg-open';

  exec(`${opener} ${JSON.stringify(location)}`);
  console.log(`Opening: ${location}`);
}

// ── helpers ─────────────────────────────────────────────────────────────────

function printUsage() {
  console.log(
    'Usage:\n' +
    '  snip add <url>    Shorten a URL and print the short link\n' +
    '  snip ls           List all shortened links\n' +
    '  snip open <code>  Open a short link in the OS browser\n' +
    '  snip help         Print this help'
  );
}

function die(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}
