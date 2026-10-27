// اختبار تصدير Excel المنسق (يحتاج: npm i exceljs في مجلد وتمرير EXCELJS=<المجلد>)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const EJ = process.env.EXCELJS || '/tmp/claude-0/xl/node_modules/exceljs';
let fails = 0, passes = 0;
function ck(n, c, x) { if (c) { passes++; console.log('  ✔', n); } else { fails++; console.log('  ✘', n, x === undefined ? '' : JSON.stringify(x)); } }
(async () => {
  if (!fs.existsSync(EJ)) { console.log('تخطي: exceljs غير مثبت'); return; }
  const ExcelJS = require(EJ);
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ acceptDownloads: true });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => { fails++; console.log('   PAGEERR', e.message); });
  await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/, r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  await pg.waitForFunction(() => window.S && S.db);
  await pg.addScriptTag({ path: path.join(EJ, 'dist/exceljs.min.js') });
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.evaluate(() => xlExport('اختبار', [{ name: 'تكاليف', title: 'مقارنة التكاليف', subtitle: 'مشروع أ', cols: [{ h: 'البند' }, { h: 'المقايسة', t: 'n', sum: 1 }, { h: 'الفعلي', t: 'n', sum: 1 }, { h: '%', t: 'p' }], rows: [['دكت', 1000, 1200, 120], ['فلاتر', 5000.5, 2000, 40]], note: 'ملاحظة' }, { name: 'تفاصيل', title: 'تفاصيل', cols: [{ h: 'م', t: 'q' }, { h: 'بيان' }], rows: [[1, 'أ']] }]))]);
  const f = '/tmp/claude-0/xl/out.xlsx'; await dl.saveAs(f);
  const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(f);
  ck('ورقتان', wb.worksheets.length === 2 && wb.worksheets[0].name === 'تكاليف');
  const ws = wb.worksheets[0];
  ck('اتجاه RTL وتجميد الرأس', ws.views[0].rightToLeft === true && ws.views[0].ySplit === 5);
  ck('ترويسة الشركة والعنوان', ws.getCell('A2').value === 'مقارنة التكاليف');
  ck('رأس الجدول ملوّن', ws.getCell('A5').fill.fgColor.argb === 'FF0B5C94' && ws.getCell('A5').font.bold === true);
  ck('الأرقام أرقام وبصيغة آلاف', ws.getCell('B6').value === 1000 && /#,##0/.test(ws.getCell('B6').numFmt));
  const t = ws.getCell('B8').value; ck('صف الإجمالي بمعادلة SUM', t && t.formula === 'SUM(B6:B7)' && Math.abs(t.result - 6000.5) < 0.01, t);
  ck('فلتر تلقائي', !!ws.autoFilter);
  ck('تنسيق شرطي للنسب', ws.conditionalFormattings.length >= 1);
  console.log(passes + ' نجح، ' + fails + ' فشل'); await b.close(); process.exit(fails ? 1 : 0);
})();
