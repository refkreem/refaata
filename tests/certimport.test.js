// استيراد حساب مقاول أسبوعيًا كشهادات تراكمية — مثال المستخدم: 10,000 ثم 25,000 مع مدفوع سابق 10,000
const { chromium } = require('playwright'); const path = require('path');
const XLSX = require('/tmp/claude-0/xl/node_modules/xlsx');
const XL = '/tmp/claude-0/xl/node_modules/xlsx/dist/xlsx.full.min.js';
let f = 0, p = 0; const ck = (n, c, x) => { if (c) { p++; console.log('  ✔', n) } else { f++; console.log('  ✘', n, JSON.stringify(x)) } };
const SITE = 'تجديد وتطوير وحدة الاقامة بالدور الخامس ابوالريش الياباني';
function book(rows, tot) {
  const H = ['التاريخ', 'اسم المقاول ', 'بيان الاعمال', 'النسبه ', 'الوحده', 'الكميه', 'الفئه', 'اجمالى', 'خصم ماسبق صرفه', 'مستحق', 'خصم ما سبق صرفه من عهده محمد عصام', 'الرصيد', 'رقم البند'];
  const a = [['شركة الامة للتجارة والمقاولات'], ['كشف حساب مقاول باطن  / ابراهيم السيد محمود (ابراهيم حداد)   الموقع / ' + SITE], H];
  rows.forEach(r => a.push([new Date(r[0] + 'T00:00:00Z'), 'ابراهيم', r[1], 1, 'مقط', 1, r[2], r[2], r[3], r[2] - r[3], 0, r[2] - r[3], null]));
  const t = new Array(13).fill(null); t[0] = 'الاجمالـــــي'; t[11] = tot; a.push(t);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(a), 'الدور الخامس');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); const pg = await (await b.newContext()).newPage();
  pg.on('pageerror', e => { f++; console.log('PAGEERR', e.message) }); pg.on('dialog', d => d.accept()); await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/, r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../index.html')); await pg.waitForFunction(() => window.S && S.db); await pg.addScriptTag({ path: XL });
  await pg.evaluate(() => { S.accounts.push({ id: 'bank', name: 'البنك', kind: 'bank', opening: 1000000 }); S.projects.push({ id: 'p5', name: 'تجديد وتطوير وحدة الاقامة بالدور الخامس - ابوالريش الياباني', value: 1, boq: [] }); render(); });
  const run = async (name, rows, tot) => {
    await pg.evaluate(() => { S.imp = null; S.impDone = ''; }); await pg.click('#side a[data-p=import]');
    await pg.setInputFiles('#imp_files', { name, mimeType: 'application/octet-stream', buffer: book(rows, tot) }); await pg.waitForFunction(() => S.imp && S.imp.files.length >= 1, null, { timeout: 20000 });
    await pg.evaluate(() => { S.imp.src = 'bank'; S.imp.cust = '__new'; S.imp.wacc = 'bank'; Object.keys(S.imp.map).forEach(k => { if (!S.imp.map[k]) S.imp.map[k] = impMatchProject(k) || ''; }); });
    await pg.click('[data-a=impGo]', { force: true }); await pg.waitForFunction(() => S.impDone, null, { timeout: 20000 });
  };
  // أسبوع 1 و2 و3 (تاريخي): بند أ: 10,000 ثم 25,000 (مدفوع 10,000)، ثم بند ب 5,000 في الأسبوع 3
  await run('ابراهيم حداد 2026-10-21.xlsx 21-10-2026', [['2026-10-07', 'توريد وتركيب حديد المظلة', 10000, 0], ['2026-10-14', 'توريد وتركيب حديد المظلة', 25000, 10000], ['2026-10-21', 'توريد وتركيب حديد المظلة', 25000, 25000], ['2026-10-21', 'كرسي انتظار', 5000, 0]], 5000);
  const r = await pg.evaluate(() => { const c = S.txs.filter(t => t.type === 'sub').sort((a, b) => a.date.localeCompare(b.date)); const L = contractorLedger(S.cfg.contractors[0].id); return { n: c.length, cum: c.map(t => t.cum), cv: c.map(t => t.cum_value), g: c.map(t => t.gross), paid: c.map(t => t.paid), owed: L.owed, reg: S.cfg.contractors.length, no: c.map(t => t.no), pb: c.map(t => certPaidBefore(t.project_id, t.party_id, t.date, t.id)) }; });
  ck('3 شهادات تراكمية', r.n === 3 && r.cum.every(Boolean), r);
  ck('القيم التراكمية 10000/25000/30000', JSON.stringify(r.cv) === '[10000,25000,30000]', r.cv);
  ck('أعمال كل أسبوع 10000/15000/5000', JSON.stringify(r.g) === '[10000,15000,5000]', r.g);
  ck('المدفوع بعد كل شهادة 10000/15000/0 وصافي المتبقي = رصيد الكشف 5000', r.owed === 5000, r);
  ck('الأسبوع 2: مدفوع سابقًا 10000 مرة واحدة', r.pb[1] === 10000, r.pb);
  ck('تسجيل المقاول تلقائيًا وأرقام الشهادات متسلسلة', r.reg === 1 && r.no.every(Boolean) && new Set(r.no).size === 3, r.no);
  // أسبوع 4 لاحق: ملف جديد فيه كل التاريخ + أسبوع 28/10 بند ج 8,000 والمدفوع السابق للشهادة الأخيرة 30,000 (تم سداد 5,000)
  await run('ابراهيم حداد 28-10-2026.xlsx', [['2026-10-07', 'توريد وتركيب حديد المظلة', 10000, 0], ['2026-10-14', 'توريد وتركيب حديد المظلة', 25000, 10000], ['2026-10-21', 'توريد وتركيب حديد المظلة', 25000, 25000], ['2026-10-21', 'كرسي انتظار', 5000, 0], ['2026-10-28', 'كرسي انتظار', 5000, 5000], ['2026-10-28', 'بوابة', 8000, 0]], 8000);
  const r2 = await pg.evaluate(() => { const c = S.txs.filter(t => t.type === 'sub').sort((a, b) => a.date.localeCompare(b.date)); const L = contractorLedger(S.cfg.contractors[0].id); return { n: c.length, cv: c.map(t => t.cum_value), owed: L.owed, pays: S.txs.filter(t => t.type === 'payment').map(t => [t.amount, t.status, t.date]), jeOk: jeAll().every(e => e.ok) }; });
  ck('إعادة الاستيراد لا تكرر القديم: 4 شهادات', r2.n === 4 && JSON.stringify(r2.cv) === '[10000,25000,30000,38000]', r2);
  ck('فرق «ما سبق صرفه» (5000) يُسجَّل سدادًا مرة واحدة', r2.pays.length === 1 && r2.pays[0][0] === 5000, r2.pays);
  ck('بعد اعتماد السداد: المتبقي = رصيد الكشف 8000', await pg.evaluate(() => { S.txs.filter(t => t.type === 'payment').forEach(t => { t.status = 'approved' }); return contractorLedger(S.cfg.contractors[0].id).owed === 8000 }), r2);
  ck('القيود متزنة', r2.jeOk === true, r2.jeOk);
  // التقارير الجديدة تعمل
  const rep = await pg.evaluate(() => { const o = {}; const cid = S.cfg.contractors[0].id; ['conStmt', 'cumWork', 'certDetail', 'conPays', 'conAdv', 'conTrade', 'conAsOf', 'dues'].forEach(k => { try { const x = REPS[k].run({ party: cid, project: '', from: '', to: '' }); o[k] = (x.rows || []).length + (x.empty ? 'E' : '') } catch (e) { o[k] = 'ERR ' + e.message } }); return o });
  ck('كل تقارير المقاولين تعمل بلا أخطاء', Object.values(rep).every(v => !String(v).startsWith('ERR')), rep);
  console.log('نجح', p, '/ فشل', f); await b.close();
})();
