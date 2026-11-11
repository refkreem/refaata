/* مصروفات الموقع اليومية + حسابات العهد + تسوية العهد الأسبوعية
   صرف العهدة = تحويل من الخزينة لحساب العهدة (حدث مستقل). مصروف الموقع = حركة مصروف مدفوعة من حساب العهدة نفسه،
   فلا تخصم من الخزينة مرة ثانية. الرصيد يُحسب من المعتمد فقط، والمعلّق يظهر منفصلًا. */
function dxMine(){return S.accounts.filter(function(a){return a.cust&&(isFin()||(a.owner||'').toLowerCase()===(S.user||'').toLowerCase())})}
function dxExps(acc){return S.txs.filter(function(t){return t.type==='expense'&&t.site&&(!acc||t.account_id===acc)})}
function dxPend(acc){return sum(dxExps(acc).filter(function(t){return t.status==='pending'}),function(t){return num(t.amount)})}
function dxKey(o){return[o.by,o.date,o.project_id,o.amount,(o.desc||'').trim()].join('|')}
function dxDraftGet(){try{return JSON.parse(localStorage.getItem('dx_draft_'+S.user)||'null')}catch(e){return null}}
function dxDraftSet(v){try{if(v)localStorage.setItem('dx_draft_'+S.user,JSON.stringify(v));else localStorage.removeItem('dx_draft_'+S.user)}catch(e){}}
S.dx={photos:[],busy:false};
function dxRead(){return{date:v$('dx_date'),project_id:v$('dx_proj'),account_id:v$('dx_acc'),desc:v$('dx_desc').trim(),supplier:v$('dx_sup').trim(),category:v$('dx_cat'),qty:v$('dx_qty'),unit:v$('dx_unit'),price:v$('dx_price'),amount:v$('dx_amt'),boq_id:v$('dx_boq')}}
function dxTotal(){var q=num(v$('dx_qty')),p=num(v$('dx_price'));if(q&&p){$('dx_amt').value=r2(q*p)}}
ACT.dxCalc=dxTotal;
ACT.dxBoq=function(){var p=v$('dx_proj');$('dx_boq').innerHTML=boqOpts(p,'')};
ACT.dxPhoto=async function(){var fs=Array.prototype.slice.call($('dx_ph').files||[]);for(var f of fs){if(S.dx.photos.length>=3){toast('الحد 3 مرفقات');break}S.dx.photos.push(await srShrink(f))}$('dx_pc').textContent=S.dx.photos.length+' مرفق'};
ACT.dxDraft=function(){var d=dxRead();d.photos=S.dx.photos;dxDraftSet(d);toast('تم حفظ المسودة على هذا الجهاز')};
ACT.dxSend=async function(){if(S.dx.busy)return;var d=dxRead();
 if(!d.project_id||!d.account_id||!d.desc||!(num(d.amount)>0)){toast('اختر المشروع والعهدة واكتب البيان والمبلغ');return}
 var o={type:'expense',site:1,date:d.date,project_id:d.project_id,account_id:d.account_id,desc:d.desc,supplier:d.supplier,category:d.category||'مصروفات موقع',qty:num(d.qty)||null,unit:d.unit,price:num(d.price)||null,amount:r2(num(d.amount)),boq_id:d.boq_id||null,unclassified:d.boq_id?0:1,pay_method:'cash',photos:S.dx.photos.slice()};
 o.by=S.user;o.dkey=dxKey(o);
 if(S.txs.some(function(t){return t.dkey===o.dkey})){toast('هذا المصروف مسجّل من قبل (منع التكرار)');return}
 var a=S.accounts.filter(function(x){return x.id===d.account_id})[0],bal=a?accStats(a).bal-dxPend(a.id):0;
 if(a&&o.amount>bal&&!confirm('المبلغ أكبر من رصيد العهدة المتاح ('+fmt(bal)+'). متابعة؟'))return;
 S.dx.busy=true;try{if(await saveTx(o)){S.dx.photos=[];dxDraftSet(null);toast('تم الإرسال — يظهر فورًا للمحاسب');render()}}finally{S.dx.busy=false}};
