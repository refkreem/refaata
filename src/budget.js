/* ===== ميزانية البنود وتنبيهات التجاوز =====
   الميزانية المرجعية للبند = ميزانية معتمدة يدويًا (b.budget) أو الكمية × تكلفة الوحدة المخططة (cost_price). بلا واحدة منهما = «بلا ميزانية».
   التنبيهات إنذار فقط ولا تمنع التنفيذ (أعمال المستشفيات العاجلة): الاستمرار بعد التجاوز يحتاج مبررًا ثم اعتماد الإدارة، وكلها في سجل. */
function budCfg(){S.cfg.bud=S.cfg.bud||{};var c=S.cfg.bud;if(!(c.warn>0))c.warn=80;if(!(c.over>0))c.over=100;if(!(c.esc>0))c.esc=120;if(c.reviewer==null)c.reviewer='';return c}
function budRef(b){var q=num(b.qty);if(num(b.budget)>0)return num(b.budget);if(num(b.cost_price)>0)return r2(q*num(b.cost_price));return 0}
function budEng(pid){return Object.keys(S.cfg.assign||{}).filter(function(e){return asgActive(e,pid)})}
function budReviewer(){var c=budCfg();if(c.reviewer)return c.reviewer;var a=Object.keys(S.cfg.roles||{}).filter(function(k){return S.cfg.roles[k]==='accountant'});return a[0]||'المحاسب'}
function budEx(pid,bid){S.cfg.budEx=S.cfg.budEx||{};return S.cfg.budEx[pid+'|'+bid]||null}
var BUD_ST={unbud:['بلا ميزانية','tag'],ok:['ضمن الميزانية','tag good'],warn:['إنذار مبكر','tag warn'],over:['تجاوز الميزانية','tag bad'],esc:['تجاوز جسيم — يحتاج اعتماد الإدارة','tag bad'],exc:['استمرار استثنائي معتمد','tag warn']};
function budState(pid,b){var c=budCfg(),i=bcItem(pid,b),ref=budRef(b),act=i.tot,ex=budEx(pid,b.id),pc=ref?r2(act/ref*100):0,st,why;
 if(!ref){st='unbud';why='لا توجد ميزانية مرجعية معتمدة لهذا البند، فلا تُحسب له نسبة استهلاك ولا ربحية.'}
 else{var lim=ex&&ex.status==='approved'&&num(ex.limit)>ref?num(ex.limit):ref;
  if(act>lim+0.5&&pc>=c.esc){st='esc';why='الفعلي '+fmt(act)+' = '+pc+'% من الميزانية '+fmt(ref)+' (حد التصعيد '+c.esc+'%)'+(lim>ref?'، وتجاوز سقف الاستثناء المعتمد '+fmt(lim):'')+'.'}
  else if(act>lim+0.5){st='over';why='الفعلي '+fmt(act)+' تجاوز الميزانية '+fmt(ref)+' بمقدار '+fmt(r2(act-ref))+' ('+pc+'%).'}
  else if(act>ref+0.5&&ex&&ex.status==='approved'){st='exc';why='تجاوز الميزانية '+fmt(ref)+' لكن باستمرار استثنائي معتمد حتى '+fmt(lim)+'.'}
  else if(pc>=c.warn){st='warn';why='استهلك '+pc+'% من الميزانية '+fmt(ref)+' (حد الإنذار '+c.warn+'%).'}
  else{st='ok';why=''}
  if(st==='ok'&&i.fc>ref+0.5){st='warn';why='التكلفة النهائية المتوقعة '+fmt(i.fc)+' ستتجاوز الميزانية '+fmt(ref)+' رغم أن الفعلي '+pc+'% فقط.'}}
 return{i:i,ref:ref,act:act,pc:pc,st:st,why:why,ex:ex,fc:i.fc,vr:ref?r2(ref-i.fc):null}}
