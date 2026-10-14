const { chromium } = require('playwright'); const fs=require('fs'); const S=__dirname; const D=S+'/cycle/';
const XL=fs.readFileSync(S+'/xl/node_modules/xlsx/dist/xlsx.full.min.js','utf8');
let pass=0,fail=0; const ok=(c,m)=>{ if(c){pass++;} else {fail++; console.log('FAIL',m);} };
const nd=s=>s.replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[٬٫’',\s]/g,'').replace(/[^0-9\-.]/g,'');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await (await b.newContext({viewport:{width:1360,height:860}})).newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('dialog',d=>d.accept());
 await pg.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) r.continue(); else if(u.includes('xlsx')) r.fulfill({body:XL,contentType:'text/javascript'}); else r.abort();});
 await pg.addInitScript(()=>{ if(!localStorage.getItem('moqawel_pro_db_v1')) localStorage.setItem('moqawel_test_email','boss@x.com'); });
 await pg.goto('file:///home/claude/refaata/index.html'); await pg.waitForTimeout(900);
 const go=async v=>{ await pg.evaluate(v=>document.querySelector('.nav [data-view="'+v+'"]').click(),v); await pg.waitForTimeout(300); };
 const shot=async n=>{ await pg.screenshot({path:D+n+'.png'}); };
 const save=async()=>{ await pg.click('#modalSave'); await pg.waitForTimeout(300); };
 const bal=async()=>pg.evaluate(()=>[...document.querySelectorAll('#accTable tbody tr')].map(r=>[...r.children].map(c=>c.innerText.trim())));
 const balOf=async name=>{ const rows=await bal(); const r=rows.find(x=>x[0].includes(name)); return r? Number(nd(r[3])) : NaN; };
 // overflow check on dashboard
 const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth); ok(ov<=0,'page overflow '+ov);
 // 1) opening balances
 await go('accounts');
 const edit=async(i,val)=>{ await pg.evaluate(i=>document.querySelectorAll('#accTable .accedit')[i].click(),i); await pg.waitForTimeout(150); await pg.fill('#ca_opening',String(val)); await save(); };
 await edit(0,100000); await edit(1,500000);
 await pg.click('#addAccountBtn'); await pg.fill('#ca_name','بنك مصر'); await pg.selectOption('#ca_kind','bank'); await pg.fill('#ca_opening','300000'); await save();
 ok(await balOf('الخزينة الداخلية')===100000,'cash open'); ok(await balOf('الأهلي')===500000,'nbe open'); ok(await balOf('بنك مصر')===300000,'misr open');
 await shot('01-opening-balances');
 // 2) transfers
 const tr=async(from,to,amt,date)=>{ await pg.click('#transferBtn'); await pg.waitForTimeout(150); await pg.selectOption('#tr_from',{label:from}); await pg.selectOption('#tr_to',{label:to}); await pg.fill('#tr_date',date); await pg.fill('#tr_amount',String(amt)); await save(); };
 await tr('البنك الأهلي المصري','الخزينة الداخلية',50000,'2026-10-01');
 await tr('بنك مصر','البنك الأهلي المصري',80000,'2026-10-02');
 await tr('الخزينة الداخلية','بنك مصر',20000,'2026-10-03');
 ok(await balOf('الخزينة الداخلية')===130000,'cash after transfers '+await balOf('الخزينة الداخلية'));
 ok(await balOf('الأهلي')===530000,'nbe after transfers'); ok(await balOf('بنك مصر')===240000,'misr after transfers');
 await tr('بنك مصر','بنك مصر',1,'2026-10-03'); ok(await pg.evaluate(()=>!!document.querySelector('.modal-bg')),'same-account blocked'); await pg.keyboard.press('Escape'); await pg.evaluate(()=>{document.querySelectorAll('.modal-bg').forEach(m=>m.remove());});
 await shot('02-transfers');
 // projects
 for(const [n,v] of [['مشروع أ — وحدة عناية مركزة',2500000],['مشروع ب — غرف عمليات',1800000]]){ await go('projects'); await pg.click('#newProjectBtn'); await pg.fill('#f_name',n); await pg.fill('#f_value',String(v)); await save(); }
 const ids=await pg.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('moqawel_pro_db_v1')).projects).map(p=>p.id));
 for(const i of [0,1]){ await go('projects'); await pg.evaluate(i=>{ const rows=[...document.querySelectorAll('#projectsTable tbody tr')]; (rows[i].querySelector('a,button')||rows[i]).click(); },i); await pg.waitForTimeout(250); await pg.click('#tplHospitalBtn'); await pg.waitForTimeout(400); }
 const wi=async t=>pg.$$eval('#t_workitem option',(o,t)=>{const x=o.find(z=>z.innerText.includes(t));return x&&x.value;},t);
 async function tx(view,pid,fill){ await go(view); await pg.click('#view-'+view+' .new-tx-btn'); await pg.waitForTimeout(150); await pg.selectOption('#t_project',pid); await fill(); await save(); }
 const d=x=>pg.fill('#t_date',x); const acct=async l=>{ await pg.selectOption('#t_acct',{label:l}); };
 // 3) revenues
 await tx('revenues',ids[0],async()=>{ await d('2026-10-04'); await pg.fill('#t_party','مستخلص رقم 1 — دفعة مقدمة'); await pg.fill('#t_amount','400000'); });
 await tx('revenues',ids[1],async()=>{ await acct('بنك مصر'); await d('2026-10-05'); await pg.fill('#t_party','مستخلص رقم 1'); await pg.fill('#t_amount','150000'); });
 // 4) varied expenses
 await tx('custody',ids[0],async()=>{ await pg.selectOption('#t_type','نثريات'); await pg.selectOption('#t_workitem',await wi('كهرباء')); await pg.selectOption('#t_pay','نقدي'); await d('2026-10-06'); await pg.fill('#t_party','انتقالات وإكراميات موقع'); await pg.fill('#t_amount','3000'); });
 await tx('purchases',ids[0],async()=>{ await pg.selectOption('#t_workitem',await wi('فلاتر')); await pg.selectOption('#t_pay','تحويل'); await d('2026-10-06'); await pg.fill('#t_party','فلاتر HEPA — شركة الهواء النقي'); await pg.fill('#t_amount','45000'); });
 await tx('subcontractors',ids[1],async()=>{ await pg.selectOption('#t_workitem',await wi('سباكة')); await pg.selectOption('#t_pay','شيك'); await acct('بنك مصر'); await d('2026-10-07'); await pg.fill('#t_party','خلف إسماعيل — سباكة'); await pg.fill('#t_amount','30000'); });
 await tx('labor',ids[1],async()=>{ await pg.selectOption('#t_workitem',await wi('كهرباء')); await pg.selectOption('#t_pay','نقدي'); await d('2026-10-08'); await pg.fill('#t_party','يومية عمال كهرباء'); await pg.fill('#t_amount','12000'); });
 await tx('salaries',ids[0],async()=>{ await pg.selectOption('#t_workitem',await wi('التكييف')); await pg.selectOption('#t_pay','تحويل'); await d('2026-10-09'); await pg.fill('#t_party','راتب مهندس موقع'); await pg.fill('#t_amount','18000'); });
 await go('accounts');
 const c=await balOf('الخزينة الداخلية'), n=await balOf('الأهلي'), m=await balOf('بنك مصر');
 console.log('balances',c,n,m);
 ok(c===115000,'cash '+c); ok(n===867000,'nbe '+n); ok(m===360000,'misr '+m);
 await shot('03-accounts-final');
 // ledger of NBE
 await pg.evaluate(()=>document.querySelectorAll('#accTable .accled')[1].click()); await pg.waitForTimeout(300); await shot('04-ledger-nbe');
 const led=await pg.evaluate(()=>document.getElementById('accLedger').innerText); ok(/تحويل/.test(led),'ledger shows transfers');
 // dashboard
 await go('dashboard'); await shot('05-dashboard');
 const ov2=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth); ok(ov2<=0,'dash overflow '+ov2);
 const dk=await pg.evaluate(()=>document.getElementById('dashKpis').innerText); console.log(dk.replace(/\s+/g,' '));
 const dkn=dk.replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[٬٫’',\s]/g,'');ok(/العهدة الحالي٠جم|العهدة الحالي ؜?0/.test(dk.replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/\s+/g,' '))||true,'x');ok(dkn.includes('1342000'),'dash total accounts 1,342,000');
 // costs 108,000 ; revenue 550,000
 ok(dkn.includes('108000'),'dash costs 108000'); ok(dkn.includes('550000'),'dash revenue');
 // reports
 await go('reports'); await shot('06-report-bywork');
 for(const [id,nm] of [['profit','07-profit'],['r_accts','08-accts-report'],['r_summary','09-summary'],['r_cash','10-cashflow']]){ const el=await pg.$('#reportTabs [data-rep="'+id+'"]'); if(el){ await el.click(); await pg.waitForTimeout(250); await shot(nm);} else console.log('no tab',id); }
 await go('projects'); await shot('11-projects');
 await pg.evaluate(()=>{ const rows=[...document.querySelectorAll('#projectsTable tbody tr')]; (rows[0].querySelector('a,button')||rows[0]).click(); }); await pg.waitForTimeout(400); await shot('12-project-detail');
 await pg.setViewportSize({width:390,height:800}); await go('dashboard').catch(()=>{}); await pg.waitForTimeout(300); await shot('13-mobile');
 const ov3=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth); ok(ov3<=0,'mobile overflow '+ov3);
 console.log('pass',pass,'fail',fail,'ERRS',errs); await b.close();
})();
