/* ===== الجدول الزمني للمشروع: خطة المراحل مقابل التقدم الفعلي والتأخير ===== */
S.pl=S.pl||{pid:''};
function plD(a){return a?Math.round(new Date(a+'T00:00:00Z').getTime()/864e5):0}
function plPhases(p){return(p.plan||[]).slice().sort(function(a,b){return(a.start||'')>(b.start||'')?1:-1})}
function plActual(p,ph){var bv=0,ev=0;(ph.boq||[]).forEach(function(id){var b=(p.boq||[]).filter(function(x){return x.id===id})[0];if(!b)return;var u=itemUse(p.id,b.id),v=num(b.qty)*num(b.price);bv+=v;ev+=Math.min(num(b.qty),(u.progQty||u.subQty))*num(b.price)});return bv?ev/bv*100:null}
function plExpected(ph,d){var s=plD(ph.start),e=plD(ph.end),t=plD(d||today());if(!s||!e||e<=s)return null;return Math.max(0,Math.min(100,(t-s)/(e-s)*100))}
function plStat(p,ph){var a=plActual(p,ph),x=plExpected(ph),t=today();
 if(a==null)return{a:null,x:x,st:'n',msg:'اربط بنودًا بالمرحلة',late:0};
 if(a>=99.5)return{a:a,x:x,st:'g',msg:'مكتملة',late:0};
 if(ph.end&&t>ph.end)return{a:a,x:100,st:'b',msg:'متأخرة عن النهاية '+(plD(t)-plD(ph.end))+' يوم',late:plD(t)-plD(ph.end)};
 if(x==null)return{a:a,x:x,st:'n',msg:'حدّد التواريخ',late:0};
 var gap=x-a,dur=plD(ph.end)-plD(ph.start),late=Math.round(Math.max(0,gap)/100*dur);
 if(x<=0&&a<=0)return{a:a,x:x,st:'n',msg:'لم تبدأ بعد',late:0};
 if(gap>15)return{a:a,x:x,st:'b',msg:'متأخرة ~'+late+' يوم',late:late};
 if(gap>5)return{a:a,x:x,st:'w',msg:'تأخر بسيط ~'+late+' يوم',late:late};
 return{a:a,x:x,st:'g',msg:gap<-5?'متقدمة عن الخطة':'حسب الخطة',late:0}}
function plPct(v){return v==null?'—':Math.round(v)+'%'}
function plGantt(p,L){var s=plD(L[0].start),e=plD(L[0].end);L.forEach(function(x){if(plD(x.start)&&plD(x.start)<s)s=plD(x.start);if(plD(x.end)>e)e=plD(x.end)});var t=plD(today()),sp=Math.max(1,e-s),col={g:'#1e8449',w:'#d68910',b:'#c0392b',n:'#7f8c8d'};
 var tp=t>=s&&t<=e?(e-t)/sp*100:null;
 return'<div class="card"><h3>المخطط الزمني</h3><div style="position:relative">'+L.map(function(ph){var st=plStat(p,ph),l=(e-plD(ph.end))/sp*100,w=Math.max(1.5,(plD(ph.end)-plD(ph.start))/sp*100),a=st.a==null?0:Math.min(100,st.a);
  return'<div style="margin:8px 0"><div style="font-size:13px;display:flex;justify-content:space-between;gap:8px"><b>'+h(ph.name)+'</b><span class="fnt">'+ph.start+' ← '+ph.end+'</span></div><div style="position:relative;height:18px;background:#0001;border-radius:5px"><div style="position:absolute;right:'+(100-l-w)+'%;width:'+w+'%;height:18px;background:#2874a644;border-radius:5px;overflow:hidden"><div style="position:absolute;right:0;width:'+a+'%;height:18px;background:'+col[st.st]+'"></div></div>'+(tp!=null?'<div style="position:absolute;right:'+(100-tp)+'%;top:-2px;bottom:-2px;width:2px;background:#e74c3c"></div>':'')+'</div></div>'}).join('')+'</div><div class="fnt" style="font-size:12px">الأزرق = المدة المخططة · اللون = المنجز فعليًا · الخط الأحمر = اليوم</div></div>'}
