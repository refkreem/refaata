// اختبار: رقم الإصدار والتحديث التلقائي
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
let fails = 0, passes = 0;
function ck(n, c, x) { if (c) { passes++; console.log('  ✔', n); } else { fails++; console.log('  ✘', n, x === undefined ? '' : JSON.stringify(x)); } }
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const pg = await (await b.newContext()).newPage();
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  let served = html, loads = 0;
  await pg.route(/gstatic|cdnjs|googleapis/, r => r.abort());
  await pg.route('http://t.local/**', r => { loads++; r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: served }) });
  await pg.goto('http://t.local/app/index.html');
  await pg.waitForFunction(() => window.S && S.db);
  const cur = await pg.evaluate(() => BUILD);
  ck('رقم الإصدار يظهر في الشريط العلوي', (await pg.textContent('#ver')).includes(cur) && /^\d{8}-\d{4}$/.test(cur), cur);
  const n0 = loads;
  await pg.evaluate(() => checkUpdate(true));
  ck('نفس الإصدار: لا إعادة تحميل', loads === n0 + 1);
  served = html.replace(/var BUILD='[^']+'/, "var BUILD='99999999-9999'");
  const nav = pg.waitForNavigation({ timeout: 5000 }).then(() => true).catch(() => false);
  await pg.evaluate(() => checkUpdate(true));
  ck('إصدار أحدث على الخادم يعيد تحميل الصفحة تلقائيًا', await nav);
  console.log(passes + ' نجح، ' + fails + ' فشل'); await b.close(); process.exit(fails ? 1 : 0);
})();
