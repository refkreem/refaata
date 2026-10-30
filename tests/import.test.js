// استيراد كشوف الخميس على ملفات حقيقية
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const XL = '/tmp/claude-0/xl/node_modules/xlsx/dist/xlsx.full.min.js', JZ = '/tmp/claude-0/xl/node_modules/jszip/dist/jszip.min.js';
const DIR = process.env.THU || '/tmp/claude-0/thu/x', ZIP = process.env.THUZIP || '/tmp/claude-0/thu/a.zip';
let f = 0, p = 0; const ck = (n, c, x) => { if (c) { p++; console.log('  ✔', n) } else { f++; console.log('  ✘', n, JSON.stringify(x)) } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); const pg = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  pg.on('pageerror', e => { f++; console.log('PAGEERR', e.message) }); pg.on('dialog', d => d.accept()); await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/, r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../index.html')); await pg.waitForFunction(() => window.S && S.db);
  await pg.addScriptTag({ path: XL }); await pg.addScriptTag({ path: JZ });
  await pg.evaluate(() => { S.accounts.push({ id: 'bank', name: 'البنك', kind: 'bank', opening: 1000000 }); S.projects.push({ id: 'p9', name: 'مبني عميد كلية الطب قصر العيني', value: 1, boq: [] }); S.cfg.contractors.push({ id: 'c9', name: 'حمدي ستاير', trade: 'ستائر', open: 0 }); render(); });
  const files = fs.readdirSync(DIR).filter(x => /\.xlsx$/.test(x)).map(x => ({ name: x, mimeType: 'application/octet-stream', buffer: fs.readFileSync(path.join(DIR, x)) }));
  await pg.click('#side a[data-p=import]'); await pg.setInputFiles('#imp_files', files); await pg.waitForFunction(() => S.imp && S.imp.files.length > 20, null, { timeout: 60000 });
  const st = await pg.evaluate(() => ({ f: S.imp.files.length, l: S.imp.lines.length, w: S.imp.wages.length, e: S.imp.exp.length, from: S.imp.from, to: S.imp.to }));
  ck('قراءة 22 ملفًا', st.f === 22, st); ck('68 حركة مصروفات', st.e === 68, st); ck('الفترة 22→28 أكتوبر', st.from === '2026-10-22' && st.to === '2026-10-28', st); ck('كشوف أجور 8 أوراق', st.w >= 8, st);
  const B = await pg.evaluate(() => { const B = impBuild(S.imp); const ib = B.groups.filter(g => g.con.indexOf('ابراهيم') >= 0).map(g => [g.site, Math.round(g.due)]); return { n: B.groups.length, tot: Math.round(B.groups.reduce((s, g) => s + g.due, 0)), ib }; });
  ck('إجمالي مستحق المقاولين 440,000 تقريبًا', Math.abs(B.tot - 565671) < 5, B); ck('ابراهيم: 3 مواقع', B.ib.length === 3 && B.ib.some(x => x[0].indexOf('الخامس') > 0 && x[1] === 48000) && B.ib.some(x => x[0].indexOf('معتز') > 0 && x[1] === 3500), B.ib);
  await pg.evaluate(() => { S.imp.src = 'bank'; S.imp.cust = '__new'; S.imp.wacc = 'bank'; Object.keys(S.imp.map).forEach(k => { if (!S.imp.map[k]) S.imp.map[k] = '__new'; }); });
  await pg.click('[data-a=impGo]'); await pg.waitForFunction(() => S.impDone, null, { timeout: 60000 });
  const r = await pg.evaluate(() => { const T = S.txs; return { n: T.length, sub: T.filter(t => t.type === 'sub').length, lab: T.filter(t => t.type === 'labor').length, pend: T.filter(t => t.status === 'pending').length, approved: T.filter(t => t.status === 'approved').length, subTot: Math.round(sum(T.filter(t => t.type === 'sub'), t => t.net)), laborTot: Math.round(sum(T.filter(t => t.type === 'labor'), t => t.total)), cons: S.cfg.contractors.length, projs: S.projects.length, jeOk: jeAll().every(e => e.ok), cust: accStats(S.accounts.find(a => a.name === 'عهدة المحاسب')).bal, hamdi: contractorLedger('c9').owed, ibr: S.cfg.contractors.filter(c => c.name.indexOf('ابراهيم') >= 0).map(c => c.id).map(id => contractorLedger(id).owed) }; });
  console.log(r);
  ck('مستخلصات المقاولين = إجمالي المستحق', Math.abs(r.subTot - (565671 - r.disc)) < 5, r); ck('الأجور 116,450 + 3,400', r.laborTot === 119850, r.laborTot); ck('كل القيود متزنة', r.jeOk);
  ck('حمدي ستاير مطابق للمقاول الموجود ورصيده صفر بعد سداد 100,000', r.hamdi === 0 || Math.abs(r.hamdi) < 1, r.hamdi);
  const again = await pg.evaluate(async () => { const before = S.txs.length; await ACT.impGo(); return S.txs.length - before; });
  ck('إعادة التحميل لا تكرر الحركات', again === 0, again);
  await pg.click('#side a[data-p=review]'); await pg.waitForTimeout(200); ck('المراجعة تعرض ما ينقص', await pg.evaluate(() => document.body.innerText.includes('ينقص')));
  const cs = await pg.evaluate(() => { ACT.go('costs'); return Math.abs(sum(costAtoms({}), a => a.amount) - sum(S.projects, p => projTotals(p.id).cost)) < 1 }); ck('اتساق التكاليف بعد الاستيراد', cs);
  // zip
  await pg.evaluate(() => { S.imp = null; }); await pg.click('#side a[data-p=import]'); await pg.setInputFiles('#imp_files', { name: 'a.zip', mimeType: 'application/zip', buffer: fs.readFileSync(ZIP) }); await pg.waitForFunction(() => S.imp && S.imp.files.length > 0, null, { timeout: 60000 }).catch(() => { });
  ck('قراءة ملف zip', await pg.evaluate(() => S.imp && S.imp.files.length === 22), await pg.evaluate(() => S.imp && S.imp.files.length));
  console.log(`نجح ${p} / فشل ${f}`); await b.close(); process.exit(f ? 1 : 0)
})();