VIEWS.dayexp=function(){var P=S.projects,accs=dxMine(),dr=dxDraftGet()||{},t=today(),w7=new Date(Date.now()-6*864e5).toISOString().slice(0,10);
 if(dr.photos&&!S.dx.photos.length)S.dx.photos=dr.photos;
 var mine=dxExps().filter(function(x){return isFin()||x.by===S.user}),td=sum(mine.filter(function(x){return x.date===t}),function(x){return num(x.amount)}),wk=sum(mine.filter(function(x){return x.date>=w7}),function(x){return num(x.amount)});
 var bal=sum(accs,function(a){return accStats(a).bal}),pend=sum(accs,function(a){return dxPend(a.id)});
 var kp='<div class="grid g4" style="margin-bottom:12px">'+kpi('رصيد عهدتي (معتمد)',fmt(bal))+kpi('مصروفات معلّقة',fmt(pend),pend?'بانتظار الاعتماد':'لا يوجد',pend?'warn':'good')+kpi('مصروف اليوم',fmt(td))+kpi('مصروف 7 أيام',fmt(wk))+'</div>';
 if(!accs.length)return pg('مصروفات الموقع اليومية','',kp+'<div class="hint w">لا توجد عهدة مسجّلة باسمك. اطلب من المحاسب فتح عهدة وصرفها لك.</div>');
 var form='<div class="card"><h3>مصروف جديد</h3><div class="fg">'+fld('التاريخ',inp('dx_date',dr.date||t,'date'))+fld('المشروع','<select id="dx_proj">'+opts(P,dr.project_id||'',function(p){return p.id},function(p){return p.name},'— اختر —')+'</select>')+fld('العهدة','<select id="dx_acc">'+opts(accs,dr.account_id||'',function(a){return a.id},function(a){return a.name+' — '+fmt(accStats(a).bal-dxPend(a.id))})+'</select>')+fld('البيان',inp('dx_desc',dr.desc||''),'full')+fld('المورد / المحل',inp('dx_sup',dr.supplier||''))+fld('التصنيف','<select id="dx_cat">'+opts(S.cfg.ecats||[],dr.category||'')+'</select>')+fld('الكمية',inp('dx_qty',dr.qty||'','number','step="any"'))+fld('الوحدة','<select id="dx_unit">'+opts(S.cfg.units||[],dr.unit||'',null,null,'—')+'</select>')+fld('سعر الوحدة',inp('dx_price',dr.price||'','number','step="any"'))+fld('الإجمالي',inp('dx_amt',dr.amount||'','number','step="any"'))+fld('بند المقايسة (اختياري)','<select id="dx_boq">'+boqOpts(dr.project_id||'',dr.boq_id||'')+'</select>','full')+fld('صورة الإيصال / الفاتورة','<input id="dx_ph" type="file" accept="image/*" multiple><small id="dx_pc">'+S.dx.photos.length+' مرفق</small>','full')+'</div><div class="hint">بدون بند مقايسة يُسجَّل «غير مصنّف» ويُراجَع لاحقًا. لا يخصم من الخزينة؛ يخصم من رصيد العهدة بعد الاعتماد.</div><div class="flt"><button class="btn p" data-a="dxSend">إرسال</button><button class="btn" data-a="dxDraft">حفظ مسودة</button></div></div>';
 var rows=mine.sort(function(a,b){return a.date<b.date?1:-1}).slice(0,40).map(function(x){var p=proj(x.project_id);return[x.date,p?h(p.name):'—',h(x.desc||''),fmt(x.amount),x.unclassified?'<span class="tag w">غير مصنّف</span>':'<span class="tag g">مرتبط</span>','<span class="tag '+(x.status==='pending'?'w':x.status==='rejected'?'b':'g')+'">'+(x.status==='pending'?'معلّق':x.status==='rejected'?'مرفوض':'معتمد')+'</span>']});
 return pg('مصروفات الموقع اليومية','',kp+form+'<div class="card"><h3>آخر المصروفات</h3>'+tbl([{h:'التاريخ'},{h:'المشروع'},{h:'البيان'},{h:'المبلغ',n:1},{h:'البند'},{h:'الحالة'}],rows,{empty:'لا توجد مصروفات'})+'</div>')};
/* ---- تسوية العهد الأسبوعية (للمحاسب/المدير) ---- */
S.cr={from:'',to:''};
function crRow(a){var tx=S.txs,inn=0,ret=0;TX().forEach(function(t){if(t.type==='transfer'){if(t.to===a.id)inn+=num(t.amount);if(t.from===a.id)ret+=num(t.amount)}});
 var ex=dxExps(a.id),ap=sum(ex.filter(function(t){return t.status!=='pending'&&t.status!=='rejected'&&t.status!=='cancelled'}),function(t){return num(t.amount)}),pe=dxPend(a.id),un=ex.filter(function(t){return t.unclassified&&t.status!=='rejected'}).length;
 return{a:a,open:num(a.opening),inn:inn,ex:ap,ret:ret,pend:pe,un:un,bal:accStats(a).bal}}
