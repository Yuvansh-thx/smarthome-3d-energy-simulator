// Script to capture high-definition screenshots of SmartHome 3D application
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const OUT_DIR = path.resolve('docs', 'media');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser for media capture...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    headless: 'new',
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // 1. Overview screenshot (with All On clicked)
  console.log('Capturing: Overview 3D Scene...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  // Click 'All On' button to turn on appliances and show active lighting
  const allOnBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.innerText.includes('All On'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('All On clicked:', allOnBtn);
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(OUT_DIR, 'smart-home-3d-overview.png'),
    quality: 95,
    type: 'jpeg',
  });
  console.log('Saved: smart-home-3d-overview.png');

  // 2. Energy Dashboard
  console.log('Capturing: Energy Analytics Dashboard...');
  await page.goto('http://localhost:5173/?panel=energy', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(OUT_DIR, 'energy-analytics-dashboard.png'),
    quality: 95,
    type: 'jpeg',
  });
  console.log('Saved: energy-analytics-dashboard.png');

  // 3. Room & Architecture Builder
  console.log('Capturing: Room & Architecture Builder...');
  await page.goto('http://localhost:5173/?panel=builder', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(OUT_DIR, 'room-builder-palette.png'),
    quality: 95,
    type: 'jpeg',
  });
  console.log('Saved: room-builder-palette.png');

  // 4. Appliance Inspector Panel
  console.log('Capturing: Appliance Inspector Panel...');
  await page.goto('http://localhost:5173/?panel=appliance', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(OUT_DIR, 'appliance-inspector.png'),
    quality: 95,
    type: 'jpeg',
  });
  console.log('Saved: appliance-inspector.png');

  // 5. First-Person View (FPV)
  console.log('Capturing: First-Person Walkthrough (FPV)...');
  await page.goto('http://localhost:5173/?panel=room', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  // Click 'Walk Inside Room (FPV)'
  const fpvClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.innerText.includes('Walk Inside Room'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('FPV button clicked:', fpvClicked);
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(OUT_DIR, 'first-person-view.png'),
    quality: 95,
    type: 'jpeg',
  });
  console.log('Saved: first-person-view.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});

