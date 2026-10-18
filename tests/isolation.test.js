// عزل بيانات نسخة Claude عن النسخ الأخرى + النقل من المجموعات المشتركة القديمة
const { chromium } = require('playwright'); const path = require('path');
let f = 0, p = 0; const ck = (n, c, x) => { c ? p++ : f++; console.log(c ? '  ✔' : '  ✘', n, c ? '' : JSON.stringify(x)); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const pg = await (await b.newContext()).newPage(); pg.on('dialog', d => d.accept());
  await pg.route(/gstatic|cdnjs|googleapis/, r => r.abort());
  const url = 'file://' + path.resolve(__dirname, '../index.html');
  await pg.goto(url);
  // بيانات قديمة: v4 (لنا) + سجلات نسخة ChatGPT (بدون ns / ns=v3) في نفس المجموعة المشتركة projects
  await pg.evaluate(() => localStorage.setItem('moqawel_pro_v4', JSON.stringify({
    projects: { a1: { name: 'مشروعي', ns: 'v4', boq: [], value: 5 }, g1: { name: 'ChatGPT مشروع', ns: 'v3' }, g2: { name: 'ChatGPT بلا ns' } },
    txs: { t1: { type: 'expense', date: '2026-10-01', amount: 100, ns: 'v4', status: 'approved' } },
    accounts: { c1: { name: 'خزينتي', kind: 'cash', opening: 10, ns: 'v4' } },
    cashAccounts: { z: { name: 'ChatGPT خزينة', ns: 'v3' } },
    meta: { config_v4: { ns: 'v4', company: { name: 'شركتي', phone: '', address: '' }, contractors: [{ id: 'k', name: 'مقاول قديم' }], pcats: ['أ'] } }
  })));
  await pg.reload(); await pg.waitForFunction(() => window.S && S.db && S.cfg.migrated_v4);
  const r = await pg.evaluate(() => ({ pr: S.projects.map(x => x.name), tx: S.txs.length, ac: S.accounts.map(a => a.name), cfg: S.cfg.company.name, con: S.cfg.contractors.length, db: JSON.parse(localStorage.getItem('moqawel_pro_v4')) }));
  ck('نُقل مشروعي فقط ولم تظهر مشاريع ChatGPT', r.pr.length === 1 && r.pr[0] === 'مشروعي', r.pr);
  ck('نُقلت الحركة والحساب والإعدادات', r.tx === 1 && r.ac[0] === 'خزينتي' && r.cfg === 'شركتي' && r.con === 1, r);
  ck('المجموعات المعزولة بالبادئة', r.db.claude_v4_projects && r.db.claude_v4_txs && r.db.claude_v4_accounts && r.db.claude_v4_meta.config, Object.keys(r.db));
  ck('سجلات ChatGPT لم تُمس', r.db.projects.g1 && r.db.projects.g2 && r.db.cashAccounts.z);
  ck('النسخ القديمة باقية بعد النقل (للأمان)', !!r.db.projects.a1);
  // كتابة جديدة تذهب للمجموعة المعزولة فقط
  await pg.evaluate(async () => { await dbSet('projects', { id: 'n1', name: 'جديد', boq: [] }); });
  const d2 = await pg.evaluate(() => JSON.parse(localStorage.getItem('moqawel_pro_v4')));
  ck('مشروع جديد يُحفظ في claude_v4_projects وليس projects', d2.claude_v4_projects.n1 && !d2.projects.n1);
  // التنظيف: يحذف نسخنا القديمة فقط
  await pg.evaluate(() => { S.set = 'isolation'; S.view = 'settings'; render(); });
  await pg.waitForTimeout(300); await pg.click('#iso_clean'); await pg.waitForTimeout(400);
  const d3 = await pg.evaluate(() => JSON.parse(localStorage.getItem('moqawel_pro_v4')));
  ck('التنظيف حذف نسخ v4 القديمة فقط', !d3.projects.a1 && d3.projects.g1 && d3.projects.g2 && d3.cashAccounts.z, Object.keys(d3.projects));
  ck('نسخنا المعزولة سليمة بعد التنظيف', d3.claude_v4_projects.a1 && d3.claude_v4_txs.t1 && d3.claude_v4_accounts.c1);
  // إعادة تحميل لا تعيد النقل (لا إحياء لما حُذف)
  await pg.evaluate(async () => { await dbDel('projects', 'a1'); }); await pg.reload(); await pg.waitForFunction(() => window.S && S.db);
  ck('لا إحياء لبيانات محذوفة بعد النقل', await pg.evaluate(() => !S.projects.some(x => x.id === 'a1')));
  await b.close(); console.log(`\nنجح ${p} / فشل ${f}`); process.exit(f ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
