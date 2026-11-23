const { chromium } = require('playwright');
let ok=0,bad=0;const T=(n,c,x)=>{if(c)ok++;else{bad++;console.log('✗',n,JSON.stringify(x))}};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext({viewport:{width:1280,height:800}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file://'+require('path').resolve(__dirname,'../index.html'));await pg.waitForFunction(()=>window.S&&S.db);
const r=await pg.evaluate(async()=>{S.user='a@x.com';S.role='admin';S.projects=[{id:'p1',name:'مشروع أ',boq:[]}];S.cfg.contractors=[{id:'c1',name:'مقاول 1'}];S.cfg.workers=[{name:'علي (نقاش)',mode:'day',rate:300}];S.accounts=[];
 S.txs=[{id:'s1',type:'sub',cum:true,party_id:'c1',project_id:'p1',gross:1000,net:1000,paid:200,date:'2026-11-04',status:'approved'},{id:'s2',type:'sub',cum:true,party_id:'c1',project_id:'p1',gross:500,net:500,paid:0,date:'2026-11-11',status:'approved'},
 {id:'l1',type:'labor',date:'2026-11-18',from:'2026-11-12',to:'2026-11-18',project_id:'p1',status:'approved',rows:[{name:'علي (نقاش)',mode:'day',rate:300,days:5,ot_n:1,total:1600,net:1600}],total:1600,net:1600}];
 dbSet=async()=>true;saveCfg=async()=>true;
 go('subs');var s=document.getElementById('main').innerText;go('labor');var l=document.getElementById('main').innerText;
 var inp=document.querySelector('[data-wtr]');var tr=inp&&inp.value;
 ACT.wDet('علي (نقاش)');var m=document.getElementById('modal').innerText;
 return{subs:s.indexOf('مشروع أ')>=0&&s.indexOf('2026-11-04')>=0&&s.indexOf('2026-11-11')>=0&&s.indexOf('1,300')>=0,lab:l.indexOf('2026-11-12')>=0&&l.indexOf('2026-11-18')>=0&&l.indexOf('مشروع أ')>=0,tr:tr,m:m.indexOf('2026-11-12')>=0}});
T('ملخص المقاول بالمشروع والفترة',r.subs,r);T('ملخص العمال بالفترة',r.lab,r);T('التخصص من الاسم',r.tr==='نقاش',r);T('تفاصيل الأسابيع',r.m,r);T('بلا أخطاء',!errs.length,errs);
console.log('نجح '+ok+' فشل '+bad);await b.close();process.exit(bad?1:0)})();
