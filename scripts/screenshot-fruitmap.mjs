#!/usr/bin/env node
// Captures the project-card screenshot for the fruit map — the app's own
// title screen, no mockup. Prereqs: a static server on public/ (e.g.
// `python3 -m http.server 8734 -d public`) and a playwright chromium
// (CHROMIUM_PATH env overrides the default).
//
// Usage: node scripts/screenshot-fruitmap.mjs
import { chromium } from 'playwright-core';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'project-images',
  'olliesfruitmap.png'
);
const CHROMIUM = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const URL = process.env.MAP_URL ?? 'http://localhost:8734/olliesfruitmap/';

const browser = await chromium.launch({ executablePath: CHROMIUM });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('#start-btn', { timeout: 15000 });
await page.waitForTimeout(800); // fonts + title art settle
await page.screenshot({ path: OUT });
await browser.close();
console.log(`Wrote ${OUT}`);
