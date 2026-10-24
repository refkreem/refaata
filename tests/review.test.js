// اختبار مراجعة: التأمينات والدفعة المقدمة، بند سداد المقاول، بند العمالة، تصنيفات المشتريات
const { chromium } = require('playwright');
const path = require('path');
let fails = 0, passes = 0;
function ck(n, c, x) { if (c) { passes++; console.log('  ✔', n); } else { fails++; console.log('  ✘', n, x === undefined ? '' : JSON.stringify(x)); } }
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  pg.on('pageerror', e => { fails++; console.log('   PAGEERR', e.message); });
  pg.on('dialog', d => d.type() === 'prompt' ? d.accept('تصفير') : d.accept());
  await pg.route(/gstatic|cdnjs|googleapis/, r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../index.html'));
  await pg.waitForFunction(() => window.S && S.db);
  const ev = (f, a) => pg.evaluate(f, a);
  const set = (s, v) => pg.fill(s, String(v));
  const save = async () => { await pg.click('#msaveBtn'); await pg.waitForTimeout(150); };
  console.log('التصنيفات');
  ck('تصنيفات المشتريات الافتراضية', JSON.stringify(await ev(() => S.cfg.pcats)) === JSON.stringify(['صحية', 'كهربائية', 'معمارية', 'إنذار', 'غازات', 'تكييف', 'أخرى']));
  console.log('المشروع');
  await pg.click('#side a[data-p=accounts]'); await pg.click('[data-a=accAdd][data-p=cash]'); await set('#a_name', 'الخزينة'); await set('#a_open', 500000); await save();
  await pg.click('#side a[data-p=projects]'); await pg.click('[data-a=projAdd]');
  await set('#p_name', 'ICU تجريبي'); await set('#p_months', 6); await set('#p_val', 1000000);
  await set('#p_bi', 50000); await set('#p_bf', 100000); await set('#p_adv', 200000); await pg.selectOption('#f_acc', await ev(() => S.accounts[0].id)); await save();
  const P = await ev(() => S.projects[0]); const pid = P.id;
  ck('حفظ التأمين الابتدائي والنهائي والدفعة', P.bond_init === 50000 && P.bond_final === 100000 && P.advance === 200000, P);
  await ev(id => { S.vp = id; S.tab = 'boq'; render(); }, pid);
  ck('عرض التأمينات في تفاصيل المشروع', (await ev(() => document.body.innerText)).includes('الدفعة المقدمة'));
  await ev(id => { const p = proj(id); p.boq = [{ id: 'b1', code: '1', group: 'تكييف', name: 'دكت', unit: 'م2', qty: 100, price: 300 }]; }, pid);
  await ev(() => { S.cfg.contractors.push({ id: 'c1', name: 'م. أحمد', trade: 'تكييف' }); });
  console.log('سداد المقاول');
  await pg.click('#side a[data-p=subs]'); await pg.click('[data-a=newTx][data-p="payment|contractor"]');
  await pg.waitForTimeout(100);
  ck('مشروع واحد فقط: يُختار تلقائيًا وتظهر بنود مقايسته', (await ev(() => $('t_proj').value)) && (await ev(() => $('t_boq').options.length)) === 2);
  await pg.selectOption('#t_con', 'c1'); await pg.selectOption('#t_proj', pid); await pg.waitForTimeout(100);
  await pg.selectOption('#t_boq', 'b1'); await pg.waitForTimeout(100);
  ck('الوحدة والسعر يُملآن من المقايسة', (await ev(() => $('t_unit').value)) === 'م2' && (await ev(() => $('t_price').value)) === '300');
  await set('#t_qty', 10); await pg.waitForTimeout(100);
  ck('الإجمالي = كمية × سعر', (await ev(() => $('t_amt').value)) === '3,000');
  await pg.selectOption('#f_acc', await ev(() => S.accounts[0].id)); await save();
  const T = await ev(() => S.txs.find(t => t.type === 'payment'));
  ck('حفظ بند وكمية ووحدة وسعر السداد', T && T.boq_id === 'b1' && T.qty === 10 && T.unit === 'م2' && T.price === 300 && T.amount === 3000, T);
  console.log('العمالة');
  await pg.click('#side a[data-p=labor]'); await pg.click('[data-a=newTx][data-p="labor|"]');
  await pg.selectOption('#t_proj', pid); await pg.waitForTimeout(100);
  await set('.w_name', 'علي'); await set('.w_rate', 200); await set('.w_days', 5); await pg.waitForTimeout(100);
  await pg.selectOption('.w_boq', 'b1'); await set('.w_work', 'تركيب دكت');
  await pg.selectOption('#f_acc', await ev(() => S.accounts[0].id)); await save();
  const L = await ev(() => S.txs.find(t => t.type === 'labor'));
  ck('بند الأعمال محفوظ على صف العامل', L && L.rows[0].boq_id === 'b1' && L.rows[0].work === 'تركيب دكت', L);
  ck('تكلفة العمالة تظهر على بند المقايسة', (await ev(id => itemUse(id, 'b1').labor, pid)) === 1000);
  console.log('استيراد المقايسة الذكي');
  const bp = await ev(() => boqSmartParse([
    ['شركة الأمة للمقاولات'], ['مقايسة أعمال العناية المركزة'], [],
    ['م', 'بيان الأعمال', 'الوحدة', 'الكمية', 'سعر الوحدة', 'الإجمالي'],
    ['', 'أعمال التكييف'],
    ['1', 'توريد وتركيب دكت مجلفن', 'م2', '1,200', '850', ''],
    ['2', 'فلتر هيبا', 'عدد', 6, 4500, 27000],
    ['', 'أعمال الكهرباء'],
    ['3', 'كابل 3×4', 'م.ط', 300, 95, ''],
    ['', 'الإجمالي', '', '', '', 1],
  ]));
  ck('عدد البنود 3 دون العناوين والإجمالي', bp.length === 3, bp);
  ck('الباب مأخوذ من صف العنوان', bp[0][1] === 'أعمال التكييف' && bp[2][1] === 'أعمال الكهرباء', bp);
  ck('الكمية بفاصلة آلاف 1,200', bp[0][4] === 1200 && bp[0][5] === 850, bp[0]);
  const bp2 = await ev(() => boqSmartParse([['1', 'تكييف', 'دكت', 'م2', '10', '100'], ['2', 'كهرباء', 'كابل', 'م', '5', '20']]));
  ck('بدون عناوين: الترتيب الافتراضي', bp2.length === 2 && bp2[0][2] === 'دكت' && bp2[1][5] === 20, bp2);
  console.log('التأمين التلقائي');
  await pg.click('#side a[data-p=projects]'); await pg.click('[data-a=projAdd]');
  await set('#p_name', 'مشروع ب'); await set('#p_months', 3); await set('#p_val', 2000000); await pg.waitForTimeout(80);
  ck('التأمين الابتدائي 1% والنهائي 5% تلقائيًا', (await ev(() => $('p_bi').value)) === '20,000' && (await ev(() => $('p_bf').value)) === '100,000');
  await set('#p_bf', 80000); await set('#p_val', 3000000); await pg.waitForTimeout(80);
  ck('التعديل اليدوي يُحفظ والآخر يتبع القيمة', (await ev(() => $('p_bf').value)) === '80,000' && (await ev(() => $('p_bi').value)) === '30,000');
  await save();
  const pb = await ev(() => S.projects.find(x => x.name === 'مشروع ب'));
  ck('حفظ التأمينات', pb.bond_init === 30000 && pb.bond_final === 80000, pb);
  console.log('لصق شيت الأجور');
  await pg.click('#side a[data-p=labor]'); await pg.click('[data-a=newTx][data-p="labor|"]');
  await pg.selectOption('#t_proj', pid); await pg.click('[data-a=pasteToggle]');
  await pg.fill('#paste_ta', '1\tعم صلاح النقاش\t350\t7\t2450\t200\t\t0\t350\t\t0\t2450\n2\tمحمد علي\t300\t1\t300\t150\t1\t150\t300\t\t0\t450\t100\nاجمالي\t\t\t\t\t');
  await pg.click('[data-a=pasteApply]'); await pg.waitForTimeout(150);
  ck('لصق صفين فقط (دون صف الإجمالي)', (await ev(() => document.querySelectorAll('#lines .ln').length)) === 2);
  ck('إجمالي الكشف 2450 + 450 = 2900', (await ev(() => $('s_total').textContent)) === '2,900');
  ck('السلف الملصقة 100', (await ev(() => document.querySelectorAll('#lines .w_adv')[1].value)) === '100');
  await pg.click('#mclose, [data-a=mclose]');
  console.log('التصفير الشامل');
  await ev(() => ACT.wipeAll()); await pg.waitForTimeout(800);
  ck('بعد التصفير: لا مشاريع ولا حركات ولا حسابات', await ev(() => S.projects.length === 0 && S.txs.length === 0 && S.accounts.length === 0));
  ck('قوائم الإعدادات فارغة وتصنيفات المشتريات الافتراضية', await ev(() => S.cfg.contractors.length === 0 && S.cfg.pcats.length === 7));
  await ev(() => loadAll()); ck('لا شيء يعود بعد إعادة التحميل', await ev(() => S.projects.length + S.txs.length + S.accounts.length === 0));
  console.log('\nنجح', passes, '/ فشل', fails); await b.close(); process.exit(fails ? 1 : 0);
})();