VIEWS.plan=function(){var P=S.projects.filter(function(p){return!p.hold});if(!P.length)return pg('الجدول الزمني','','<div class="hint">لا توجد مشاريع.</div>');
 var p=proj(S.pl.pid)||P[0];S.pl.pid=p.id;
 var sel='<div class="flt noprint"><select id="pl_p" data-a="plProj">'+P.map(function(x){return'<option value="'+x.id+'"'+(x.id===p.id?' selected':'')+'>'+h(x.name)+'</option>'}).join('')+'</select><button class="btn p" data-a="plAdd">+ مرحلة</button><button class="btn" data-a="plGen">توليد المراحل من مجموعات المقايسة</button></div>';
 var L=plPhases(p);if(!L.length)return pg('الجدول الزمني والتقدم','',sel+'<div class="hint">لا توجد خطة لهذا المشروع. أضف مراحل (كل مرحلة بتاريخ بداية ونهاية وبنود من المقايسة) أو اضغط «توليد المراحل من مجموعات المقايسة» لتوزيعها تلقائيًا على مدة المشروع.</div>');
 var S2=L.map(function(ph){return plStat(p,ph)}),late=S2.filter(function(x){return x.st==='b'}).length,w=S2.filter(function(x){return x.st==='w'}).length,done=S2.filter(function(x){return x.a!=null&&x.a>=99.5}).length;
 var tv=sum(L,function(ph){return sum((ph.boq||[]).map(function(id){return(p.boq||[]).filter(function(b){return b.id===id})[0]}).filter(Boolean),boqValue)}),ev=sum(L,function(ph){var a=plActual(p,ph)||0,v=sum((ph.boq||[]).map(function(id){return(p.boq||[]).filter(function(b){return b.id===id})[0]}).filter(Boolean),boqValue);return a/100*v});
 var k='<div class="grid g4" style="margin-bottom:12px">'+kpi('مراحل الخطة',L.length,done+' مكتملة')+kpi('متأخرة',late,w?w+' تأخر بسيط':'',late?'bad':'good')+kpi('الإنجاز الفعلي',tv?plPct(ev/tv*100):'—','من قيمة بنود الخطة')+kpi('بنود خارج الخطة',(p.boq||[]).filter(function(b){return!L.some(function(ph){return(ph.boq||[]).indexOf(b.id)>=0})}).length,'اربطها بمرحلة')+'</div>';
 var rows=L.map(function(ph,i){var st=S2[i];return[h(ph.name),'<span class="nw">'+(ph.start||'—')+'</span>','<span class="nw">'+(ph.end||'—')+'</span>',(ph.boq||[]).length,plPct(st.x),plPct(st.a),'<span class="tag '+{g:'g',w:'w',b:'r',n:''}[st.st]+'">'+st.msg+'</span>','<button class="btn sm" data-a="plEdit" data-p="'+ph.id+'">تعديل</button> <button class="btn sm d" data-a="plDel" data-p="'+ph.id+'">حذف</button>']});
 return pg('الجدول الزمني والتقدم','',sel+k+plGantt(p,L)+'<div class="card"><h3>المراحل</h3>'+tbl([{h:'المرحلة'},{h:'البداية'},{h:'النهاية'},{h:'بنود',n:1},{h:'المخطط الآن',n:1},{h:'الفعلي',n:1},{h:'الحالة'},{h:''}],rows,{})+'</div>')};
