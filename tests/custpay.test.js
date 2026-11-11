// سداد المقاول من عهدة المهندس — بيانات تجريبية محلية: رصيد موجب/صفر/سالب، مشروعان لمقاول واحد، ترحيل للأسبوع التالي، تسوية الكشف مع العهدة والسندات
const { chromium } = require('playwright');
let ok=0,bad=0;const T=(n,c,x)=>{if(c)ok++;else{bad++;console.log('✗',n,JSON.stringify(x))}};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext()).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
const r=await pg.evaluate(async()=>{var o={};
 S.user='a@x.com';S.role='admin';S.cfg.roles={'a@x.com':'admin'};
 S.projects=[{id:'p1',name:'م1',boq:[]},{id:'p2',name:'م2',boq:[]}];S.txs=[];S.cfg.contractors=[{id:'c1',name:'مقاول أ',trade:'بياض'}];
 S.accounts=[{id:'tr',name:'الخزينة',kind:'cash',opening:100000},{id:'cu',name:'عهدة المهندس',kind:'cash',opening:0,cust:true,owner:'e@x.com'}];
 await saveTx({type:'transfer',date:'2026-11-01',from:'tr',to:'cu',amount:20000,desc:'صرف عهدة',custody:true});
 var cert=function(d,p,cum,rec,gr){gr=gr==null?cum:gr;return saveTx({type:'sub',cum:true,date:d,project_id:p,party_id:'c1',no:'',cum_value:cum,cum_base:cum,cum_add:0,lines:[{name:'بياض',unit:'مقطوعية',qty:1,qty_prev:0,price:gr,boq_id:null}],gross:gr,prior_paid:0,adv_recov:rec||0,other_ded:0,prev_disb:0,tax_pct:0,tax_amt:0,ret_pct:0,ret_amt:0,pct_paid:0,net:gr,paid:0,paid_set:true,pay_method:'cash',account_id:'',desc:'شهادة '+d})};
 var have={};var post=async function(t,key,miss){if(have[key])return;have[key]=1;t.status='approved';await saveTx(t)};
 // الأسبوع 1: م1 استحقاق 5000 وصُرف 8000 من العهدة (زيادة 3000) — م2 استحقاق 4000 بلا صرف
 await cert('2026-11-04','p1',5000);await cert('2026-11-04','p2',4000);
 var pay=await impCustPay(post,{pk:'k1',cons:'c1',p:'p1',date:'2026-11-04',real:8000,payable:5000,cust:'cu'});
 await impCustPay(post,{pk:'k1',cons:'c1',p:'p1',date:'2026-11-04',real:8000,payable:5000,cust:'cu'}); // إعادة نفس الاستيراد
 o.pay=pay;var tx=S.txs.filter(t=>t.from_custody);o.n=tx.length;o.paySum=tx.filter(t=>t.type==='payment').reduce((s,t)=>s+t.amount,0);o.advSum=tx.filter(t=>t.type==='adv').reduce((s,t)=>s+t.amount,0);
 o.negVoucher=S.txs.filter(t=>(t.type==='payment'||t.type==='adv')&&t.amount<0).length;
 var w1=wkRows({week:'2026-11-04',project:'p1'})[0],w2=wkRows({week:'2026-11-04',project:'p2'})[0];
 o.p1={ent:w1.ent,paid:w1.paid,rem:w1.rem,adv:certAdvOut('p1','c1')};o.p2={ent:w2.ent,paid:w2.paid,rem:w2.rem,adv:certAdvOut('p2','c1')};
 o.cust=accStats(S.accounts[1]).bal;o.tr=accStats(S.accounts[0]).bal;
 // الأسبوع 2: م1 تراكمي 11000 (+6000) مع استرداد السلفة 3000 موثقًا
 await cert('2026-11-11','p1',11000,3000,6000);
 var w3=wkRows({week:'2026-11-11',project:'p1'})[0];o.w3={ent:w3.ent,advBefore:w3.advOut,recov:w3.advRecov,net:w3.net};o.adv2=certAdvOut('p1','c1');
 // تسوية: الكشف مقابل العهدة والسندات
 var cumP1=11000,cumP2=4000,custPaid=o.paySum+o.advSum,payments=S.txs.filter(t=>t.type==='payment'&&t.kind==='contractor').reduce((s,t)=>s+t.amount,0);
 o.recon={entitle:cumP1+cumP2,paidTotal:payments,advOpen:o.adv2,custOut:custPaid};
 return o});
T('الدفع للأسبوع = الاستحقاق 5000 لا أكثر',r.pay===5000,r);
T('إعادة الاستيراد لا تكرر (حركتان فقط: سداد + سلفة)',r.n===2,r);
T('سداد 5000 وسلفة 3000',r.paySum===5000&&r.advSum===3000,r);
T('لا سند سالب',r.negVoucher===0,r);
T('م1: استحقاق 5000 مدفوع 5000 متبقٍ 0 وسلفة قائمة 3000',r.p1.ent===5000&&r.p1.paid===5000&&r.p1.rem===0&&r.p1.adv===3000,r.p1);
T('م2: متبقٍ 4000 ولا مقاصة تلقائية مع السلفة',r.p2.rem===4000&&r.p2.adv===0,r.p2);
T('العهدة صُرف منها 8000 مرة واحدة (12000 متبقية) والخزينة 80000 لم تتغير',r.cust===12000&&r.tr===80000,r);
T('الأسبوع التالي: استحقاق 6000 والسلفة 3000 تُرحّل ثم تُسترد بوثيقة فيكون الصافي 3000',r.w3.ent===6000&&r.w3.advBefore===3000&&r.w3.recov===3000&&r.w3.net===3000,r.w3);
T('بعد الاسترداد لا سلفة قائمة',r.adv2===0,r);
T('تسوية كشف المقاول: استحقاق 15000 − مدفوع 5000 = 10000 متبقٍ، والسلفة 3000 مستردة، والعهدة 8000',r.recon.entitle-r.recon.paidTotal===10000&&r.recon.custOut===8000,r.recon);
T('لا أخطاء بالصفحة',errs.length===0,errs);
console.log('نجح',ok,'فشل',bad);await b.close()})();
