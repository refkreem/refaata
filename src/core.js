'use strict';
var NS='v4';
var FIREBASE_CONFIG={apiKey:"AIzaSyBb80zFyo-kaykUD58wttrpCGsHDdqCTfw",authDomain:"moqawel-claude.firebaseapp.com",projectId:"moqawel-claude",storageBucket:"moqawel-claude.firebasestorage.app",messagingSenderId:"949127912931",appId:"1:949127912931:web:b80df53ddbc36549e114d6"};
var PCATS_DEFAULT=['صحية','كهربائية','معمارية','إنذار','غازات','تكييف','أخرى'];var PCATS_OLD=['كهرباء','صحي','أعمال دهانات','أخرى'];
function bondInit(p){return(p.bond_init!=null&&p.bond_init!=='')?num(p.bond_init):r2(num(p.value)*0.01)}
function bondFinal(p){return(p.bond_final!=null&&p.bond_final!=='')?num(p.bond_final):r2(num(p.value)*0.05)}
function defaultCfg(){return{company:{name:'',phone:'',address:''},pcats:PCATS_DEFAULT.slice(),units:['م','م2','م3','عدد','طن','كجم','متر طولي','لفة','مقطوعية','يوم'],
ecats:['نقل وانتقالات','إكراميات','ضرائب وتأمينات','إيجارات','رواتب إدارية','مرافق (كهرباء/مياه/اتصالات)','عدد وأدوات','أخرى'],
rcats:['دفعة مقدمة','مستخلص جاري','مستخلص ختامي','محتجز / ضمان أعمال','أخرى'],
catalog:[],contractors:[],suppliers:[],workers:[],roles:{}};}
var S={db:null,user:'',role:'admin',view:'accounts',vp:null,tab:'boq',accounts:[],projects:[],txs:[],cfg:defaultCfg(),rf:{},lf:{},modalSave:null};
var $=function(id){return document.getElementById(id)};
function h(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(v){if(typeof v==='number')return isFinite(v)?v:0;var s=String(v==null?'':v).replace(/[٠-٩]/g,function(d){return'٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).replace(/[,٬\s]/g,'').replace('٫','.');var n=parseFloat(s);return isFinite(n)?n:0}
function r2(n){return Math.round((n+Number.EPSILON)*100)/100}
function fmt(n){n=r2(num(n));return n.toLocaleString('en-US',{maximumFractionDigits:2})}
function fq(n){n=Math.round(num(n)*1000)/1000;return n.toLocaleString('en-US',{maximumFractionDigits:3})}
function uid(){return'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function addMonths(iso,m){if(!iso)return'';var p=iso.split('-').map(Number);var d=new Date(p[0],p[1]-1+m,1);var last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(p[2],last));return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function daysTo(iso){if(!iso)return null;var p=iso.split('-').map(Number);var t=new Date();t.setHours(0,0,0,0);return Math.round((new Date(p[0],p[1]-1,p[2])-t)/864e5)}
function initialDate(p){return p.start&&p.months?addMonths(p.start,num(p.months)):''}
function finalDate(p){var i=initialDate(p);return i?addMonths(i,12):''}
function toast(m){var t=$('toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(function(){t.style.display='none'},3200)}
function by(a,f){return a.slice().sort(function(x,y){var u=f(x),v=f(y);return u<v?-1:u>v?1:0})}
function sum(a,f){var s=0;for(var i=0;i<a.length;i++)s+=num(f?f(a[i]):a[i]);return s}
function cls(n){return n>0.004?'good':n<-0.004?'bad':''}

/* ---------- local fallback db ---------- */
function makeLocalDb(){var K='moqawel_pro_v4';function ld(){try{return JSON.parse(localStorage.getItem(K)||'{}')}catch(e){return{}}}function sv(d){try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}}
var db={collection:function(n){var flt=null;var api={where:function(f,op,v){flt=[f,v];return api},get:function(){var c=ld()[n]||{};var ids=Object.keys(c).filter(function(id){return!flt||c[id][flt[0]]===flt[1]});return Promise.resolve({docs:ids.map(function(id){return{id:id,data:function(){return c[id]}}})})},doc:function(id){return{set:function(o){var d=ld();d[n]=d[n]||{};d[n][id]=JSON.parse(JSON.stringify(o));sv(d);return Promise.resolve()},delete:function(){var d=ld();if(d[n])delete d[n][id];sv(d);return Promise.resolve()},get:function(){var c=ld()[n]||{};return Promise.resolve({exists:!!c[id],data:function(){return c[id]}})}}}};return api},doc:function(p){var a=p.split('/');return db.collection(a[0]).doc(a[1])}};return db}

/* ---------- persistence ----------
   كل بيانات نسخة Claude تُحفظ في مجموعات بادئتها claude_v4_ فقط، فلا تتشارك أي مجموعة مع نسخ ChatGPT / Google Studio
   (التي تستخدم projects و batches و pending و cashAccounts و meta/config...). */
var PFX='claude_v4_';
var COL={projects:PFX+'projects',txs:PFX+'txs',accounts:PFX+'accounts'};
var CFGDOC=PFX+'meta/config';
var LEGACY={projects:'projects',txs:'txs',accounts:'accounts'};   // أماكن النسخة القديمة المشتركة (قبل العزل)
function clean(o){var c=JSON.parse(JSON.stringify(o));c.ns=NS;return c}
async function dbSet(col,o){try{await S.db.collection(COL[col]).doc(o.id).set(clean(o));return true}catch(e){console.error(e);toast('⚠ تعذر الحفظ — تحقق من الاتصال');return false}}
async function dbDel(col,id){try{await S.db.collection(COL[col]).doc(id).delete();return true}catch(e){console.error(e);toast('⚠ تعذر الحذف');return false}}
async function saveCfg(){try{await S.db.doc(CFGDOC).set(clean(S.cfg));return true}catch(e){console.error(e);toast('⚠ تعذر حفظ الإعدادات');return false}}
function qNs(name){var r=S.db.collection(name);return r.where?r.where('ns','==',NS).get():r.get()}
/* نقل لمرة واحدة: ينسخ بيانات v4 من المجموعات المشتركة القديمة إلى المجموعات المعزولة (لا يحذف شيئًا من القديم) */
async function migrateLegacy(){var counts={},had=0;
 try{var lc=await S.db.doc('meta/config_v4').get();if(lc.exists){var ex=await S.db.doc(CFGDOC).get();if(!ex.exists){var d=Object.assign(defaultCfg(),lc.data());delete d.ns;S.cfg=Object.assign(S.cfg,d);counts.config=1}}}catch(e){console.error('mig cfg',e)}
 for(var k of Object.keys(LEGACY)){counts[k]=0;try{var old=await qNs(LEGACY[k]);var cur={};(await qNs(COL[k])).docs.forEach(function(d){cur[d.id]=1});
  for(var d of old.docs){if(cur[d.id])continue;var v=d.data();v.id=d.id;await S.db.collection(COL[k]).doc(d.id).set(clean(v));counts[k]++;had++}}catch(e){console.error('mig '+k,e);counts[k]='خطأ'}}
 S.cfg.migrated_v4={at:new Date().toISOString(),counts:counts};await saveCfg();return counts}
async function legacyCounts(){var r={};for(var k of Object.keys(LEGACY)){try{r[k]=(await qNs(LEGACY[k])).docs.length}catch(e){r[k]='؟'}}return r}
function withTO(pr,ms){return Promise.race([pr,new Promise(function(_,rj){setTimeout(function(){rj(new Error('timeout'))},ms||10000)})])}
async function loadAll(){S.loadErr=null;
 try{var c=await withTO(S.db.doc(CFGDOC).get());if(c.exists){S.cfg=Object.assign(defaultCfg(),c.data());var pc=S.cfg.pcats||[];if(!S.cfg.pcats_v5){S.cfg.pcats=PCATS_DEFAULT.concat(pc.filter(function(x){return PCATS_DEFAULT.indexOf(x)<0&&PCATS_OLD.indexOf(x)<0}));S.cfg.pcats_v5=true;if(typeof saveCfg==='function')saveCfg()}}else S.cfg=defaultCfg()}catch(e){console.error('cfg',e);S.loadErr=e&&e.code?e.code:(e&&e.message)||'error'}
 S.role=roleOf(S.user);
 if(!S.cfg.migrated_v4&&isFin()&&!S.loadErr){try{var m=await migrateLegacy();S.role=roleOf(S.user);var n=sum(Object.keys(m),function(k){return typeof m[k]==='number'?m[k]:0});if(n)toast('تم نقل '+n+' سجل إلى المجموعات المعزولة لنسخة Claude')}catch(e){console.error('migrate',e)}}
 if(S.loadErr){S.projects=[];S.txs=[];S.accounts=[];return}
 try{S.projects=(await withTO(qNs(COL.projects))).docs.map(function(d){var v=d.data();v.id=d.id;v.boq=v.boq||[];return v})}catch(e){toast('⚠ تعذر تحميل المشاريع')}
 try{S.txs=(await withTO(qNs(COL.txs))).docs.map(function(d){var v=d.data();v.id=d.id;return v})}catch(e){S.txs=[];console.error('txs',e)}
 if(isFin()){try{S.accounts=(await withTO(qNs(COL.accounts))).docs.map(function(d){var v=d.data();v.id=d.id;return v})}catch(e){S.accounts=[]}}else{try{S.accounts=(await qNs(COL.accounts)).docs.map(function(d){var v=d.data();return{id:d.id,name:v.name,kind:v.kind,opening:0}})}catch(e){S.accounts=[]}}
}
/* ---------- roles ---------- */
function roleOf(email){var r=S.cfg.roles||{};var keys=Object.keys(r);if(!keys.length)return'admin';return r[(email||'').toLowerCase()]||'engineer'}
function isFin(){return S.role==='admin'||S.role==='accountant'}
function isAdmin(){return S.role==='admin'}
var ROLE_NAMES={admin:'مدير النظام',accountant:'محاسب',engineer:'مهندس موقع',supervisor:'إشراف فني'};
var MENU=[['accounts','🏦','الخزائن والبنوك','fin'],['projects','🏗️','المشاريع','all'],['subs','🤝','مقاولو الباطن','op'],['labor','👷','العمالة اليومية','op'],['purchases','🧱','المشتريات','op'],['revenues','💰','الإيرادات','fin'],['expenses','🧾','مصروفات أخرى','op'],['progress','📐','الأعمال المنفذة (الإنجاز)','tech'],['dashboard','📊','لوحة التحكم','fin'],['reports','📑','التقارير','rep'],['review','✅','المراجعة والاعتماد','op'],['settings','⚙️','الإعدادات','adm']];
function menuAllowed(m){var k=m[3],r=S.role;if(r==='admin')return true;if(k==='adm')return false;if(r==='accountant')return true;if(k==='all')return true;if(k==='op')return r==='engineer';if(k==='tech')return true;if(k==='rep')return r==='supervisor';return false}

/* ---------- calc engine ---------- */
function apr(t){return t.status!=='pending'&&t.status!=='rejected'}
function TX(){return S.txs.filter(apr)}
function proj(id){return S.projects.filter(function(p){return p.id===id})[0]}
function acc(id){return S.accounts.filter(function(a){return a.id===id})[0]}
function pname(id){var p=proj(id);return p?p.name:(id?'(مشروع محذوف)':'عام / غير موزع')}
function aname(id){var a=acc(id);return a?a.name:'—'}
function cname(id){var c=S.cfg.contractors.filter(function(x){return x.id===id})[0];return c?c.name:'—'}
function boqItem(pid,bid){var p=proj(pid);if(!p)return null;return p.boq.filter(function(b){return b.id===bid})[0]||null}
function boqLabel(b){return(b.code?b.code+' - ':'')+b.name}
function lineVal(l){return num(l.qty)*num(l.price)}
function costOf(t){switch(t.type){case'purchase':return num(t.total);case'sub':return num(t.gross)-num(t.prior_paid);case'labor':return num(t.total);case'expense':return t.project_id?num(t.amount):0}return 0}
function cashMoves(t){var m=[];function o(a,v){if(num(v)&&a)m.push({acc:a,amt:-num(v)})}
 switch(t.type){case'purchase':o(t.account_id,t.paid);break;case'sub':o(t.account_id,t.paid);break;case'labor':o(t.account_id,t.net);break;case'expense':case'adv':case'payment':o(t.account_id,t.amount);break;
 case'revenue':if(t.account_id&&num(t.amount))m.push({acc:t.account_id,amt:num(t.amount)});break;
 case'transfer':o(t.from,t.amount);if(t.to&&num(t.amount))m.push({acc:t.to,amt:num(t.amount)});break}
 return m}
function accStats(a){var inn=0,out=0,n=0;TX().forEach(function(t){cashMoves(t).forEach(function(m){if(m.acc===a.id){n++;if(m.amt>0)inn+=m.amt;else out-=m.amt}})});return{opening:num(a.opening),inn:inn,out:out,n:n,bal:num(a.opening)+inn-out}}
function projTotals(pid){var r={purchase:0,sub:0,labor:0,expense:0,cost:0,revenue:0};TX().forEach(function(t){if(t.project_id!==pid)return;var c=costOf(t);if(r[t.type]!=null&&t.type!=='revenue')r[t.type]+=c;r.cost+=c;if(t.type==='revenue')r.revenue+=num(t.amount)});return r}
function itemUse(pid,bid,excl){var r={purchase:0,sub:0,labor:0,expense:0,pqty:{},subQty:0,progQty:0,total:0};TX().forEach(function(t){if(t.project_id!==pid||t.id===excl)return;
 if(t.type==='purchase')(t.lines||[]).forEach(function(l){if(l.boq_id===bid){r.purchase+=lineVal(l);var u=l.unit||'';r.pqty[u]=(r.pqty[u]||0)+num(l.qty)}});
 else if(t.type==='sub')(t.lines||[]).forEach(function(l){if(l.boq_id===bid){var q=num(l.qty)-num(l.qty_prev);r.sub+=q*num(l.price);r.subQty+=q}});
 else if(t.type==='labor'){if(t.rows&&t.rows.length)t.rows.forEach(function(w){if((w.boq_id||t.boq_id)===bid)r.labor+=num(w.total)});else if(t.boq_id===bid)r.labor+=num(t.total)}
 else if(t.type==='expense'){if(t.boq_id===bid&&t.project_id)r.expense+=num(t.amount)}
 else if(t.type==='progress'){if(t.boq_id===bid)r.progQty+=num(t.qty)}});
 r.total=r.purchase+r.sub+r.labor+r.expense;return r}
function itemizedCost(pid){var s=0;var p=proj(pid);if(!p)return 0;p.boq.forEach(function(b){s+=itemUse(pid,b.id).total});return s}
function boqValue(b){return num(b.qty)*num(b.price)}
function boqBudget(b){return num(b.qty)*(num(b.cost_price)||num(b.price))}
function projBoqValue(p){return sum(p.boq,boqValue)}
function prevQty(pid,party,bid,excl,date){var best=null;S.txs.forEach(function(t){if(t.type!=='sub'||t.project_id!==pid||t.party_id!==party||t.id===excl||t.status==='rejected')return;if(date&&t.date>date)return;(t.lines||[]).forEach(function(l){if(l.boq_id===bid){if(!best||t.date>best.d||(t.date===best.d&&(t.at||'')>best.a))best={d:t.date,a:t.at||'',q:num(l.qty)}}})});return best?best.q:0}
function lastPrice(pid,party,bid){var best=null;S.txs.forEach(function(t){if(t.type!=='sub'||t.project_id!==pid||t.party_id!==party)return;(t.lines||[]).forEach(function(l){if(l.boq_id===bid&&num(l.price)&&(!best||t.date>=best.d))best={d:t.date,p:num(l.price)}})});return best?best.p:0}
function contractorLedger(id,pid){var r={extracts:0,work:0,net:0,paid:0,payments:0,adv:0,recov:0,owed:0,advOut:0};TX().forEach(function(t){if(pid&&t.project_id&&t.project_id!==pid)return;
 if(t.type==='sub'&&t.party_id===id){r.extracts++;r.work+=costOf(t);r.net+=num(t.net);r.paid+=num(t.paid);r.recov+=num(t.adv_recov)}
 else if(t.type==='payment'&&t.kind==='contractor'&&t.party_id===id)r.payments+=num(t.amount);
 else if(t.type==='adv'&&t.kind==='contractor'&&t.party_id===id)r.adv+=num(t.amount)});
 r.owed=r.net-r.paid-r.payments;r.advOut=r.adv-r.recov;return r}
function supplierLedger(name,excl){var r={total:0,paid:0,payments:0,bal:0};TX().forEach(function(t){if(excl&&t.id===excl)return;if(t.type==='purchase'&&String(t.supplier||'').trim()===String(name||'').trim()){r.total+=num(t.total);r.paid+=num(t.paid)}else if(t.type==='payment'&&t.kind==='supplier'&&String(t.party||'').trim()===String(name||'').trim())r.payments+=num(t.amount)});r.bal=r.total-r.paid-r.payments;return r}
function workerAdv(name){var a=0,rc=0;TX().forEach(function(t){if(t.type==='adv'&&t.kind==='worker'&&t.party===name)a+=num(t.amount);if(t.type==='labor')(t.rows||[]).forEach(function(w){if(w.name===name)rc+=num(w.adv)})});return a-rc}
function itemState(pid,bid){var b=boqItem(pid,bid);if(!b)return null;var u=itemUse(pid,bid);return{b:b,u:u,val:boqValue(b),bud:boqBudget(b),rest:boqBudget(b)-u.total}}
function costTxIds(){return TX().filter(function(t){return costOf(t)!==0})}
function ensureReg(t){var c=S.cfg,ch=false;function add(arr,n){if(n&&arr.indexOf(n)<0){arr.push(n);ch=true}}
 add(c.suppliers,t.supplier&&t.type==='purchase'?t.supplier:'');
 if(t.type==='labor')(t.rows||[]).forEach(function(w){if(w.name&&!c.workers.some(function(x){return x.name===w.name})){c.workers.push({name:w.name,mode:w.mode,rate:num(w.rate)});ch=true}});
 if(t.type==='purchase')(t.lines||[]).forEach(function(l){if(!l.item)return;var f=c.catalog.filter(function(x){return x.name===l.item&&x.cat===t.cat})[0];if(!f){c.catalog.push({name:l.item,unit:l.unit,price:num(l.price),cat:t.cat});ch=true}else if(num(l.price)&&f.price!==num(l.price)){f.price=num(l.price);ch=true}});
 return ch}
