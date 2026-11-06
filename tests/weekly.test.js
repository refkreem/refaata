const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext()).newPage();let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:bad++;console.log(c?'  ✔':'  ✘',n,c?'':JSON.stringify(x))};
pg.on('pageerror',e=>{bad++;console.log('PAGEERR',e.message)});pg.on('dialog',async d=>{d.type()==='prompt'?await d.accept('سبب'):await d.accept()});
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
await pg.evaluate(async()=>{S.projects=[{id:'p1',name:'الدور الخامس',value:900000,boq:[]},{id:'p2',name:'عيادة',value:50000,boq:[]}];S.accounts=[{id:'a1',name:'خزينة',kind:'cash',opening:500000}];S.cfg.contractors=[{id:'c1',name:'إبراهيم',trade:'حدادة'}];
 async function cert(date,pid,cum,paid,adv,oth){var prev=certPrevC(pid,'c1',date);var g=cum-prev;await saveTx({type:'sub',cum:true,date:date,project_id:pid,party_id:'c1',cum_value:cum,cum_base:cum,cum_add:0,lines:[{name:'حدادة',unit:'مقطوعية',qty:1,qty_prev:0,price:g,boq_id:null}],gross:g,prior_paid:0,adv_recov:adv||0,other_ded:oth||0,prev_disb:0,net:g-(adv||0)-(oth||0),paid:paid||0,paid_set:true,pay_method:'cash',account_id:paid?'a1':'',desc:'شهادة'},null)}
 await cert('2026-10-14','p1',10000,10000);await cert('2026-10-21','p1',25000,0);await cert('2026-10-21','p2',3500,0);window.__cert=cert});
await pg.evaluate(()=>{S.wk.week='2026-10-21';go('wkpay')});
const r1=await pg.evaluate(()=>wkRows({week:'2026-10-21',project:'p1'}).map(r=>({before:r.before,ent:r.ent,net:r.net,rem:r.rem,st:r.st,cum:r.cum,prevC:r.prevC})));
T('الأسبوع 2: التراكمي 25000 والاستحقاق 15000 ومدفوع سابقًا 10000',r1.length===1&&r1[0].cum===25000&&r1[0].ent===15000&&r1[0].before===10000&&r1[0].net===15000&&r1[0].rem===15000&&r1[0].st==='review',r1);
T('المشروعان حسابان مستقلان',await pg.evaluate(()=>wkRows({week:'2026-10-21'}).length===2));
T('الشاشة تُعرض والأزرار موجودة',await pg.evaluate(()=>{const m=document.getElementById('main').innerHTML;return m.includes('اعتماد المحدد للصرف')&&m.includes('مدفوعات المقاولين')}));
T('زر لوحة التحكم',await pg.evaluate(()=>{go('dashboard');return document.getElementById('main').innerHTML.includes('GENERATE WEEKLY PAYMENTS')}));
// اعتماد قبل الصرف
await pg.evaluate(()=>{S.wk.project='p1';S.wk.sel={};wkRows().forEach(r=>S.wk.sel[r.key]=1);return ACT.wkToSt('approved')});await pg.waitForTimeout(200);
T('الاعتماد لا يعني دفعًا',await pg.evaluate(()=>{const r=wkRows({week:'2026-10-21',project:'p1'})[0];return r.st==='approved'&&r.paid===0&&r.rem===15000}));
// سند جزئي 6000
await pg.evaluate(()=>{go('wkpay');ACT.wkVoucher()});await pg.waitForTimeout(150);await pg.selectOption('#f_acc','a1');await pg.fill('.v_amt','6000');await pg.click('[data-a=msave]');await pg.waitForTimeout(350);
const r2=await pg.evaluate(()=>{const r=wkRows({week:'2026-10-21',project:'p1'})[0];return{st:r.st,paid:r.paid,rem:r.rem,v:S.txs.filter(t=>t.voucher).map(t=>t.voucher)}});
T('دفعة جزئية: مدفوع جزئيًا والمتبقي 9000 وسند رقم',r2.st==='partial'&&r2.paid===6000&&r2.rem===9000&&r2.v[0]==='PV-0001',r2);
T('الخزينة نقصت 16000 (10000 قديمة + 6000)',await pg.evaluate(()=>accStats(S.accounts[0]).bal===500000-16000));
// سند ثانٍ بالباقي
await pg.evaluate(()=>{S.wk.sel={};wkRows().forEach(r=>S.wk.sel[r.key]=1);ACT.wkVoucher()});await pg.waitForTimeout(150);await pg.selectOption('#f_acc','a1');await pg.click('[data-a=msave]');await pg.waitForTimeout(350);
T('مدفوع بالكامل',await pg.evaluate(()=>{const r=wkRows({week:'2026-10-21',project:'p1'})[0];return r.st==='full'&&r.rem===0&&S.txs.filter(t=>t.voucher).length===2}));
// عكس السند الأول
await pg.evaluate(()=>{const t=S.txs.find(t=>t.voucher==='PV-0001');return ACT.wkRev(t.id)});await pg.waitForTimeout(300);
const r3=await pg.evaluate(()=>{const r=wkRows({week:'2026-10-21',project:'p1'})[0];const t=S.txs.find(t=>t.voucher==='PV-0001');return{st:r.st,paid:r.paid,rem:r.rem,cs:t.status,au:(t.audit||[]).length,still:S.txs.includes(t)}});
T('العكس: السند يبقى بالسجل والمتبقي 6000 ومدفوع جزئيًا',r3.st==='partial'&&r3.rem===6000&&r3.cs==='cancelled'&&r3.au===1&&r3.still,r3);
// الأسبوع التالي يخصم المدفوع فعليًا فقط
await pg.evaluate(async()=>{await window.__cert('2026-10-28','p1',30000,0)});
const r4=await pg.evaluate(()=>{const r=wkRows({week:'2026-10-28',project:'p1'})[0];return{before:r.before,ent:r.ent,net:r.net}});
T('الأسبوع 3: سابق 19000 (10000+9000) واستحقاق 5000 وصافي 11000',r4.before===19000&&r4.ent===5000&&r4.net===11000,r4);
// سلفة تُخصم مرة واحدة
await pg.evaluate(async()=>{await saveTx({type:'adv',kind:'contractor',party_id:'c1',project_id:'p1',date:'2026-10-29',amount:2000,account_id:'a1',desc:'سلفة'},null);await window.__cert('2026-11-04','p1',40000,0,2000)});
const r5=await pg.evaluate(()=>{const r=wkRows({week:'2026-11-04',project:'p1'})[0];return{adv:r.advOut,rec:r.advRecov,net:r.net,before:r.before}});
T('أسبوع 4: سلفة 2000 تُخصم والصافي 40000-19000-2000',r5.adv===2000&&r5.rec===2000&&r5.net===19000,r5);
// المتطلبات النقدية والتصدير
T('شاشة المتطلبات النقدية',await pg.evaluate(()=>{S.wk.week='2026-11-04';go('cashreq');const m=document.getElementById('main').innerHTML;return m.includes('إجمالي المطلوب نقدًا')&&m.includes('المتاح في الخزائن')}));
T('دالة التصدير والتقرير',await pg.evaluate(()=>{S.wk.week='2026-10-21';S.wk.project='';const r=wkRes();return r.rows.length===2&&r.cols.length===19}));
T('عدم وجود أخطاء بالصفحة',bad===0);
console.log(ok+' نجح، '+bad+' فشل');await b.close();process.exit(bad?1:0)})();
