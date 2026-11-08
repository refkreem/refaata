// اختبار القبول على الأسابيع الأربعة بالملفات الحقيقية. تشغيل: NODE_PATH=$(npm root -g) node tests/acceptance.manual.js
const { chromium } = require('playwright'); const fs=require('fs');
const A=process.env.ATT||'/mnt/user-data/attachments/417653ff-1ed1-57a2-b72f-c61552d5058e/';
const Z={'2026-10-14':'09e3244b-1793843935465_14-10-2026_______.zip','2026-10-21':'45ebf9e3-1793842721467_21-10-2026_______.zip','2026-10-28':'a964418d-1793842525729_28-10-2026.zip','2026-11-04':'2d1759c4-1793844918233_4-11-2026_______.zip'};
const R=[];const PARSED={},DELTA={};const T=(n,c,x)=>{R.push({n,ok:!!c,x});console.log(c?'  ✔':'  ✘',n,c?'':JSON.stringify(x))};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const ctx=await b.newContext();const pg=await ctx.newPage();
pg.on('pageerror',e=>{T('PAGEERR '+e.message,false)});pg.on('dialog',d=>{d.type()==='prompt'?d.accept(/تصفير/.test(d.message())?'تصفير':'سبب'):d.accept()});
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
await pg.addScriptTag({path:'/tmp/claude-0/xl/node_modules/xlsx/dist/xlsx.full.min.js'});await pg.addScriptTag({path:'/tmp/claude-0/xl/node_modules/jszip/dist/jszip.min.js'});await pg.addScriptTag({path:'/tmp/claude-0/xl/node_modules/exceljs/dist/exceljs.min.js'});
const f=d=>({name:Z[d].replace(/^[0-9a-f]{8}-\d+_/,''),mimeType:'application/zip',buffer:fs.readFileSync(A+Z[d])});
await pg.click('#side a[data-p=import]');await pg.click('[data-a=impReset]');await pg.waitForFunction(()=>S.impDone,null,{timeout:30000});
const snap=()=>pg.evaluate(()=>{const keys={};let dup=0;S.txs.forEach(t=>{if(t.imp_key){if(keys[t.imp_key])dup++;keys[t.imp_key]=1}});return{n:S.txs.length,dup,pend:S.txs.filter(t=>t.status==='pending').length}});
const load=async(d)=>{await pg.click('#side a[data-p=import]');await pg.evaluate(()=>{S.imp=null;render()});await pg.setInputFiles('#imp_files',[f(d)]);await pg.waitForFunction(z=>S.imp&&S.imp.files.length>15&&(S.imp.zds||[]).indexOf(z)>=0,d,{timeout:120000});await pg.waitForTimeout(500);
 await pg.evaluate(()=>{const c=S.accounts.filter(a=>/عهد|محاسب/.test(a.name))[0];S.imp.cust=c?c.id:'__new';S.imp.src=S.accounts[1].id;S.imp.wacc=S.accounts[1].id});const parsed=await pg.evaluate(()=>{const KN={};IMP_SITES.forEach(q=>KN[q[1]]=1);const pn={};S.projects.forEach(p=>pn[p.name]=1);const isEx=x=>!!(x&&KN[x]&&!pn[x]);const B=impBuild(S.imp);const w={inc:0,exc:0,workers:new Set()};(S.imp.wages||[]).forEach(x=>{const t=x.rows.reduce((a,r)=>a+num(r.total),0);if(isEx(x.site))w.exc+=t;else{w.inc+=t;x.rows.forEach(r=>w.workers.add(r.name))}});w.workers=w.workers.size;const e={inc:0,exc:0,cin:0};B.ex.forEach(r=>{if(r.kind==='in')e.cin+=num(r.inn);else{const v=r.kind==='refund'?-num(r.inn):num(r.out);if(isEx(r.site))e.exc+=v;else e.inc+=v}});return{w,e}});PARSED[d]=parsed;
 const ids=await pg.evaluate(()=>S.txs.map(t=>t.id));await pg.click('[data-a=impGo]');await pg.waitForFunction(()=>S.impDone&&S.impDone.indexOf('تم تحميل')===0,null,{timeout:180000});
 DELTA[d]=await pg.evaluate(ids=>{const have=new Set(ids);const o={out:0,cin:0};S.txs.forEach(t=>{if(have.has(t.id)||t.payroll_id)return;if(t.type==='expense')o.out+=num(t.amount);else if(t.type==='payment'&&!String(t.desc||'').startsWith('سداد مستحقات'))o.out+=num(t.amount);else if(t.type==='purchase')o.out+=num(t.total);else if(t.type==='adv')o.out+=num(t.amount);else if(t.type==='transfer'&&t.custody)o.cin+=num(t.amount)});return o},ids);return pg.evaluate(()=>S.impDone.replace(/<[^>]*>/g,''))};