function budAll(pid){var L=[];(pid?[proj(pid)]:S.projects).forEach(function(p){if(p)(p.boq||[]).forEach(function(b){var s=budState(p.id,b);s.p=p;L.push(s)})});return L}
S.bu={project:'',st:''};
VIEWS.budget=function(){var f=S.bu,L=budAll(f.project),all=L,cnt=function(k){return all.filter(function(x){return x.st===k}).length};
 var rows=L.filter(function(x){return f.st?x.st===f.st:true}).sort(function(a,b){var o={esc:0,over:1,warn:2,exc:3,unbud:4,ok:5};return o[a.st]-o[b.st]});
 var pend=Object.keys(S.cfg.budEx||{}).filter(function(k){return S.cfg.budEx[k].status==='requested'}).length;
 var body='<div class="flt noprint"><label>المشروع<select data-buf="project">'+projOpts(f.project,'كل المشاريع')+'</select></label><label>الحالة<select data-buf="st">'+opts([['','كل الحالات']].concat(Object.keys(BUD_ST).map(function(k){return[k,BUD_ST[k][0]]})),f.st,function(x){return x[0]},function(x){return x[1]})+'</select></label>'+(isFin()?'<button class="btn" data-a="budSeed">اقتراح ميزانية للبنود بلا ميزانية</button>':'')+'</div>'+
 '<div class="grid g4" style="margin-bottom:12px">'+kpi('بلا ميزانية',cnt('unbud'),'لا تُحسب لها ربحية',cnt('unbud')?'warn':'')+kpi('إنذار مبكر',cnt('warn'),'من '+budCfg().warn+'%',cnt('warn')?'warn':'good')+kpi('تجاوز الميزانية',cnt('over')+cnt('esc'),'منها جسيم '+cnt('esc'),cnt('over')+cnt('esc')?'bad':'good')+kpi('طلبات استمرار معلّقة',pend,'بانتظار اعتماد الإدارة',pend?'warn':'good')+'</div>'+
 '<div class="card"><h3>ميزانية البنود</h3>'+tbl([{h:'المشروع'},{h:'البند'},{h:'الميزانية',n:1},{h:'الفعلي',n:1},{h:'الاستهلاك %',n:1},{h:'المتوقع عند الإتمام',n:1},{h:'الانحراف',n:1},{h:'المسؤول'},{h:'الحالة / السبب'},{h:''}],
  rows.map(function(x){var b=x.i.b,en=budEng(x.p.id).join('، ');var ex=x.ex?'<div class="hint">'+(x.ex.urgent?'🚑 عاجل · ':'')+'مبرر: '+h(x.ex.reason)+' — '+(x.ex.status==='approved'?'معتمد حتى '+fmt(x.ex.limit)+' بواسطة '+h(x.ex.appr_by):x.ex.status==='rejected'?'مرفوض ('+h(x.ex.note||'')+')':'بانتظار الاعتماد')+'</div>':'';
   var act=(x.st==='over'||x.st==='esc'||x.st==='warn')&&(!x.ex||x.ex.status!=='requested')?'<button class="btn sm" data-a="budReq" data-p="'+h(x.p.id+'|'+b.id)+'">طلب استمرار</button>':'';
   if(x.ex&&x.ex.status==='requested'&&isAdmin())act='<button class="btn sm p" data-a="budAppr" data-p="'+h(x.p.id+'|'+b.id)+'|1">اعتماد</button> <button class="btn sm" data-a="budAppr" data-p="'+h(x.p.id+'|'+b.id)+'|0">رفض</button>';
   return[h(x.p.name),h(boqLabel(b)),x.ref?fmt(x.ref):'—',fmt(x.act),x.ref?x.pc+'%':'—',fmt(x.fc),x.vr==null?'—':(x.vr<0?'<b class="bad">'+fmt(x.vr)+'</b>':fmt(x.vr)),'<small>'+(h(en)||'—')+'<br>مراجع مالي: '+h(budReviewer())+'</small>','<span class="'+BUD_ST[x.st][1]+'">'+BUD_ST[x.st][0]+'</span><div class="hint">'+h(x.why)+'</div>'+ex,act]}),{empty:'لا توجد بنود'})+'</div>'+
 '<div class="hint" style="margin-top:8px">التنبيهات إنذار فقط ولا توقف التنفيذ: أعمال المستشفيات العاجلة تستمر، والاستمرار بعد التجاوز يُسجَّل بمبرر ويُعتمد من الإدارة. البند «بلا ميزانية» لا تُحسب له نسبة استهلاك ولا ربحية حتى تُدخل ميزانيته. حدود الإنذار والتصعيد والمراجع المالي من الإعدادات ← «حدود الميزانية».</div>';
 return pg('ميزانية البنود وتنبيهات التجاوز','',body)};
