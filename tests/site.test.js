const { chromium } = require('playwright');
let ok=0,bad=0;const t=(n,c)=>{if(c)ok++;else{bad++;console.log('✗',n)}};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext({viewport:{width:390,height:800}})).newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
const r=await pg.evaluate(async()=>{
 S.cfg.roles={'a@x.com':'admin','e@x.com':'engineer'};S.user='e@x.com';S.role='engineer';
 S.projects=[{id:'p1',name:'م1',boq:[]}];S.cfg.assign={'e@x.com':[{pid:'p1',from:'2026-01-01',to:''}]};S.sitereps=[];
 var o={};
 S.view='sitereps';render();o.v1=document.body.innerHTML.length>500;
 var rep={id:'r1',pid:'p1',date:today(),by:'e@x.com',manpower:[{trade:'نقاش',count:3}],works:[],photos:[]};srLog(rep,'draft');await dbSet('sitereps',rep);S.sitereps.push(rep);
 srLog(rep,'submitted');await dbSet('sitereps',rep);
 S.user='a@x.com';S.role='admin';S.view='sitemon';render();o.mon=document.body.innerHTML.indexOf('متابعة المواقع')>=0;
 await ACT.srStep('r1|review');await ACT.srStep('r1|approved');o.st=rep.status;o.hist=rep.history.length;o.tx=S.txs.length;
 S.view='sitereps';render();return o});
t('شاشة',r.v1);t('متابعة',r.mon);t('اعتماد',r.st==='approved');t('سجل',r.hist===4);t('لا قيود',r.tx===0);t('بلا أخطاء JS',errs.length===0);
if(errs.length)console.log(errs);console.log('نجح',ok,'فشل',bad);await b.close()})();
