// سداد المقاول من عهدة المهندس — اختبار على كشف «أبو شهد مبيض» الحقيقي (مع تعديل عمود العهدة للأسبوع الأخير حسب لقطة الشاشة)
// تشغيل: NODE_PATH=$(npm root -g) node tests/custpay.manual.js
const { chromium } = require('playwright'); const fs=require('fs');
const XL='/tmp/claude-0/xl/node_modules/';const X=require(XL+'xlsx'),JSZip=require(XL+'jszip');
const SRC=process.env.SRC||'/tmp/claude-0/z411/x/ابو شهد مبيض.xlsx';
let ok=0,bad=0;const T=(n,c,x)=>{if(c)ok++;else{bad++;console.log('✘',n,JSON.stringify(x))}console.log(c?'  ✔':'  ✘',n)};
async function mk(cust){const w=X.readFile(SRC,{cellDates:true});const s=w.Sheets['مبني 1و2 الطالبات 2025'];const set=(r,c,v)=>{s[X.utils.encode_cell({r,c})]={t:'n',v}};
 // الصف 75 = 04-11-2026 (الأعمدة: 9 خصم ماسبق، 10 مستحق، 11 من عهدة، 12 رصيد)
 set(75,11,cust);set(75,12,8537.9-cust);set(81,11,cust);set(81,12,8537.9-cust);
 const z=new JSZip();z.file('ابو شهد مبيض.xlsx',X.write(w,{type:'buffer',bookType:'xlsx',cellDates:true}));return{name:'4-11-2026.zip',mimeType:'application/zip',buffer:await z.generateAsync({type:'nodebuffer'})}}
(async()=>{if(!fs.existsSync(SRC)){console.log('الملف الأصلي غير موجود');process.exit(0)}
const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext()).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{d.type()==='prompt'?d.accept(/تصفير/.test(d.message())?'تصفير':'سبب'):d.accept()});
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
for(const p of ['xlsx/dist/xlsx.full.min.js','jszip/dist/jszip.min.js'])await pg.addScriptTag({path:XL+p});
async function run(cust,label){await pg.click('#side a[data-p=import]');await pg.click('[data-a=impReset]');await pg.waitForFunction(()=>S.impDone,null,{timeout:30000});
 await pg.evaluate(()=>{S.imp=null;render()});await pg.setInputFiles('#imp_files',[await mk(cust)]);await pg.waitForFunction(()=>S.imp&&S.imp.files.length>=1&&S.imp.lines&&S.imp.lines.length>0,null,{timeout:60000}).catch(()=>{});await pg.waitForTimeout(800);
 const parsed=await pg.evaluate(()=>{const g=(impDefaults(S.imp).groups||[]).filter(x=>/الطالبات|طالبات/.test(x.sheet)&&x.date==='2026-11-04')[0];return g?{due:g.dcost,cust:g.cust,G:g.G,P:g.P,taken:!!g.taken,disc:g.disc}:null});
 await pg.evaluate(()=>{S.accounts=S.accounts.length?S.accounts:[{id:'tr',name:'الخزينة',kind:'cash',opening:1000000}];S.imp.cust='__new';S.imp.src=S.accounts[0].id;S.imp.wacc=S.accounts[0].id});
 await pg.click('[data-a=impGo]');await pg.waitForFunction(()=>S.impDone&&S.impDone.indexOf('تم تحميل')===0,null,{timeout:120000});
 return{label,parsed,...await pg.evaluate(()=>{const pj=S.projects.filter(p=>/الطالبات|طالبات/.test(p.name))[0];const con=S.cfg.contractors.filter(c=>/شهد/.test(c.name))[0];if(!pj||!con)return{err:'no project/contractor',pj:!!pj,con:!!con};
  const tx=S.txs.filter(t=>t.project_id===pj.id&&t.party_id===con.id&&t.status!=='cancelled');const WK='2026-11-04';const pay=tx.filter(t=>t.type==='payment'&&t.from_custody&&t.date===WK),adv=tx.filter(t=>t.type==='adv'&&t.from_custody&&t.date===WK);
  const cu=S.accounts.filter(a=>/عهد/.test(a.name))[0];const wk=wkRows({week:'2026-11-04',project:pj.id,party:con.id})[0];
  return{pid:pj.id,con:con.id,pay:sum(pay,t=>num(t.amount)),adv:sum(adv,t=>num(t.amount)),n:tx.length,custBal:cu?accStats(cu).bal:null,custOut:cu?sum(pay.concat(adv).filter(t=>apr(t)),t=>sum(cashMoves(t).filter(m=>m.acc===cu.id),m=>-m.amt)):null,earlierCust:sum(tx.filter(t=>t.type==='payment'&&t.from_custody&&t.date!==WK),t=>num(t.amount)),advOut:certAdvOut(pj.id,con.id),net:wk&&wk.net,rem:wk&&wk.rem,paid:wk&&wk.paid,ent:wk&&wk.ent}})}}
