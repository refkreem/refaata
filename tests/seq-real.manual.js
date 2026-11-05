const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const pg=await(await b.newContext()).newPage();
pg.on('pageerror',e=>console.log('PAGEERR',e.message));pg.on('dialog',d=>{d.type()==='prompt'?d.accept('تصفير'):d.accept()});
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata2/index.html');await pg.waitForFunction(()=>window.S&&S.db);
await pg.addScriptTag({path:'/tmp/claude-0/xl/node_modules/xlsx/dist/xlsx.full.min.js'});await pg.addScriptTag({path:'/tmp/claude-0/xl/node_modules/jszip/dist/jszip.min.js'});
const A='/mnt/user-data/attachments/d5e711fb-0cee-506f-8b45-996e9faaf23a/';
const Z={'14':'09e3244b-1793843935465_14-10-2026_______.zip','21':'45ebf9e3-1793842721467_21-10-2026_______.zip','28':'a964418d-1793842525729_28-10-2026.zip'};
const f=k=>({name:Z[k].replace(/^[0-9a-f]{8}-\d+_/,''),mimeType:'application/zip',buffer:fs.readFileSync(A+Z[k])});
await pg.click('#side a[data-p=import]');await pg.click('[data-a=impReset]');await pg.waitForFunction(()=>S.impDone,null,{timeout:30000});
const snap=async(lab)=>{const r=await pg.evaluate(()=>{const ty={};S.txs.forEach(t=>ty[t.type]=(ty[t.type]||0)+1);const keys={};let dup=0;S.txs.forEach(t=>{if(t.imp_key){if(keys[t.imp_key])dup++;keys[t.imp_key]=1}});const ds=S.txs.map(t=>t.date).filter(Boolean).sort();
 const dues=duesRows({}).filter(r=>r[0]==='مقاول باطن');return{n:S.txs.length,ty,pend:S.txs.filter(t=>t.status==='pending').length,dup,min:ds[0],max:ds[ds.length-1],owed:Math.round(sum(dues,r=>r[6])),cons:dues.length,cost:Math.round(sum(S.projects,p=>projTotals(p.id).cost)),jeOk:jeAll().every(e=>e.ok),tb:REPS.tb.run({}).summary[2][1],cash:S.accounts.map(a=>[a.name,Math.round(accStats(a).bal)]),batches:[...new Set(S.txs.map(t=>t.imp_batch).filter(Boolean))].sort()}});console.log(lab,JSON.stringify(r))};
const ISO={'14':'2026-10-14','21':'2026-10-21','28':'2026-10-28'};for(const k of ['14','21','28','28']){
 await pg.click('#side a[data-p=import]');
 await pg.evaluate(()=>{S.imp=null;render()});await pg.setInputFiles('#imp_files',[f(k)]);await pg.waitForFunction(z=>S.imp&&S.imp.files.length>15&&(S.imp.zds||[]).indexOf(z)>=0,ISO[k],{timeout:120000});await pg.waitForTimeout(500);
 const m=await pg.evaluate(()=>{const c=S.accounts.filter(a=>/عهد|محاسب/.test(a.name))[0];S.imp.cust=c?c.id:'__new';S.imp.src=S.accounts[1].id;S.imp.wacc=S.accounts[1].id;return{hist:S.imp.hist,from:S.imp.from,to:S.imp.to,cust:S.imp.cust}});console.log('stage',k,JSON.stringify(m));
 await pg.click('[data-a=impGo]');await pg.waitForFunction(()=>S.impDone&&S.impDone.indexOf('تم تحميل')===0,null,{timeout:150000});
 console.log(await pg.evaluate(()=>S.impDone.replace(/<[^>]*>/g,'')));await snap('after '+k);
 if(k==='28'&&!global.once){global.once=1;await pg.evaluate(()=>{window.__dues=duesRows({}).filter(r=>r[0]==='مقاول باطن').map(r=>[r[1],Math.round(r[6])])});}
}
console.log(JSON.stringify(await pg.evaluate(()=>duesRows({}).filter(r=>r[0]==='مقاول باطن').map(r=>[r[1],Math.round(r[6])]).sort((a,b)=>b[1]-a[1]).slice(0,40))));
await b.close()})();