const S0={};for(const d of Object.keys(Z)){const m=await load(d);S0[d]=await snap();console.log(d,S0[d].n,'txs |',m.slice(0,160))}
// 1 استخراج مدفوعات المقاولين لكل أسبوع
const wk=await pg.evaluate(()=>{const o={};wkWeeks().forEach(w=>{const r=wkRows({week:w});o[w]={n:r.length,ent:Math.round(r.reduce((s,x)=>s+x.ent,0)),net:Math.round(r.reduce((s,x)=>s+x.net,0)),neg:r.filter(x=>x.net<-0.5).length}});return o});console.log(JSON.stringify(wk));
for(const d of Object.keys(Z))T('1 استخراج مدفوعات المقاولين '+d,wk[d]&&wk[d].n>0,wk[d]);
// 2 التراكمي والاستحقاق
const cum=await pg.evaluate(()=>{const bad=[];const g={};TX().filter(t=>t.type==='sub'&&t.cum).forEach(t=>{(g[t.project_id+'|'+t.party_id]=g[t.project_id+'|'+t.party_id]||[]).push(t)});Object.keys(g).forEach(k=>{const L=g[k].sort((a,b)=>a.date<b.date?-1:1);let prev=0;L.forEach(t=>{if(num(t.cum_value)+0.5<prev)bad.push([k,t.date,prev,t.cum_value]);prev=num(t.cum_value)})});return{groups:Object.keys(g).length,bad:bad.slice(0,5),nb:bad.length}});
T('2 التراكمي لا ينقص بين الأسابيع',cum.nb===0,cum);
const ent=await pg.evaluate(()=>{let bad=0;wkWeeks().forEach(w=>wkRows({week:w}).forEach(r=>{if(Math.abs(r.net-(r.cum-r.before-r.advRecov-r.other))>0.5)bad++}));return bad});T('2 الصافي = التراكمي − المدفوع قبله − السلف − الخصم',ent===0,ent);
// 3 المدفوع الفعلي والأرصدة
const pay=await pg.evaluate(()=>{let bad=0,n=0;wkWeeks().forEach(w=>wkRows({week:w}).forEach(r=>{n++;if(Math.abs(r.rem-(r.net-r.paid))>0.5)bad++}));return{n,bad}});T('3 المتبقي = الصافي − المدفوع لكل حساب',pay.bad===0,pay);
// 4 أجور العمال الأسبوعية
const wg=await pg.evaluate(()=>{const o={};wgWeeks().forEach(w=>{const s=wgSheets({week:w});o[w]={sheets:s.length,total:Math.round(s.reduce((a,x)=>a+x.total,0)),net:Math.round(s.reduce((a,x)=>a+x.net,0)),workers:new Set(wgWorkers({week:w}).map(x=>x.name)).size}});return o});console.log(JSON.stringify(wg));
const P4=PARSED['2026-11-04'];T('4 مطابقة أجور 4-11 مع ملف Excel: 127,200 = المحمَّل + المستبعد (خارج المشاريع السبعة) بلا فرق',Math.round(P4.w.inc+P4.w.exc)===127200&&wg['2026-11-04'].total===Math.round(P4.w.inc)&&wg['2026-11-04'].workers===P4.w.workers,{parsed:P4.w,system:wg['2026-11-04']});
const D4=DELTA['2026-11-04'];T('4 مطابقة مصروفات وعهدة 4-11: المحمَّل = المقروء من الملف بلا فرق',Math.abs(D4.out-P4.e.inc)<1&&Math.abs(D4.cin-P4.e.cin)<1,{parsed:P4.e,posted:D4});
for(const d of Object.keys(Z))T('4 كشف أجور أسبوع '+d,wg[d]&&wg[d].sheets>0,wg[d]);
// 5 السلف
const adv=await pg.evaluate(()=>{const r=PC.adv.run({});return{n:r.rows.length,neg:r.rows.filter(x=>x[5]<-0.5).length,noted:r.rows.filter(x=>x[5]<-0.5&&x[2]).length,rows:r.rows.filter(x=>x[5]<-0.5).slice(0,5)}});T('5 السلف: كل رصيد سالب موسوم بملاحظة (سلف خُصمت بلا سلفة مسجلة)',adv.neg===adv.noted,adv);
// 6 مرتبات شهرية بموظفين مسجلين
const mp=await pg.evaluate(async()=>{S.cfg.staff=[{id:'e1',name:'مهندس اختبار',salary:12000,allow:500,active:true},{id:'e2',name:'سائق اختبار',salary:6000,active:true}];S.cfg.mp={ins_pct:11,tax_pct:0};await saveCfg();S.mp.month='2026-10';go('mpay');const bal0=S.accounts.reduce((s,a)=>s+accStats(a).bal,0);await ACT.mpApprove();const t=mpOf('2026-10');const ok1=t&&t.mst==='approved';await ACT.mpApprove();const one=mpAll().length;return{ok1,one,net:t&&t.total}});
T('6 المرتبات الشهرية: اعتماد وكشف واحد للشهر',mp.ok1&&mp.one===1,mp);
// 7/8 كشوف وتصدير
const ex=await pg.evaluate(async()=>{const out={};for(const k of PC_ORDER){try{Object.assign(S.pc,{rep:k,week:'2026-11-04',month:'2026-10',project:'',party:k==='constmt'?S.cfg.contractors[0].id:k==='wgstmt'?pcWorkers()[0]:k==='empstmt'?'مهندس اختبار':'',from:'',to:''});const r=pcRun();out[k]=r.rows.length}catch(e){out[k]='ERR '+e.message}}
 let xl='';try{const r=pcRun();S.pc.rep='psum';const rr=pcRun();const wb=await xlBuild([xlSheetFromRes({title:'x',cols:rr.cols,rows:rr.rows},'s')]);const buf=await wb.xlsx.writeBuffer();xl=buf.byteLength}catch(e){xl='ERR '+e.message}return{out,xl}});console.log(JSON.stringify(ex));
