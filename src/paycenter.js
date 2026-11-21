/* ===== مركز الصرف الأسبوعي: شاشة واحدة = قائمة جاهزية + من يُصرف له وكم + النقد المطلوب ===== */
function pcWeeks(){var m={};wkWeeks().concat(wgWeeks()).forEach(function(d){m[d]=1});return Object.keys(m).sort().reverse()}
function pcChecks(w){var from=impAdd(w,-6),a=cwAcc(),ck=[];
 var held=S.projects.filter(function(p){return p.hold}).length,pend=S.txs.filter(function(t){return t.status==='pending'&&t.date&&t.date>=from&&t.date<=w}).length;
 var bal=a?r2(accStats(a).bal):null,rows=wkRows({week:w,scope:'week'}),wr=rows.filter(function(r){return r.warn}).length,neg=rows.filter(function(r){return r.net<-0.5}).length;
 var al=a?(S.cfg.wAlias||{}):{},openAdv=0;wgSheets({week:w}).forEach(function(s){(s.t.rows||[]).forEach(function(x){if(workerAdv(x.name)>0.5)openAdv++})});
 var unl=0;S.txs.forEach(function(t){if(t.type==='adv'&&t.kind==='worker'&&t.date>=from&&t.date<=w&&t.status!=='cancelled'&&!(al[t.party])){var found=false;S.txs.forEach(function(l){if(l.type==='labor'&&(l.rows||[]).some(function(r){return r.name===t.party}))found=true});if(!found)unl++}});
 ck.push({ok:!!a,t:'خزنة الموقع (العهدة) موجودة',d:a?h(a.name):'تُنشأ عند أول استيراد',go:'accounts'});
 ck.push({ok:bal==null||bal>=0,t:'رصيد العهدة غير سالب',d:bal==null?'—':fmt(bal),go:'custweek',lvl:'w'});
 ck.push({ok:pend===0,t:'لا توجد مصروفات معلّقة لهذا الأسبوع',d:pend?pend+' بند يحتاج استكمال':'',go:'review'});
 ck.push({ok:held===0,t:'لا توجد مشاريع معلّقة (اسم مشابه)',d:held?held+' مشروع':'',go:'home'});
 ck.push({ok:unl===0,t:'كل سلف العمال مربوطة بعامل',d:unl?unl+' سلفة غير مربوطة':'',go:'custweek'});
 ck.push({ok:rows.length>0,t:'مستخلصات الأسبوع محمّلة',d:rows.length+' مستخلص',go:'import'});
 return ck}
VIEWS.paycenter=function(){var W=pcWeeks();if(!S.wk.week||W.indexOf(S.wk.week)<0)S.wk.week=W[0]||'';var w=S.wk.week,from=impAdd(w,-6);
 var sel='<div class="flt"><label>الأسبوع (ينتهي في)<select data-wf="week">'+W.map(function(d){return'<option'+(d===w?' selected':'')+'>'+d+'</option>'}).join('')+'</select></label></div>';
 if(!W.length)return pg('مركز الصرف الأسبوعي','','<div class="hint w">لا توجد أسابيع محمّلة بعد — ابدأ من «استيراد كشوف الخميس».</div><a class="btn p" data-a="go" data-p="import">استيراد</a>');
 var ck=pcChecks(w),bad=ck.filter(function(c){return!c.ok}),rows=wkRows({week:w,scope:'week'}),ws=wgSheets({week:w});
 var cDue=sum(rows,function(r){return r.net}),cRem=sum(rows,function(r){return r.rem>0?r.rem:0}),cCust=sum(rows,function(r){return Math.max(0,r.paid)}),wNet=sum(ws,function(x){return x.net}),wRem=sum(ws,function(x){return x.rem>0?x.rem:0}),a=cwAcc(),bal=a?r2(accStats(a).bal):0;
 var need=r2(cRem+wRem);
 var kp='<div class="kpis">'+kpi('مستحق المقاولين',fmt(cDue),rows.length+' مستخلص')+kpi('مستحق العمال (صافي)',fmt(wNet),ws.length+' كشف')+kpi('مخصوم/مدفوع بالفعل',fmt(cCust+sum(ws,function(x){return x.paid})),'عهدة + سلف + مدفوع')+kpi('النقد المطلوب للصرف',fmt(need),'المتبقي للمقاولين والعمال','pos')+kpi('رصيد العهدة',fmt(bal),a?h(a.name):'','neg'.slice(0,bal<0?3:0))+'</div>';
 var gate=bad.length?'<div class="hint w"><b>غير جاهز للصرف:</b> '+bad.length+' بند يحتاج مراجعة (موضّح بالأسفل).</div>':'<div class="hint g"><b>جاهز للصرف ✔</b> — كل بنود المراجعة سليمة.</div>';
 var cl='<div class="card"><h3>١) قائمة الجاهزية قبل الصرف</h3>'+tbl([{h:''},{h:'البند'},{h:'التفصيل'},{h:''}],ck.map(function(c){return[c.ok?'<span class="tag g">✔</span>':'<span class="tag w">!</span>',c.t,h(c.d||''),c.ok?'':'<a class="btn sm" data-a="go" data-p="'+c.go+'">معالجة</a>']}))+'</div>';
 var cr=rows.slice().sort(function(a,b){return b.rem-a.rem}).map(function(r){return[h(r.cname),h(r.pname),fmt(r.net),fmt(Math.max(0,r.paid)),'<b>'+fmt(r.rem)+'</b>',r.rem<=0.5?'<span class="tag g">مسدَّد</span>':(r.paid>500?'<span class="tag">جزئي</span>':'<span class="tag w">لم يُصرف</span>'),r.warn?'<span class="tag w">'+h(r.warn)+'</span>':'']});
 var s2='<div class="card"><h3>٢) المقاولون — من يُصرف له وكم</h3>'+tbl([{h:'المقاول'},{h:'المشروع'},{h:'المستحق',n:1},{h:'خُصم/دُفع',n:1},{h:'المتبقي',n:1},{h:'الحالة'},{h:'تنبيه'}],cr.concat([['<b>الإجمالي</b>','',fmt(cDue),fmt(cCust),'<b>'+fmt(cRem)+'</b>','','']]),{empty:'لا توجد مستخلصات'})+'<div style="margin-top:8px"><a class="btn p" data-a="go" data-p="wkpay">فتح كشف المقاولين للصرف</a> <a class="btn" data-a="go" data-p="custweek">مراجعة العهدة</a></div></div>';
 var wr2=ws.map(function(x){return[h(x.pname),x.n,fmt(x.total),fmt(x.adv),fmt(x.net),'<b>'+fmt(x.rem)+'</b>',x.rem<=0.5?'<span class="tag g">مسدَّد</span>':'<span class="tag w">لم يُصرف</span>']});
 var s3='<div class="card"><h3>٣) العمال — كشوف الأسبوع</h3>'+tbl([{h:'الموقع/المشروع'},{h:'عمال',n:1},{h:'الإجمالي',n:1},{h:'سلف مخصومة',n:1},{h:'الصافي',n:1},{h:'المتبقي',n:1},{h:'الحالة'}],wr2.concat([['<b>الإجمالي</b>','',fmt(sum(ws,function(x){return x.total})),fmt(sum(ws,function(x){return x.adv})),fmt(wNet),'<b>'+fmt(wRem)+'</b>','']]),{empty:'لا توجد كشوف أجور'})+'<div style="margin-top:8px"><a class="btn p" data-a="go" data-p="wkwages">فتح كشف العمال للصرف</a></div></div>';
 return pg('مركز الصرف الأسبوعي','',sel+gate+kp+cl+s2+s3)};
