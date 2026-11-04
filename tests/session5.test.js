const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const pg=await(await b.newContext()).newPage();let ok=0,bad=0;const T=(n,c)=>{c?ok++:bad++;console.log(c?'  ✔':'  ✘',n)};
let dlg=[];pg.on('pageerror',e=>{bad++;console.log('PAGEERR',e.message)});pg.on('dialog',async d=>{dlg.push(d.message());d.type()==='prompt'?await d.accept('سبب اختبار'):await d.accept()});
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata2/index.html');await pg.waitForFunction(()=>window.S&&S.db);
// --- BOQ gap
await pg.evaluate(()=>{S.projects=[{id:'p1',name:'م1',value:1000,boq:[]}];S.accounts=[{id:'a1',name:'خزينة',kind:'cash',opening:1000},{id:'a2',name:'بنك',kind:'bank',opening:5000}];S.txs=[];S.vp='p1'});
await pg.evaluate(()=>{const p=proj('p1');p.boq=[{id:'b1',code:'1',group:'قسم أصلي',name:'توريد وتركيب مواسير صرف صحي',unit:'م',qty:10,price:100,cost_price:0},{id:'b2',code:'2',group:'',name:'تكسير بلاط قديم',unit:'م2',qty:10,price:100},{id:'b3',code:'3',group:'',name:'بند غريب xyz',unit:'م',qty:1,price:0}]});
T('فجوة المقايسة عن العقد',await pg.evaluate(()=>!!boqGap(proj('p1'))));
T('الفرق غير معتمد افتراضيًا',await pg.evaluate(()=>!boqGapOk(proj('p1'))&&boqGapHtml(proj('p1')).includes('غير معتمد')));
await pg.evaluate(()=>ACT.boqGapOk());await pg.waitForTimeout(200);
T('اعتماد الفرق بسبب',await pg.evaluate(()=>boqGapOk(proj('p1'))&&proj('p1').gap_ok.note==='سبب اختبار'));
await pg.evaluate(()=>{proj('p1').value=1500});
T('تغيير القيمة يُبطل الاعتماد',await pg.evaluate(()=>!boqGapOk(proj('p1'))));
// --- classification + dictionary + preserve original
await pg.evaluate(()=>ACT.boqAutoCat());await pg.waitForTimeout(200);
const g=await pg.evaluate(()=>proj('p1').boq.map(b=>[b.group,b.group0,b.name,b.qty,b.price]));
T('تصنيف صحي',g[0][0]==='أعمال صحية');T('تصنيف تكسير',g[1][0]==='أعمال تعديل وتكسير');
T('الاسم والكمية والسعر لم تتغير',g[0][2]==='توريد وتركيب مواسير صرف صحي'&&g[0][3]===10&&g[0][4]===100);
T('القسم الأصلي محفوظ',g[0][1]==='قسم أصلي');
await pg.evaluate(()=>{S.cfg.boqDict={'أعمال كهربائية':'xyz'}});
T('القاموس يُوسَّع',await pg.evaluate(()=>boqTrade('بند غريب xyz')==='أعمال كهربائية'));
// --- treasury guard + vouchers
const s0=await pg.evaluate(()=>accStats(acc('a1')).bal);
await pg.evaluate(()=>{dlgMark=1});
await pg.evaluate(()=>openForm('expense'));
await pg.fill('#t_amt','1500').catch(()=>{});
T('أزرار سند القبض والصرف',await pg.evaluate(()=>{go('accounts');return document.body.innerHTML.includes('سند قبض')&&document.body.innerHTML.includes('سند صرف')}));
// --- batches
await pg.evaluate(()=>{closeModal&&closeModal();S.cfg.trash=[];S.txs=[1,2,3].map(i=>({id:'t'+i,type:'expense',status:'approved',date:'2026-10-28',category:'نقل',amount:100*i,account_id:'a1',project_id:'p1',imp_batch:'2026-10-28'})).concat([{id:'t9',type:'expense',status:'approved',date:'2026-10-21',category:'نقل',amount:50,account_id:'a1',imp_batch:'2026-10-21'}])});
await pg.evaluate(()=>ACT.impDelBatch('2026-10-28'));await pg.waitForTimeout(300);
T('حذف الدفعة لا يمس غيرها',await pg.evaluate(()=>S.txs.length===1&&S.txs[0].id==='t9'));
T('الدفعة في السلة',await pg.evaluate(()=>S.cfg.trash.length===1&&S.cfg.trash[0].txs.length===3));
await pg.evaluate(()=>ACT.impRestore(0));await pg.waitForTimeout(300);
T('الاسترداد يعيد الحركات',await pg.evaluate(()=>S.txs.length===4&&S.cfg.trash.length===0));
await pg.evaluate(()=>{S.addBatch='2026-10-28'});
await pg.evaluate(async()=>{await saveTx({type:'expense',date:'2026-10-28',category:'نقل',amount:10,account_id:'a1',project_id:'p1'},null)});
T('إضافة مصروف لخميس قائم',await pg.evaluate(()=>S.txs.filter(t=>t.imp_batch==='2026-10-28').length===4));
await pg.evaluate(async()=>{const t=S.txs.find(x=>x.id==='t1');await saveTx(Object.assign({},t,{amount:777}),t)});
T('التعديل يحفظ الدفعة',await pg.evaluate(()=>{const t=S.txs.find(x=>x.id==='t1');return t.amount===777&&t.imp_batch==='2026-10-28'}));
// --- treasury math
await pg.evaluate(()=>{S.txs=[];S.accounts=[{id:'a1',name:'خزينة',kind:'cash',opening:1000},{id:'a2',name:'بنك',kind:'bank',opening:5000}];S.addBatch=''});
await pg.evaluate(async()=>{await saveTx({type:'revenue',date:'2026-10-01',project_id:'p1',kind:'أخرى',amount:500,wh:[{k:'vat',amt:50}],account_id:'a1'},null);await saveTx({type:'expense',date:'2026-10-02',category:'نقل',amount:200,account_id:'a1',project_id:'p1'},null);await saveTx({type:'transfer',date:'2026-10-03',from:'a1',to:'a2',amount:300},null)});
const bal=await pg.evaluate(()=>[accStats(acc('a1')).bal,accStats(acc('a2')).bal]);
T('رصيد الخزينة = 1000+450-200-300',bal[0]===950);T('رصيد البنك = 5300',bal[1]===5300);
dlg=[];const r5=await pg.evaluate(async()=>await saveTx({type:'expense',date:'2026-10-04',category:'نقل',amount:5000,account_id:'a1',project_id:'p1'},null));
T('تحذير الرصيد السالب',dlg.some(m=>m.includes('بالسالب')));
console.log('نجح',ok,'/ فشل',bad);await b.close()})();
