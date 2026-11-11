const { chromium } = require('playwright');
let ok=0,bad=0;const t=(n,c)=>{if(c)ok++;else{bad++;console.log('✗',n)}};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext({viewport:{width:390,height:800}})).newPage();
pg.on('dialog',d=>d.accept());const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
const r=await pg.evaluate(async()=>{var o={};
 S.cfg.roles={'a@x.com':'admin','e@x.com':'engineer'};S.cfg.assign={'e@x.com':[{pid:'p1',from:'2026-01-01',to:''}]};
 S.projects=[{id:'p1',name:'م1',boq:[{id:'b1',code:'1',name:'دهان',group:'معماري',qty:10,price:100}]}];S.txs=[];S.sitereps=[];
 S.accounts=[{id:'tr',name:'الخزينة',kind:'cash',opening:100000}];
 // 1) المحاسب يفتح عهدة ويصرفها
 S.user='a@x.com';S.role='admin';S.view='custrec';render();
 document.getElementById('cr_own').value='e@x.com';await ACT.crNew();var cu=S.accounts.filter(a=>a.cust)[0];o.cust=!!cu&&cu.owner==='e@x.com';
 await saveTx({type:'transfer',date:today(),from:'tr',to:cu.id,amount:10000,desc:'صرف عهدة',custody:true});
 o.tr1=accStats(S.accounts[0]).bal;o.cu1=accStats(cu).bal;
 // 2) المهندس يسجل مصروفين
 S.user='e@x.com';S.role='engineer';S.view='dayexp';render();o.scr=document.body.innerHTML.indexOf('مصروف جديد')>=0;
 var set=(id,v)=>{document.getElementById(id).value=v};
 set('dx_proj','p1');ACT.dxBoq();set('dx_acc',cu.id);set('dx_desc','دهان وأدوات');set('dx_qty','4');set('dx_price','250');document.getElementById('dx_qty').dispatchEvent(new Event('input',{bubbles:true}));o.auto=document.getElementById('dx_amt').value;set('dx_boq','b1');
 await ACT.dxSend();var e1=S.txs.filter(t=>t.site)[0];o.e1=e1&&e1.status==='pending'&&!e1.unclassified;
 render();set('dx_proj','p1');set('dx_acc',cu.id);set('dx_desc','دهان وأدوات');set('dx_amt','1000');await ACT.dxSend();o.dup=S.txs.filter(t=>t.site).length;
 set('dx_desc','نقل');set('dx_amt','500');await ACT.dxSend();var e2=S.txs.filter(t=>t.site&&t.desc==='نقل')[0];o.unc=e2&&e2.unclassified===1;
 o.pendHid=accStats(cu).bal; o.pend=dxPend(cu.id);
 // 3) المحاسب يعتمد في التسوية
 S.user='a@x.com';S.role='admin';await ACT.crApprove(cu.id);
 o.cu2=accStats(cu).bal;o.tr2=accStats(S.accounts[0]).bal;
 // 4) إرجاع الباقي
 await saveTx({type:'transfer',date:today(),from:cu.id,to:'tr',amount:8500,desc:'إرجاع',custody:true});
 o.cu3=accStats(cu).bal;o.tr3=accStats(S.accounts[0]).bal;
 S.view='custrec';render();o.rec=document.body.innerHTML.indexOf('تسوية العهد')>=0;return o});
t('فتح عهدة',r.cust);t('الخزينة بعد الصرف 90000',r.tr1===90000);t('رصيد العهدة 10000',r.cu1===10000);t('شاشة المهندس',r.scr);t('الإجمالي التلقائي 1000',r.auto==='1000');t('مصروف معلّق مرتبط',r.e1);t('منع التكرار',r.dup===1);t('غير مصنّف',r.unc);
t('المعلّق لا يغيّر الرصيد المعتمد',r.pendHid===10000);t('معلّق 1500',r.pend===1500);t('بعد الاعتماد عهدة 8500',r.cu2===8500);t('الخزينة لم تُخصم ثانيةً',r.tr2===90000);t('بعد الإرجاع عهدة صفر',r.cu3===0);t('الخزينة 98500',r.tr3===98500);t('شاشة التسوية',r.rec);t('بلا أخطاء JS',errs.length===0);
if(errs.length)console.log(errs);console.log(JSON.stringify(r));console.log('نجح',ok,'فشل',bad);await b.close()})();
