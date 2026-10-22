// اختبار دورة كاملة: خزائن → مشروع → مقايسة → مقاول → مشتريات → مستخلص → عمالة → إيراد → إنجاز → تقارير
const { chromium } = require('playwright');
const path = require('path');
let fails = 0, passes = 0;
function ck(name, cond, extra) { if (cond) { passes++; console.log('  ✔', name); } else { fails++; console.log('  ✘', name, extra === undefined ? '' : JSON.stringify(extra)); } }
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => { errs.push(e.message); console.log('   PAGEERR', e.message); }); pg.on('console', m => { if (m.type() === 'error' && !/net::|Failed to load/.test(m.text())) errs.push(m.text()); });
  pg.on('dialog', d => d.accept());
  await pg.route(/gstatic|cdnjs|googleapis/, r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  await pg.waitForFunction(() => window.S && S.db);
  const ev = (f, a) => pg.evaluate(f, a);
  const click = async (sel) => { await pg.click(sel); };
  const set = async (sel, v) => { await pg.fill(sel, String(v)); };
  const acct = async (m, a) => { await pg.selectOption('#f_pm', m); await pg.selectOption('#f_acc', a); };
  const save = async () => { await pg.click('#msaveBtn'); await pg.waitForTimeout(150); const t = await pg.evaluate(() => { const e = document.getElementById('toast'); return e.style.display === 'block' ? e.textContent : ''; }); if (/^(⚠|حدث|اكتب|اختر|أضف|كل )/.test(t)) console.log('   [toast]', t); };

  console.log('القائمة والبداية');
  const menu = await ev(() => Array.from(document.querySelectorAll('#side a')).map(a => a.textContent.trim()));
  ck('الخزائن والبنوك أول القائمة', menu[0].includes('الخزائن والبنوك'), menu);
  ck('المشاريع ثانيًا', menu[1].includes('المشاريع'));
  ck('لا كشف عهد ولا دفعة الخميس', !menu.join('|').includes('عهد') && !menu.join('|').includes('الخميس'));
  ck('النظام يبدأ فارغًا', await ev(() => S.projects.length === 0 && S.txs.length === 0 && S.accounts.length === 0));

  console.log('الخزائن والبنوك');
  await click('[data-a=accAdd][data-p=cash]'); await set('#a_name', 'الخزينة'); await set('#a_open', 100000); await save();
  await click('[data-a=accAdd][data-p=bank]'); await set('#a_name', 'البنك الأهلي'); await set('#a_open', 1000000); await save();
  await click('[data-a=accAdd][data-p=bank]'); await set('#a_name', 'بنك مصر'); await set('#a_open', 0); await save();
  ck('3 حسابات', await ev(() => S.accounts.length === 3));
  const ids = await ev(() => S.accounts.map(a => a.id)); const [cash, nbe, misr] = ids;
  await click('[data-a=transfer]'); await pg.selectOption('#x_from', nbe); await pg.selectOption('#x_to', cash); await set('#x_amt', 50000); await save();
  ck('تحويل داخلي لا يغير الإجمالي', await ev(() => S.accounts.reduce((s, a) => s + accStats(a).bal, 0)) === 1100000);
  ck('رصيد الخزينة 150000', await ev(() => accStats(S.accounts[0]).bal) === 150000);

  console.log('المشاريع');
  await pg.click('#side a[data-p=projects]');
  await click('[data-a=projAdd]'); await set('#p_name', 'ICU تجريبي'); await set('#p_months', 6); await set('#p_start', '2026-01-31'); await set('#p_val', 1000000); await set('#p_exp', 700000);
  ck('الاستلام الابتدائي = بدء + 6 شهور (مع ضبط آخر الشهر)', await ev(() => document.getElementById('p_init').value) === '2026-07-31');
  ck('الاستلام النهائي بعد سنة', await ev(() => document.getElementById('p_fin').value) === '2027-07-31');
  await save();
  ck('مشروع محفوظ', await ev(() => S.projects.length === 1 && S.projects[0].months === 6));
  ck('بعد حفظ مشروع جديد تُفتح مقايسته مباشرة', await ev(() => S.vp === S.projects[0].id && S.tab === 'boq')); await pg.waitForTimeout(100);
  const pid = await ev(() => S.projects[0].id);
  for (const [code, name, unit, qty, price, cp] of [['1', 'دكت مجلفن', 'م2', 100, 1000, 700], ['2', 'فلتر HEPA', 'عدد', 10, 20000, 15000]]) {
    await click('[data-a=boqAdd]'); await set('#b_code', code); await set('#b_name', name); await set('#b_unit', unit); await set('#b_qty', qty); await set('#b_price', price); await set('#b_cost', cp); await save();
  }
  const [b1, b2] = await ev(() => S.projects[0].boq.map(b => b.id));
  ck('بندان بقيمة مقايسة 300000', await ev(() => projBoqValue(S.projects[0])) === 300000);

  console.log('مقاولو الباطن');
  await pg.click('#side a[data-p=subs]');
  await click('[data-a=newTx][data-p="contractor|"]'); await set('#c_name', 'م. أحمد'); await set('#c_trade', 'تكييف'); await save();
  const cid = await ev(() => S.cfg.contractors[0].id);
  await click('[data-a=newTx][data-p="adv|contractor"]'); await pg.selectOption('#t_con', cid); await set('#t_amt', 10000); await pg.selectOption('#f_acc', cash); await save();
  ck('دفعة مقدمة خرجت من الخزينة', await ev(() => accStats(S.accounts[0]).bal) === 140000);
  await click('[data-a=newTx][data-p="sub|"]'); await pg.selectOption('#t_proj', pid); await pg.selectOption('#t_con', cid);
  await pg.selectOption('#lines .l_boq', b1); await set('#lines .l_qty', 40); await pg.waitForTimeout(100);
  ck('سعر الفئة يُملأ بالتكلفة المقدرة', await ev(() => document.querySelector('#lines .l_price').value) === '700');
  const hint = await ev(() => document.querySelector('#lines .l_hint').textContent);
  ck('تظهر مقارنة البند مع المقايسة', hint.includes('100,000') && hint.includes('دكت'), hint);
  await set('#t_adv', 10000); await acct('تحويل بنكي', nbe); await pg.waitForTimeout(50);
  ck('الصافي = 28000 - 10000', await ev(() => document.getElementById('s_net').textContent) === '18,000');
  await save();
  ck('مستخلص 1: تكلفة 28000 ونقد 18000 من البنك', await ev(() => { const t = S.txs.filter(x => x.type === 'sub')[0]; return costOf(t) === 28000 && t.paid === 18000 && accStats(S.accounts[1]).bal === 1000000 - 50000 - 18000; }));
  await click('[data-a=newTx][data-p="sub|"]'); await pg.selectOption('#t_proj', pid); await pg.selectOption('#t_con', cid);
  await pg.selectOption('#lines .l_boq', b1); await pg.waitForTimeout(100);
  ck('الكمية السابقة تُسترجع تلقائيًا (40)', await ev(() => document.querySelector('#lines .l_prev').value) === '40');
  await set('#lines .l_qty', 100); await pg.waitForTimeout(100);
  ck('ما سبق صرفه = 28000 وإجمالي تراكمي 70000', await ev(() => document.getElementById('t_prior').value) === '28000' && await ev(() => document.getElementById('s_gross').value) === '70,000');
  await acct('تحويل بنكي', nbe); await set('#t_paid', 20000); await save();
  ck('تكلفة المستخلص 2 = 42000', await ev(() => costOf(S.txs.filter(x => x.type === 'sub')[1])) === 42000);
  ck('مستحق للمقاول 22000 (صافي 42000 - 20000)', Math.abs(await ev(() => contractorLedger(S.cfg.contractors[0].id).owed) - 22000) < 0.01);
  ck('دفعة مقدمة قائمة صفر', await ev(() => contractorLedger(S.cfg.contractors[0].id).advOut) === 0);

  console.log('المشتريات');
  await pg.click('#side a[data-p=purchases]'); await click('[data-a=newTx][data-p="purchase|"]');
  await pg.selectOption('#t_proj', pid); await pg.selectOption('#t_cat', 'أخرى'); await set('#t_sup', 'هيبا');
  await set('#lines .l_item', 'فلتر HEPA H14'); await set('#lines .l_unit', 'عدد'); await set('#lines .l_qty', 4); await set('#lines .l_price', 16000);
  await pg.selectOption('#lines .l_boq', b2); await pg.waitForTimeout(100);
  ck('تلميح البند يعرض قيمة المقايسة والمتبقي', (await ev(() => document.querySelector('#lines .l_hint').textContent)).includes('200,000'));
  await acct('تحويل بنكي', misr); await set('#t_paid', 40000); await save();
  ck('المشتريات: إجمالي 64000 مدفوع 40000 آجل 24000', await ev(() => { const t = S.txs.filter(x => x.type === 'purchase')[0]; return t.total === 64000 && t.paid === 40000 && supplierLedger('هيبا').bal === 24000; }));
  ck('الصنف أُضيف تلقائيًا لقائمة الأصناف', await ev(() => S.cfg.catalog.some(c => c.name === 'فلتر HEPA H14' && c.cat === 'أخرى')));
  ck('رصيد بنك مصر -40000', await ev(() => accStats(S.accounts[2]).bal) === -40000);
  await click('[data-a=newTx][data-p="payment|supplier"]'); await pg.selectOption('#t_sup', 'هيبا'); await set('#t_amt', 24000); await acct('تحويل بنكي', nbe); await save();
  ck('سداد المورد صفّر الرصيد', await ev(() => supplierLedger('هيبا').bal) === 0);

  console.log('العمالة');
  await pg.click('#side a[data-p=labor]'); await click('[data-a=newTx][data-p="adv|worker"]'); await set('#t_party', 'محمود'); await set('#t_amt', 300); await pg.selectOption('#f_acc', cash); await save();
  await click('[data-a=newTx][data-p="labor|"]'); await pg.selectOption('#t_proj', pid);
  await set('#lines .w_name', 'محمود'); await set('#lines .w_rate', 400); await set('#lines .w_days', 6); await set('#lines .w_otn', 2); await set('#lines .w_shn', 1); await pg.waitForTimeout(100);
  ck('إجمالي: 2400 + 2×200 − 1×200 = 2600', await ev(() => document.getElementById('s_total').textContent) === '2,600');
  ck('يقترح خصم السلفة 300', (await ev(() => document.querySelector('#lines .w_hint').textContent)).includes('300'));
  console.log('   dup ids:', await ev(() => document.querySelectorAll('#wr0').length), await ev(() => document.querySelector('[data-a=useWAdv]').closest('.ln').id)); await pg.click('[data-a=useWAdv]'); console.log('   adv:', await ev(() => document.querySelector('#lines .w_adv').value)); await pg.selectOption('#f_acc', cash); await pg.waitForTimeout(50);
  const sn = await ev(() => [document.getElementById('s_net').textContent, document.querySelector('#lines .w_adv').value]); ck('الصافي 2300', sn[0] === '2,300', sn); await save();
  ck('تكلفة العمالة 2600 ونقد 2300 وسلف قائمة 0', await ev(() => { const t = S.txs.filter(x => x.type === 'labor')[0]; return costOf(t) === 2600 && t.net === 2300 && workerAdv('محمود') === 0; }));
  await click('[data-a=newTx][data-p="labor|"]'); await pg.selectOption('#t_proj', pid); await set('#lines .w_name', 'عم حسن'); await pg.selectOption('#lines .w_mode', 'month'); await set('#lines .w_rate', 9000); await set('#lines .w_days', 15); await pg.waitForTimeout(80);
  ck('شهري: 9000÷30×15 = 4500', await ev(() => document.getElementById('s_total').textContent) === '4,500'); await pg.selectOption('#f_acc', cash); await save();

  console.log('الإيرادات والمصروفات والإنجاز');
  await pg.click('#side a[data-p=revenues]'); await click('[data-a=newTx][data-p="revenue|"]'); await pg.selectOption('#t_proj', pid); await set('#t_amt', 300000); await pg.selectOption('#f_acc', nbe); await save();
  await pg.click('#side a[data-p=expenses]'); await click('[data-a=newTx][data-p="expense|"]'); await pg.selectOption('#t_proj', pid); await pg.selectOption('#t_boq', b1); await set('#t_amt', 1500); await pg.selectOption('#f_acc', cash); await save();
  await click('[data-a=newTx][data-p="expense|"]'); await set('#t_amt', 700); await pg.selectOption('#f_acc', cash); await save();
  await pg.click('#side a[data-p=progress]'); await click('[data-a=newTx][data-p="progress|"]'); await pg.selectOption('#t_proj', pid); await pg.selectOption('#t_boq', b1); await set('#t_qty', 100); await save();
  const T = await ev(() => { const p = S.projects[0]; return { t: projTotals(p.id), it: itemUse(p.id, p.boq[0].id) }; });
  ck('تكلفة المشروع = 42000+28000+64000+2600+4500+1500 = 142600', T.t.cost === 142600, T.t);
  ck('إيراد 300000', T.t.revenue === 300000);
  ck('مصروف عام غير موزع لا يدخل تكلفة المشروع', await ev(() => TX().some(t => t.type === 'expense' && !t.project_id) && projTotals(S.projects[0].id).expense === 1500));
  ck('تكلفة البند 1 = 70000 مقاول + 1500 مصروف', T.it.sub === 70000 && T.it.expense === 1500 && T.it.total === 71500, T.it);
  const finalTot = await ev((id) => { const r = REPS.final.run({ project: id }); return { s: r.summary, n: r.rows.length }; }, pid);
  ck('المستخلص الختامي: المنفذ 100 م2 = قيمة 100000', finalTot.s[1][1] === 100000, finalTot.s);
  ck('تكاليف غير مربوطة ببند = مشتريات 0 + عمالة 7100', finalTot.n === 3, finalTot.n);

  console.log('الأرصدة النهائية');
  const bal = await ev(() => S.accounts.map(a => accStats(a).bal));
  // الخزينة: 100000+50000-10000(دفعة)-300(سلفة)-2300-4500-1500-700 = 130700
  ck('رصيد الخزينة 130700', bal[0] === 130700, bal);
  // الأهلي: 1000000-50000-18000-20000-24000+300000 = 1188000
  ck('رصيد الأهلي 1188000', bal[1] === 1188000, bal);
  ck('إجمالي مستخلص الأرصدة = 130700+1188000-40000', bal.reduce((a, c) => a + c, 0) === 1278700);

  console.log('التقارير');
  await pg.click('#side a[data-p=reports]');
  const cards = await ev(() => document.querySelectorAll('#main .card.clk').length);
  ck('20 تقريرًا تقريبًا', cards >= 18, cards);
  for (const k of Object.keys(await ev(() => Object.fromEntries(Object.keys(REPS).map(k => [k, 1]))))) {
    const ok = await ev(([k, pid, cid, acc]) => { try { const r = REPS[k].run({ project: pid, party: cid, acc: acc }); return !!r && Array.isArray(r.rows) && reportHtml(r, k).length > 10; } catch (e) { return 'ERR ' + e.message; } }, [k, pid, cid, cash]);
    ck('تقرير ' + k + ' يعمل', ok === true, ok);
  }
  await pg.click('[data-a=openRep][data-p=conStmt]'); await pg.waitForTimeout(100);
  ck('كشف حساب المقاول يعرض رصيدًا', (await ev(() => document.querySelector('#main').textContent)).includes('22,000'));

  console.log('لوحة التحكم والصلاحيات والبيانات التجريبية');
  await pg.click('#side a[data-p=dashboard]'); ck('لوحة التحكم تُعرض', (await ev(() => document.querySelector('#main').textContent)).includes('السيولة'));
  await pg.click('#side a[data-p=settings]'); await pg.click('[data-a=setSec][data-p=data]'); 
  await click('[data-a=demoLoad]'); await pg.waitForTimeout(800);
  ck('البيانات التجريبية حُمّلت (3 مشاريع)', await ev(() => S.projects.length) === 3);
  for (const k of Object.keys(await ev(() => Object.fromEntries(Object.keys(REPS).map(k => [k, 1]))))) { const ok = await ev(([k]) => { try { REPS[k].run({ project: 'demo_p1', party: 'demo_c1', acc: 'demo_nbe' }); REPS[k].run({}); return true } catch (e) { return e.message } }, [k]); if (ok !== true) ck('تقرير تجريبي ' + k, false, ok) }
   await click('[data-a=demoClear]'); await pg.waitForTimeout(800);
  ck('حذف التجريبي يُبقي بياناتي فقط', await ev(() => S.projects.length === 1 && S.accounts.length === 3 && S.cfg.contractors.length === 1 && S.txs.every(t => !t.demo)));
  // مهندس موقع
  await ev(() => { S.cfg.roles = { 'admin@x.com': 'admin', 'eng@x.com': 'engineer' }; S.user = 'eng@x.com'; S.role = roleOf(S.user); S.view = 'expenses'; render(); });
  const m2 = await ev(() => Array.from(document.querySelectorAll('#side a')).map(a => a.textContent.trim()));
  ck('المهندس لا يرى الخزائن/الإيرادات/التقارير/الإعدادات', !m2.join('|').match(/الخزائن|الإيرادات|التقارير|الإعدادات|لوحة/), m2);
  await click('[data-a=newTx][data-p="expense|"]'); await set('#t_amt', 250); await pg.selectOption('#t_proj', pid); await save();
  const pend = await ev(() => S.txs.filter(t => t.status === 'pending').length);
  ck('إدخال المهندس ينتظر الاعتماد', pend === 1);
  ck('لا يؤثر على الأرصدة قبل الاعتماد', await ev((id) => projTotals(id).expense, pid) === 1500);
  await ev(() => { S.user = 'admin@x.com'; S.role = 'admin'; S.view = 'review'; render(); });
  await click('[data-a=txOk]'); await pg.waitForTimeout(100);
  ck('بعد الاعتماد تُحسب في المشروع', await ev((id) => projTotals(id).expense, pid) === 1750);
  console.log('الموبايل');
  await pg.setViewportSize({ width: 390, height: 800 }); await ev(() => { S.view = 'projects'; S.vp = null; render(); });
  const ov = await ev(() => document.documentElement.scrollWidth <= window.innerWidth + 2); ck('لا تمرير أفقي للصفحة على الموبايل', ov);
  ck('بدون أخطاء JS', errs.length === 0, errs.slice(0, 5));
  await pg.screenshot({ path: '/tmp/shot-mobile.png' });
  await b.close();
  console.log(`\nنجح ${passes} / فشل ${fails}`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
