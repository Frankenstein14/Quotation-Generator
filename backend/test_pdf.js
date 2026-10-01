import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function test() {
  const tempDir = path.join(os.tmpdir(), 'chrome_puppeteer_test');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', `--user-data-dir=${tempDir}`]
  });
  const page = await browser.newPage();
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="background:#6B1E2E; color:white; font-family:sans-serif; padding:50px;">
        <h1>KALAKAR EVENTS PDF GENERATOR</h1>
        <p>Testing server-side A4 PDF output with Puppeteer-core and Chrome.</p>
      </body>
    </html>
  `);
  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });
  await browser.close();
  fs.writeFileSync('test_output.pdf', buffer);
  console.log('PDF generated successfully! Size:', buffer.length, 'bytes');
}

test().catch(console.error);
