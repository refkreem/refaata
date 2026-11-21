/* ===== تسجيل سريع من الموقع: شاشة واحدة (موبايل) — مصروف على مشروع/بند، دفعة مقاول، سلفة عامل ===== */
S.qx={kind:'exp',v:{},busy:false,photos:[]};
var QX_KINDS=[['exp','🧾','مصروف / مشتريات'],['con','🤝','دفعة مقاول'],['adv','👷','سلفة عامل']];
var QX_CATS=['خامات ومواد','نقل وانتقالات','أدوات ومعدات','وقود','إعاشة وضيافة','ورش ومصنعيات','أخرى'];
function qxRead(){var v={};['date','proj','acc','amt','desc','sup','cat','qty','unit','price','boq','con','wrk'].forEach(function(k){var e=$('qx_'+k);if(e)v[k]=e.value});return v}
function qxRecentProj(){var seen={},o=[];S.txs.slice().sort(function(a,b){return(b.at||'')>(a.at||'')?1:-1}).forEach(function(t){if(t.project_id&&!seen[t.project_id]&&proj(t.project_id)&&o.length<5){seen[t.project_id]=1;o.push(t.project_id)}});return o}
function qxAccs(){return S.accounts.filter(function(a){return a.cust||/عصام/.test(a.name||'')}).concat(S.accounts.filter(function(a){return!(a.cust||/عصام/.test(a.name||''))}))}
ACT.qxKind=function(k){S.qx.v=Object.assign(S.qx.v,qxRead());S.qx.kind=k;render()};
ACT.qxProj=function(id){S.qx.v=Object.assign(S.qx.v,qxRead());S.qx.v.proj=id;S.qx.v.boq='';render()};
ACT.qxBoq=function(){var p=v$('qx_proj');$('qx_boq').innerHTML=boqOpts(p,'')};
ACT.qxCalc=function(){var q=num(v$('qx_qty')),p=num(v$('qx_price'));if(q&&p)$('qx_amt').value=r2(q*p)};
ACT.qxPhoto=async function(){var fs=Array.prototype.slice.call($('qx_ph').files||[]);for(var f of fs){if(S.qx.photos.length>=3){toast('الحد 3 مرفقات');break}S.qx.photos.push(await srShrink(f))}$('qx_pc').textContent=S.qx.photos.length+' مرفق'};
ACT.qxSend=async function(){if(S.qx.busy)return;var d=qxRead(),k=S.qx.kind,amt=r2(num(d.amt));
 if(!(amt>0)){toast('اكتب المبلغ');return}if(!d.acc){toast('اختر الخزنة / العهدة');return}
 var base={date:d.date||today(),account_id:d.acc,amount:amt,pay_method:'cash',by:S.user,src:'quick'},o;
 if(k==='exp'){if(!d.proj||!String(d.desc||'').trim()){toast('اختر المشروع واكتب البيان');return}
  o=Object.assign(base,{type:'expense',site:1,project_id:d.proj,desc:d.desc.trim(),supplier:(d.sup||'').trim(),category:d.cat||'مصروفات موقع',qty:num(d.qty)||null,unit:d.unit||'',price:num(d.price)||null,boq_id:d.boq||null,unclassified:d.boq?0:1,photos:S.qx.photos.slice()})}
 else if(k==='con'){if(!d.con||!d.proj){toast('اختر المقاول والمشروع');return}
  o=Object.assign(base,{type:'payment',kind:'contractor',party_id:d.con,project_id:d.proj,from_custody:accIsCust(d.acc)?1:0,desc:(d.desc||'').trim()||'دفعة مقاول من الموقع'})}
 else{var nm=String(d.wrk||'').trim();if(!nm){toast('اكتب اسم العامل');return}
  o=Object.assign(base,{type:'adv',kind:'worker',party:nm,project_id:d.proj||null,desc:(d.desc||'').trim()||'سلفة عامل'})}
 o.dkey=['q',k,o.date,o.amount,o.project_id||'',o.party_id||o.party||'',o.desc||''].join('|');
 if(S.txs.some(function(t){return t.dkey===o.dkey})){toast('هذا القيد مسجّل من قبل (منع التكرار)');return}
 var a=S.accounts.filter(function(x){return x.id===d.acc})[0];if(a&&k!=='exp'&&o.amount>accStats(a).bal&&!confirm('المبلغ أكبر من رصيد «'+a.name+'» ('+fmt(accStats(a).bal)+'). متابعة؟'))return;
 S.qx.busy=true;try{if(await saveTx(o)){S.qx.photos=[];var keep={date:d.date,proj:d.proj,acc:d.acc,cat:d.cat,con:d.con};S.qx.v=keep;toast('✔ تم التسجيل: '+fmt(amt));render();setTimeout(function(){var e=$('qx_amt');if(e)e.focus()},50)}}finally{S.qx.busy=false}};
