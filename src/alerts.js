/* ===== مركز التنبيهات الموحّد: يجمع كل التنبيهات في قائمة واحدة مرتبة بالأهمية ===== */
/* sev: 3 حرج · 2 تنبيه · 1 للعلم */
function acAll(){var o=[];function A(sev,cat,msg,go,p){o.push({sev:sev,cat:cat,msg:msg,go:go||'',p:p||''})}
 S.accounts.forEach(function(a){var b=accStats(a).bal;if(b<-0.5)A(3,a.cust||/عصام/.test(a.name||'')?'العهدة':'السيولة','رصيد «'+h(a.name)+'» سالب: '+fmt(b)+(a.cust?' — موّل العهدة بتحويل وارد':''),a.cust?'custweek':'accounts')});
 var pend=S.txs.filter(function(t){return t.status==='pending'});if(pend.length)A(2,'العهدة',pend.length+' حركة بانتظار الاعتماد/الاستكمال ('+fmt(sum(pend,function(t){return num(t.amount)||num(t.net)||0}))+')','review');
 var un=S.txs.filter(function(t){return t.type==='expense'&&t.unclassified&&t.status!=='rejected'&&t.status!=='pending'}).length;if(un)A(1,'التكلفة',un+' مصروف موقع غير مربوط ببند مقايسة','custrec');
 S.projects.forEach(function(p){if(p.hold)A(1,'البيانات','مشروع باسم مشابه لمشروع آخر: '+h(p.name)+' — أكّد أنه مشروع جديد أو ادمجه','home')});
 hmIncomplete().filter(function(x){return x.a!=='projHoldAsk'}).slice(0,15).forEach(function(x){A(1,'البيانات','استكمل بيانات '+x.t+' «'+h(x.n)+'»: '+x.w,'home')});
 S.projects.filter(function(p){return!p.hold}).forEach(function(p){var r=mgProj(p);if(r.st==='b')A(3,'المشاريع','«'+h(p.name)+'»: '+r.msg+' (تكلفة '+mgPct(r.cp)+' / إنجاز '+mgPct(r.prog)+')','mgr');else if(r.st==='w')A(2,'المشاريع','«'+h(p.name)+'»: '+r.msg,'mgr');
  (p.boq||[]).forEach(function(b){var s=itemState(p.id,b.id);if(s&&s.bud>0&&s.u.total>s.bud*1.0001)A(2,'المقايسة',h(p.name)+' › '+h(boqLabel(b))+': تجاوز البند '+fmt(s.u.total-s.bud),'costctl')})});
 var W=(typeof pcWeeks==='function'?pcWeeks():[])[0];
 if(W&&typeof crcRows==='function')crcRows(W).forEach(function(x){if(x.st==='rev'||x.st==='sheet')A(2,'المقاولون',h(x.r.cname)+' — '+h(x.r.pname)+': '+x.why,'conrec')});
 var np=S.txs.filter(function(t){return t.type==='payment'&&t.kind==='contractor'&&!t.party_id&&t.status!=='rejected'}).length;if(np)A(2,'المقاولون',np+' دفعة مقاول بلا اسم مقاول — حدّد المقاول','review');
 if(W){pcChecks(W).forEach(function(c){if(!c.ok&&c.go!=='home'&&c.go!=='review'&&!/رصيد العهدة/.test(c.t))A(c.lvl==='w'?2:3,'الصرف الأسبوعي',c.t+(c.d?' — '+c.d:'')+' (أسبوع '+W+')',c.go)});
}
 var od=0;S.txs.forEach(function(t){if(t.type==='sub'&&t.status==='pending')od++});
 o.sort(function(a,b){return b.sev-a.sev});return o}
function acCount(){try{return acAll().filter(function(x){return x.sev>=2}).length}catch(e){return 0}}
VIEWS.alerts=function(){var L=acAll(),f=S.acf||'',cats={};L.forEach(function(x){cats[x.cat]=(cats[x.cat]||0)+1});
 var shown=f?L.filter(function(x){return x.cat===f}):L,tag={3:'<span class="tag b">حرج</span>',2:'<span class="tag w">تنبيه</span>',1:'<span class="tag">للعلم</span>'};
 var k='<div class="grid g4" style="margin-bottom:12px">'+kpi('حرج',L.filter(function(x){return x.sev===3}).length,'يحتاج تدخل الآن',L.some(function(x){return x.sev===3})?'bad':'good')+kpi('تنبيه',L.filter(function(x){return x.sev===2}).length,'',L.some(function(x){return x.sev===2})?'warn':'good')+kpi('للعلم',L.filter(function(x){return x.sev===1}).length,'')+kpi('الإجمالي',L.length,'')+'</div>';
 var flt='<div class="flt" style="margin-bottom:10px"><button class="btn sm'+(f?'':' p')+'" data-a="acFilter" data-p="">الكل</button>'+Object.keys(cats).map(function(c){return'<button class="btn sm'+(f===c?' p':'')+'" data-a="acFilter" data-p="'+h(c)+'">'+h(c)+' ('+cats[c]+')</button>'}).join('')+'</div>';
 var rows=shown.map(function(x){return[tag[x.sev],h(x.cat),x.msg,x.go?'<button class="btn sm" data-a="go" data-p="'+x.go+'">افتح</button>':'']});
 return pg('مركز التنبيهات','',k+flt+(L.length?tbl([{h:''},{h:'القسم'},{h:'التنبيه'},{h:''}],rows,{}):'<div class="hint g">✔ لا توجد تنبيهات — كل شيء سليم.</div>'))};
ACT.acFilter=function(c){S.acf=c||'';render()};

/* تنبيهات سياقية: تظهر في الصفحة المعنية فقط (قسم واحد أو أكثر) */
function ctxAlerts(cats,cur){var L=[];try{L=acAll().filter(function(x){return cats.indexOf(x.cat)>=0})}catch(e){}if(!L.length)return'';var top=L.slice(0,6);return'<details class="hint '+(L.some(function(x){return x.sev===3})?'b':'w')+'" style="margin-bottom:10px" open><summary><b>'+L.length+' تنبيه</b> في هذا القسم</summary>'+top.map(function(x){return'<div style="margin-top:4px">• '+x.msg+(x.go&&x.go!==cur?' <button class="btn sm" data-a="go" data-p="'+x.go+'">افتح</button>':'')+'</div>'}).join('')+(L.length>6?'<div class="mut" style="margin-top:4px">+ '+(L.length-6)+' أخرى</div>':'')+'</details>'}
[['subs',['المقاولون']],['custweek',['العهدة']],['custrec',['العهدة']],['dayexp',['العهدة']],['quick',['العهدة']],['wkpay',['المقاولون']],['accounts',['السيولة']],['projects',['المقايسة','المشاريع']]].forEach(function(q){var o=VIEWS[q[0]];if(!o)return;VIEWS[q[0]]=function(){var r=o.apply(this,arguments);return(S.vp&&q[0]==='projects'?'':ctxAlerts(q[1],q[0]))+r}});
