const { chromium } = require('playwright');
let ok=0,bad=0;const T=(n,c,x)=>{if(c)ok++;else{bad++;console.log('✗',n,JSON.stringify(x))}};
const dxf=['0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC','0','SECTION','2','BLOCKS','0','BLOCK','2','DOOR','0','LINE','10','0','20','0','11','900','21','0','0','ENDBLK','0','ENDSEC','0','SECTION','2','ENTITIES',
'0','LWPOLYLINE','90','4','70','1','10','0','20','0','10','10000','20','0','10','10000','20','5000','10','0','20','5000',
'0','CIRCLE','10','5000','20','2500','40','500','0','INSERT','2','DOOR','10','2000','20','0','41','1','42','1','50','0','0','TEXT','10','100','20','100','40','200','1','غرفة','0','ENDSEC','0','EOF'].join('\n');
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext({viewport:{width:390,height:800}})).newPage();
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file://'+require('path').resolve(__dirname,'../index.html'));await pg.waitForFunction(()=>window.S&&S.db);
await pg.evaluate(()=>{S.user='a@x.com';S.role='admin';dbSet=async()=>true;window.__f={};S.db={collection:()=>({doc:(id)=>({set:async(o)=>{__f[id]=o},get:async()=>({exists:!!__f[id],data:()=>__f[id]}),delete:async()=>{delete __f[id]}})})};
 S.projects=[{id:'p1',name:'مستشفى',boq:[{id:'b1',code:'1',name:'جدران',qty:1,price:1}]}];S.txs=[];window.__t=[];window.toast=m=>__t.push(m);go('drawings')});
await pg.setInputFiles('#dw_file',{name:'plan.dxf',mimeType:'application/dxf',buffer:Buffer.from(dxf)});
await pg.waitForFunction(()=>S.dw.doc,null,{timeout:10000});
const r=await pg.evaluate(async()=>{var pl=dwActive(),d=S.dw.doc;await new Promise(r=>setTimeout(r,100));
 var cv=document.getElementById('dw_cv'),px=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,dark=0;for(var i=0;i<px.length;i+=4)if(px[i]<120)dark++;
 var segs=d.n,txt=d.texts.length,cal=pl.cal,stored=pl.stored;
 S.dw.mode='dist';S.dw.pts=[[0,-0],[10000,0]];ACT.dwFinish();set=(id,v)=>{document.getElementById(id).value=v};set('dw_lab','جدار');await S.modalSave();
 S.dw.mode='area';S.dw.pts=[[0,0],[10000,0],[10000,-5000],[0,-5000]];ACT.dwFinish();await S.modalSave();
 S.dw.mode='count';S.dw.pts=[[1,1],[2,2],[3,3]];ACT.dwFinish();await S.modalSave();
 var M=pl.meas.map(x=>[x.kind,x.val]);
 S.dw.doc=null;await ACT.dwOpen(pl.id);var reopened=!!S.dw.doc&&S.dw.doc.n===segs;
 ACT.dwClose();var list=document.getElementById('main')?document.getElementById('main').innerText:document.body.innerText;
 return{dark:dark,segs:segs,txt:txt,cal:cal,stored:stored,M:M,reopened:reopened,ov:document.documentElement.scrollWidth>innerWidth+2,list:list.slice(0,200),toasts:__t}});
T('رسم DXF على اللوحة',r.dark>200,r.dark);T('مقاطع (مستطيل+دائرة+باب)',r.segs>=4+12+1,r.segs);T('نص',r.txt===1,r.txt);T('معايرة تلقائية من الوحدات',r.cal&&Math.round(r.cal.ppm)===1000,r.cal);T('حفظ الملف',r.stored===true,r.stored);
T('مسافة 10 م',r.M[0]&&r.M[0][0]==='dist'&&r.M[0][1]===10,r.M);T('مساحة 50 م²',r.M[1]&&r.M[1][1]===50,r.M);T('عدّ 3',r.M[2]&&r.M[2][1]===3,r.M);T('إعادة الفتح من السحابة',r.reopened,r.reopened);T('بدون تمرير أفقي',!r.ov,r.ov);
console.log(JSON.stringify(r.toasts).slice(0,300));console.log('نجح '+ok+' فشل '+bad);await b.close();process.exit(bad?1:0)})();