VIEWS.quick=function(){var v=S.qx.v,k=S.qx.kind,accs=qxAccs(),t=today(),rec=qxRecentProj();if(!v.acc&&accs.length)v.acc=accs[0].id;
 var tabs='<div class="qx-tabs">'+QX_KINDS.map(function(q){return'<button class="btn'+(q[0]===k?' p':'')+'" data-a="qxKind" data-p="'+q[0]+'">'+q[1]+' '+q[2]+'</button>'}).join('')+'</div>';
 var chips=rec.length?'<div class="qx-chips">'+rec.map(function(id){var p=proj(id);return'<button class="btn sm'+(v.proj===id?' p':'')+'" data-a="qxProj" data-p="'+id+'">'+h((p.name||'').slice(0,26))+'</button>'}).join('')+'</div>':'';
 var f='<div class="fg">'+fld('المبلغ','<input id="qx_amt" type="number" inputmode="decimal" step="any" class="qx-big" value="'+h(v.amt||'')+'" placeholder="0">','full')+fld('التاريخ',inp('qx_date',v.date||t,'date'))+fld('الخزنة / العهدة','<select id="qx_acc">'+opts(accs,v.acc||'',function(a){return a.id},function(a){return a.name+' — '+fmt(accStats(a).bal)})+'</select>')+fld('المشروع','<select id="qx_proj">'+opts(S.projects.filter(function(p){return!p.hold}),v.proj||'',function(p){return p.id},function(p){return p.name},'— اختر —')+'</select>','full');
 if(k==='exp'){f+=fld('البيان',inp('qx_desc',v.desc||'','text','placeholder="مثال: أسمنت 10 شكاير"'),'full')+fld('بند المقايسة (يحمّل التكلفة على البند)','<select id="qx_boq">'+boqOpts(v.proj||'',v.boq||'')+'</select>','full')+fld('التصنيف','<select id="qx_cat">'+opts((S.cfg.ecats||[]).length?QX_CATS.concat(S.cfg.ecats):QX_CATS,v.cat||'')+'</select>')+fld('المورد / المحل',inp('qx_sup',v.sup||''))+'<details class="full" style="grid-column:1/-1"><summary>كمية وسعر وحدة (اختياري)</summary><div class="fg">'+fld('الكمية',inp('qx_qty',v.qty||'','number','step="any" data-a="qxCalc"'))+fld('الوحدة','<select id="qx_unit">'+opts(S.cfg.units||[],v.unit||'',null,null,'—')+'</select>')+fld('سعر الوحدة',inp('qx_price',v.price||'','number','step="any" data-a="qxCalc"'))+'</div></details>'+fld('صورة الإيصال','<input id="qx_ph" type="file" accept="image/*" capture="environment" multiple data-a="qxPhoto"><small id="qx_pc">'+S.qx.photos.length+' مرفق</small>','full')}
 else if(k==='con'){f+=fld('المقاول','<select id="qx_con">'+opts(S.cfg.contractors||[],v.con||'',function(c){return c.id},function(c){return c.name},'— اختر —')+'</select>','full')+fld('ملاحظة',inp('qx_desc',v.desc||''),'full')}
 else{f+=fld('اسم العامل',inp('qx_wrk',v.wrk||'','text','list="qx_wl" autocomplete="off"')+'<datalist id="qx_wl">'+cwWorkerNames(t).map(function(n){return'<option value="'+h(n)+'">'}).join('')+'</datalist>','full')+fld('ملاحظة',inp('qx_desc',v.desc||''),'full')}
 f+='</div>';
 var mine=S.txs.filter(function(x){return x.src==='quick'&&(isFin()||x.by===S.user)}).sort(function(a,b){return(b.at||'')>(a.at||'')?1:-1}).slice(0,12).map(function(x){return[x.date,x.type==='expense'?'مصروف':x.type==='adv'?'سلفة':'دفعة مقاول',h((proj(x.project_id)||{}).name||'—').slice(0,30),h((x.desc||'').slice(0,34)),fmt(x.amount),'<span class="tag '+(x.status==='pending'?'w':'g')+'">'+(x.status==='pending'?'معلّق':'معتمد')+'</span>']});
 return pg('تسجيل سريع من الموقع','',tabs+chips+'<div class="card">'+f+'<div class="hint">يُرحَّل فورًا على المشروع والبند ويخصم من رصيد الخزنة/العهدة المختارة؛ ويظهر في مراجعة العهدة ومركز الصرف.</div><div class="flt"><button class="btn p qx-send" data-a="qxSend">تسجيل</button></div></div><div class="card"><h3>آخر ما سجّلته</h3>'+tbl([{h:'التاريخ'},{h:'النوع'},{h:'المشروع'},{h:'البيان'},{h:'المبلغ',n:1},{h:''}],mine,{empty:'لا توجد قيود بعد'})+'</div>')};
document.addEventListener('input',function(ev){var i=ev.target.id;if(i==='qx_qty'||i==='qx_price')ACT.qxCalc()});
document.addEventListener('change',function(ev){var i=ev.target.id;if(i==='qx_proj'){S.qx.v=Object.assign(S.qx.v,qxRead());S.qx.v.boq='';render()}else if(i==='qx_ph')ACT.qxPhoto()});
