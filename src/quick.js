/* ===== تسجيل سريع من الموقع: شاشة واحدة (موبايل) — مصروف على مشروع/بند، دفعة مقاول، سلفة عامل ===== */
S.qx={kind:'exp',v:{},busy:false,photos:[]};
var QX_KINDS=[['exp','🧾','مصروف / مشتريات'],['con','🤝','دفعة مقاول'],['adv','👷','سلفة عامل'],['tip','🎁','إكرامية / نثرية']];
var QX_CATS=['خامات ومواد','نقل وانتقالات','أدوات ومعدات','وقود','إعاشة وضيافة','ورش ومصنعيات','أخرى'];
function qxRead(){var v={};['date','proj','acc','amt','desc','sup','cat','qty','unit','price','boq','con','wrk'].forEach(function(k){var e=$('qx_'+k);if(e)v[k]=e.value});return v}
function qxRecentProj(){var seen={},o=[];S.txs.slice().sort(function(a,b){return(b.at||'')>(a.at||'')?1:-1}).forEach(function(t){if(t.project_id&&!seen[t.project_id]&&proj(t.project_id)&&o.length<5){seen[t.project_id]=1;o.push(t.project_id)}});return o}
function qxAccs(){return S.accounts.filter(function(a){return a.cust||/عصام/.test(a.name||'')}).concat(S.accounts.filter(function(a){return!(a.cust||/عصام/.test(a.name||''))}))}
ACT.qxKind=function(k){S.qx.v=Object.assign(S.qx.v,qxRead());S.qx.kind=k;render()};
ACT.qxProj=function(id){S.qx.v=Object.assign(S.qx.v,qxRead());S.qx.v.proj=id;S.qx.v.boq='';render()};
ACT.qxBoq=function(){var p=v$('qx_proj');$('qx_boq').innerHTML=boqOpts(p,'')};
ACT.qxCalc=function(){var q=num(v$('qx_qty')),p=num(v$('qx_price'));if(q&&p)$('qx_amt').value=r2(q*p)};
ACT.qxPhoto=async function(){var fs=Array.prototype.slice.call($('qx_ph').files||[]);for(var f of fs){if(S.qx.photos.length>=3){toast('الحد 3 مرفقات');break}S.qx.photos.push(await srShrink(f))}$('qx_pc').textContent=S.qx.photos.length+' مرفق'};
function qxFind(id){return S.txs.filter(function(t){return t.id===id})[0]}
ACT.qxSend=async function(){if(S.qx.busy)return;var d=qxRead(),k=S.qx.kind,amt=r2(num(d.amt)),ed=S.qx.edit?qxFind(S.qx.edit):null;
 if(!(amt>0)){toast('اكتب المبلغ');return}if(!d.acc){toast('اختر الخزنة / العهدة');return}
 var base={date:d.date||today(),account_id:d.acc,amount:amt,pay_method:'cash',src:'quick',qk:k},o;
 if(k==='exp'||k==='tip'){if(k==='exp'&&!d.proj){toast('اختر المشروع');return}if(!String(d.desc||'').trim()){toast('اكتب البيان');return}
  o=Object.assign(base,{type:'expense',site:1,project_id:d.proj||null,desc:d.desc.trim(),supplier:(d.sup||'').trim(),category:k==='tip'?'إكراميات':(d.cat||'مصروفات موقع'),qty:num(d.qty)||null,unit:d.unit||'',price:num(d.price)||null,boq_id:k==='exp'&&d.boq?d.boq:null,unclassified:k==='exp'&&d.boq?0:1,photos:S.qx.photos.slice()})}
 else if(k==='con'){if(!d.con||!d.proj){toast('اختر المقاول والمشروع');return}
  o=Object.assign(base,{type:'payment',kind:'contractor',party_id:d.con,project_id:d.proj,from_custody:accIsCust(d.acc)?1:0,desc:(d.desc||'').trim()||'دفعة مقاول من الموقع'})}
 else{var nm=String(d.wrk||'').trim();if(!nm){toast('اكتب اسم العامل');return}
  o=Object.assign(base,{type:'adv',kind:'worker',party:nm,project_id:d.proj||null,desc:(d.desc||'').trim()||'سلفة عامل'})}
 if(typeof closedBlock==='function'&&closedBlock(o.date)){toast('الفترة مقفلة حتى '+S.cfg.closedTo);return}
 o.dkey=['q',k,o.date,o.amount,o.project_id||'',o.party_id||o.party||'',o.desc||''].join('|');
 if(S.txs.some(function(t){return t.dkey===o.dkey&&(!ed||t.id!==ed.id)})){toast('هذا القيد مسجّل من قبل (منع التكرار)');return}
 if(ed){o.id=ed.id;o.by=ed.by;o.at=ed.at;o.status='pending';o.edited_by=S.user;o.edited_at=new Date().toISOString()}
 else{o.id=uid();o.by=S.user;o.at=new Date().toISOString();o.status='pending'}
 o.updated=new Date().toISOString();
 S.qx.busy=true;try{if(!await dbSet('txs',o))return;if(ed)S.txs=S.txs.map(function(x){return x.id===o.id?o:x});else S.txs.push(o);if(ensureReg(o))await saveCfg();
  S.qx.photos=[];S.qx.edit='';var keep={date:d.date,proj:d.proj,acc:d.acc,cat:d.cat,con:d.con};S.qx.v=keep;toast(ed?'✔ حُفظ التعديل (بانتظار اعتماد المكتب)':'✔ سُجّل ومعلّق لاعتماد المكتب: '+fmt(amt));render();setTimeout(function(){var e=$('qx_amt');if(e)e.focus()},50)}finally{S.qx.busy=false}};
