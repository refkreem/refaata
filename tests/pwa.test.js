const { chromium } = require('playwright');
let ok=0,bad=0;const T=(n,c,x)=>{if(c)ok++;else{bad++;console.log('✗',n,JSON.stringify(x))}};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const ctx=await b.newContext();const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('http://localhost:8765/index.html');await pg.waitForFunction(()=>window.S&&S.db);
const r=await pg.evaluate(async()=>{var reg=await navigator.serviceWorker.ready;var m=await (await fetch('manifest.webmanifest')).json();var ic=await Promise.all(m.icons.map(i=>fetch(i.src).then(x=>x.ok)));
 return{sw:!!reg.active,icons:ic,disp:m.display,ids:typeof ACT.install,btn:!!document.querySelector('[data-a=install]')}});
T('service worker يعمل',r.sw);T('كل الأيقونات تُحمَّل',r.icons.every(Boolean),r.icons);T('standalone',r.disp==='standalone');T('زر التثبيت',r.btn&&r.ids==='function');
await ctx.setOffline(true);await pg.reload();await pg.waitForSelector('body');const t=await pg.evaluate(()=>document.body.innerText.length);T('تفتح الواجهة بدون إنترنت',t>20,t);
T('لا أخطاء',errs.length===0,errs);console.log('نجح',ok,'فشل',bad);await b.close()})();