VIEWS.custrec=function(){var accs=S.accounts.filter(function(a){return a.cust}),rows=accs.map(function(a){var r=crRow(a);return[h(a.name),h((a.owner||'').split('@')[0]),fmt(r.open),fmt(r.inn),fmt(r.ex),fmt(r.ret),fmt(r.bal),r.pend?'<span class="tag w">'+fmt(r.pend)+'</span>':0,r.un||0,(r.pend?'<button class="btn sm" data-a="crApprove" data-p="'+a.id+'">اعتماد المعلّق</button> ':'')+'<button class="btn sm" data-a="crPay" data-p="'+a.id+'">صرف / إرجاع</button>']});
 var nw='<div class="flt" style="margin-top:12px"><label>المهندس (البريد)<input id="cr_own" dir="ltr" list="cr_dl"></label><datalist id="cr_dl">'+Object.keys(S.cfg.roles||{}).map(function(k){return'<option value="'+h(k)+'">'}).join('')+'</datalist><label>اسم العهدة<input id="cr_nm"></label><button class="btn p" data-a="crNew">+ فتح عهدة</button></div>';
 return pg('تسوية العهد الأسبوعية','',tbl([{h:'العهدة'},{h:'المهندس'},{h:'افتتاحي',n:1},{h:'مصروف من الخزينة',n:1},{h:'مصروفات معتمدة',n:1},{h:'مرتجع للخزينة',n:1},{h:'الرصيد',n:1},{h:'معلّق',n:1},{h:'غير مصنّف',n:1},{h:''}],rows,{empty:'لا توجد عهد'})+'<div class="hint" style="margin-top:10px">الرصيد = افتتاحي + ما صُرف من الخزينة − المصروفات المعتمدة − المرتجع. خروج العهدة من الخزينة مرة واحدة عند الصرف فقط، والمصروفات لا تخصم من الخزينة ثانيةً.</div>'+nw)};
ACT.crNew=async function(){if(!isFin()){toast('للمحاسب أو المدير');return}var o=v$('cr_own').trim().toLowerCase(),n=v$('cr_nm').trim()||('عهدة '+o.split('@')[0]);if(!o){toast('اكتب بريد المهندس');return}
 var a={id:uid(),name:n,kind:'cash',opening:0,cust:1,owner:o};if(await dbSet('accounts',a)){S.accounts.push(a);render()}};
ACT.crApprove=async function(id){if(!isFin())return;var l=dxExps(id).filter(function(t){return t.status==='pending'});if(!l.length||!confirm('اعتماد '+l.length+' مصروف بإجمالي '+fmt(sum(l,function(t){return num(t.amount)}))+'؟'))return;
 l.forEach(function(t){t.status='approved';t.audit=(t.audit||[]);t.audit.push({a:'اعتماد تسوية أسبوعية',by:S.user,at:new Date().toISOString()})});if(await dbSetMany('txs',l))render()};
ACT.crPay=function(id){var a=S.accounts.filter(function(x){return x.id===id})[0];if(!a)return;var tr=S.accounts.filter(function(x){return !x.cust});
 modal('صرف / إرجاع عهدة — '+h(a.name),'<div class="fg">'+fld('العملية','<select id="cp_k"><option value="out">صرف عهدة من حساب</option><option value="back">إرجاع رصيد إلى حساب</option></select>')+fld('الحساب (الخزينة/البنك)','<select id="cp_a">'+opts(tr,'',function(x){return x.id},function(x){return x.name})+'</select>')+fld('التاريخ',inp('cp_d',today(),'date'))+fld('المبلغ',inp('cp_m','','number','step="any"'))+'</div>',{save:async function(){var m=r2(num(v$('cp_m'))),s=v$('cp_a');if(!(m>0)||!s){toast('أدخل المبلغ والحساب');return false}var out=v$('cp_k')==='out';
  return await saveTx({type:'transfer',date:v$('cp_d'),from:out?s:a.id,to:out?a.id:s,amount:m,desc:(out?'صرف عهدة: ':'إرجاع عهدة: ')+a.name,custody:true})&&(render(),true)}})};
document.addEventListener('input',function(ev){var i=ev.target.id;if(i==='dx_qty'||i==='dx_price')dxTotal()});
document.addEventListener('change',function(ev){var i=ev.target.id;if(i==='dx_proj')ACT.dxBoq();else if(i==='dx_ph')ACT.dxPhoto()});
