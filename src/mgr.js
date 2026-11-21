/* ===== لوحة المدير: أين نحن في كل مشروع (تكلفة مقابل ميزانية مقابل إنجاز) + السيولة ===== */
function mgProj(p){var T=projTotals(p.id),bv=projBoqValue(p),bud=sum(p.boq||[],boqBudget),ev=sum(p.boq||[],function(b){var u=itemUse(p.id,b.id);return Math.min(num(b.qty),(u.progQty||u.subQty))*num(b.price)}),
 B=num(p.expected_cost)||bud,prog=bv?ev/bv*100:null,cp=B?T.cost/B*100:null,V=pval(p),
 cpi=(ev&&T.cost)?ev/T.cost:null,eac=(prog&&prog>0)?T.cost/(prog/100):null,st='g',msg='سليم';
 if(!bv||!B){st='n';msg='ناقص بيانات (مقايسة/ميزانية)'}
 else if(cp>100){st='b';msg='تجاوز الميزانية'}
 else if(prog!=null&&cp-prog>10){st='b';msg='الصرف يسبق الإنجاز'}
 else if(prog!=null&&cp-prog>3){st='w';msg='انتبه: الصرف أعلى من الإنجاز'}
 return{p:p,V:V,B:B,cost:T.cost,rev:T.revenue,prog:prog,cp:cp,cpi:cpi,eac:eac,st:st,msg:msg,ev:ev,bv:bv}}
function mgLiq(){var cust=0,cash=0;S.accounts.forEach(function(a){var b=accStats(a).bal;if(a.cust||/عصام/.test(a.name||''))cust+=b;else cash+=b});
 var oc=sum(S.cfg.contractors,function(c){return Math.max(0,contractorLedger(c.id).owed)}),os=sum(S.cfg.suppliers,function(n){return Math.max(0,supplierLedger(n).bal)});
 var pend=sum(S.txs.filter(function(t){return t.status==='pending'&&t.type==='expense'}),function(t){return num(t.amount)});
 return{cust:cust,cash:cash,oc:oc,os:os,pend:pend,net:cash+cust-oc-os-pend}}
function mgPct(v){return v==null?'—':Math.round(v)+'%'}
VIEWS.mgr=function(){var L=mgLiq(),R=S.projects.filter(function(p){return!p.hold}).map(mgProj),sev={b:0,w:1,n:2,g:3};R.sort(function(a,b){return sev[a.st]-sev[b.st]});
 var bad=R.filter(function(r){return r.st==='b'}).length,warn=R.filter(function(r){return r.st==='w'}).length;
 var k='<div class="grid g4" style="margin-bottom:12px">'+kpi('السيولة (خزائن وبنوك)',fmt(L.cash),'',L.cash<0?'bad':'good')+kpi('عهدة الموقع',fmt(L.cust),L.cust<0?'سالبة — موّلها':'',L.cust<0?'bad':'good')+kpi('مستحقات علينا (مقاولون+موردون)',fmt(L.oc+L.os),'مقاولون '+fmt(L.oc)+' · موردون '+fmt(L.os),'warn')+kpi('الصافي بعد الالتزامات',fmt(L.net),L.pend?'يشمل معلّق '+fmt(L.pend):'',L.net<0?'bad':'good')+'</div>';
 var banner=(bad||warn)?'<div class="hint '+(bad?'b':'w')+'" style="margin-bottom:12px"><b>'+(bad?bad+' مشروع يحتاج تدخل':'')+(bad&&warn?' · ':'')+(warn?warn+' مشروع تنبيه':'')+'</b></div>':'<div class="hint g" style="margin-bottom:12px">كل المشاريع ضمن الميزانية والإنجاز.</div>';
 var cards=R.map(function(r){var c={b:'var(--bad,#c0392b)',w:'var(--warn,#d68910)',g:'var(--good,#1e8449)',n:'#888'}[r.st];
  function bar(v,col){var w=Math.max(0,Math.min(100,v||0));return'<div style="background:#0001;border-radius:6px;height:10px;overflow:hidden"><div style="width:'+w+'%;height:10px;background:'+col+'"></div></div>'}
  return'<div class="card" style="border-right:6px solid '+c+'"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><h3 style="margin:0">'+h(r.p.name)+'</h3><span class="tag '+(r.st==='g'?'g':r.st==='n'?'':'w')+'">'+r.msg+'</span></div>'
  +'<div style="margin-top:10px"><small>التكلفة مقابل الميزانية: <b>'+fmt(r.cost)+'</b> من '+fmt(r.B)+' ('+mgPct(r.cp)+')</small>'+bar(r.cp,r.cp>100?'#c0392b':'#2e86c1')+'</div>'
  +'<div style="margin-top:8px"><small>الإنجاز (قيمة منفّذة '+fmt(r.ev)+' من '+fmt(r.bv)+'): <b>'+mgPct(r.prog)+'</b></small>'+bar(r.prog,'#1e8449')+'</div>'
  +'<div class="grid g4" style="margin-top:10px;font-size:13px"><div>قيمة العقد<br><b>'+fmt(r.V)+'</b></div><div>المحصّل<br><b>'+fmt(r.rev)+'</b></div><div>كفاءة التكلفة<br><b>'+(r.cpi==null?'—':r.cpi.toFixed(2))+'</b></div><div>التكلفة المتوقعة عند الإتمام<br><b>'+(r.eac==null?'—':fmt(r.eac))+'</b></div></div>'
  +(r.st==='n'?'<div class="hint w" style="margin-top:8px">ينقص: <b>'+pdMissing(r.p).join(' · ')+'</b></div>':'')+'<div class="flt" style="margin-top:8px"><button class="btn sm" data-a="openProj" data-p="'+r.p.id+'">فتح المشروع</button></div></div>'}).join('');
 return pg('لوحة المدير — أين نحن؟','',k+banner+(cards||'<div class="hint">لا توجد مشاريع.</div>')+'<div class="hint">الإنجاز = كمية منفّذة (تقدم أو مستخلصات) × سعر البند ÷ قيمة المقايسة. كفاءة التكلفة = قيمة المنفّذ ÷ التكلفة (أكبر من 1 جيد). المتوقع عند الإتمام = التكلفة ÷ نسبة الإنجاز.</div>')};
