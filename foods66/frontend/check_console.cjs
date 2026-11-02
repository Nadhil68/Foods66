const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));
  
  console.log("Navigating to http://localhost:3000/#/login...");
  try {
    await page.goto('http://localhost:3000/#/login', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log("Navigation complete.");
    
    // Wait a bit just in case
    await new Promise(r => setTimeout(r, 2000));
    
  } catch(e) {
    console.error("Puppeteer error:", e);
  } finally {
    await browser.close();
  }
})();