ACT.plProj=function(){S.pl.pid=v$('pl_p');render()};
document.addEventListener('change',function(e){if(e.target&&e.target.id==='pl_p'){S.pl.pid=e.target.value;render()}});
async function plSave(p){if(await dbSet('projects',p)){render();return true}return false}
function plForm(ph){var p=proj(S.pl.pid),sel=ph?ph.boq||[]:[],gs={};(p.boq||[]).forEach(function(b){(gs[b.group||'بدون مجموعة']=gs[b.group||'بدون مجموعة']||[]).push(b)});
 var used={};plPhases(p).forEach(function(x){if(!ph||x.id!==ph.id)(x.boq||[]).forEach(function(id){used[id]=x.name})});
 var bl=Object.keys(gs).map(function(g){return'<div style="margin:6px 0"><b>'+h(g)+'</b> <button class="btn sm" type="button" data-a="plGrp" data-p="'+h(g)+'">كل المجموعة</button>'+gs[g].map(function(b){return'<label style="display:block;font-size:13px"><input type="checkbox" class="plb" data-g="'+h(g)+'" value="'+b.id+'"'+(sel.indexOf(b.id)>=0?' checked':'')+'> '+h((b.code||'')+' '+(b.name||''))+(used[b.id]?' <span class="fnt">(في «'+h(used[b.id])+'»)</span>':'')+'</label>'}).join('')+'</div>'}).join('');
 modal(ph?'تعديل مرحلة':'مرحلة جديدة','<div class="fg">'+fld('اسم المرحلة',inp('pl_n',ph?ph.name:''))+fld('البداية',inp('pl_s',ph?ph.start:(p.start||today()),'date'))+fld('النهاية',inp('pl_e',ph?ph.end:'','date'))+'</div><div style="max-height:40vh;overflow:auto;margin-top:8px">'+(bl||'<div class="hint">لا توجد بنود في المقايسة.</div>')+'</div>',
 {save:async function(){var n=v$('pl_n').trim(),s=v$('pl_s'),e=v$('pl_e');if(!n||!s||!e){toast('اكتب الاسم والتواريخ');return false}if(e<s){toast('النهاية قبل البداية');return false}
  var ids=[].slice.call(document.querySelectorAll('.plb:checked')).map(function(x){return x.value});p.plan=p.plan||[];
  if(ph){ph.name=n;ph.start=s;ph.end=e;ph.boq=ids}else p.plan.push({id:uid(),name:n,start:s,end:e,boq:ids});
  p.plan.forEach(function(x){if(!ph||x.id!==ph.id)if(ids.length)x.boq=(x.boq||[]).filter(function(i){return ids.indexOf(i)<0})});
  return await plSave(p)}})}
ACT.plAdd=function(){plForm(null)};
ACT.plEdit=function(id){var p=proj(S.pl.pid),ph=(p.plan||[]).filter(function(x){return x.id===id})[0];if(ph)plForm(ph)};
ACT.plGrp=function(g){document.querySelectorAll('.plb').forEach(function(x){if(x.dataset.g===g)x.checked=true})};
ACT.plDel=async function(id){var p=proj(S.pl.pid);if(!confirm('حذف المرحلة من الخطة؟'))return;p.plan=(p.plan||[]).filter(function(x){return x.id!==id});await plSave(p)};
ACT.plGen=async function(){var p=proj(S.pl.pid),s=p.start,e=finalDate(p)||(s?addMonths(s,num(p.months)||12):'');if(!s||!e){toast('حدّد تاريخ بداية ومدة المشروع أولًا (بيانات المشاريع)');return}
 if((p.plan||[]).length&&!confirm('سيستبدل الخطة الحالية. متابعة؟'))return;var gs=[],m={};(p.boq||[]).forEach(function(b){var g=b.group||'بنود عامة';if(!m[g]){m[g]={id:uid(),name:g,boq:[]};gs.push(m[g])}m[g].boq.push(b.id)});
 if(!gs.length){toast('لا توجد بنود في المقايسة');return}var tot=plD(e)-plD(s),vals=gs.map(function(g){return Math.max(1,sum(g.boq.map(function(id){return p.boq.filter(function(b){return b.id===id})[0]}),boqValue))}),T=sum(vals,function(x){return x}),cur=plD(s);
 gs.forEach(function(g,i){var d=Math.max(1,Math.round(tot*vals[i]/T));g.start=impAdd('1970-01-01',cur);g.end=impAdd('1970-01-01',Math.min(plD(e),cur+d));cur+=d});
 p.plan=gs;await plSave(p);toast('وُلّدت '+gs.length+' مرحلة — عدّل التواريخ حسب خطتك')};
