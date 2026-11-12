const { chromium } = require('playwright');
let ok=0,bad=0;const T=(n,c,x)=>{if(c)ok++;else{bad++;console.log('✗',n,JSON.stringify(x))}};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext({viewport:{width:1280,height:900}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));let pv='x';pg.on('dialog',d=>d.accept(d.type()==='prompt'?pv:undefined));
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
const r=await pg.evaluate(async()=>{var o={};S.user='a@x.com';S.role='admin';S.cfg.roles={'a@x.com':'admin','e@x.com':'engineer'};S.cfg.assign={'e@x.com':[{pid:'p1',from:'2026-01-01',to:''}]};
 S.projects=[{id:'p1',name:'م1',value:100000,boq:[{id:'A',name:'بند أ',unit:'م2',qty:100,price:200,cost_price:100},{id:'B',name:'بند ب',unit:'م2',qty:50,price:200,cost_price:100},{id:'C',name:'بند ج',unit:'م2',qty:10,price:300,cost_price:0}]}];
 S.accounts=[{id:'tr',name:'خ',kind:'cash',opening:1000000}];S.txs=[];
 var ex=function(bid,a){return saveTx({type:'expense',date:'2026-11-05',project_id:'p1',boq_id:bid,amount:a,account_id:'tr',status:'approved',desc:'م'})};
 await ex('A',8500);await ex('B',6000);await ex('C',1000);
 var st=function(id){var b=proj('p1').boq.filter(function(x){return x.id===id})[0];return budState('p1',b)};
 o.A=[st('A').st,st('A').pc,st('A').ref];o.B=[st('B').st,st('B').pc];o.C=[st('C').st,st('C').ref];
 // لا تعطيل: يمكن تسجيل مصروف جديد على البند المتجاوز
 var before=S.txs.length;await ex('B',500);o.noBlock=S.txs.length===before+1;
 // تحويل الواجهة
 S.view='budget';render();o.html=document.body.innerHTML;
 return o});
T('بند أ: 85% من 10000 → إنذار مبكر',r.A[0]==='warn'&&r.A[1]===85&&r.A[2]===10000,r.A);
T('بند ب: 120% → تجاوز جسيم يحتاج اعتماد',r.B[0]==='esc'&&r.B[1]===120,r.B);
T('بند ج: بلا ميزانية',r.C[0]==='unbud'&&r.C[1]===0,r.C);
T('التنبيه لا يمنع التسجيل',r.noBlock,r);
T('الشاشة تعرض الحالات والسبب والمراجع المالي',/بلا ميزانية/.test(r.html)&&/تجاوز جسيم/.test(r.html)&&/مراجع مالي/.test(r.html)&&/إنذار فقط ولا توقف/.test(r.html));
// استثناء: طلب ثم اعتماد
pv='العمل عاجل لغرفة عمليات';await pg.evaluate(()=>ACT.budReq('p1|B'));
let e1=await pg.evaluate(()=>({s:budEx('p1','B').status,u:budEx('p1','B').urgent,r:budEx('p1','B').reason}));
T('طلب استمرار بمبرر مسجل وعاجل',e1.s==='requested'&&e1.u===1&&/عمليات/.test(e1.r),e1);
pv='9000';await pg.evaluate(()=>ACT.budAppr('p1|B|1'));
const e2=await pg.evaluate(()=>{var b=proj('p1').boq[1],s=budState('p1',b);return{ex:budEx('p1','B').status,lim:budEx('p1','B').limit,st:s.st,hist:budEx('p1','B').hist.length}});
T('اعتماد الإدارة بسقف 9000: البند 6500 → استمرار استثنائي، والسجل 2',e2.ex==='approved'&&e2.lim===9000&&e2.st==='exc'&&e2.hist===2,e2);
const e3=await pg.evaluate(async()=>{await saveTx({type:'expense',date:'2026-11-06',project_id:'p1',boq_id:'B',amount:3000,account_id:'tr',status:'approved',desc:'م'});var s=budState('p1',proj('p1').boq[1]);return s.st});
T('تجاوز السقف المعتمد → تصعيد من جديد',e3==='esc',e3);
// مهندس لا يعتمد
const e4=await pg.evaluate(async()=>{S.user='e@x.com';S.role='engineer';var w=0;var ot=toast;toast=function(m){w=m};await ACT.budAppr('p1|B|1');toast=ot;return w});
T('المهندس لا يملك الاعتماد',/للإدارة/.test(e4),e4);
// ضبط التكلفة: بند بلا ميزانية لا تُعرض له ربحية
const cc=await pg.evaluate(()=>{S.user='a@x.com';S.role='admin';S.cc.tab='boq';var r=ccRes();var row=r.rows.filter(function(x){return/بند ج/.test(x[1])})[0];return row.slice(14,16)});
T('بند بلا ميزانية: الربح والانحراف «بلا ميزانية» لا أرقام مضللة',cc[0]==='بلا ميزانية'&&cc[1]==='بلا ميزانية',cc);
// حدود الإعدادات
const cf=await pg.evaluate(async()=>{S.set='bud';S.view='settings';render();document.getElementById('bu_w').value='70';document.getElementById('bu_o').value='100';document.getElementById('bu_e').value='150';document.getElementById('bu_r').value='fin@x.com';await ACT.budCfgSave();return[budCfg().warn,budCfg().esc,budReviewer()]});
T('حفظ الحدود والمراجع المالي',cf[0]===70&&cf[1]===150&&cf[2]==='fin@x.com',cf);
// كشف الأجور: كشف معلّق يظهر
const wg=await pg.evaluate(async()=>{S.txs=[];await saveTx({type:'labor',date:'2026-11-04',to:'2026-11-04',project_id:'p1',status:'pending',total:1000,adv:0,net:1000,rows:[{name:'عامل',days:5,rate:200,total:1000,net:1000}]});S.txs[S.txs.length-1].status='pending';S.wg.week='';S.view='wkwages';render();return{w:wgWeeks().length,s:wgSheets({week:'2026-11-04',project:''}).length,pend:wgSheets({week:'2026-11-04',project:''})[0].pend,txt:document.body.innerText.indexOf('لا توجد كشوف عمالة')>=0}});
T('كشف الأجور: الكشف المعلّق يظهر بدل الشاشة الفارغة',wg.w===1&&wg.s===1&&wg.pend&&!wg.txt,wg);
T('لا أخطاء بالصفحة',errs.length===0,errs);
console.log('نجح',ok,'فشل',bad);await b.close()})();
