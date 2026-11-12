// تشخيص سريع على حالة محفوظة: node tests/diag.js "<js expr returning value>"
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext()).newPage();
pg.on('pageerror',e=>console.log('PAGEERR',e.message));
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());
await pg.addInitScript(s=>{localStorage.setItem('moqawel_pro_v4',s)},fs.readFileSync(process.env.STATE||'/tmp/claude-0/real_state.json','utf8'));
await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db&&S.txs.length>0,null,{timeout:30000});
const code=process.argv[2].startsWith('@')?fs.readFileSync(process.argv[2].slice(1),'utf8'):process.argv[2];
const r=await pg.evaluate(code);console.log(typeof r==='string'?r:JSON.stringify(r,null,1));await b.close()})();
