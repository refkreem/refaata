/* ===== مطابقة حسابات المقاولين مع الشيتات: صفًا بصف (الشيت هو المرجع) ===== */
function crcRows(w){var out=[];wkRows({week:w,scope:'week'}).forEach(function(r){var c=S.txs.filter(function(t){return t.type==='sub'&&t.cum&&!t.corr&&t.status!=='cancelled'&&t.date===w&&t.party_id===r.con&&t.project_id===r.pid})[0];if(!c)return;
 var hasSheet=c.sheet_due!=null,G=num(c.sheet_G),P=num(c.sheet_P),D=num(c.sheet_due),K=num(c.sheet_cust),B=c.imp_items?r2(sum(c.imp_items,function(x){return num(x.b)})):null,diff=B==null?null:r2(r.rem-B),st='ok',why='مطابق';
 if(!hasSheet||B==null){st='na';why='لا توجد بيانات شيت لهذا المستخلص'}
 else if(Math.abs(diff)>1){if(Math.abs(r2(D-K-B))>1){st='sheet';why='الشيت نفسه غير متسق: المستحق − العهدة = '+fmt(r2(D-K))+' والرصيد المكتوب '+fmt(B)}
  else if(diff<0&&r.paid-K>0.5){st='paid';why='دفعات سُجّلت بعد الشيت: '+fmt(r2(-diff))}else{st='rev';why='فرق غير مفسَّر — راجع الصف'}}
 out.push({r:r,c:c,G:G,P:P,D:D,K:K,B:B,diff:diff,st:st,why:why})});
 var sv={rev:0,sheet:1,paid:2,na:3,ok:4};out.sort(function(a,b){return sv[a.st]-sv[b.st]});return out}
VIEWS.conrec=function(){var W=wkWeeks();if(!S.wk.week||W.indexOf(S.wk.week)<0)S.wk.week=W[0]||'';var w=S.wk.week,L=crcRows(w);if(S.crcOnly){var one=L.filter(function(x){return x.c.id===S.crcOnly});if(one.length)L=one;else S.crcOnly=''}var AK=S.cfg.crcAck||{},cnt=function(s){return L.filter(function(x){return x.st===s}).length};
 var sel='<div class="flt noprint"><label>الأسبوع<select data-wf="week">'+W.map(function(x){return'<option'+(x===w?' selected':'')+'>'+x+'</option>'}).join('')+'</select></label></div>';
 var k='<div class="grid g4" style="margin-bottom:10px">'+kpi('حسابات الأسبوع',L.length)+kpi('مطابقة للشيت',cnt('ok'),'',cnt('ok')===L.length?'good':'')+kpi('فرق بسبب دفعات بعد الشيت',cnt('paid'),'طبيعي')+kpi('تحتاج مراجعة',cnt('rev')+cnt('sheet'),cnt('sheet')?cnt('sheet')+' منها خطأ داخل الشيت':'',cnt('rev')+cnt('sheet')?'warn':'good')+'</div>';
 var tag={ok:'<span class="tag g">مطابق</span>',paid:'<span class="tag a">دفعات لاحقة</span>',sheet:'<span class="tag w">خطأ بالشيت</span>',rev:'<span class="tag b">راجع</span>',na:'<span class="tag">بلا شيت</span>'};
 var rows=L.map(function(x){return[h(x.r.cname),h(x.r.pname),fmt(x.G),fmt(x.P),fmt(x.D),fmt(x.K),x.B==null?'—':fmt(x.B),fmt(x.r.rem),x.diff==null?'—':(x.diff===0?'0':fmt(x.diff)),tag[x.st]+' <small>'+h(x.why)+'</small>'+((x.st==='sheet'||x.st==='rev')?(AK[x.c.id]?' <span class="tag g">معتمد</span>':'<br><button class="btn sm p" data-a="crcAck" data-p="'+x.c.id+'">اعتماد رقم الشيت</button> <button class="btn sm" data-a="conFile" data-p="'+x.c.party_id+'">تصحيح الحركات</button> <button class="btn sm" data-a="wkStmt" data-p="'+h(x.r.key)+'">كشف</button>'):'')]});
 return pg('مطابقة المقاولين مع الشيتات',S.crcOnly?'<button class="btn" data-a="crcAll">عرض كل الأسبوع</button>':'',sel+k+tbl([{h:'المقاول'},{h:'المشروع'},{h:'إجمالي الأعمال (شيت)',n:1},{h:'سبق صرفه (شيت)',n:1},{h:'المستحق (شيت)',n:1},{h:'خصم العهدة (شيت)',n:1},{h:'الرصيد بالشيت',n:1},{h:'المتبقي بالنظام',n:1},{h:'الفرق',n:1},{h:'الحالة'}],rows,{empty:'لا توجد مستخلصات في هذا الأسبوع'})+'<div class="hint">الشيت هو المرجع: «الرصيد بالشيت» هو مجموع عمود الرصيد لسطور المقاول. المتبقي بالنظام = الرصيد بعد خصم دفعاتك المسجلة بعد الشيت. أي فرق غير مفسَّر يظهر «راجع» ويُفتح صفّه للمقارنة.</div>')};

