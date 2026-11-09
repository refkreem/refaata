const { chromium } = require('playwright');
let ok=0,bad=0;const t=(n,c)=>{if(c)ok++;else{bad++;console.log('✗',n)}};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext({viewport:{width:1280,height:800}})).newPage();
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
const r=await pg.evaluate(async()=>{
 S.cfg.roles={'a@x.com':'admin','e@x.com':'engineer'};S.user='a@x.com';S.role='admin';
 S.projects=[{id:'p1',name:'م1',boq:[]},{id:'p2',name:'م2',boq:[]}];S.txs=[{id:'t1',project_id:'p1'},{id:'t2',project_id:'p2'},{id:'t3'}];
 S.set='assign';S.view='settings';render();var html=document.body.innerHTML.indexOf('تخصيص المهندسين')>=0;
 document.getElementById('as_u').value='e@x.com';document.getElementById('as_p').value='p1';document.getElementById('as_f').value='2026-01-01';
 window.__t=[];var ot=toast;toast=function(m){window.__t.push(m)};await ACT.asgAdd();var added=asgList('e@x.com').length;
 await ACT.asgAdd();var dup=asgList('e@x.com').length;
 var ov=asgActive('e@x.com','p1')&&!asgActive('e@x.com','p2');
 S.user='e@x.com';S.role='engineer';applyScope();
 var sc=[S.projects.length,S.txs.length,S.allProjects.length];
 S.user='a@x.com';S.role='admin';await ACT.asgEnd('e@x.com|0');var ended=(asgList('e@x.com')[0]||{}).to===today();
 return{T:window.__t,u:document.getElementById('as_u').value,L:JSON.stringify(S.cfg.assign),html,added,dup,ov,sc,ended}});
t('شاشة',r.html);t('إضافة',r.added===1);t('منع التداخل',r.dup===1);t('ساري',r.ov);t('نطاق المهندس',r.sc[0]===1&&r.sc[1]===2&&r.sc[2]===2);t('إنهاء',r.ended);
console.log('نجح',ok,'فشل',bad);await b.close()})();
