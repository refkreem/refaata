const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const pg=await(await b.newContext()).newPage();let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:bad++;console.log(c?'  ✔':'  ✘',n,c?'':JSON.stringify(x))};
pg.on('pageerror',e=>{bad++;console.log('PAGEERR',e.message)});pg.on('dialog',async d=>{d.type()==='prompt'?await d.accept('تصحيح'):await d.accept()});
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
await pg.evaluate(()=>{S.projects=[{id:'p1',name:'الدور الخامس',value:900000,boq:[{id:'b1',code:'1',name:'حديد',unit:'م',qty:1,price:1}]},{id:'p2',name:'عيادة',value:50000,boq:[]}];S.accounts=[{id:'a1',name:'خزينة',kind:'cash',opening:500000}];S.cfg.contractors=[{id:'c1',name:'ابراهيم الحداد',trade:'أعمال معدنية',open:0}];S.txs=[]});
async function cert(date,proj,cum,adv,paid){await pg.evaluate(()=>openForm('sub'));await pg.fill('#t_date',date);await pg.selectOption('#t_proj',proj);await pg.selectOption('#t_con','c1');await pg.fill('#c_cum',String(cum));if(adv!=null)await pg.fill('#c_adv',String(adv));if(paid)await pg.fill('#c_paid',String(paid));await pg.selectOption('#f_acc','a1').catch(()=>{});await pg.waitForTimeout(100);
 const calc=await pg.evaluate(()=>{const c=S.certCalc();return{delta:c.delta,due:c.due,net:c.net,P:c.P,prevC:c.prevC,advOut:c.advOut}});await pg.click('[data-a=msave]');await pg.waitForTimeout(250);return calc}
const w1=await cert('2026-10-07','p1',10000,null,10000);
T('الأسبوع 1: مستحق 10000 وصافي 10000',w1.due===10000&&w1.net===10000&&w1.P===0,w1);
const w2=await cert('2026-10-14','p1',25000,null,0);
T('الأسبوع 2: سابق مدفوع 10000 يُخصم مرة واحدة، مستحق 15000',w2.P===10000&&w2.due===15000&&w2.net===15000&&w2.delta===15000,w2);
T('رقم الشهادة تلقائي',await pg.evaluate(()=>S.txs.filter(t=>t.cum).map(t=>t.no).join()==='1,2'),await pg.evaluate(()=>S.txs.map(t=>t.no)));
// سلفة 2000
await pg.evaluate(async()=>{await saveTx({type:'adv',kind:'contractor',party_id:'c1',project_id:'p1',date:'2026-10-15',amount:2000,account_id:'a1',desc:'سلفة'},null)});
const w3=await cert('2026-10-21','p1',30000,2000,5000);
T('الأسبوع 3: سلف قائمة 2000 وخصمها',w3.advOut===2000&&w3.net===(30000-10000-2000),w3);
T('السلفة لا تُخصم مرتين',await pg.evaluate(()=>certAdvOut('p1','c1')===0));
const L=await pg.evaluate(()=>contractorLedger('c1','p1'));
T('دفعة جزئية: المتبقي 13000',Math.round(L.owed)===30000-2000-10000-5000,L);
// مشروع 2 منفصل
await cert('2026-10-21','p2',3500,null,0);
const own=await pg.evaluate(()=>[contractorLedger('c1','p1').owed,contractorLedger('c1','p2').owed]);
T('المشروع الثاني منفصل',own[0]===13000&&own[1]===3500,own);
// تعديل شهادة سابقة وإعادة الاحتساب
await pg.evaluate(()=>{const t=S.txs.find(x=>x.cum&&x.no==='2'&&x.project_id==='p1');openForm('sub',t)});await pg.waitForTimeout(150);
await pg.fill('#c_cum','26000');await pg.click('[data-a=msave]');await pg.waitForTimeout(300);
const g=await pg.evaluate(()=>S.txs.filter(x=>x.cum&&x.project_id==='p1').sort((a,b)=>a.date.localeCompare(b.date)).map(x=>[x.gross,x.net]));
T('بعد التعديل: الفروق تُعاد (10000،16000،4000)',g[0][0]===10000&&g[1][0]===16000&&g[2][0]===4000,g);
T('سجل المراجعة للتعديل',await pg.evaluate(()=>{const t=S.txs.find(x=>x.cum&&x.no==='2'&&x.project_id==='p1');return t.audit&&t.audit.length===1&&t.audit[0].reason==='تصحيح'&&t.audit[0].ch.some(c=>c[0]==='cum_value')}));
T('الإجمالي لا يتغير بعد التعديل (13000)',await pg.evaluate(()=>Math.round(contractorLedger('c1','p1').owed)===13000));
// إلغاء شهادة
await pg.evaluate(()=>{const t=S.txs.find(x=>x.cum&&x.project_id==='p1'&&x.no==='3');return ACT.txCancel(t.id)});await pg.waitForTimeout(300);
T('إلغاء الشهادة تُخرجها من الحساب وتبقى بالسجل',await pg.evaluate(()=>{const t=S.txs.find(x=>x.cum&&x.project_id==='p1'&&x.no==='3');return t.status==='cancelled'&&!TX().includes(t)}));
// حذف شهادة لا يمس المشاريع والمقايسة والشهادات الأخرى
const before=await pg.evaluate(()=>({p:S.projects.length,boq:S.projects[0].boq.length,n:S.txs.filter(x=>x.cum).length}));
await pg.evaluate(()=>{const t=S.txs.find(x=>x.cum&&x.project_id==='p2');return ACT.txDel(t.id)});await pg.waitForTimeout(300);
const after=await pg.evaluate(()=>({p:S.projects.length,boq:S.projects[0].boq.length,n:S.txs.filter(x=>x.cum).length,log:(S.cfg.auditLog||[]).length}));
T('الحذف يترك المشاريع والمقايسة والشهادات الأخرى',after.p===before.p&&after.boq===before.boq&&after.n===before.n-1&&after.log===1,[before,after]);
// كشف الحساب المجمّع
const rep=await pg.evaluate(()=>{S.rf={rep:'conStmt',party:'c1',project:''};const r=REPS.conStmt.run(S.rf);return{n:r.rows.length,cols:r.cols.length,sum:r.summary.map(x=>x[1])}});
T('كشف حساب مجمّع يعمل',rep.n>3&&rep.cols===12,rep);
const jeok=await pg.evaluate(()=>jeAll().every(e=>e.ok)&&REPS.tb.run({}).summary[2][1]===0);
T('القيود متزنة',jeok);
console.log('نجح',ok,'/ فشل',bad);await b.close()})();
