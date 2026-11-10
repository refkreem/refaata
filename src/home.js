/* ===== الشاشة الرئيسية حسب الدور ===== */
function hmTile(v,ic,t,d,badge){return'<a class="tile" data-a="go" data-p="'+v+'"><span class="tic">'+ic+'</span><b>'+t+'</b><small>'+d+'</small>'+(badge?'<span class="bdg">'+badge+'</span>':'')+'</a>'}
function hmSec(t,tiles){return'<div class="card" style="margin-bottom:12px"><h3>'+t+'</h3><div class="tiles">'+tiles.join('')+'</div></div>'}
function hmMine(){return S.txs.filter(function(t){return t.by===S.user&&t.status==='pending'}).length}
VIEWS.home=function(){var r=S.role,name=h(ROLE_NAMES[r]||''),body='';
 if(r==='admin'||r==='accountant'){
  var liq=sum(S.accounts,function(a){return accStats(a).bal}),pend=pendingCount(),W=wkWeeks()[0],G=wgWeeks()[0],M=today().slice(0,7),mp=mpOf(M);
  var cRem=W?sum(wkRows({week:W}),function(x){return x.rem>0?x.rem:0}):0,wRem=G?sum(wgSheets({week:G}),function(x){return x.rem}):0;
  var neg=S.accounts.filter(function(a){return accStats(a).bal<0}),miss=S.txs.filter(function(t){return t.status==='pending'&&t.imp_missing&&t.imp_missing.length}).length;
  var al=[];if(neg.length)al.push('رصيد سالب في: '+neg.map(function(a){return h(a.name)}).join('، '));if(miss)al.push(miss+' حركة مستوردة ناقصة البيانات');if(!mp)al.push('لم يُنشأ كشف مرتبات شهر '+M);else if(mp.mst==='approved')al.push('مرتبات '+M+' معتمدة وبانتظار الصرف');
  body+='<div class="grid g4" style="margin-bottom:12px">'+kpi('السيولة (كل الحسابات)',fmt(liq),S.accounts.length+' حساب',liq<0?'bad':'')+kpi('بانتظار الاعتماد',pend,pend?'تحتاج مراجعة':'لا يوجد',pend?'warn':'good')+kpi('مستحق للمقاولين'+(W?' ('+W+')':''),fmt(cRem))+kpi('أجور غير مصروفة'+(G?' ('+G+')':''),fmt(wRem))+'</div>';
  if(al.length)body+='<div class="hint b" style="margin-bottom:12px"><b>تنبيهات:</b><br>'+al.join('<br>')+'</div>';
  body+=hmSec('الأسبوعي (كل خميس)',[hmTile('import','📥','استيراد كشوف الخميس','تحميل الملفات الأسبوعية'),hmTile('wkpay','💸','مدفوعات المقاولين','استحقاق الأسبوع والسندات'),hmTile('wkwages','👷','أجور العمال','كشف وصرف الأسبوع'),hmTile('cashreq','🧮','المتطلبات النقدية','كم نحتاج هذا الأسبوع')])+
   hmSec('الشهري',[hmTile('mpay','👔','مرتبات الموظفين','مسودة، اعتماد، صرف'),hmTile('acct','📒','المحاسبة','قيود وميزان وقوائم'),hmTile('accounts','🏦','الخزائن والبنوك','أرصدة وتحويلات')])+
   hmSec('المتابعة والتقارير',[hmTile('dashboard','📊','لوحة التحكم','مؤشرات الشركة'),hmTile('costctl','📐','ضبط التكلفة','ربحية المشاريع والبنود'),hmTile('prcenter','🖨️','مركز الطباعة','12 تقريرًا بالتواقيع'),hmTile('review','✅','المراجعة والاعتماد','الحركات المعلّقة',pend||'')])+
   hmSec('تسجيل يومي',[hmTile('expenses','🧾','مصروف جديد','مصروفات ومشتريات'),hmTile('subs','🤝','مقاولو الباطن','مستخلصات ودفعات'),hmTile('labor','👷','العمالة','كشف عمالة'),hmTile('revenues','💰','تحصيل','إيرادات ومستخلصات العملاء')])}
 else if(r==='engineer'){var mine=hmMine();
  body+='<div class="grid g4" style="margin-bottom:12px">'+kpi('مشاريعي',S.projects.length)+kpi('حركاتي المعلّقة',mine,mine?'بانتظار الاعتماد':'لا يوجد',mine?'warn':'good')+'</div>'+
   hmSec('عمل اليوم',[hmTile('sitereps','📝','تقرير اليوم','تقرير الموقع اليومي'),hmTile('progress','📐','الأعمال المنفذة','سجّل الكميات المنفذة'),hmTile('labor','👷','كشف العمالة','أجور اليومية'),hmTile('expenses','🧾','مصروف / عهدة','سجّل مصروفًا'),hmTile('purchases','🧱','مشتريات','فاتورة شراء'),hmTile('subs','🤝','مقاول باطن','مستخلص')])+
   hmSec('متابعة',[hmTile('projects','🏗️','المشاريع','البنود والتفاصيل'),hmTile('review','✅','حالة طلباتي','المعلّق والمعتمد',mine||'')])}
 else{body+=hmSec('الإشراف الفني',[hmTile('projects','🏗️','المشاريع','المقايسة والتقدم'),hmTile('progress','📐','الأعمال المنفذة','متابعة الإنجاز'),hmTile('reports','📑','التقارير','تكلفة وإنجاز')])}
 return pg('الرئيسية — '+name,h(S.user||''),body)};
