// المحاسبة: قيود متزنة، ميزان مراجعة، ميزانية، استقطاعات، محتجز، إقفال
const { chromium } = require('playwright'); const path = require('path');
let fails = 0, passes = 0;
function ck(n, c, x) { if (c) { passes++; console.log('  ✔', n); } else { fails++; console.log('  ✘', n, x === undefined ? '' : JSON.stringify(x)); } }
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const toasts = []; pg.on('pageerror', e => { fails++; console.log('   PAGEERR', e.message); }); pg.on('dialog', d => d.accept());
  await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/, r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../index.html')); await pg.waitForFunction(() => window.S && S.db);
  const ev = (f, a) => pg.evaluate(f, a); const set = (s, v) => pg.fill(s, String(v));
  const save = async () => { await pg.click('#msaveBtn'); await pg.waitForTimeout(250); };
  await ev(() => { S.accounts.push({ id: 'cash', name: 'الخزينة', kind: 'cash', opening: 100000 }, { id: 'bank', name: 'البنك الأهلي', kind: 'bank', opening: 400000 }); S.projects.push({ id: 'p1', name: 'ICU', client: 'مستشفى', value: 1000000, advance: 0, expected_cost: 700000, boq: [] }); S.cfg.suppliers.push('مورد س'); S.cfg.supInfo = { 'مورد س': { open: 20000 } }; S.cfg.contractors.push({ id: 'c1', name: 'مقاول ص', trade: 'تكييف', open: 30000 }); render(); });
  const T = (o) => ev(o => saveTx(Object.assign({ date: '2026-10-01', status: 'approved' }, o)), o);
  console.log('قيد افتتاحي');
  let tb = await ev(() => REPS.tb.run({}));
  ck('ميزان المراجعة متزن في البداية', tb.summary[2][1] === 0, tb.summary);
  console.log('حركات');
  await T({ type: 'purchase', project_id: 'p1', supplier: 'مورد س', invoice: '1', cat: 'مواد', lines: [{ item: 'حديد', qty: 1, price: 11400 }], total: 11400, vat: 1400, paid: 5000, account_id: 'cash' });
  await T({ type: 'sub', project_id: 'p1', party_id: 'c1', gross: 50000, prior_paid: 0, net: 45000, adv_recov: 2000, tax_amt: 3000, paid: 20000, account_id: 'bank' });
  await T({ type: 'labor', project_id: 'p1', total: 10000, adv: 1000, net: 9000, rows: [], account_id: 'cash' });
  await T({ type: 'expense', project_id: 'p1', category: 'نقل وانتقالات', amount: 800, account_id: 'cash' });
  await T({ type: 'expense', category: 'إيجارات', amount: 5000, account_id: 'bank' });
  await T({ type: 'adv', kind: 'contractor', party_id: 'c1', amount: 7000, account_id: 'bank' });
  await T({ type: 'payment', kind: 'supplier', party: 'مورد س', amount: 6400, account_id: 'bank' });
  await T({ type: 'transfer', from: 'bank', to: 'cash', amount: 10000 });
  // إيراد 200,000 : قيمة مضافة مخصومة 14,000 ، خصم وإضافة 2,000 ، تأمينات 7,200 ، محتجز 10,000 ، منها قيمة مضافة مخرجات 24,561.40
  await T({ type: 'revenue', project_id: 'p1', kind: 'مستخلص جاري', amount: 200000, wh: [{ k: 'vat', amt: 14000 }, { k: 'tax', amt: 2000 }, { k: 'ins', amt: 7200 }, { k: 'ret', amt: 10000 }], vat_out: 24000, account_id: 'bank' });
  await T({ type: 'expense', category: 'سداد ضريبة قيمة مضافة', amount: 3000, account_id: 'bank' });
  const E = await ev(() => jeAll());
  ck('كل القيود متزنة', E.every(e => e.ok), E.filter(e => !e.ok).map(e => e.desc));
  tb = await ev(() => REPS.tb.run({}));
  ck('ميزان المراجعة متزن بعد الحركات', tb.summary[2][1] === 0, tb.summary);
  console.log('تطابق مع الأنظمة الفرعية');
  const chk = await ev(() => {
    const B = {}; jeAll().forEach(e => e.lines.forEach(l => { B[l.a] = (B[l.a] || 0) + l.d - l.c }));
    return { cash: B['T:cash'], bank: B['T:bank'], accCash: accStats(acc('cash')).bal, accBank: accStats(acc('bank')).bal, sup: -B['2101'], supLed: supplierLedger('مورد س').bal, con: -B['2102'], conLed: contractorLedger('c1').owed, rev: -B['4101'], projRev: projTotals('p1').revenue, cost: (B['5101'] || 0) + (B['5102'] || 0) + (B['5103'] || 0) + Object.keys(B).filter(k => k.indexOf('D:') === 0).reduce((s, k) => s + B[k], 0), projCost: projTotals('p1').cost };
  });
  ck('رصيد الخزينة يطابق دفتر الأستاذ', chk.cash === chk.accCash, chk); ck('رصيد البنك يطابق', chk.bank === chk.accBank, chk);
  ck('رصيد الموردين يطابق كشف المورد', chk.sup === chk.supLed, chk); ck('رصيد المقاولين يطابق كشف المقاول', chk.con === chk.conLed, chk);
  ck('إيراد دفتر الأستاذ = إيراد المشروع (قبل ضريبة المخرجات)', chk.rev + 24000 === chk.projRev, chk);
  ck('تكلفة المشروع = تكلفة الحسابات (بدون ضريبة المدخلات)', chk.cost === chk.projCost, chk);
  const bs = await ev(() => REPS.bs.run({})), is = await ev(() => REPS.is.run({}));
  ck('الميزانية متزنة', bs.summary[3][1] === 0, bs.summary);
  ck('الخزينة+البنك = الفعلي', (await ev(() => sum(S.accounts, a => accStats(a).bal))) === chk.cash + chk.bank);
  ck('صافي الربح = إيراد − تكلفة − مصروفات', is.summary[3][1] === is.summary[0][1] - is.summary[1][1] - (await ev(() => 5000)), is.summary);
  const vat = await ev(() => REPS.vat.run({}));
  ck('ضريبة القيمة المضافة: مخرجات 24,000 ومدخلات 1,400 ومخصوم 14,000', vat.rows[0][1] === 24000 && vat.rows[1][1] === 1400 && vat.rows[2][1] === 14000, vat.rows.slice(0, 3));
  ck('صافي المستحق 8,600 والمتبقي 5,600', vat.rows[3].c[1] === 8600 && vat.rows[5].c[1] === 5600, [vat.rows[3], vat.rows[5]]);
  ck('سداد الضريبة لا يُحسب مصروفًا عامًا', (await ev(() => TX().filter(t => t.type === 'expense' && !t.project_id && !isVatSettle(t)).length)) === 1);
  console.log('محتجز لدى العميل');
  await T({ type: 'revenue', project_id: 'p1', kind: 'محتجز / ضمان أعمال', amount: 10000, account_id: 'bank' });
  const r2 = await ev(() => ({ rev: projTotals('p1').revenue, ret: jeAll().reduce((s, e) => s + e.lines.filter(l => l.a === '1305').reduce((q, l) => q + l.d - l.c, 0), 0) }));
  ck('صرف المحتجز لا يزيد الإيراد ويصفّر حساب المحتجز', r2.rev === 200000 && r2.ret === 0, r2);
  console.log('قيد يدوي وإقفال');
  await ev(() => { S.cfg.jes = [{ id: 'j1', date: '2026-10-05', desc: 'تسوية', lines: [{ a: '6501', d: 100, c: 0 }, { a: '2104', d: 0, c: 100 }] }]; });
  ck('القيد اليدوي يظهر والميزان متزن', (await ev(() => jeAll().length)) === E.length + 2 && (await ev(() => REPS.tb.run({}).summary[2][1])) === 0);
  await ev(() => { S.cfg.closedTo = '2026-10-31'; });
  const blocked = await ev(() => saveTx({ type: 'expense', date: '2026-10-15', category: 'أخرى', amount: 10, account_id: 'cash' }));
  ck('الحركة في فترة مقفلة مرفوضة', blocked === false);
  await ev(() => { S.cfg.closedTo = ''; });
  console.log('الواجهات');
  for (const v of ['acct', 'reports']) { await pg.click('#side a[data-p=' + v + ']'); await pg.waitForTimeout(200); }
  await pg.click('#side a[data-p=acct]'); await pg.waitForTimeout(200);
  ck('شاشة القيود تظهر', (await ev(() => document.body.innerText.includes('كل القيود متزنة'))));
  for (const t of ['coa', 'close', 'je']) { await ev(t => ACT.acctTab(t), t); }
  for (const k of ['jr', 'led', 'tb', 'is', 'bs', 'vat', 'cfl']) { const r = await ev(k => { S.rf = { rep: k }; S.view = 'reports'; render(); return !!document.querySelector('table'); }, k); ck('تقرير ' + k + ' يُعرض', r); }
  console.log(`\nنجح ${passes} / فشل ${fails}`); await b.close(); process.exit(fails ? 1 : 0);
})();
