#!/usr/bin/env node
// Captures the project-card screenshot for the PDX Redwoods Map.
// Prereqs: `npm run build && npx vite preview --port 4174` running, and a
// chromium playwright can drive (CHROMIUM_PATH env overrides the default).
//
// Usage: node scripts/screenshot-redwoods.mjs
import { chromium } from 'playwright-core';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'project-images',
  'redwoods-map.png'
);
const CHROMIUM = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const URL = process.env.MAP_URL ?? 'http://localhost:4174/redwoods/';

const browser = await chromium.launch({ executablePath: CHROMIUM });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

// In sandboxed environments the browser may not reach the tile CDN directly;
// route tile requests through Node's fetch, which honors the local proxy/CA.
await page.route(/^https:\/\/[a-d]\.basemaps\.cartocdn\.com\//, async (route) => {
  try {
    const res = await fetch(route.request().url());
    const body = Buffer.from(await res.arrayBuffer());
    await route.fulfill({
      status: res.status,
      contentType: res.headers.get('content-type') ?? 'image/png',
      body,
    });
  } catch {
    await route.abort();
  }
});

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.cluster-icon', { timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT });
await browser.close();
console.log(`Wrote ${OUT}`);
