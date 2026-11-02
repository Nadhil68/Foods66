import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * Automated Production & Deployment Monitor for FOODS66 (Mad)
 * Usage: node monitor-deployment.js [URL]
 * Example: node monitor-deployment.js https://your-project.vercel.app
 */

const targetUrlStr = process.argv[2] || 'http://localhost:3000';
console.log('====================================================');
console.log(`🔍 FOODS66 AUTOMATIC DEPLOYMENT MONITOR`);
console.log(`🌐 Target: ${targetUrlStr}`);
console.log(`⏰ Time: ${new Date().toISOString()}`);
console.log('====================================================\n');

function request(targetUrl, options = {}, postData = null) {
  return new Promise((resolve) => {
    const start = Date.now();
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;

      const reqOptions = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + (parsed.search || ''),
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'FOODS66-Automated-Monitor/1.0',
          'Accept': 'application/json, text/html, */*',
          ...(postData ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {})
        },
        timeout: 15000
      };

      const req = lib.request(reqOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const duration = Date.now() - start;
          let json = null;
          try {
            json = JSON.parse(body);
          } catch {
            // Not json
          }
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            headers: res.headers,
            body,
            json,
            duration
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ok: false,
          status: 'TIMEOUT',
          duration: Date.now() - start,
          error: 'Request timed out after 15s'
        });
      });

      req.on('error', (err) => {
        resolve({
          ok: false,
          status: 'ERROR',
          duration: Date.now() - start,
          error: err.message
        });
      });

      if (postData) {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
      req.end();
    } catch (err) {
      resolve({
        ok: false,
        status: 'INVALID_URL',
        duration: Date.now() - start,
        error: err.message
      });
    }
  });
}

async function runMonitor() {
  const base = targetUrlStr.replace(/\/$/, '');
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  function report(name, result, expectedCondition, details = '') {
    if (result.ok && expectedCondition) {
      console.log(`✅ [PASS] ${name} | Status: ${result.status} | Latency: ${result.duration}ms ${details}`);
      passCount++;
    } else if (result.status === 404 || result.status >= 500 || !result.ok) {
      console.log(`❌ [FAIL] ${name} | Status: ${result.status} | Latency: ${result.duration}ms | ${result.error || details}`);
      failCount++;
    } else {
      console.log(`⚠️ [WARN] ${name} | Status: ${result.status} | Latency: ${result.duration}ms | ${details}`);
      warnCount++;
    }
  }

  // 1. Frontend Root Delivery
  console.log('📌 1. Checking Frontend Application Delivery...');
  const rootRes = await request(`${base}/`);
  const hasRootDiv = rootRes.body && (rootRes.body.includes('<div id="root">') || rootRes.body.includes('FOODS66'));
  report('Frontend Index HTML Delivery', rootRes, hasRootDiv, hasRootDiv ? '(HTML root element verified)' : '(Root element missing)');

  // 2. Health Endpoint
  console.log('\n📌 2. Checking Backend Health Check API...');
  const healthRes = await request(`${base}/api/health`);
  const healthOk = healthRes.ok && (healthRes.json?.status === 'ok' || healthRes.json?.success === true || healthRes.status === 200);
  report('System Health API (/api/health)', healthRes, healthOk, healthRes.json ? JSON.stringify(healthRes.json) : '');

  // 3. Foods Menu API
  console.log('\n📌 3. Checking Foods & Menu API...');
  const foodsRes = await request(`${base}/api/foods`);
  const hasFoods = foodsRes.ok && Array.isArray(foodsRes.json?.data || foodsRes.json);
  const foodItems = (foodsRes.json?.data || foodsRes.json) || [];
  report('Foods Catalog API (/api/foods)', foodsRes, hasFoods, hasFoods ? `(${foodItems.length} dishes returned)` : '');

  // 4. Client Route Checks
  console.log('\n📌 4. Checking Client-Side Routes & Static Assets...');
  const routes = ['/login', '/register', '/menu'];
  for (const r of routes) {
    const routeRes = await request(`${base}${r}`);
    report(`Route SPA Delivery (${r})`, routeRes, routeRes.ok, `(Status: ${routeRes.status})`);
  }

  console.log('\n====================================================');
  console.log(`📊 MONITOR SUMMARY: ${passCount} Passed, ${warnCount} Warnings, ${failCount} Failed`);
  console.log('====================================================\n');
}

runMonitor();