ACT.qxEdit=function(id){var x=qxFind(id);if(!x)return;if(x.status!=='pending'&&!isFin()){toast('القيد معتمد — لا يمكن تعديله');return}
 var k=x.qk||(x.type==='payment'?'con':x.type==='adv'?'adv':(x.category==='إكراميات'?'tip':'exp'));S.qx.kind=k;S.qx.edit=id;S.qx.photos=(x.photos||[]).slice();
 S.qx.v={date:x.date,proj:x.project_id||'',acc:x.account_id,amt:x.amount,desc:x.desc==='دفعة مقاول من الموقع'||x.desc==='سلفة عامل'?'':x.desc,sup:x.supplier||'',cat:x.category||'',qty:x.qty||'',unit:x.unit||'',price:x.price||'',boq:x.boq_id||'',con:x.party_id||'',wrk:x.party||''};render();window.scrollTo(0,0)};
ACT.qxFlt=function(k){S.qx.f=k;render()};
ACT.qxCancel=function(){S.qx.edit='';S.qx.v={};S.qx.photos=[];render()};
ACT.qxDel=async function(id){var x=qxFind(id);if(!x)return;if(x.status!=='pending'&&!isFin()){toast('القيد معتمد — لا يمكن حذفه');return}if(x.status!=='pending'){ACT.txDel(id);return}if(!confirm('حذف هذا القيد؟'))return;if(await dbDel('txs',id)){S.txs=S.txs.filter(function(t){return t.id!==id});if(S.qx.edit===id)S.qx.edit='';toast('حُذف');render()}};
ACT.qxOk=async function(id){var x=qxFind(id);if(!x)return;await ACT.txOk(id)};
ACT.qxRej=async function(id){var x=qxFind(id);if(!x)return;x.status='rejected';x.rejected_by=S.user;if(await dbSet('txs',x)){toast('رُفض القيد');render()}};
ACT.qxOkAll=async function(){var L=S.txs.filter(function(x){return x.src==='quick'&&x.status==='pending'});if(!L.length)return;if(!S.qx.ok2){S.qx.ok2=1;toast('اضغط مرة أخرى لاعتماد '+L.length+' قيد');setTimeout(function(){S.qx.ok2=0},4000);return}S.qx.ok2=0;var n=0;for(var i=0;i<L.length;i++){L[i].status='approved';L[i].approved_by=S.user;if(await dbSet('txs',L[i]))n++}toast('اعتُمد '+n+' قيد');render()};
VIEWS.quick=function(){var v=S.qx.v,k=S.qx.kind,accs=qxAccs(),t=today(),rec=qxRecentProj();if(!v.acc&&accs.length)v.acc=accs[0].id;
 var tabs='<div class="qx-tabs">'+QX_KINDS.map(function(q){return'<button class="btn'+(q[0]===k?' p':'')+'" data-a="qxKind" data-p="'+q[0]+'">'+q[1]+' '+q[2]+'</button>'}).join('')+'</div>';
 var chips=rec.length?'<div class="qx-chips">'+rec.map(function(id){var p=proj(id);return'<button class="btn sm'+(v.proj===id?' p':'')+'" data-a="qxProj" data-p="'+id+'">'+h((p.name||'').slice(0,26))+'</button>'}).join('')+'</div>':'';
 var f='<div class="fg">'+fld('المبلغ','<input id="qx_amt" type="number" inputmode="decimal" step="any" class="qx-big" value="'+h(v.amt||'')+'" placeholder="0">','full')+fld('التاريخ',inp('qx_date',v.date||t,'date'))+fld('الخزنة / العهدة','<select id="qx_acc">'+opts(accs,v.acc||'',function(a){return a.id},function(a){return a.name+' — '+fmt(accStats(a).bal)})+'</select>')+fld('المشروع','<select id="qx_proj">'+opts(S.projects.filter(function(p){return!p.hold}),v.proj||'',function(p){return p.id},function(p){return p.name},'— اختر —')+'</select>','full');
 if(k==='exp'){f+=fld('البيان',inp('qx_desc',v.desc||'','text','placeholder="مثال: أسمنت 10 شكاير"'),'full')+fld('بند المقايسة (يحمّل التكلفة على البند)','<select id="qx_boq">'+boqOpts(v.proj||'',v.boq||'')+'</select>','full')+fld('التصنيف','<select id="qx_cat">'+opts((S.cfg.ecats||[]).length?QX_CATS.concat(S.cfg.ecats):QX_CATS,v.cat||'')+'</select>')+fld('المورد / المحل',inp('qx_sup',v.sup||''))+'<details class="full" style="grid-column:1/-1"><summary>كمية وسعر وحدة (اختياري)</summary><div class="fg">'+fld('الكمية',inp('qx_qty',v.qty||'','number','step="any" data-a="qxCalc"'))+fld('الوحدة','<select id="qx_unit">'+opts(S.cfg.units||[],v.unit||'',null,null,'—')+'</select>')+fld('سعر الوحدة',inp('qx_price',v.price||'','number','step="any" data-a="qxCalc"'))+'</div></details>'+fld('صورة الإيصال','<input id="qx_ph" type="file" accept="image/*" capture="environment" multiple data-a="qxPhoto"><small id="qx_pc">'+S.qx.photos.length+' مرفق</small>','full')}
 else if(k==='con'){f+=fld('المقاول','<select id="qx_con">'+opts(S.cfg.contractors||[],v.con||'',function(c){return c.id},function(c){return c.name},'— اختر —')+'</select>','full')+fld('ملاحظة',inp('qx_desc',v.desc||''),'full')}
 else{f+=fld('اسم العامل',inp('qx_wrk',v.wrk||'','text','list="qx_wl" autocomplete="off"')+'<datalist id="qx_wl">'+cwWorkerNames(t).map(function(n){return'<option value="'+h(n)+'">'}).join('')+'</datalist>','full')+fld('ملاحظة',inp('qx_desc',v.desc||''),'full')}
 f+='</div>';

 var QN={exp:'مصروف',tip:'إكرامية',con:'دفعة مقاول',adv:'سلفة'},ST={pending:['معلّق','w'],approved:['معتمد','g'],rejected:['مرفوض','r']};
 var all=S.txs.filter(function(x){return x.src==='quick'&&(isFin()||x.by===S.user)}).sort(function(a,b){return(b.at||'')>(a.at||'')?1:-1});
 var fl=S.qx.f||'pending',shown=all.filter(function(x){return fl==='all'||x.status===fl}).slice(0,60);
 var pend=all.filter(function(x){return x.status==='pending'});
 var mine=shown.map(function(x){var st=ST[x.status]||['—',''],kk=x.qk||(x.type==='payment'?'con':x.type==='adv'?'adv':'exp'),can=x.status==='pending'||isFin();
  var ac='';if(can)ac+='<button class="btn sm" data-a="qxEdit" data-p="'+x.id+'">تعديل</button> <button class="btn sm d" data-a="qxDel" data-p="'+x.id+'">حذف</button>';
  if(isFin()&&x.status==='pending')ac+=' <button class="btn sm p" data-a="qxOk" data-p="'+x.id+'">اعتماد</button> <button class="btn sm" data-a="qxRej" data-p="'+x.id+'">رفض</button>';
  return[x.date,QN[kk]||kk,h((proj(x.project_id)||{}).name||'—'),h((x.desc||'')+(x.party_id?' — '+cname(x.party_id):x.party?' — '+x.party:'')),fmt(x.amount),'<span class="tag '+st[1]+'">'+st[0]+'</span>',ac]});
 var fb='<div class="flt noprint">'+[['pending','معلّقة ('+pend.length+')'],['approved','معتمدة'],['rejected','مرفوضة'],['all','الكل']].map(function(q){return'<button class="btn sm'+(fl===q[0]?' p':'')+'" data-a="qxFlt" data-p="'+q[0]+'">'+q[1]+'</button>'}).join('')+(isFin()&&pend.length?'<button class="btn sm p" data-a="qxOkAll" style="margin-inline-start:auto">اعتماد كل المعلّق ('+pend.length+')</button>':'')+'</div>';
 var ed=S.qx.edit?qxFind(S.qx.edit):null;return pg('تسجيل سريع من الموقع','',tabs+(ed?'<div class="hint w">✏️ تعديل قيد بتاريخ '+ed.date+' بمبلغ '+fmt(ed.amount)+' — <button class="btn sm" data-a="qxCancel">إلغاء التعديل</button></div>':'')+chips+'<div class="card">'+f+'<div class="hint">كل قيد يُسجَّل <b>معلّقًا</b> ولا يؤثر على رصيد الخزنة ولا تكلفة المشروع إلا بعد <b>اعتماد المكتب</b>. يمكنك تعديله أو حذفه ما دام معلّقًا.</div><div class="flt"><button class="btn p qx-send" data-a="qxSend">'+(ed?'حفظ التعديل':'تسجيل')+'</button></div></div><div class="card"><h3>قيودي من الموقع</h3>'+fb+tbl([{h:'التاريخ'},{h:'النوع'},{h:'المشروع'},{h:'البيان'},{h:'المبلغ',n:1},{h:'الحالة'},{h:''}],mine,{empty:'لا توجد قيود في هذا العرض'})+'</div>')};
document.addEventListener('input',function(ev){var i=ev.target.id;if(i==='qx_qty'||i==='qx_price')ACT.qxCalc()});
document.addEventListener('change',function(ev){var i=ev.target.id;if(i==='qx_proj'){S.qx.v=Object.assign(S.qx.v,qxRead());S.qx.v.boq='';render()}else if(i==='qx_ph')ACT.qxPhoto()});