T('7 الكشوف الفردية والتقارير الـ12 تعمل دون أخطاء',Object.values(ex.out).every(v=>typeof v==='number'),ex.out);T('8 ملف Excel يُبنى فعليًا',typeof ex.xl==='number'&&ex.xl>2000,ex.xl);
// 9/10 تكلفة المشروع وربحية البنود
const pc=await pg.evaluate(()=>{const bad=[];S.projects.forEach(p=>{const x=ccProjRow(p.id);if(Math.abs(x.cost-(x.sub+x.mat+x.lab+x.dir+x.ind))>1)bad.push([p.name,x.cost,x.sub+x.mat+x.lab+x.dir+x.ind])});const L=jeAll().reduce((a,e)=>{(e.lines||[]).forEach(l=>{a.d+=l.d;a.c+=l.c});return a},{d:0,c:0});return{bad,tb:Math.round(L.d-L.c),projects:S.projects.length}});
T('9 تكلفة المشروع = مجموع مكوناتها',pc.bad.length===0,pc);T('9 ميزان المراجعة متزن',Math.abs(pc.tb)<1,pc.tb);
const bq=await pg.evaluate(()=>{let n=0,bad=0;S.projects.forEach(p=>(p.boq||[]).forEach(b=>{n++;const i=bcItem(p.id,b);if(!isFinite(i.fc)||!isFinite(i.profit))bad++}));return{n,bad}});T('10 ربحية البنود محسوبة بلا قيم غير صالحة',bq.bad===0,bq);
// 11/12 دفع جزئي وعكس
const pp=await pg.evaluate(async()=>{const W='2026-11-04';S.wk.week=W;S.wk.project='';const r=wkRows({week:W}).filter(x=>x.net>1000)[0];if(!r)return{skip:1};S.wk.sel={};S.wk.sel[r.key]=1;await ACT.wkToSt('approved');const key=r.key;S.wk.sel={};S.wk.sel[key]=1;ACT.wkVoucher();return{key,net:r.net}});
if(!pp.skip){await pg.waitForTimeout(200);await pg.selectOption('#f_acc',(await pg.evaluate(()=>S.accounts[1].id)));await pg.fill('.v_amt','500');await pg.click('[data-a=msave]');await pg.waitForTimeout(500);
 const a1=await pg.evaluate(k=>{const r=wkRows({week:'2026-11-04'}).filter(x=>x.key===k)[0];return{st:r.st,paid:r.paid}},pp.key);T('11 دفعة جزئية 500 → مدفوع جزئيًا',a1.st==='partial'&&a1.paid===500,a1);
 const a2=await pg.evaluate(async k=>{const v=S.txs.filter(t=>t.voucher).slice(-1)[0];await ACT.wkRev(v.id);const r=wkRows({week:'2026-11-04'}).filter(x=>x.key===k)[0];return{paid:r.paid,still:S.txs.some(t=>t.id===v.id),st:S.txs.find(t=>t.id===v.id).status,audit:(S.txs.find(t=>t.id===v.id).audit||[]).length}},pp.key);T('12 العكس: يعود المستحق ويبقى السند بالسجل',a2.paid===0&&a2.still&&a2.st==='cancelled'&&a2.audit===1,a2)}else T('11 دفعة جزئية',false,'no row');
