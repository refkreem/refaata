// مستخلصات العميل، أوامر التغيير، أعمار الديون، لوحة التحكم، ودورة كاملة
const { chromium } = require('playwright'); const path = require('path');
let fails = 0, passes = 0;
function ck(n, c, x) { if (c) { passes++; console.log('  ✔', n); } else { fails++; console.log('  ✘', n, x === undefined ? '' : JSON.stringify(x)); } }
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  pg.on('pageerror', e => { fails++; console.log('   PAGEERR', e.message); }); pg.on('dialog', d => d.accept());
  await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/, r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../index.html')); await pg.waitForFunction(() => window.S && S.db);
  const ev = (f, a) => pg.evaluate(f, a); const set = (s, v) => pg.fill(s, String(v));
  const save = async () => { await pg.click('#msaveBtn'); await pg.waitForTimeout(250); };
  await ev(() => { S.accounts.push({ id: 'cash', name: 'الخزينة', kind: 'cash', opening: 1000000 }); S.projects.push({ id: 'p1', name: 'ICU', client: 'مستشفى', value: 1000000, advance: 100000, expected_cost: 700000, boq: [] }); S.cfg.suppliers.push('مورد س'); render(); });
  console.log('أوامر التغيير');
  await ev(() => { const p = S.projects[0]; p.variations = [{ id: 'v1', date: today(), desc: 'إضافة', amount: 50000 }, { id: 'v2', date: today(), desc: 'تخفيض', amount: -20000 }]; });
  ck('قيمة العقد بعد التغيير 1,030,000', (await ev(() => pval(S.projects[0]))) === 1030000);
  console.log('مستخلص عميل');
  await pg.click('#side a[data-p=revenues]'); await pg.click('[data-a=openForm][data-p=ipc]').catch(async () => { await ev(() => openForm('ipc')); });
  await pg.selectOption('#t_proj', 'p1'); await set('#i_gross', 300000); await set('#i_adv', 30000); await set('#i_ret', 5); await set('#i_tax', 2); await set('#i_oth', 1000); await pg.waitForTimeout(150);
  // net = 300000-30000-15000-6000-1000 = 248000
  ck('الصافي = 248,000', (await ev(() => $('i_n').textContent)) === '248,000');
  ck('رقم المستخلص تلقائي 1', (await ev(() => $('i_no').value)) === '1');
  await save();
  const ip = await ev(() => S.txs.find(t => t.type === 'ipc'));
  ck('حُفظ بالقيم', ip && ip.net === 248000 && ip.ret_amt === 15000 && ip.tax_amt === 6000, ip);
  let I = await ev(() => projIpc('p1'));
  ck('المستحق = 248,000 والمحتجز = 15,000', I.due === 248000 && I.retHeld === 15000, I);
  ck('المستخلص لا يغيّر الخزينة', (await ev(() => accStats(S.accounts[0]).bal)) === 1000000);
  console.log('تحصيل');
  await ev(() => { saveTx({ type: 'revenue', date: today(), project_id: 'p1', amount: 100000, kind: 'دفعة', account_id: 'cash', method: 'cash' }); }); await pg.waitForTimeout(250);
  I = await ev(() => projIpc('p1'));
  ck('المستحق بعد تحصيل 100,000 = 148,000', I.due === 148000, I);
  ck('الخزينة +100,000', (await ev(() => accStats(S.accounts[0]).bal)) === 1100000);
  console.log('أعمار الديون');
  await ev(() => { saveTx({ type: 'purchase', date: '2026-01-01', project_id: 'p1', supplier: 'مورد س', invoice: '1', lines: [{ item: 'حديد', qty: 1, price: 10000 }], total: 10000, paid: 0, cat: 'مواد' }); }); await pg.waitForTimeout(250);
  const ag = await ev(() => { S.rf = { rep: 'aging' }; return REPS.aging.run({}); });
  const sup = ag.rows.find(r => r[0] === 'مورد س'), cl = ag.rows.find(r => r[1].indexOf('عميل') === 0);
  ck('مورد: مبلغ في خانة >90 يوم', sup && sup[5] === 10000, sup); ck('عميل: 148,000 مستحق', cl && cl[6] === 148000, cl);
  console.log('لوحة التحكم والواجهات');
  for (const v of ['dashboard', 'revenues', 'costs', 'reports', 'projects']) { await pg.click('#side a[data-p=' + v + ']'); await pg.waitForTimeout(150); }
  await pg.click('#side a[data-p=dashboard]'); await pg.waitForTimeout(150);
  ck('رسوم SVG في لوحة التحكم', (await ev(() => document.querySelectorAll('#main svg, #app svg').length)) >= 2);
  await ev(() => ACT.openProj('p1')); await pg.waitForTimeout(150);
  ck('مؤشرات المستخلصات في المشروع', (await ev(() => document.body.innerText.includes('المستحق تحصيله من العميل'))));
  ck('الاتساق: تكاليف الذرات = تكاليف المشاريع', (await ev(() => Math.abs(sum(costAtoms({}), a => a.amount) - sum(S.projects, p => projTotals(p.id).cost)) < 1)));
  console.log(`\nنجح ${passes} / فشل ${fails}`); await b.close(); process.exit(fails ? 1 : 0);
})();
