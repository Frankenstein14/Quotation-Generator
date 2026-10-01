import { generateQuotationHtml } from './src/services/pdfService.js';
import { QuotationRepository } from './src/models/Quotation.js';
import puppeteer from 'puppeteer-core';
import { getBrowserExecutablePath } from './src/config.js';
import os from 'os';
import path from 'path';

async function capture() {
  const q = await QuotationRepository.getByNumber('QT-2026-001');
  if (!q) {
    console.log('Quote not found');
    return;
  }
  const html = generateQuotationHtml(q);
  const tempDir = path.join(os.tmpdir(), 'chrome_snap_' + Date.now());
  const browser = await puppeteer.launch({
    executablePath: getBrowserExecutablePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--user-data-dir=' + tempDir]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1400, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pages = await page.$$('.a4-page');
  console.log('Found rendered A4 pages:', pages.length);
  for (let i = 0; i < Math.min(pages.length, 3); i++) {
    await pages[i].screenshot({ path: `f:/automation/page_${i + 1}_preview.png` });
  }
  console.log('Saved page screenshots successfully!');
  await browser.close();
}

capture().catch(console.error);