// 13 منع التكرار: إعادة استيراد 4-11
const before=(await snap()).n;await load('2026-11-04');const af=await snap();T('13 إعادة استيراد 4-11 لا تضيف حركات ولا مكرر',af.dup===0&&af.n-before<=0,{before,after:af.n,dup:af.dup});
// 14 الاستمرارية بعد التحديث
const cnt=await pg.evaluate(()=>({n:S.txs.length,p:S.projects.length}));await pg.reload();await pg.waitForFunction(()=>window.S&&S.db&&S.txs.length>0,null,{timeout:30000}).catch(()=>{});const cnt2=await pg.evaluate(()=>({n:S.txs.length,p:S.projects.length}));T('14 البيانات بعد تحديث الصفحة',cnt2.n===cnt.n&&cnt2.p===cnt.p,{cnt,cnt2});
// مطابقة 4-11
const rec=await pg.evaluate(()=>{const o=wgSheets({week:'2026-11-04'});const w=wgWorkers({week:'2026-11-04'});const ex=TX().filter(t=>t.type==='expense'&&!t.payroll_id&&t.date>='2026-10-29'&&t.date<='2026-11-04');return{contractorRows:wkRows({week:'2026-11-04'}).length,wages:Math.round(w.reduce((s,x)=>s+x.total,0)),wagesNet:Math.round(w.reduce((s,x)=>s+x.net,0)),expenses:Math.round(ex.reduce((s,t)=>s+num(t.amount),0)),expCount:ex.length}});console.log('RECON-4-11',JSON.stringify(rec));
fs.writeFileSync('/tmp/claude-0/acceptance_result.json',JSON.stringify({R,S0,wk,wg,rec,PARSED,DELTA},null,1));
console.log(R.filter(x=>x.ok).length+' passed, '+R.filter(x=>!x.ok).length+' failed');await b.close()})();
