// Uso: node render.mjs <outDir> <frame1,frame2,...|start-end>
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const [,, outDir, spec, pageName = 'index.html'] = process.argv;
fs.mkdirSync(outDir, {recursive: true});
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none'],
});
const page = await browser.newPage();
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[err]', e.message));
await page.setViewport({width: 1080, height: 1920, deviceScaleFactor: 1});
await page.goto('http://127.0.0.1:8765/' + pageName + '', {waitUntil: 'networkidle0'});
await page.waitForFunction('window.READY === true', {timeout: 60000});
await page.evaluate(() => document.fonts.ready);
const total = await page.evaluate(() => window.TOTAL_FRAMES);
let frames;
if (spec.includes('-')) { const [a, b] = spec.split('-').map(Number); frames = []; for (let i = a; i <= Math.min(b, total - 1); i++) frames.push(i); }
else frames = spec.split(',').map(Number);
const t0 = Date.now();
for (const f of frames) {
  await page.evaluate(f => window.renderFrame(f), f);
  await page.screenshot({path: `${outDir}/f${String(f).padStart(5, '0')}.png`, clip: {x: 0, y: 0, width: 1080, height: 1920}});
}
console.log(`rendered ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await browser.close();
