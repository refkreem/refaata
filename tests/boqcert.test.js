const { chromium } = require('playwright'); const path = require('path');
let f = 0, p = 0; const ck = (n, c, x) => { if (c) { p++; console.log('  ✔', n) } else { f++; console.log('  ✘', n, JSON.stringify(x)) } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); const pg = await (await b.newContext()).newPage();
  pg.on('pageerror', e => { f++; console.log('PAGEERR', e.message) }); pg.on('dialog', async d => d.type() === 'prompt' ? await d.accept('تصحيح') : await d.accept()); await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/, r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../index.html')); await pg.waitForFunction(() => window.S && S.db);
  await pg.evaluate(() => { S.accounts = [{ id: 'a1', name: 'خزينة', kind: 'cash', opening: 100000 }]; S.projects = [{ id: 'p1', name: 'م1', value: 100000, boq: [{ id: 'b1', code: '1', name: 'حديد مظلة', unit: 'مقط', qty: 1, price: 40000, group: 'أعمال معدنية' }, { id: 'b2', code: '2', name: 'باب حديد', unit: 'عدد', qty: 4, price: 5000, group: 'أعمال معدنية' }] }]; S.cfg.contractors = [{ id: 'c1', name: 'ابراهيم', trade: 'حداد', open: 0 }]; S.txs = []; });
  const cert = async (date, rows, paid) => {
    await pg.evaluate(() => openForm('sub')); await pg.selectOption('#t_proj', 'p1'); await pg.selectOption('#t_con', 'c1'); await pg.fill('#t_date', date); await pg.waitForTimeout(150);
    for (let i = 0; i < rows.length; i++) {
      if (i >= 2) await pg.evaluate(() => ACT.certAddRow());
      const tr = pg.locator('#c_tbl tbody tr').nth(i); await tr.locator('.cl_d').fill(rows[i][0]); await tr.locator('.cl_q').fill(String(rows[i][1])); await tr.locator('.cl_p').fill(String(rows[i][2])); await tr.locator('.cl_b').selectOption(rows[i][3]);
    }
    await pg.fill('#c_paid', String(paid || '')); await pg.selectOption('#f_acc', 'a1').catch(() => {}); await pg.evaluate(() => { const b = document.querySelector('[data-a=msave]'); b && b.click() }); await pg.waitForTimeout(300);
  };
  await cert('2026-10-07', [['حديد المظلة', 1, 10000, 'b1'], ['باب', 1, 5000, 'b2']], 0);
  await cert('2026-10-14', [['حديد المظلة', 1, 25000, 'b1'], ['باب', 2, 5000, 'b2']], 0);
  const r = await pg.evaluate(() => { const c = S.txs.filter(t => t.type === 'sub').sort((a, b) => a.date.localeCompare(b.date)); return { n: c.length, cv: c.map(t => t.cum_value), g: c.map(t => t.gross), l: c.map(t => t.lines.map(l => [l.boq_id, l.price])), b1: itemUse('p1', 'b1').total, b2: itemUse('p1', 'b2').total, pc: costOf(c[0]) + costOf(c[1]) }; });
  ck('شهادتان تراكميتان 15000 ثم 35000', r.n === 2 && JSON.stringify(r.cv) === '[15000,35000]', r);
  ck('الأسبوع 2: أعمال 20000', JSON.stringify(r.g) === '[15000,20000]', r.g);
  ck('توزيع الشهادة على بنود المقايسة', JSON.stringify(r.l[1]) === '[["b1",15000],["b2",5000]]', r.l);
  ck('تكلفة البند 1 = 25000 والبند 2 = 10000 (بلا تكرار)', Math.round(r.b1) === 25000 && Math.round(r.b2) === 10000, [r.b1, r.b2]);
  // تعديل الشهادة الأولى: يُعاد احتساب الثانية
  await pg.evaluate(async () => { const t = S.txs.filter(x => x.type === 'sub').sort((a, b) => a.date.localeCompare(b.date))[0]; t.cert_lines[0].p = 12000; t.cum_value = 17000; t.cum_base = 17000; await dbSet('txs', t); await cumRecalc('p1', 'c1') });
  const r2 = await pg.evaluate(() => { const c = S.txs.filter(t => t.type === 'sub').sort((a, b) => a.date.localeCompare(b.date)); return { g: c.map(t => t.gross), l1: c[1].lines.map(l => [l.boq_id, l.price]), total: c.reduce((s, t) => s + t.gross, 0), b1: itemUse('p1', 'b1').total } });
  ck('بعد تعديل الأولى: الفرق يُعاد (17000 ثم 18000) والإجمالي ثابت 35000', JSON.stringify(r2.g) === '[17000,18000]' && r2.total === 35000, r2);
  ck('بند 1 بعد التعديل = 25000', Math.round(r2.b1) === 25000, r2.b1);
  console.log('نجح', p, '/ فشل', f); await b.close();
})();