ACT.crcOpen=function(id){var c=S.txs.filter(function(t){return t.id===id})[0];if(c)S.wk.week=c.date;S.crcOnly=id;go('conrec')};
ACT.crcAll=function(){S.crcOnly='';render()};
ACT.crcAck=async function(id){S.cfg.crcAck=Object.assign({},S.cfg.crcAck||{});S.cfg.crcAck[id]=1;await saveCfg();toast('اعتُمد رقم الشيت');render()};
/* دفعات مقاولين بلا اسم مقاول: تحديد سريع */
VIEWS.fixpay=function(){var L=S.txs.filter(function(t){return t.type==='payment'&&t.kind==='contractor'&&!t.party_id&&t.status!=='rejected'}).sort(function(a,b){return String(b.date).localeCompare(String(a.date))});
 var rows=L.map(function(t){return[t.date,fmt(t.amount),h((t.desc||'').slice(0,90)),h(pname(t.project_id)||'—'),'<select id="fp_'+t.id+'">'+opts(S.cfg.contractors,'',function(c){return c.id},function(c){return c.name},'— اختر —')+'</select> <button class="btn sm p" data-a="fpSet" data-p="'+t.id+'">حفظ</button>']});
 return pg('دفعات مقاولين بلا اسم','',tbl([{h:'التاريخ'},{h:'المبلغ',n:1},{h:'البيان'},{h:'المشروع'},{h:'المقاول'}],rows,{empty:'لا توجد دفعات بلا مقاول ✔'})+'<div class="hint">اختر المقاول الصحيح لكل دفعة ثم «حفظ»؛ تُحتسب بعدها في حسابه وفي المدفوعات الأسبوعية.</div>')};
ACT.fpSet=async function(id){var c=v$('fp_'+id);if(!c){toast('اختر المقاول');return}var t=S.txs.filter(function(x){return x.id===id})[0];if(!t)return;t.party_id=c;if(await dbSet('txs',t)){toast('تم');render()}};

/* ملف المقاول: كل حركاته مع تعديل/نقل مشروع/حذف */
S.cfile=S.cfile||'';
ACT.conFile=function(id){S.cfile=id;go('confile')};
ACT.cfSel=function(){S.cfile=v$('cf_con');render()};
VIEWS.confile=function(){var cs=S.cfg.contractors||[],id=S.cfile;
 var sel='<div class="flt"><select id="cf_con" data-a="cfSel">'+opts(cs,id,function(c){return c.id},function(c){return c.name},'— اختر المقاول —')+'</select></div>';
 if(!id)return pg('ملف المقاول','',sel+'<div class="empty">اختر المقاول لعرض كل حركاته وتصحيحها</div>');
 var L=S.txs.filter(function(t){return t.party_id===id&&(t.type==='sub'||t.type==='adv'||(t.type==='payment'&&t.kind==='contractor'))&&t.status!=='cancelled'}).sort(function(a,b){return String(a.date).localeCompare(String(b.date))});
 var G={};L.forEach(function(t){var k=t.project_id||'';(G[k]=G[k]||[]).push(t)});
 var pOpts=function(cur){return opts(S.projects,cur,function(p){return p.id},function(p){return p.name},'— بلا مشروع —')};
 var out=Object.keys(G).map(function(k){var rows=G[k].map(function(t){var amt=t.type==='sub'?(t.cum?num(t.cum_value):num(t.net)):num(t.amount);var ty=t.type==='sub'?(t.cum?'شهادة تراكمية':'مستخلص'):t.type==='adv'?'سلفة':'دفعة';
  return[t.date,ty+(t.no?' '+t.no:''),fmt(amt),fmt(t.type==='sub'?num(t.paid):0),'<button class="btn sm" data-a="txEdit" data-p="'+t.id+'">تعديل</button> <button class="btn sm d" data-a="cfDel" data-p="'+t.id+'">حذف</button>']});
  return'<div class="card" style="margin-bottom:12px"><div class="flt"><b>'+h(pname(k)||'بلا مشروع')+'</b> <span class="muted">('+G[k].length+' حركة)</span><select id="cf_to_'+h(k||'none')+'">'+pOpts('')+'</select><button class="btn sm p" data-a="cfMove" data-p="'+h(k)+'">نقل كل حركات هذا المشروع إلى المشروع المختار</button></div>'+tbl([{h:'التاريخ'},{h:'النوع'},{h:'القيمة',n:1},{h:'المدفوع',n:1},{h:'إجراء'}],rows)+'</div>'}).join('');
 return pg('ملف المقاول: '+cname(id),'<button class="btn" data-a="back">↩ رجوع</button>',sel+(out||'<div class="empty">لا توجد حركات</div>')+'<div class="hint">«نقل» يغيّر مشروع كل حركات المقاول في المشروع المعروض (شهادات ودفعات)، و«حذف» يحذف الحركة نهائيًا، و«تعديل» يفتح نموذجها كاملاً.</div>')};
ACT.cfMove=async function(k){var to=v$('cf_to_'+(k||'none'));if(!to){toast('اختر المشروع الجديد');return}var L=S.txs.filter(function(t){return t.party_id===S.cfile&&(t.project_id||'')===k&&(t.type==='sub'||t.type==='adv'||(t.type==='payment'&&t.kind==='contractor'))}),n=0;for(var i=0;i<L.length;i++){L[i].project_id=to;if(await dbSet('txs',L[i]))n++}toast('نُقلت '+n+' حركة إلى '+pname(to));render()};
ACT.cfDel=function(id){ACT.txDel(id)};
