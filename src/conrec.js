/* ===== مطابقة حسابات المقاولين مع الشيتات: صفًا بصف (الشيت هو المرجع) ===== */
function crcRows(w){var out=[];wkRows({week:w,scope:'week'}).forEach(function(r){var c=S.txs.filter(function(t){return t.type==='sub'&&t.cum&&!t.corr&&t.status!=='cancelled'&&t.date===w&&t.party_id===r.con&&t.project_id===r.pid})[0];if(!c)return;
 var hasSheet=c.sheet_due!=null,G=num(c.sheet_G),P=num(c.sheet_P),D=num(c.sheet_due),K=num(c.sheet_cust),B=c.imp_items?r2(sum(c.imp_items,function(x){return num(x.b)})):null,diff=B==null?null:r2(r.rem-B),st='ok',why='مطابق';
 if(!hasSheet||B==null){st='na';why='لا توجد بيانات شيت لهذا المستخلص'}
 else if(Math.abs(diff)>1){if(Math.abs(r2(D-K-B))>1){st='sheet';why='الشيت نفسه غير متسق: المستحق − العهدة = '+fmt(r2(D-K))+' والرصيد المكتوب '+fmt(B)}
  else if(diff<0&&r.paid-K>0.5){st='paid';why='دفعات سُجّلت بعد الشيت: '+fmt(r2(-diff))}else{st='rev';why='فرق غير مفسَّر — راجع الصف'}}
 out.push({r:r,c:c,G:G,P:P,D:D,K:K,B:B,diff:diff,st:st,why:why})});
 var sv={rev:0,sheet:1,paid:2,na:3,ok:4};out.sort(function(a,b){return sv[a.st]-sv[b.st]});return out}
VIEWS.conrec=function(){var W=wkWeeks();if(!S.wk.week||W.indexOf(S.wk.week)<0)S.wk.week=W[0]||'';var w=S.wk.week,L=crcRows(w),cnt=function(s){return L.filter(function(x){return x.st===s}).length};
 var sel='<div class="flt noprint"><label>الأسبوع<select data-wf="week">'+W.map(function(x){return'<option'+(x===w?' selected':'')+'>'+x+'</option>'}).join('')+'</select></label></div>';
 var k='<div class="grid g4" style="margin-bottom:10px">'+kpi('حسابات الأسبوع',L.length)+kpi('مطابقة للشيت',cnt('ok'),'',cnt('ok')===L.length?'good':'')+kpi('فرق بسبب دفعات بعد الشيت',cnt('paid'),'طبيعي')+kpi('تحتاج مراجعة',cnt('rev')+cnt('sheet'),cnt('sheet')?cnt('sheet')+' منها خطأ داخل الشيت':'',cnt('rev')+cnt('sheet')?'warn':'good')+'</div>';
 var tag={ok:'<span class="tag g">مطابق</span>',paid:'<span class="tag a">دفعات لاحقة</span>',sheet:'<span class="tag w">خطأ بالشيت</span>',rev:'<span class="tag b">راجع</span>',na:'<span class="tag">بلا شيت</span>'};
 var rows=L.map(function(x){return[h(x.r.cname),h(x.r.pname),fmt(x.G),fmt(x.P),fmt(x.D),fmt(x.K),x.B==null?'—':fmt(x.B),fmt(x.r.rem),x.diff==null?'—':(x.diff===0?'0':fmt(x.diff)),tag[x.st]+' <small>'+h(x.why)+'</small>']});
 return pg('مطابقة المقاولين مع الشيتات','',sel+k+tbl([{h:'المقاول'},{h:'المشروع'},{h:'إجمالي الأعمال (شيت)',n:1},{h:'سبق صرفه (شيت)',n:1},{h:'المستحق (شيت)',n:1},{h:'خصم العهدة (شيت)',n:1},{h:'الرصيد بالشيت',n:1},{h:'المتبقي بالنظام',n:1},{h:'الفرق',n:1},{h:'الحالة'}],rows,{empty:'لا توجد مستخلصات في هذا الأسبوع'})+'<div class="hint">الشيت هو المرجع: «الرصيد بالشيت» هو مجموع عمود الرصيد لسطور المقاول. المتبقي بالنظام = الرصيد بعد خصم دفعاتك المسجلة بعد الشيت. أي فرق غير مفسَّر يظهر «راجع» ويُفتح صفّه للمقارنة.</div>')};