document.addEventListener('change',function(ev){var e=ev.target,k=e.dataset&&e.dataset.buf;if(k){S.bu[k]=e.value;render()}});
function budAudit(ex,what){ex.hist=(ex.hist||[]).concat([{at:new Date().toISOString(),by:S.user,what:what}])}
ACT.budReq=async function(k){var x=k.split('|'),p=proj(x[0]);if(!p)return;var r=prompt('اكتب مبرر الاستمرار بعد التجاوز (مطلوب):');if(!r||!r.trim()){toast('لم يُسجَّل — المبرر مطلوب');return}var urg=confirm('هل العمل عاجل / حرج لمستشفى قائم؟ (لا يوقف التنفيذ في الحالتين)');
 S.cfg.budEx=S.cfg.budEx||{};var ex={status:'requested',reason:r.trim(),urgent:urg?1:0,by:S.user,at:new Date().toISOString(),pid:x[0],bid:x[1]};budAudit(ex,'طلب استمرار استثنائي');S.cfg.budEx[x[0]+'|'+x[1]]=ex;if(await saveCfg()){toast('أُرسل الطلب للإدارة — التنفيذ لم يتوقف');render()}};
ACT.budAppr=async function(k){var x=k.split('|'),ok=x[2]==='1';if(!isAdmin()){toast('الاعتماد للإدارة فقط');return}var ex=budEx(x[0],x[1]);if(!ex)return;var b=boqItem(x[0],x[1]),st=budState(x[0],b);
 if(ok){var lim=prompt('سقف التكلفة الجديد المعتمد لهذا البند (الميزانية '+fmt(st.ref)+' — الفعلي '+fmt(st.act)+' — المتوقع '+fmt(st.fc)+'):',String(Math.ceil(Math.max(st.fc,st.act))));if(lim==null)return;lim=num(lim);if(!(lim>st.ref)){toast('السقف يجب أن يكون أكبر من الميزانية');return}ex.status='approved';ex.limit=lim;budAudit(ex,'اعتماد حتى '+fmt(lim))}
 else{var n=prompt('سبب الرفض:');if(!n)return;ex.status='rejected';ex.note=n;budAudit(ex,'رفض: '+n)}
 ex.appr_by=S.user;ex.appr_at=new Date().toISOString();if(await saveCfg())render()};
ACT.budSeed=async function(){var L=budAll(S.bu.project).filter(function(x){return x.st==='unbud'});if(!L.length){toast('لا توجد بنود بلا ميزانية');return}var pc=prompt('نسبة التكلفة المخططة من سعر العقد (مثلًا 75) — تُطبَّق على '+L.length+' بند بلا ميزانية، وتُعلَّم «ميزانية مقترحة» لمراجعتها:','75');if(pc==null)return;pc=num(pc);if(!(pc>0&&pc<=100)){toast('أدخل نسبة بين 1 و100');return}
 var byP={};L.forEach(function(x){if(num(x.i.b.price)>0){x.i.b.cost_price=r2(num(x.i.b.price)*pc/100);x.i.b.budget_src='مقترحة '+pc+'% من العقد — '+today();byP[x.p.id]=x.p}});var ok=true;for(var id of Object.keys(byP))if(!await dbSet('projects',byP[id]))ok=false;if(ok){toast('تم اقتراح الميزانية لـ '+Object.keys(byP).length+' مشروع');render()}};
SETS.push(['bud','حدود الميزانية والتنبيهات']);
SECT.bud=function(){var c=budCfg();return'<h3>حدود ميزانية البنود</h3><div class="hint" style="margin-bottom:10px">تنبيهات فقط — لا تمنع التنفيذ. الاستمرار بعد التجاوز يتطلب مبررًا واعتماد الإدارة.</div><div class="fg">'+fld('إنذار مبكر عند %',inp('bu_w',c.warn,'number'))+fld('تجاوز عند %',inp('bu_o',c.over,'number'))+fld('تصعيد للإدارة عند %',inp('bu_e',c.esc,'number'))+fld('المراجع المالي (بريد)',inp('bu_r',c.reviewer,'text'))+'</div><button class="btn p" data-a="budCfgSave">حفظ</button>'};
ACT.budCfgSave=async function(){if(!isAdmin()){toast('للمدير فقط');return}var c=budCfg(),w=num(v$('bu_w')),o=num(v$('bu_o')),e=num(v$('bu_e'));if(!(w>0&&w<=o&&o<=e)){toast('الترتيب: إنذار ≤ تجاوز ≤ تصعيد');return}c.warn=w;c.over=o;c.esc=e;c.reviewer=v$('bu_r').trim();if(await saveCfg()){toast('تم الحفظ');render()}};
