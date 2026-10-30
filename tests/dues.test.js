const { chromium } = require('playwright'); const path = require('path');
let f = 0, p = 0; const ck = (n, c, x) => { if (c) { p++; console.log('  ✔', n) } else { f++; console.log('  ✘', n, JSON.stringify(x)) } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); const pg = await (await b.newContext()).newPage();
  pg.on('pageerror', e => { f++; console.log('PAGEERR', e.message) }); await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/, r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../index.html')); await pg.waitForFunction(() => window.S && S.db);
  await pg.evaluate(async () => { S.accounts.push({ id: 'c', name: 'خ', kind: 'cash', opening: 100000 }); S.projects.push({ id: 'p', name: 'م', value: 1, boq: [] }); S.cfg.contractors.push({ id: 'k', name: 'مقاول', trade: 'كهرباء' }); S.cfg.suppliers.push('مورد'); S.cfg.workers.push({ name: 'عامل 1', trade: 'نقاش' });
    await saveTx({ type: 'sub', date: '2026-10-01', project_id: 'p', party_id: 'k', gross: 10000, prior_paid: 0, net: 10000, paid: 4000, account_id: 'c' }); await saveTx({ type: 'purchase', date: '2026-10-01', project_id: 'p', supplier: 'مورد', total: 3000, paid: 1000, account_id: 'c', lines: [] }); await saveTx({ type: 'adv', kind: 'worker', party: 'عامل 1', date: '2026-10-02', amount: 500, account_id: 'c' }); });
  const r = await pg.evaluate(() => REPS.dues.run({}));
  ck('مقاول مستحق 6,000', r.rows.some(x => x[1] === 'مقاول' && x[6] === 6000), r.rows); ck('مورد 2,000', r.rows.some(x => x[1] === 'مورد' && x[6] === 2000)); ck('عامل سلفة 500', r.rows.some(x => x[1] === 'عامل 1' && x[5] === 500)); ck('الإجمالي 8,000', r.summary[0][1] === 8000);
  await pg.click('#side a[data-p=expenses]'); ck('زر الكشف موجود', await pg.locator('[data-a=duesXl]').count() === 1);
  console.log(`نجح ${p} / فشل ${f}`); await b.close(); process.exit(f ? 1 : 0)
})();
