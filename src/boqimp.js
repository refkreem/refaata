/* ===== استيراد المقايسة وتنظيفها: Excel / CSV / لصق / PDF =====
   يستخرج بنود العمل المسعّرة فقط (كمية أو فئة أو إجمالي)، ويتجاهل العناوين والملاحظات (مع إظهارها للمراجعة)،
   يختصر منطوق البند مع حفظ النص الكامل، ويتحقق من الكمية × الفئة = الإجمالي، ويحفظ الملف الأصلي. */
var BQ_NOTE=/^(ملاحظ|ملحوظ|يشمل|يجب|على المقاول|علي المقاول|شروط|مواصفات عامة|note|general)/i;
var BQ_TOT=/^(اجمال|الاجمال|الإجمال|إجمال|المجموع|مجموع|total|sub ?total)/i;
function bqNum(v){if(typeof v==='number')return isNaN(v)?NaN:v;var s=String(v==null?'':v).replace(/[٠-٩]/g,function(d){return String.fromCharCode(d.charCodeAt(0)-1632)}).replace(/[,٬\s]/g,'');if(!/^-?\d+(\.\d+)?$/.test(s))return NaN;return parseFloat(s)}
/* اختصار البند: أول عبارة مفيدة (≤ 9 كلمات) دون التوصيف الفني الطويل؛ النص الكامل يبقى محفوظًا */
function bqShort(t){t=String(t||'').replace(/\s+/g,' ').trim();if(!t)return'';
 var seg=t.split(/\s(?:طبقا|طبقاً|وفقا|وفقاً|حسب|مطابق|بمواصفات|بحيث|على أن|علي ان|على ان|ويشمل|يشمل|شاملا|شاملاً|وذلك|كما هو|بالمواصفات)\s|\.(?=\s|$)|[؛;:\(\[]|\s[-–—]\s|،|,/)[0].trim();
 if(seg.length<6)seg=t;var w=seg.split(' ');if(w.length>9)w=w.slice(0,9);var s=w.join(' ');if(s.length>70)s=s.slice(0,70).replace(/\s\S*$/,'');return s||t.slice(0,70)}
function bqHdr(rows){for(var i=0;i<Math.min(rows.length,40);i++){var m=boqColMap(rows[i]);if(m.qty>=0&&(m.name>=0||m.code>=0)){var tot=-1;rows[i].forEach(function(c,ix){if(tot<0&&c&&/اجمال|إجمال|total|amount|القيم|المبلغ/i.test(c)&&[m.code,m.group,m.name,m.unit,m.qty,m.price].indexOf(ix)<0)tot=ix});m.total=tot;return{i:i,m:m}}}return null}
function bqParse(aoa){var cl=function(c){return String(c==null?'':c).replace(/\s+/g,' ').trim()};var rows=aoa.map(function(r){return(r||[]).map(cl)});
 var H=bqHdr(rows),map,start=0;if(H){map=H.m;start=H.i+1;if(map.name<0){var used=[],w=0;Object.keys(map).forEach(function(k){if(map[k]>=0)used.push(map[k])});while(used.indexOf(w)>=0)w++;map.name=w}}else map={code:0,group:1,name:2,unit:3,qty:4,price:5,total:6};
 var items=[],ign=[],cur='',codes={};
 for(var k=start;k<rows.length;k++){var r=rows[k];if(!r.some(function(c){return c}))continue;var g=function(ix){return ix>=0&&r[ix]!=null?r[ix]:''};var nm=g(map.name);
  if(!nm){if(g(map.code)||g(map.qty)||g(map.price))nm='(بلا وصف)';else continue}
  if(BQ_TOT.test(nm)){ign.push({row:k+1,text:nm,why:'صف إجمالي'});continue}
  var q=bqNum(g(map.qty)),pr=bqNum(g(map.price)),tt=map.total>=0?bqNum(g(map.total)):NaN,un=g(map.unit),code=g(map.code);
  var hasQ=!isNaN(q)&&q>0,hasP=!isNaN(pr)&&pr>0,hasT=!isNaN(tt)&&tt>0;
  if(!hasQ&&!hasP&&!hasT){if(BQ_NOTE.test(nm)){ign.push({row:k+1,text:nm,why:'ملاحظة'})}else{if(nm.length<=80&&!(map.group>=0&&g(map.group)))cur=nm;ign.push({row:k+1,text:nm,why:'عنوان / وصف بلا كمية أو سعر'})}continue}
  var fl=[],sev=0;
  if(hasT&&hasQ&&!hasP){pr=r2(tt/q);hasP=true;fl.push('الفئة محسوبة من الإجمالي ÷ الكمية')}
  else if(hasT&&hasP&&!hasQ){q=r2(tt/pr);hasQ=true;fl.push('الكمية محسوبة من الإجمالي ÷ الفئة')}
  if(!hasQ){fl.push('بلا كمية');sev=1}if(!hasP){fl.push('بلا فئة/سعر');sev=1}
  if(hasQ&&hasP&&hasT&&Math.abs(q*pr-tt)>Math.max(1,tt*0.005)){fl.push('الإجمالي المذكور '+fmt(tt)+' ≠ الكمية × الفئة '+fmt(r2(q*pr)));sev=1}
  if(!un)fl.push('بلا وحدة');if(code){if(codes[code])fl.push('رقم بند مكرر مع صف '+codes[code]);else codes[code]=k+1}
  items.push({row:k+1,code:code,group:(map.group>=0&&g(map.group))||cur,full:nm,name:bqShort(nm),unit:un,qty:hasQ?q:0,price:hasP?pr:0,stated:hasT?tt:null,flags:fl,sev:sev})}
 return{items:items,ignored:ign}}
/* PDF: استخراج النص بإحداثياته وإعادة بناء الجدول (صفوف بحسب y، وخلايا بحسب الفجوات، من اليمين لليسار) */
function bqLoadPdfJs(){return new Promise(function(res,rej){if(window.pdfjsLib)return res(window.pdfjsLib);var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=function(){window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';res(window.pdfjsLib)};s.onerror=function(){rej(new Error('تعذر تحميل قارئ PDF'))};document.head.appendChild(s)})}
async function bqPdfRows(buf){var lib=await bqLoadPdfJs();var pdf=await lib.getDocument({data:buf}).promise,all=[],anc=null,dIx=-1;
 for(var p=1;p<=pdf.numPages;p++){var pg=await pdf.getPage(p),tc=await pg.getTextContent(),its=tc.items.filter(function(i){return i.str&&i.str.trim()}).map(function(i){return{s:i.str.trim(),x:i.transform[4],y:i.transform[5],w:i.width||0}});
  its.sort(function(a,b){return b.y-a.y||b.x-a.x});var lines=[];its.forEach(function(i){var L=lines[lines.length-1];if(L&&Math.abs(L.y-i.y)<=3)L.it.push(i);else lines.push({y:i.y,it:[i]})});
  lines.forEach(function(L){L.it.sort(function(a,b){return b.x-a.x});var cells=[],cur=null;L.it.forEach(function(i){if(cur&&(cur.x0-(i.x+i.w))<=9){cur.s+=' '+i.s;cur.x0=i.x}else{cur={s:i.s,x0:i.x,x1:i.x+i.w};cells.push(cur)}});
   cells.forEach(function(c){c.cx=(c.x0+c.x1)/2});var txt=cells.map(function(c){return c.s}).join(' ');
   if(!anc&&/كمي|qty|quantity/i.test(txt)&&/وصف|بيان|description|الاعمال|الأعمال|وحد|unit/i.test(txt)){anc=cells.map(function(c){return c.cx});dIx=-1;cells.forEach(function(c,i){if(dIx<0&&/وصف|بيان|الاعمال|الأعمال|description|item name/i.test(c.s))dIx=i});all.push(cells.map(function(c){return c.s}));return}
   if(!anc){all.push(cells.map(function(c){return c.s}));return}
   var row=anc.map(function(){return''});cells.forEach(function(c){var num=/^[\d.,٬٠-٩\s-]+$/.test(c.s),ix=-1;
    if(!num&&c.s.length>12&&dIx>=0)ix=dIx;else{var best=1e9;anc.forEach(function(a,i){var d=Math.abs(a-c.cx);if(d<best){best=d;ix=i}})}
    row[ix]=row[ix]?row[ix]+' '+c.s:c.s});all.push(row)})}
 return all}
async function bqSaveOrig(pid,file,buf){var u8=new Uint8Array(buf),dg=await crypto.subtle.digest('SHA-256',u8),sha=Array.prototype.map.call(new Uint8Array(dg),function(b){return('0'+b.toString(16)).slice(-2)}).join('');
 var meta={id:uid(),project_id:pid,name:file.name,size:file.size,sha:sha,at:new Date().toISOString(),by:S.user,stored:false};
 if(file.size<=700*1024){var b='',ch=0x8000;for(var i=0;i<u8.length;i+=ch)b+=String.fromCharCode.apply(null,u8.subarray(i,i+ch));try{await S.db.collection(COL.files).doc(meta.id).set(clean(Object.assign({data:btoa(b),type:file.type||''},meta)));meta.stored=true}catch(e){console.error(e)}}
 return meta}
ACT.boqOrig=async function(id){try{var d=await S.db.collection(COL.files).doc(id).get(),v=d.data();if(!v||!v.data){toast('الملف الأصلي غير محفوظ (كبير الحجم)');return}var a=document.createElement('a');a.href='data:'+(v.type||'application/octet-stream')+';base64,'+v.data;a.download=v.name;a.click()}catch(e){toast('تعذر فتح الملف')}};
S.bq={items:[],ign:[],sel:{},file:null,buf:null};
function bqShow(r){S.bq.items=r.items;S.bq.ign=r.ignored;S.bq.sel={};r.items.forEach(function(it,i){S.bq.sel[i]=!it.sev});bqDraw()}
function bqDraw(){var B=S.bq,it=B.items,sel=it.filter(function(x,i){return B.sel[i]}),tot=sum(sel,function(x){return x.qty*x.price}),rev=it.filter(function(x){return x.flags.length}).length;
 $('bi_prev').innerHTML=it.length?'<b>'+it.length+'</b> بند مسعّر — المحدد للاستيراد <b>'+sel.length+'</b> بإجمالي <b>'+fmt(tot)+'</b> · <span class="tag warn">'+rev+' تحتاج مراجعة</span> · '+B.ign.length+' صف متجاهل (عناوين / ملاحظات / إجماليات) <button class="btn sm" type="button" data-a="bqIgn">عرض المتجاهل</button>':'لم يُعثر على بنود مسعّرة — تأكد من وجود أعمدة الوصف والكمية والفئة.';
 var o='';if(it.length){o='<table class="bsheet"><thead><tr><th></th><th>م</th><th>البند</th><th>الوحدة</th><th>الكمية</th><th>الفئة</th><th>الإجمالي</th><th>مراجعة</th></tr></thead><tbody>';var lg='';it.slice(0,500).forEach(function(x,i){if(x.group!==lg){lg=x.group;if(lg)o+='<tr class="grp"><td colspan="8">'+h(lg)+'</td></tr>'}
  o+='<tr'+(x.sev?' style="background:#fde9e1"':x.flags.length?' style="background:#eaf4fb"':'')+'><td><input type="checkbox" data-bqs="'+i+'"'+(B.sel[i]?' checked':'')+'></td><td class="n">'+h(x.code)+'</td><td class="nm" title="'+h(x.full)+'">'+h(x.name)+'</td><td>'+h(x.unit)+'</td><td class="n">'+(x.qty?fq(x.qty):'—')+'</td><td class="n">'+(x.price?fmt(x.price):'—')+'</td><td class="n">'+fmt(x.qty*x.price)+'</td><td style="font-size:11px">'+h(x.flags.join(' · '))+'</td></tr>'});
  o+='<tr class="gt"><td colspan="6">إجمالي المحدد</td><td class="n">'+fmt(tot)+'</td><td></td></tr></tbody></table>'+(it.length>500?'<div class="hint">يُعرض أول 500 بند، وسيُستورد كل المحدد.</div>':'')}
 $('bi_tbl').innerHTML=o}
ACT.bqIgn=function(){var B=S.bq;modal('الصفوف المتجاهلة ('+B.ign.length+')','<div class="hint">لم تُستورد لأنها بلا كمية ولا سعر ولا إجمالي (عناوين أو ملاحظات أو إجماليات). إن كان بينها بند مسعّر فصحّح الملف أو أضفه يدويًا.</div>'+tbl([{h:'صف',n:1},{h:'النص'},{h:'السبب'}],B.ign.map(function(x){return[x.row,h(x.text),x.why]}),{empty:'لا يوجد'}),{wide:true,saveLabel:'إغلاق',save:function(){}})};
document.addEventListener('change',function(e){var t=e.target;if(t&&t.getAttribute&&t.getAttribute('data-bqs')!=null){S.bq.sel[t.getAttribute('data-bqs')]=t.checked;bqDraw()}});
ACT.boqImport=function(){modal('استيراد المقايسة','<div class="hint">Excel أو CSV أو PDF أو لصق من Excel. يُستورد فقط ما له كمية وسعر؛ تُتجاهل العناوين والملاحظات، ويُختصر منطوق البند (النص الكامل يبقى محفوظًا)، ويُفحص الإجمالي = الكمية × الفئة، ويُحفظ الملف الأصلي. <button class="btn sm" type="button" data-a="boqTpl">⬇ قالب Excel</button></div><div class="fg" style="margin-top:8px">'+fld('ملف Excel / CSV / PDF','<input type="file" id="bi_file" accept=".xlsx,.xls,.csv,.pdf">','full')+'<div id="bi_sheetbox" style="display:none" class="full"></div>'+fld('أو الصق هنا','<textarea id="bi_txt" rows="4" placeholder="الصق الجدول من Excel هنا"></textarea>','full')+'</div><div id="bi_prev" class="hint">—</div><div id="bi_tbl" class="bprev"></div>',
 {wide:true,saveLabel:'استيراد المحدد',save:async function(){var B=S.bq,rows=B.items.filter(function(x,i){return B.sel[i]});if(!rows.length){toast('لا توجد بنود محددة');return false}var p=proj(S.vp);
  var addV=sum(rows,function(r){return r.qty*r.price}),newBv=projBoqValue(p)+addV,cv0=num(p.value);
  if(cv0&&Math.abs(newBv-cv0)>Math.max(1,cv0*0.001)&&!confirm('⛔ تنبيه مالي\nإجمالي المقايسة بعد الاستيراد = '+fmt(newBv)+'\nقيمة العقد المسجّلة = '+fmt(cv0)+'\nالفرق = '+fmt(Math.abs(newBv-cv0))+'\n\nلن يُعتبر الفرق معتمدًا إلا بعد ضغط «اعتماد الفرق» وكتابة السبب. هل تريد المتابعة؟'))return false;
  var src=null;if(B.file&&B.buf)try{src=await bqSaveOrig(p.id,B.file,B.buf)}catch(e){console.error(e)}
  rows.forEach(function(r){var t=boqTrade(r.full+' '+(r.group||''));p.boq.push({id:uid(),code:r.code,group:t||r.group||'غير مصنف',group0:r.group||'',name:r.name,desc_full:r.full===r.name?'':r.full,unit:r.unit,qty:r.qty,price:r.price,cost_price:0,imp_flags:r.flags.length?r.flags:null,imp_row:r.row,src_id:src?src.id:null})});
  if(src){p.boq_src=(p.boq_src||[]).concat([{id:src.id,name:src.name,size:src.size,sha:src.sha,at:src.at,by:src.by,stored:src.stored,items:rows.length,ignored:B.ign.length}])}
  if(!await dbSet('projects',p))return false;S.bq.items=[];render();var gp=boqGap(p);toast('تم استيراد '+rows.length+' بند'+(src&&!src.stored?' — الملف الأصلي كبير فلم يُحفظ داخل النظام، احتفظ بنسخته':'')+(gp?' — ⚠ إجمالي المقايسة '+fmt(gp.bv)+' يختلف عن قيمة العقد '+fmt(gp.cv):''))},
 init:function(){S.bq={items:[],ign:[],sel:{},file:null,buf:null};var wb=null;
  function loadSheet(n){bqShow(bqParse(XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:false,defval:''})))}
  $('bi_txt').oninput=function(){S.bq.file=null;S.bq.buf=null;bqShow(bqParse(this.value.split(/\r?\n/).map(function(l){return l.split('\t')})))};
  $('bi_file').onchange=function(){var f=this.files[0];if(!f)return;var rd=new FileReader();rd.onload=async function(e){S.bq.file=f;S.bq.buf=e.target.result;
   if(/\.pdf$/i.test(f.name)){$('bi_prev').textContent='جارٍ قراءة PDF…';try{bqShow(bqParse(await bqPdfRows(e.target.result.slice(0))))}catch(x){$('bi_prev').textContent='تعذر قراءة PDF: '+x.message+' — جرّب ملف Excel أو الصق الجدول'}return}
   if(!window.XLSX){toast('مكتبة Excel غير محملة — استخدم اللصق');return}
   wb=XLSX.read(e.target.result,{type:'array'});var sb=$('bi_sheetbox');if(wb.SheetNames.length>1){sb.style.display='';sb.innerHTML='<label class="f"><span>الورقة (Sheet)</span><select id="bi_sheet">'+wb.SheetNames.map(function(n){return'<option>'+h(n)+'</option>'}).join('')+'</select></label>';$('bi_sheet').onchange=function(){loadSheet(this.value)}}else sb.style.display='none';loadSheet(wb.SheetNames[0])};rd.readAsArrayBuffer(f)}}})};
