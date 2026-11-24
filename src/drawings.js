/* ===== المخططات والقياس: رفع DXF / PDF / صورة، معايرة المقياس، قياس مسافة ومساحة وعدّ، حفظ القياسات لكل مشروع ===== */
S.dw={pid:'',plan:'',mode:'pan',pts:[],doc:null,view:null,busy:false,msg:''};
var DW_UNITS={1:0.0254,2:0.3048,4:0.001,5:0.01,6:1,7:1000,8:0.0000254,9:0.0254e-3,10:0.9144,14:0.1,15:10,16:100};
function dwTxt(s){return String(s||'').replace(/\\P/g,' ').replace(/\{\\[^;]*;/g,'').replace(/[{}]/g,'').replace(/\\[A-Za-z][^;\\]*;?/g,'').trim()}
function dwParseDxf(txt){var L=txt.split(/\r?\n/),P=[];for(var i=0;i+1<L.length;i+=2)P.push([parseInt(L[i],10),L[i+1].trim()]);
 var ents=[],blocks={},sec='',cb=null,unit=null,cur=null;
 for(var k=0;k<P.length;k++){var c=P[k][0],v=P[k][1];
  if(c===9&&v==='$INSUNITS'&&P[k+1]&&P[k+1][0]===70){unit=DW_UNITS[parseInt(P[k+1][1],10)]||null}
  if(c===0){if(v==='SECTION'&&P[k+1]&&P[k+1][0]===2){sec=P[k+1][1];cur=null;continue}if(v==='ENDSEC'){sec='';cur=null;continue}
   if(sec==='BLOCKS'&&v==='BLOCK'){cb={name:'',e:[]};cur={t:'BLOCK',g:[]};cur.blk=cb;continue}if(sec==='BLOCKS'&&v==='ENDBLK'){cb=null;cur=null;continue}
   if(sec==='ENTITIES'||(sec==='BLOCKS'&&cb)){cur={t:v,g:[]};(sec==='ENTITIES'?ents:cb.e).push(cur)}else cur=null;continue}
  if(cur){if(cur.t==='BLOCK'){if(c===2){cur.blk.name=v;blocks[v]=cur.blk}}else cur.g.push([c,v])}}
 var segs=[],texts=[];
 function T(m,x,y){return[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]}
 function G(e,c,d){for(var i=0;i<e.g.length;i++)if(e.g[i][0]===c)return e.g[i][1];return d}
 function N(e,c,d){var v=G(e,c);return v==null?d:parseFloat(v)}
 function poly(pts,closed,m){for(var i=0;i+1<pts.length;i++){var a=T(m,pts[i][0],pts[i][1]),b=T(m,pts[i+1][0],pts[i+1][1]);segs.push([a[0],a[1],b[0],b[1]])}if(closed&&pts.length>2){var a2=T(m,pts[pts.length-1][0],pts[pts.length-1][1]),b2=T(m,pts[0][0],pts[0][1]);segs.push([a2[0],a2[1],b2[0],b2[1]])}}
 function arc(cx,cy,r,a0,a1,m){var n=Math.max(12,Math.min(72,Math.ceil(Math.abs(a1-a0)/5))),pts=[];for(var i=0;i<=n;i++){var a=(a0+(a1-a0)*i/n)*Math.PI/180;pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}poly(pts,false,m)}
 function emit(list,m,depth){var pv=null;for(var i=0;i<list.length;i++){var e=list[i],t=e.t;
  if(t==='LINE'){poly([[N(e,10,0),N(e,20,0)],[N(e,11,0),N(e,21,0)]],false,m)}
  else if(t==='LWPOLYLINE'){var pts=[],x=null;e.g.forEach(function(p){if(p[0]===10)x=parseFloat(p[1]);else if(p[0]===20&&x!=null){pts.push([x,parseFloat(p[1])]);x=null}});poly(pts,(parseInt(G(e,70,0),10)&1)===1,m)}
  else if(t==='POLYLINE'){pv={pts:[],closed:(parseInt(G(e,70,0),10)&1)===1}}
  else if(t==='VERTEX'&&pv){pv.pts.push([N(e,10,0),N(e,20,0)])}
  else if(t==='SEQEND'&&pv){poly(pv.pts,pv.closed,m);pv=null}
  else if(t==='CIRCLE'){arc(N(e,10,0),N(e,20,0),N(e,40,0),0,360,m)}
  else if(t==='ARC'){var a0=N(e,50,0),a1=N(e,51,360);if(a1<=a0)a1+=360;arc(N(e,10,0),N(e,20,0),N(e,40,0),a0,a1,m)}
  else if(t==='TEXT'||t==='MTEXT'){var p=T(m,N(e,10,0),N(e,20,0)),s=dwTxt(G(e,1,''));if(s)texts.push({x:p[0],y:p[1],h:Math.abs(N(e,40,1)*Math.sqrt(m[0]*m[0]+m[1]*m[1])),t:s})}
  else if((t==='INSERT'||t==='DIMENSION')&&depth<4){var bn=G(e,2,''),b=blocks[bn];if(!b)continue;var sx=t==='INSERT'?N(e,41,1):1,sy=t==='INSERT'?N(e,42,1):1,rot=(t==='INSERT'?N(e,50,0):0)*Math.PI/180,ix=t==='INSERT'?N(e,10,0):0,iy=t==='INSERT'?N(e,20,0):0,co=Math.cos(rot),si=Math.sin(rot);
   var lm=[sx*co,sx*si,-sy*si,sy*co,ix,iy],nm=[m[0]*lm[0]+m[2]*lm[1],m[1]*lm[0]+m[3]*lm[1],m[0]*lm[2]+m[2]*lm[3],m[1]*lm[2]+m[3]*lm[3],m[0]*lm[4]+m[2]*lm[5]+m[4],m[1]*lm[4]+m[3]*lm[5]+m[5]];emit(b.e,nm,depth+1)}}}
 emit(ents,[1,0,0,1,0,0],0);
 var x0=1e18,y0=1e18,x1=-1e18,y1=-1e18;segs.forEach(function(s){for(var j=0;j<4;j+=2){if(s[j]<x0)x0=s[j];if(s[j]>x1)x1=s[j];if(s[j+1]<y0)y0=s[j+1];if(s[j+1]>y1)y1=s[j+1]}});
 if(!segs.length)return null;
 // قلب المحور الرأسي ليتوافق مع الشاشة
 segs=segs.map(function(s){return[s[0],-s[1],s[2],-s[3]]});texts.forEach(function(t){t.y=-t.y});
 return{type:'dxf',segs:segs,texts:texts,b:[x0,-y1,x1,-y0],unit:unit,n:segs.length}}
/* ===== تحميل الملفات ===== */
async function dwGz(u8){if(typeof CompressionStream==='undefined')return null;var cs=new CompressionStream('gzip'),w=cs.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(cs.readable).arrayBuffer())}
async function dwUngz(u8){var ds=new DecompressionStream('gzip'),w=ds.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer())}
function dwB64(u8){var b='',ch=0x8000;for(var i=0;i<u8.length;i+=ch)b+=String.fromCharCode.apply(null,u8.subarray(i,i+ch));return btoa(b)}
function dwFromB64(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function dwPdfJs(){return new Promise(function(res,rej){if(window.pdfjsLib)return res(window.pdfjsLib);var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=function(){window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';res(window.pdfjsLib)};s.onerror=function(){rej(new Error('تعذر تحميل قارئ PDF (تحقق من الاتصال)'))};document.head.appendChild(s)})}
async function dwBuild(plan,u8){var t=plan.type;
 if(t==='dxf'){var d=dwParseDxf(new TextDecoder('utf-8').decode(u8));if(!d)throw new Error('لم أجد رسومًا في ملف DXF (قد يكون بصيغة ثنائية أو يحوي عناصر غير مدعومة)');return d}
 if(t==='pdf'){var lib=await dwPdfJs(),pdf=await lib.getDocument({data:u8.slice()}).promise,pg=await pdf.getPage(plan.page||1),vp=pg.getViewport({scale:2}),cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;return{type:'img',img:cv,b:[0,0,cv.width,cv.height],pages:pdf.numPages}}
 return await new Promise(function(res,rej){var im=new Image();im.onload=function(){res({type:'img',img:im,b:[0,0,im.naturalWidth,im.naturalHeight]})};im.onerror=function(){rej(new Error('تعذر قراءة الصورة'))};im.src=URL.createObjectURL(new Blob([u8]))})}
function dwPlans(p){return(p&&p.plans)||[]}
function dwActive(){var p=proj(S.dw.pid);return p?dwPlans(p).filter(function(x){return x.id===S.dw.plan})[0]:null}
ACT.dwUpload=async function(){var f=($('dw_file').files||[])[0];if(!f)return;var p=proj(S.dw.pid);if(!p){toast('اختر المشروع');return}var ext=(f.name.split('.').pop()||'').toLowerCase();
 if(ext==='dwg'){toast('ملفات DWG مغلقة الصيغة ولا يمكن قراءتها هنا — حوّلها إلى DXF أو PDF من AutoCAD (حفظ باسم) أو من محوّل مجاني ثم ارفعها');$('dw_file').value='';return}
 var type=ext==='dxf'?'dxf':ext==='pdf'?'pdf':/^(png|jpe?g|webp|gif|bmp)$/.test(ext)?'img':'';if(!type){toast('الصيغ المدعومة: DXF · PDF · صور');return}
 S.dw.busy=true;S.dw.msg='جارٍ قراءة الملف…';render();
 try{var u8=new Uint8Array(await f.arrayBuffer()),plan={id:uid(),name:f.name,type:type,size:f.size,at:new Date().toISOString(),by:S.user,page:1,cal:null,meas:[],stored:false};
  var doc=await dwBuild(plan,u8);if(doc.unit)plan.cal={ppm:1/doc.unit,auto:true};
  var data=u8,gz=false;if(type==='dxf'){var z=await dwGz(u8);if(z&&z.length<u8.length){data=z;gz=true}}
  if(data.length<=700*1024){try{await S.db.collection(COL.files).doc(plan.id).set(clean({id:plan.id,project_id:p.id,name:f.name,data:dwB64(data),gz:gz,type:f.type||'',at:plan.at,by:S.user,kind:'plan'}));plan.stored=true;plan.gz=gz}catch(e){console.error(e)}}
  p.plans=dwPlans(p).concat([plan]);if(!await dbSet('projects',p)){S.dw.busy=false;return}
  S.dw.plan=plan.id;S.dw.doc=doc;S.dw.view=null;S.dw.pts=[];S.dw.mode='pan';S.dw.busy=false;S.dw.msg='';toast(plan.stored?'✔ رُفع المخطط وحُفظ':'رُفع المخطط — الملف كبير فلم يُحفظ بالسحابة؛ ستعيد فتحه من جهازك عند الحاجة');render()}
 catch(e){S.dw.busy=false;S.dw.msg='';toast('⚠ '+(e.message||e));render()}};
ACT.dwOpen=async function(id){var p=proj(S.dw.pid),pl=dwPlans(p).filter(function(x){return x.id===id})[0];if(!pl)return;S.dw.plan=id;S.dw.pts=[];S.dw.mode='pan';S.dw.view=null;S.dw.doc=null;
 if(pl.type==='board'){S.dw.doc={type:'board',b:[0,0,1200,800]};render();return}
 if(!pl.stored){S.dw.msg='هذا المخطط لم يُحفظ بالسحابة لكبر حجمه — اختر ملفه الأصلي لعرضه مع قياساته المحفوظة.';render();return}
 S.dw.busy=true;S.dw.msg='جارٍ التحميل…';render();
 try{var d=await S.db.collection(COL.files).doc(id).get();if(!d.exists)throw new Error('الملف غير موجود');var v=d.data(),u8=dwFromB64(v.data);if(v.gz)u8=await dwUngz(u8);S.dw.doc=await dwBuild(pl,u8)}catch(e){toast('⚠ '+(e.message||e))}S.dw.busy=false;S.dw.msg='';render()};
ACT.dwReattach=async function(){var f=($('dw_re').files||[])[0];if(!f)return;var pl=dwActive();if(!pl)return;try{S.dw.doc=await dwBuild(pl,new Uint8Array(await f.arrayBuffer()));S.dw.msg='';S.dw.view=null;render()}catch(e){toast('⚠ '+(e.message||e))}};
ACT.dwDelPlan=async function(id){var p=proj(S.dw.pid);if(!p||!confirm('حذف المخطط وكل قياساته؟'))return;var pl=dwPlans(p).filter(function(x){return x.id===id})[0];p.plans=dwPlans(p).filter(function(x){return x.id!==id});if(await dbSet('projects',p)){if(pl&&pl.stored)try{await S.db.collection(COL.files).doc(id).delete()}catch(e){}if(S.dw.plan===id){S.dw.plan='';S.dw.doc=null}render()}};
ACT.dwNewBoard=function(){var p=proj(S.dw.pid);if(!p){toast('اختر المشروع');return}modal('لوحة رسم جديدة','<div class="fg">'+fld('اسم اللوحة',inp('dw_bn','مخطط الموقع'),'full')+'</div><div class="hint">لوحة بيضاء ترسم عليها مناطق الموقع ومراحله وتربطها ببنود الأعمال؛ تتلوّن المناطق بحسب تقدّم مرحلتها.</div>',{save:async function(){var n=v$('dw_bn').trim()||'لوحة الموقع',pl={id:uid(),name:n,type:'board',at:new Date().toISOString(),by:S.user,cal:null,meas:[],shapes:[],stored:true};p.plans=dwPlans(p).concat([pl]);if(await dbSet('projects',p)){S.dw.plan=pl.id;S.dw.doc={type:'board',b:[0,0,1200,800]};S.dw.view=null;S.dw.pts=[];S.dw.mode='pan';render();return true}return false}})};
ACT.dwClose=function(){S.dw.plan='';S.dw.doc=null;S.dw.pts=[];render()};
/* ===== العرض والرسم ===== */
function dwFit(cv){var d=S.dw.doc,b=d.b,w=(b[2]-b[0])||1,h2=(b[3]-b[1])||1,s=Math.min(cv.width/w,cv.height/h2)*0.95;S.dw.view={s:s,ox:(cv.width-w*s)/2-b[0]*s,oy:(cv.height-h2*s)/2-b[1]*s}}
function dwW2S(x,y){var v=S.dw.view;return[x*v.s+v.ox,y*v.s+v.oy]}
function dwS2W(x,y){var v=S.dw.view;return[(x-v.ox)/v.s,(y-v.oy)/v.s]}
function dwDraw(){var cv=$('dw_cv');if(!cv||!S.dw.doc)return;var wrap=cv.parentNode,W=Math.max(280,wrap.clientWidth),H=Math.round(Math.min(560,Math.max(300,window.innerHeight*0.55)));if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;if(!S.dw.view)dwFit(cv)}if(!S.dw.view)dwFit(cv);
 var c=cv.getContext('2d'),d=S.dw.doc,v=S.dw.view;c.fillStyle='#fff';c.fillRect(0,0,W,H);
 if(d.type==='board'){c.strokeStyle='#e3e8ef';c.lineWidth=1;c.beginPath();for(var gx=0;gx<=1200;gx+=50){var a1=dwW2S(gx,0),a2=dwW2S(gx,800);c.moveTo(a1[0],a1[1]);c.lineTo(a2[0],a2[1])}for(var gy=0;gy<=800;gy+=50){var b1=dwW2S(0,gy),b2=dwW2S(1200,gy);c.moveTo(b1[0],b1[1]);c.lineTo(b2[0],b2[1])}c.stroke();c.strokeStyle='#9aa7b8';var o1=dwW2S(0,0),o2=dwW2S(1200,800);c.strokeRect(o1[0],o1[1],o2[0]-o1[0],o2[1]-o1[1])}
 else if(d.type==='img'){c.drawImage(d.img,v.ox,v.oy,d.img.width*v.s,d.img.height*v.s)}
 else{c.strokeStyle='#1a2b44';c.lineWidth=1;c.beginPath();var N=d.segs.length;for(var i=0;i<N;i++){var s=d.segs[i],x1=s[0]*v.s+v.ox,y1=s[1]*v.s+v.oy,x2=s[2]*v.s+v.ox,y2=s[3]*v.s+v.oy;if((x1<0&&x2<0)||(y1<0&&y2<0)||(x1>W&&x2>W)||(y1>H&&y2>H))continue;c.moveTo(x1,y1);c.lineTo(x2,y2)}c.stroke();
  c.fillStyle='#555';d.texts.forEach(function(t){var px=t.h*v.s;if(px<6||px>80)return;var p=dwW2S(t.x,t.y);if(p[0]<-50||p[0]>W+50||p[1]<-20||p[1]>H+20)return;c.font=px+'px sans-serif';c.fillText(t.t,p[0],p[1])})}
 var pl=dwActive();if(pl)(pl.shapes||[]).forEach(function(sh){dwDrawShape(c,sh)});(pl?pl.meas:[]).forEach(function(m){dwShape(c,m.pts,m.kind,'#c0392b',m.label,m.val,m.kind)});if(S.dw.pts.length)dwShape(c,S.dw.pts,S.dw.mode==='area'?'area-draft':S.dw.mode==='cal'?'dist':S.dw.mode==='count'?'count':'dist','#2874a6','',null,S.dw.mode)}
function dwShape(c,pts,kind,col,label,val){if(!pts.length)return;var q=pts.map(function(p){return dwW2S(p[0],p[1])});c.strokeStyle=col;c.fillStyle=col;c.lineWidth=2;
 if(kind==='count'){q.forEach(function(p,i){c.beginPath();c.arc(p[0],p[1],6,0,6.3);c.fill();c.fillStyle='#fff';c.font='9px sans-serif';c.fillText(String(i+1),p[0]-3,p[1]+3);c.fillStyle=col});return}
 c.beginPath();c.moveTo(q[0][0],q[0][1]);for(var i=1;i<q.length;i++)c.lineTo(q[i][0],q[i][1]);if(kind==='area'){c.closePath();c.globalAlpha=0.18;c.fill();c.globalAlpha=1}c.stroke();q.forEach(function(p){c.beginPath();c.arc(p[0],p[1],3,0,6.3);c.fill()});
 if(label||val!=null){var m=q[Math.floor(q.length/2)];c.font='bold 12px sans-serif';c.fillStyle='#fff';var tx=(label?label+' ':'')+(val!=null?dwFmtVal(val,kind):'');var w=c.measureText(tx).width;c.fillRect(m[0]-2,m[1]-14,w+4,16);c.fillStyle=col;c.fillText(tx,m[0],m[1]-2)}}
var DW_COL={g:'#1e8449',w:'#d68910',b:'#c0392b',n:'#2874a6'};
function dwShapeInfo(sh){var p=proj(S.dw.pid),ph=sh.phase_id&&p?plPhases(p).filter(function(x){return x.id===sh.phase_id})[0]:null,st=ph?plStat(p,ph):null;return{ph:ph,st:st,col:st?DW_COL[st.st]:(sh.col||'#2874a6')}}
function dwDrawShape(c,sh){var I=dwShapeInfo(sh),q=sh.pts.map(function(p){return dwW2S(p[0],p[1])});if(!q.length)return;var lab=(sh.label||'')+(I.st&&I.st.a!=null?' · '+plPct(I.st.a):'');c.strokeStyle=I.col;c.fillStyle=I.col;c.lineWidth=2;
 if(sh.k==='text'){c.font='bold '+Math.max(11,14*Math.min(2,S.dw.view.s))+'px sans-serif';c.fillStyle=I.col;c.fillText(lab,q[0][0],q[0][1]);return}
 c.beginPath();c.moveTo(q[0][0],q[0][1]);for(var i=1;i<q.length;i++)c.lineTo(q[i][0],q[i][1]);if(sh.k==='zone'){c.closePath();c.globalAlpha=0.25;c.fill();c.globalAlpha=1}c.stroke();
 if(lab){var cx=0,cy=0;q.forEach(function(p){cx+=p[0];cy+=p[1]});cx/=q.length;cy/=q.length;c.font='bold 12px sans-serif';var w=c.measureText(lab).width;c.fillStyle='rgba(255,255,255,.85)';c.fillRect(cx-w/2-3,cy-9,w+6,18);c.fillStyle=I.col;c.fillText(lab,cx-w/2,cy+4)}}
function dwFmtVal(v,k){return k==='area'?fmt(r2(v))+' م²':k==='count'?String(v)+' عدد':fmt(r2(v))+' م'}
function dwLen(pts){var s=0;for(var i=0;i+1<pts.length;i++)s+=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);return s}
function dwArea(pts){var a=0;for(var i=0;i<pts.length;i++){var j=(i+1)%pts.length;a+=pts[i][0]*pts[j][1]-pts[j][0]*pts[i][1]}return Math.abs(a)/2}
function dwSnap(x,y){var d=S.dw.doc;if(d&&d.type==='board')return[Math.round(x/10)*10,Math.round(y/10)*10];if(!d||d.type!=='dxf')return[x,y];var v=S.dw.view,r=10/v.s,best=null,bd=r*r;var N=Math.min(d.segs.length,60000);for(var i=0;i<N;i++){var s=d.segs[i];for(var j=0;j<4;j+=2){var dx=s[j]-x,dy=s[j+1]-y,dd=dx*dx+dy*dy;if(dd<bd){bd=dd;best=[s[j],s[j+1]]}}}return best||[x,y]}
ACT.dwMode=function(m){S.dw.mode=m;S.dw.pts=[];render()};
ACT.dwZoom=function(f){var cv=$('dw_cv');if(!cv||!S.dw.view)return;var v=S.dw.view,cx=cv.width/2,cy=cv.height/2;v.ox=cx-(cx-v.ox)*f;v.oy=cy-(cy-v.oy)*f;v.s*=f;dwDraw()};
ACT.dwFit=function(){var cv=$('dw_cv');if(cv){dwFit(cv);dwDraw()}};
ACT.dwUndo=function(){S.dw.pts.pop();dwDraw();dwStatus()};
function dwStatus(){var e=$('dw_st');if(!e)return;var pl=dwActive(),m=S.dw.mode,pp=pl&&pl.cal?pl.cal.ppm:0,t='';
 if(m==='pan')t='✋ حرّك بإصبعك/الفأرة، وكبّر بالعجلة أو الإصبعين. اختر أداة قياس للبدء.';
 else if(m==='cal')t='📏 المعايرة: اضغط نقطتين على مسافة تعرف طولها الحقيقي ('+S.dw.pts.length+'/2)';
 else if(m==='zone')t='⬠ اضغط رؤوس المنطقة ثم «إنهاء» ('+S.dw.pts.length+')';
 else if(m==='rect')t='▭ اضغط الركن الأول ثم الركن المقابل';
 else if(m==='line')t='➖ اضغط نقاط الخط ثم «إنهاء»';
 else if(m==='text')t='🏷 اضغط مكان النص';
 else if(!pp)t='⚠ عاير المقياس أولًا (📏) وإلا لن تكون الأطوال بالمتر.';
 else if(m==='dist')t='↔ اضغط نقاط المسار — الطول الحالي: '+fmt(r2(dwLen(S.dw.pts)/pp))+' م';
 else if(m==='area')t='▭ اضغط رؤوس المنطقة — المساحة الحالية: '+(S.dw.pts.length>2?fmt(r2(dwArea(S.dw.pts)/pp/pp)):'0')+' م²';
 else if(m==='count')t='🔢 اضغط على كل عنصر لعدّه — العدد: '+S.dw.pts.length;
 e.textContent=t}
ACT.dwFinish=function(){var pl=dwActive(),m=S.dw.mode,P=S.dw.pts;if(!pl)return;
 if(m==='cal'){if(P.length<2){toast('اضغط نقطتين');return}var px=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]);modal('معايرة المقياس','<div class="fg">'+fld('الطول الحقيقي بين النقطتين (متر)',inp('dw_real','','number','step="any" inputmode="decimal"'))+'</div><div class="hint">مثال: عرض باب 1.00 م أو بُعد مكتوب على المخطط.</div>',{save:async function(){var L=num(v$('dw_real'));if(!(L>0)){toast('اكتب الطول');return false}pl.cal={ppm:px/L,auto:false,ref:L};var p=proj(S.dw.pid);if(await dbSet('projects',p)){S.dw.pts=[];S.dw.mode='dist';toast('✔ عُيّر المقياس');render();return true}return false}});return}
 if(['zone','rect','line','text'].indexOf(m)>=0){var need=m==='zone'?3:m==='line'?2:m==='rect'?2:1;if(P.length<need){toast('نقاط غير كافية');return}var pts=P.map(function(q){return[q[0],q[1]]}),k=m;if(m==='rect'){var a=P[0],b=P[1];pts=[[a[0],a[1]],[b[0],a[1]],[b[0],b[1]],[a[0],b[1]]];k='zone'}dwShapeForm({id:'',k:k,pts:pts,label:'',phase_id:'',boq_id:'',col:'#2874a6'},true);return}
 var pp=pl.cal&&pl.cal.ppm;if(!pp){toast('عاير المقياس أولًا');return}
 if(m==='dist'&&P.length<2){toast('اضغط نقطتين على الأقل');return}if(m==='area'&&P.length<3){toast('المساحة تحتاج 3 نقاط');return}if(m==='count'&&!P.length){toast('اضغط على العناصر');return}
 var val=m==='dist'?dwLen(P)/pp:m==='area'?dwArea(P)/pp/pp:P.length,p2=proj(S.dw.pid);
 modal('حفظ القياس — '+dwFmtVal(val,m),'<div class="fg">'+fld('الوصف (مثال: جدار الدور الأول)',inp('dw_lab',''),'full')+fld('ربط ببند المقايسة (اختياري)','<select id="dw_boq">'+boqOpts(S.dw.pid,'')+'</select>','full')+'</div>',{save:async function(){pl.meas=pl.meas||[];pl.meas.push({id:uid(),kind:m,pts:P.map(function(q){return[r2(q[0]),r2(q[1])]}),val:r2(val),label:v$('dw_lab').trim(),boq_id:v$('dw_boq')||null,at:new Date().toISOString(),by:S.user});if(await dbSet('projects',p2)){S.dw.pts=[];toast('حُفظ القياس');render();return true}pl.meas.pop();return false}})};
function dwShapeForm(sh,isNew){var p=proj(S.dw.pid),pl=dwActive(),ph=plPhases(p);
 modal(isNew?'عنصر جديد على اللوحة':'تعديل العنصر','<div class="fg">'+fld('الوصف / الاسم',inp('dw_sl',sh.label||''),'full')+(sh.k==='text'?'':fld('المرحلة (تتلوّن بتقدّمها)','<select id="dw_sph"><option value="">— بدون —</option>'+ph.map(function(x){return'<option value="'+x.id+'"'+(x.id===sh.phase_id?' selected':'')+'>'+h(x.name)+'</option>'}).join('')+'</select>')+fld('بند الأعمال','<select id="dw_sb">'+boqOpts(S.dw.pid,sh.boq_id||'')+'</select>'))+fld('اللون (إن لم تُربط بمرحلة)','<select id="dw_sc">'+[['#2874a6','أزرق'],['#1e8449','أخضر'],['#d68910','برتقالي'],['#c0392b','أحمر'],['#6c3483','بنفسجي'],['#555555','رمادي']].map(function(q){return'<option value="'+q[0]+'"'+(q[0]===sh.col?' selected':'')+'>'+q[1]+'</option>'}).join('')+'</select>')+'</div>'+(ph.length?'':'<div class="hint">لا توجد مراحل لهذا المشروع — أنشئها من «الجدول الزمني والتقدم» لتربطها بالمناطق.</div>'),
 {save:async function(){sh.label=v$('dw_sl').trim();if($('dw_sph')){sh.phase_id=v$('dw_sph');sh.boq_id=v$('dw_sb')||null}sh.col=v$('dw_sc');pl.shapes=pl.shapes||[];if(isNew){sh.id=uid();sh.by=S.user;pl.shapes.push(sh)}if(await dbSet('projects',p)){if(isNew)S.dw.pts=[];toast('حُفظ');render();return true}if(isNew)pl.shapes.pop();return false}})}
ACT.dwEditShape=function(id){var pl=dwActive();var sh=pl&&(pl.shapes||[]).filter(function(x){return x.id===id})[0];if(sh)dwShapeForm(sh,false)};
ACT.dwDelShape=async function(id){var pl=dwActive(),p=proj(S.dw.pid);if(!pl)return;pl.shapes=(pl.shapes||[]).filter(function(x){return x.id!==id});if(await dbSet('projects',p))render()};
ACT.dwDelMeas=async function(id){var pl=dwActive(),p=proj(S.dw.pid);if(!pl)return;pl.meas=(pl.meas||[]).filter(function(m){return m.id!==id});if(await dbSet('projects',p))render()};
ACT.dwPage=async function(d){var pl=dwActive();if(!pl||pl.type!=='pdf')return;var n=(pl.page||1)+(+d);if(n<1)return;pl.page=n;S.dw.msg='';ACT.dwOpen(pl.id)};
function dwCanvasEvents(){var cv=$('dw_cv');if(!cv||cv.dataset.b)return;cv.dataset.b=1;var ptr={},drag=null,pinch=null,moved=0;
 function pos(e){var r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]}
 cv.addEventListener('pointerdown',function(e){cv.setPointerCapture(e.pointerId);ptr[e.pointerId]=pos(e);moved=0;var ks=Object.keys(ptr);if(ks.length===2){var a=ptr[ks[0]],b=ptr[ks[1]];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),s:S.dw.view.s}}else drag={p:pos(e),ox:S.dw.view.ox,oy:S.dw.view.oy}});
 cv.addEventListener('pointermove',function(e){if(!ptr[e.pointerId])return;ptr[e.pointerId]=pos(e);var ks=Object.keys(ptr),v=S.dw.view;if(ks.length===2&&pinch){var a=ptr[ks[0]],b=ptr[ks[1]],d=Math.hypot(a[0]-b[0],a[1]-b[1]),ns=pinch.s*d/pinch.d,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,f=ns/v.s;v.ox=cx-(cx-v.ox)*f;v.oy=cy-(cy-v.oy)*f;v.s=ns;moved=99;dwDraw()}else if(drag&&ks.length===1){var p=pos(e);moved=Math.max(moved,Math.hypot(p[0]-drag.p[0],p[1]-drag.p[1]));if(S.dw.mode==='pan'||moved>6){if(moved>6){v.ox=drag.ox+p[0]-drag.p[0];v.oy=drag.oy+p[1]-drag.p[1];dwDraw()}}}});
 function up(e){var wasOne=Object.keys(ptr).length===1;var p=ptr[e.pointerId];delete ptr[e.pointerId];if(Object.keys(ptr).length<2)pinch=null;
  if(wasOne&&moved<=6&&p&&S.dw.mode!=='pan'){var w=dwS2W(p[0],p[1]);w=dwSnap(w[0],w[1]);S.dw.pts.push(w);if(S.dw.mode==='cal'&&S.dw.pts.length>2)S.dw.pts=S.dw.pts.slice(-2);dwDraw();dwStatus();if((S.dw.mode==='rect'&&S.dw.pts.length===2)||(S.dw.mode==='text'&&S.dw.pts.length===1))ACT.dwFinish()}if(!Object.keys(ptr).length)drag=null}
 cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',function(e){delete ptr[e.pointerId];pinch=null;drag=null});
 cv.addEventListener('wheel',function(e){e.preventDefault();var p=pos(e),v=S.dw.view,f=e.deltaY<0?1.2:1/1.2;v.ox=p[0]-(p[0]-v.ox)*f;v.oy=p[1]-(p[1]-v.oy)*f;v.s*=f;dwDraw()},{passive:false})}
