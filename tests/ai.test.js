const { chromium } = require('playwright');
let ok=0,bad=0;const T=(n,c,x)=>{if(c)ok++;else{bad++;console.log('✗',n,JSON.stringify(x))}};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});const pg=await(await b.newContext()).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata/index.html');await pg.waitForFunction(()=>window.S&&S.db);
const r=await pg.evaluate(async()=>{var o={};S.user='a@x.com';S.role='admin';
 o.off=aiOn();localStorage.setItem('moq_ai_key','sk-test');o.on=aiOn();
 var calls=[];window.fetch=async function(u,opt){calls.push({u:u,h:opt.headers,b:JSON.parse(opt.body)});var body=JSON.parse(opt.body),txt=JSON.stringify(/مصروفات أسبوعية/.test(JSON.stringify(body.messages))?[{i:0,cat:'ضيافة وبوفيه',person:'عم سيد',role:'worker',why:'بوفيه'}]:{supplier:'شركة النور',invoice_no:'123',date:'2026-11-10',total:1500,category:'كهربائية',lines:[{item:'كابل 3×2.5',unit:'لفة',qty:3,price:500}]});return{ok:true,json:async function(){return{content:[{type:'text',text:'```json\n'+txt+'\n```'}]}}}};
 // تصنيف بنود الاستيراد
 var st={files:[1],lines:[],wages:[],exp:[{no:1,date:'2026-11-10',bayan:'شاي وبسكوت للعمال',band:'',site:'الموقع',out:150,inn:0,flags:[]}],notes:[],from:'',to:'',map:{},cmap:{}};S.imp=st;
 var e0=impClassify(st.exp[0]);o.before=[e0.kind,e0.cat];
 await ACT.impAI();o.ai=st.exp[0].ai;var e1=impClassify(st.exp[0]);o.after=[e1.kind,e1.cat,e1.flags.length];
 o.hdr=[calls[0].u,calls[0].h['x-api-key'],calls[0].h['anthropic-dangerous-direct-browser-access'],calls[0].b.model];
 // فاتورة نصية
 var res=await aiCall(AI_GLOSS,[{type:'text',text:'x'}],100).then(aiJson);o.inv=[res.supplier,res.lines.length,res.total];
 o.sets=SETS.some(function(s){return s[0]==='ai'});o.sect=String(SECT.ai()).indexOf('ai_key')>=0;
 return o});
T('بدون مفتاح لا تفعيل',r.off===false);T('مع مفتاح',r.on===true);
T('قبل التحليل',r.before[1]!=='ضيافة وبوفيه',r.before);T('اقتراح AI محفوظ',r.ai&&r.ai.role==='worker',r.ai);T('بعد: التصنيف مطبَّق',r.after[1]==='ضيافة وبوفيه',r.after);
T('ترويسات API صحيحة',r.hdr[0]==='https://api.anthropic.com/v1/messages'&&r.hdr[1]==='sk-test'&&r.hdr[2]==='true',r.hdr);
T('قراءة JSON داخل ```',r.inv[0]==='شركة النور'&&r.inv[1]===1,r.inv);T('قسم الإعدادات',r.sets&&r.sect);T('لا أخطاء',errs.length===0,errs);
const JZ=require('/tmp/claude-0/xl/node_modules/jszip');
const wr=(a)=>'<w:tr>'+a.map(c=>'<w:tc><w:p><w:r><w:t>'+c+'</w:t></w:r></w:p></w:tc>').join('')+'</w:tr>';
const xml='<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl>'+[['م','الوصف','الوحدة','الكمية','الفئة','الإجمالي'],['1','توريد وتركيب دكت صاج مجلفن طبقا للمواصفات','م2','120','350','42000'],['2','توريد وعمل دهانات بلاستيك','م2','500','60','30000'],['','ملاحظة','','','','']].map(wr).join('')+'</w:tbl></w:body></w:document>';
const z=new JZ();z.file('word/document.xml',xml);const bytes=Array.from(await z.generateAsync({type:'uint8array'}));
await pg.addScriptTag({path:'/tmp/claude-0/xl/node_modules/jszip/dist/jszip.min.js'});
const d=await pg.evaluate(async(by)=>{const rows=await bqDocxRows(new Uint8Array(by).buffer);const P=bqParse(rows);return{n:P.items.length,first:P.items[0]&&[P.items[0].name,P.items[0].qty,P.items[0].price],bad:P.items.filter(i=>i.sev).length}},bytes);
T('Word: بندان من الجدول',d.n===2,d);T('Word: الاسم مختصر والكمية والسعر',d.first&&d.first[1]===120&&d.first[2]===350&&d.first[0].length<45,d);
console.log('نجح',ok,'فشل',bad);await b.close()})();
