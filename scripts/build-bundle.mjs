#!/usr/bin/env node
/**
 * scripts/build-bundle.mjs
 *
 * Assembles the distributable bundle/ submodule from the source submodules.
 * Works on Windows, macOS, Linux, and in CI.
 *
 * Usage:
 *   node scripts/build-bundle.mjs          # assemble only
 *   node scripts/build-bundle.mjs --push   # assemble + push bundle + main
 *
 * Safe to re-run: commits only when the working tree has actually changed.
 */

import { spawnSync }                                            from 'child_process';
import { cpSync, existsSync, rmSync, writeFileSync }           from 'fs';
import { dirname, extname, join, resolve, sep }                from 'path';
import { fileURLToPath }                                       from 'url';

const ROOT   = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = join(ROOT, 'bundle');
const PUSH   = process.argv.includes('--push');

// ── helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`\n  $ ${cmd}`);
  const r = spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: ROOT, ...opts });
  if (r.status !== 0) {
    console.error(`\n  FAILED (exit ${r.status ?? '?'}): ${cmd}`);
    process.exit(r.status ?? 1);
  }
}

function capture(cmd, cwd = ROOT) {
  return spawnSync(cmd, { shell: true, encoding: 'utf8', cwd }).stdout?.trim() ?? '';
}

// ── 1. Update source submodules to their branch tips ─────────────────────────

console.log('\n=== 1. Update source submodules ===');
run('git submodule update --init --remote backend frontend cli');

// ── 2. Build Angular frontend ────────────────────────────────────────────────

console.log('\n=== 2. Build frontend ===');
const FRONTEND   = join(ROOT, 'frontend');
const INDEX_HTML = join(FRONTEND, 'dist', 'snip-frontend', 'browser', 'index.html');

run('npm install',    { cwd: FRONTEND });
run('npx ng build',  { cwd: FRONTEND, env: { ...process.env, NG_CLI_ANALYTICS: 'false' } });

if (!existsSync(INDEX_HTML)) {
  console.error(`\nERROR: expected build output at:\n  ${INDEX_HTML}`);
  process.exit(1);
}
console.log(`\n  verified: ${INDEX_HTML}`);

// ── 3. Assemble bundle/ ───────────────────────────────────────────────────────

console.log('\n=== 3. Assemble bundle/ ===');

// server.js and cli.js — copied as-is
cpSync(join(ROOT, 'backend', 'server.js'), join(BUNDLE, 'server.js'));
cpSync(join(ROOT, 'cli',     'cli.js'),    join(BUNDLE, 'cli.js'));
console.log('  copied server.js, cli.js');

// public/ — wipe and copy Angular build output fresh
const PUBLIC = join(BUNDLE, 'public');
if (existsSync(PUBLIC)) rmSync(PUBLIC, { recursive: true });
cpSync(join(FRONTEND, 'dist', 'snip-frontend', 'browser'), PUBLIC, { recursive: true });
console.log('  copied dist/snip-frontend/browser → bundle/public/');

// .env — Bun auto-loads this; sets PUBLIC_DIR so server.js also serves the SPA
writeFileSync(join(BUNDLE, '.env'), 'PUBLIC_DIR=./public\n');

// package.json — no "type" field so cli.js remains CommonJS under plain node
writeFileSync(join(BUNDLE, 'package.json'), JSON.stringify({
  name:        'snip-bundle',
  version:     '1.0.0',
  description: 'Snip — self-contained backend + SPA bundle',
  main:        'server.js',
  scripts:     { start: 'bun server.js' },
  engines:     { bun: '>=1' },
}, null, 2) + '\n');

// Dockerfile
writeFileSync(join(BUNDLE, 'Dockerfile'), [
  'FROM oven/bun:1-alpine',
  'WORKDIR /app',
  'COPY . .',
  'ENV PORT=3000',
  'EXPOSE 3000',
  'CMD bun server.js',
  '',
].join('\n'));

// .dockerignore
writeFileSync(join(BUNDLE, '.dockerignore'), [
  '.git',
  'node_modules',
  '',
].join('\n'));

// railway.json
writeFileSync(join(BUNDLE, 'railway.json'), JSON.stringify({
  $schema: 'https://railway.app/railway.schema.json',
  build:   { builder: 'DOCKERFILE' },
}, null, 2) + '\n');

console.log('  wrote .env, package.json, Dockerfile, .dockerignore, railway.json');

// ── 4. Commit bundle/ (no-op when nothing changed) ───────────────────────────

console.log('\n=== 4. Commit bundle/ ===');
const bundleStatus = capture('git status --porcelain', BUNDLE);

if (!bundleStatus) {
  console.log('  bundle/: nothing to commit — skipping');
} else {
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
  run('git add -A',                                        { cwd: BUNDLE });
  run(`git commit -m "chore: bundle build ${ts}"`,         { cwd: BUNDLE });
  if (PUSH) {
    run('git push origin HEAD:bundle',                     { cwd: BUNDLE });
    console.log('  pushed bundle branch');
  } else {
    console.log('  (skipping push — run with --push to publish)');
  }
}

// ── 5. Bump superproject submodule pointers (no-op when nothing changed) ──────

console.log('\n=== 5. Bump superproject pointers ===');
run('git add backend frontend cli bundle');
const superStaged = capture('git diff --cached --name-only');

if (!superStaged) {
  console.log('  superproject: nothing to commit — skipping');
} else {
  console.log(`  staging: ${superStaged.replace(/\n/g, ', ')}`);
  run('git commit -m "chore: bump submodule pointers"');
  if (PUSH) {
    run('git push');
    console.log('  pushed main');
  } else {
    console.log('  (skipping push — run with --push to publish)');
  }
}

console.log('\n✓ Done.');