const A=await run(15000,'سالب');console.log(JSON.stringify(A));
T('1 قراءة الأعمدة منفصلة: مستحق 8,537.9 وعهدة 15,000 وإجمالي/سابق من الكشف',A.parsed&&Math.abs(A.parsed.due-8537.9)<0.01&&A.parsed.cust===15000&&Math.abs(A.parsed.G-922752.1)<0.01&&Math.abs(A.parsed.P-914214.2)<0.01,A.parsed);
T('2 لا سند سالب: السداد = الاستحقاق 8,537.9 فقط',Math.abs(A.pay-8537.9)<0.01,A);
T('3 الزيادة 6,462.1 سلفة مقاول مرحّلة',Math.abs(A.adv-6462.1)<0.01&&Math.abs(A.advOut-6462.1)<0.01,A);
T('4 العهدة صُرف منها 15,000 مرة واحدة (سداد + سلفة)',Math.abs(A.custOut-15000)<0.01&&Math.abs(A.pay+A.adv-15000)<0.01,A);
T('5 رصيد المقاول: المتبقي للأسبوع صفر',Math.abs(A.rem)<0.01,A);
// إعادة الاستيراد دون تكرار
const cnt1=await pg.evaluate(()=>S.txs.length);await pg.click('#side a[data-p=import]');await pg.evaluate(()=>{S.imp=null;render()});await pg.setInputFiles('#imp_files',[await mk(15000)]);await pg.waitForTimeout(1500);
await pg.evaluate(()=>{S.imp.cust=S.accounts.filter(a=>/عهد/.test(a.name))[0].id;S.imp.src=S.accounts[0].id;S.imp.wacc=S.accounts[0].id});await pg.click('[data-a=impGo]');await pg.waitForFunction(()=>S.impDone&&S.impDone.indexOf('تم تحميل')===0,null,{timeout:120000});
const cnt2=await pg.evaluate(()=>S.txs.length);T('6 إعادة الاستيراد لا تضيف حركات',cnt2===cnt1,{cnt1,cnt2});
// ترحيل للأسبوع التالي: السلفة ما زالت قائمة وليست مخصومة تلقائيًا من مشروع آخر
const nx=await pg.evaluate(a=>({same:certAdvOut(a.pid,a.con),other:certAdvOut('__other__',a.con)}),A);T('7 السلفة تظهر في حساب المقاول ولا تُقاصّ تلقائيًا مع مشروع آخر',Math.abs(nx.same-6462.1)<0.01&&nx.other===0,nx);
const B=await run(3000,'موجب');console.log(JSON.stringify(B));T('8 رصيد موجب: سداد 3,000 والمتبقي 5,537.9 بلا سلفة',Math.abs(B.pay-3000)<0.01&&B.adv===0&&Math.abs(B.rem-5537.9)<0.01,B);
const C=await run(8537.9,'صفر');console.log(JSON.stringify(C));T('9 رصيد صفري: سداد 8,537.9 دون سلفة والمتبقي صفر',Math.abs(C.pay-8537.9)<0.01&&C.adv===0&&Math.abs(C.rem)<0.01,C);
T('10 لا أخطاء بالصفحة',errs.length===0,errs);console.log('نجح',ok,'فشل',bad);await b.close()})();