document.addEventListener('change',function(e){if(e.target.id==='dw_p'){S.dw.pid=e.target.value;S.dw.plan='';S.dw.doc=null;render()}else if(e.target.id==='dw_file')ACT.dwUpload();else if(e.target.id==='dw_re')ACT.dwReattach()});
window.addEventListener('resize',function(){if(S.view==='drawings'&&S.dw.doc){S.dw.view=null;dwDraw()}});
VIEWS.drawings=function(){var P=S.projects.filter(function(p){return!p.hold});if(!P.length)return pg('المخططات والقياس','','<div class="hint">لا توجد مشاريع.</div>');var p=proj(S.dw.pid)||P[0];S.dw.pid=p.id;var sel='<div class="flt noprint"><select id="dw_p">'+opts(P,p.id,function(x){return x.id},function(x){return x.name})+'</select></div>';
 var pl=dwActive();if(!pl){var cards=dwPlans(p).map(function(x){return[h(x.name),x.type==='board'?'لوحة':x.type.toUpperCase(),(x.meas||[]).length,x.cal?'✔':'—',x.stored?'محفوظ':'غير محفوظ','<button class="btn sm p" data-a="dwOpen" data-p="'+x.id+'">فتح</button> <button class="btn sm d" data-a="dwDelPlan" data-p="'+x.id+'">حذف</button>']});
  return pg('المخططات والقياس','',sel+'<div class="card"><h3>رفع مخطط أو لوحة جديدة</h3><div class="flt"><button class="btn p" data-a="dwNewBoard">+ لوحة رسم جديدة</button></div><input id="dw_file" type="file" accept=".dxf,.pdf,.png,.jpg,.jpeg,.webp,.dwg"><div class="hint">الصيغ المدعومة: <b>DXF</b> (يُرسم ويُعاير تلقائيًا إن كانت وحدته معروفة) · <b>PDF</b> (صفحة واحدة تُعرض كصورة) · <b>صورة</b>. ملف <b>DWG</b> مغلق الصيغة: احفظه من AutoCAD بصيغة DXF أو PDF ثم ارفعه.</div>'+(S.dw.busy?'<div class="hint w">'+h(S.dw.msg)+'</div>':'')+'</div><div class="card sm13"><h3>مخططات المشروع</h3>'+tbl([{h:'الملف'},{h:'النوع'},{h:'قياسات',n:1},{h:'معايَر'},{h:'التخزين'},{h:''}],cards,{empty:'لا توجد مخططات — ارفع أول مخطط'})+'</div>')}
 var m=S.dw.mode,pp=pl.cal&&pl.cal.ppm,tools=[['pan','✋ تحريك'],['cal','📏 معايرة'],['dist','↔ مسافة'],['area','▭ مساحة'],['count','🔢 عدّ'],['zone','⬠ منطقة'],['rect','▭ مستطيل'],['line','➖ خط'],['text','🏷 نص']].map(function(q){return'<button class="btn sm'+(m===q[0]?' p':'')+'" data-a="dwMode" data-p="'+q[0]+'">'+q[1]+'</button>'}).join('');
 var body='<div class="flt noprint"><button class="btn sm" data-a="dwClose">← المخططات</button><b>'+h(pl.name)+'</b>'+(pl.type==='board'?'<span class="fnt">لوحة رسم</span>':'')+(pl.type==='pdf'?'<button class="btn sm" data-a="dwPage" data-p="-1">◀</button> صفحة '+(pl.page||1)+' <button class="btn sm" data-a="dwPage" data-p="1">▶</button>':'')+'</div>';
 if(S.dw.msg)body+='<div class="hint w">'+h(S.dw.msg)+(pl.stored?'':'<br><input id="dw_re" type="file" accept=".dxf,.pdf,.png,.jpg,.jpeg,.webp">')+'</div>';
 if(S.dw.doc){body+='<div class="flt noprint" style="flex-wrap:wrap;gap:4px">'+tools+'<span style="flex:1"></span><button class="btn sm" data-a="dwZoom" data-p="1.4">＋</button><button class="btn sm" data-a="dwZoom" data-p="0.71">－</button><button class="btn sm" data-a="dwFit">⤢</button></div><div style="border:1px solid #0003;border-radius:8px;overflow:hidden;background:#fff"><canvas id="dw_cv" style="display:block;width:100%;touch-action:none"></canvas></div><div class="hint" id="dw_st"></div>'+
  (m!=='pan'?'<div class="flt noprint"><button class="btn p" data-a="dwFinish">'+(m==='cal'?'تأكيد المعايرة':'إنهاء وحفظ القياس')+'</button><button class="btn sm" data-a="dwUndo">↶ تراجع نقطة</button></div>':'')+'<div class="fnt" style="font-size:12px">المقياس: '+(pp?'1 م = '+fmt(r2(pp))+' وحدة رسم'+(pl.cal.auto?' (تلقائي من وحدات DXF — تأكد منه)':''):'غير معاير')+'</div>';
  var SH=pl.shapes||[];body+='<div class="card sm13"><h3>عناصر اللوحة</h3>'+tbl([{h:'الوصف'},{h:'النوع'},{h:'المرحلة'},{h:'الحالة'},{h:'البند'},{h:''}],SH.map(function(x){var I=dwShapeInfo(x),b=(p.boq||[]).filter(function(q){return q.id===x.boq_id})[0];return[h(x.label||'—'),{zone:'منطقة',line:'خط',text:'نص'}[x.k]||x.k,I.ph?h(I.ph.name):'—',I.st?'<span class="tag '+{g:'g',w:'w',b:'r',n:''}[I.st.st]+'">'+plPct(I.st.a)+' · '+I.st.msg+'</span>':'—',b?h((b.code||'')+' '+b.name):'—','<button class="btn sm" data-a="dwEditShape" data-p="'+x.id+'">تعديل</button> <button class="btn sm d" data-a="dwDelShape" data-p="'+x.id+'">حذف</button>']}),{empty:'لا توجد عناصر — اختر ⬠ منطقة أو ▭ مستطيل أو 🏷 نص وارسم على اللوحة'})+'</div>';
  var M=pl.meas||[],tot={};M.forEach(function(x){var k=(x.boq_id||'')+'|'+x.kind;tot[k]=(tot[k]||0)+num(x.val)});
  body+='<div class="card sm13"><h3>القياسات المحفوظة</h3>'+tbl([{h:'الوصف'},{h:'النوع'},{h:'القيمة',n:1},{h:'البند'},{h:''}],M.map(function(x){var b=(p.boq||[]).filter(function(q){return q.id===x.boq_id})[0];return[h(x.label||'—'),{dist:'مسافة',area:'مساحة',count:'عدّ'}[x.kind],dwFmtVal(x.val,x.kind),b?h((b.code||'')+' '+b.name):'—','<button class="btn sm d" data-a="dwDelMeas" data-p="'+x.id+'">حذف</button>']}),{empty:'لا توجد قياسات'})+'</div>'}
 else body+=(S.dw.busy?'<div class="hint">'+h(S.dw.msg)+'</div>':'');
 setTimeout(function(){dwCanvasEvents();dwDraw();dwStatus()},0);return pg('المخططات والقياس','',sel+body)};
