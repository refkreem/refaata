// اختبار القبول على الأسابيع الأربعة بالملفات الحقيقية. تشغيل: NODE_PATH=$(npm root -g) node tests/acceptance.manual.js
const { chromium } = require('playwright'); const fs=require('fs');
const A=process.env.ATT||'/mnt/user-data/attachments/417653ff-1ed1-57a2-b72f-c61552d5058e/';
const Z={'2026-10-14':'09e3244b-1793843935465_14-10-2026_______.zip','2026-10-21':'45ebf9e3-1793842721467_21-10-2026_______.zip','2026-10-28':'a964418d-1793842525729_28-10-2026.zip','2026-11-04':'2d1759c4-1793844918233_4-11-2026_______.zip','2026-11-11':'d6f41e58-1794459689216_11-11-2026.zip'};
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
const DUMP=await pg.evaluate(()=>{const o={};o.accounts=S.accounts.map(a=>({n:a.name,bal:Math.round(accStats(a).bal)}));
o.projects=S.projects.map(p=>({id:p.id,n:p.name,value:p.value,boq:(p.boq||[]).length,boqTot:Math.round((p.boq||[]).reduce((s,b)=>s+num(b.qty)*num(b.price),0))}));
o.types={};S.txs.forEach(t=>{o.types[t.type]=(o.types[t.type]||0)+1});
o.contractors=(S.cfg.contractors||[]).map(c=>({id:c.id,n:c.name}));
return o});
fs.writeFileSync('/tmp/claude-0/real_dump.json',JSON.stringify(DUMP,null,1));
await pg.evaluate(()=>{window.__x=1});
global.PG=pg;

const st=await pg.evaluate(()=>localStorage.getItem('moqawel_pro_v4'));
fs.writeFileSync('/tmp/claude-0/real_state.json',st||'{}');console.log('saved state',(st||'').length);
await b.close()})();
