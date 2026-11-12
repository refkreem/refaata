const { chromium } = require('playwright');const XL='/tmp/claude-0/xl/node_modules/';const X=require(XL+'xlsx');
let ok=0,bad=0;const T=(n,c,x)=>{if(c)ok++;else{bad++;console.log('✗',n,JSON.stringify(x))}};
const A=[['م','الوصف','الوحدة','الكمية','الفئة','الإجمالي'],
['','أعمال التكييف والتهوية','','','',''],
[1,'توريد وتركيب دكت صاج مجلفن سمك 0.8 مم طبقا للمواصفات الفنية المرفقة وبحسب تعليمات الاستشاري شاملا العزل والتعليق','م2',120,850,102000],
[2,'توريد وعمل دهانات بلاستيك للحوائط والأسقف وجميع الأعمال المساعدة','م2',500,60,31000],
['','ملاحظة: جميع البنود تشمل الاختبارات والتشغيل التجريبي','','','',''],
[3,'توريد وتركيب رخام جلالة للأرضيات','م2',50,1000,50000],
[4,'بند بلا سعر','عدد',10,'','' ],
[5,'بند بلا وحدة','',5,100,500],
['','تفاصيل فنية فقط بلا كمية','','','',''],
['','الإجمالي','','','',183500]];
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext({viewport:{width:1200,height:900}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
await pg.addScriptTag({path:XL+'pdfjs-dist/build/pdf.min.js'});await pg.evaluate(()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='file:///tmp/claude-0/xl/node_modules/pdfjs-dist/build/pdf.worker.min.js'});
const r=await pg.evaluate(a=>{var R=bqParse(a);return{n:R.items.length,ig:R.ignored.map(x=>x.why),names:R.items.map(x=>x.name),flags:R.items.map(x=>x.flags.join('|')),sev:R.items.map(x=>x.sev),full:R.items[0].full.length}},A);
T('يُستخرج 5 بنود مسعّرة ويُتجاهل غير المسعّر',r.n===5,r);
T('تجاهل العناوين والملاحظات والإجمالي (4 صفوف)',r.ig.length===4&&r.ig.indexOf('صف إجمالي')>=0&&r.ig.indexOf('ملاحظة')>=0,r.ig);
T('اختصار البند 1 لعبارة قصيرة مع بقاء النص الكامل',r.names[0]==='توريد وتركيب دكت صاج مجلفن سمك 0.8 مم'&&r.full>80,r.names[0]);
T('اختصار توريد وعمل دهانات',/^توريد وعمل دهانات/.test(r.names[1])&&r.names[1].length<=70,r.names[1]);
T('رخام',/رخام/.test(r.names[2]),r.names[2]);
T('فحص الكمية×الفئة: البند 1 (120×850=102000) سليم، البند 2 (500×60=30000≠31000) مُعلَّم',r.flags[0]===''&&/≠/.test(r.flags[1])&&r.sev[1]===1,r.flags);
T('بند بلا سعر مُعلَّم ولا يُحذف، وبلا وحدة تنبيه فقط',/بلا فئة/.test(r.flags[3])&&r.sev[3]===1&&/بلا وحدة/.test(r.flags[4])&&r.sev[4]===0,r.flags);
// واجهة: لصق ثم استيراد
await pg.evaluate(()=>{S.user='a@x.com';S.role='admin';S.cfg.roles={'a@x.com':'admin'};S.projects=[{id:'p1',name:'م1',value:0,boq:[]}];S.vp='p1';S.view='projects';render();ACT.boqImport()});
await pg.fill('#bi_txt',A.map(r=>r.join('\t')).join('\n'));await pg.waitForSelector('#bi_tbl table');
const ui=await pg.evaluate(()=>({prev:$('bi_prev').textContent,sel:Object.values(S.bq.sel).filter(Boolean).length}));
T('المعاينة: 5 بنود، المحدد 3 (غير المشكوك فيها)',/5 بند مسعّر/.test(ui.prev)&&ui.sel===3&&/صف متجاهل/.test(ui.prev),ui);
await pg.evaluate(()=>{S.bq.sel[1]=true;bqDraw()});await pg.evaluate(()=>{S.bq.file={name:'boq.xlsx',size:10,type:''};S.bq.buf=new Uint8Array([1,2,3]).buffer});
await pg.click('.mfoot .btn.p, .modal .btn.p').catch(async()=>{await pg.evaluate(()=>document.querySelector('[data-a=modalSave]')&&document.querySelector('[data-a=modalSave]').click())});
await pg.waitForTimeout(800);
const im=await pg.evaluate(()=>{var p=S.projects[0];return{n:p.boq.length,full:p.boq[0].desc_full.length>50,nm:p.boq[0].name,src:(p.boq_src||[]).length,sha:(p.boq_src||[{}])[0].sha&&p.boq_src[0].sha.length,grp:p.boq.map(x=>x.group)}});
T('استُورد 4 بنود (3 + 1 حدّده المستخدم) وحُفظ النص الكامل',im.n===4&&im.full,im);
T('سجل الملف الأصلي (اسم + بصمة SHA-256)',im.src===1&&im.sha===64,im);
// PDF
const pdf=require('fs').readFileSync('/tmp/claude-0/pdft/boq.pdf').toString('base64');
const pr=await pg.evaluate(async b=>{var u=Uint8Array.from(atob(b),c=>c.charCodeAt(0));var rows=await bqPdfRows(u.buffer);var R=bqParse(rows);return{rows:rows.length,n:R.items.length,q:R.items.map(x=>x.qty+'x'+x.price),ig:R.ignored.length}},pdf).catch(e=>({err:e.message}));
T('PDF: يستخرج 3 بنود بكميتها وفئتها ويتجاهل العنوان والملاحظة والإجمالي',pr.n===3&&pr.q.join()==='120x850,300x95,50x1000'&&pr.ig>=2,pr);
T('لا أخطاء بالصفحة',errs.length===0,errs);
console.log('نجح',ok,'فشل',bad);await b.close()})();
