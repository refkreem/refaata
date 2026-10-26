/* ---------- events & boot ---------- */
ACT.go=function(v){go(v)};ACT.menu=function(){$('side').classList.toggle('open')};ACT.mclose=closeModal;
ACT.msave=async function(){if(!S.modalSave)return;var b=$('msaveBtn');b.disabled=true;try{var ok=await S.modalSave();if(ok!==false)closeModal()}catch(e){console.error(e);toast('حدث خطأ: '+e.message)}b.disabled=false};
ACT.refresh=async function(){if(!S.db)return;toast('جاري التحديث…');await loadAll();render();toast('تم التحديث')};
ACT.logout=function(){if(window.firebase&&firebase.auth)firebase.auth().signOut()};
document.addEventListener('click',function(ev){var el=ev.target.closest('[data-a]');if(!el)return;if(el.tagName==='SELECT'||el.tagName==='INPUT')return;var f=ACT[el.dataset.a];if(f){ev.preventDefault();f(el.dataset.p,el)}});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});
function loginMsg(c){return{'auth/invalid-credential':'البريد أو كلمة المرور غير صحيحة','auth/wrong-password':'البريد أو كلمة المرور غير صحيحة','auth/user-not-found':'البريد أو كلمة المرور غير صحيحة','auth/invalid-email':'صيغة البريد غير صحيحة','auth/too-many-requests':'محاولات كثيرة، انتظر قليلًا','auth/network-request-failed':'لا يوجد اتصال بالإنترنت','auth/operation-not-allowed':'تسجيل الدخول بالبريد غير مفعّل'}[c]||('تعذر تسجيل الدخول ('+c+')')}
async function start(db,label,email){S.db=db;S.user=(email||'').toLowerCase();$('dot').classList.add('on');$('conn').textContent=label;$('main').innerHTML='<div class="card empty">جارٍ تحميل البيانات…</div>';await loadAll();render()}
async function boot(){
 if(window.firebase&&FIREBASE_CONFIG.apiKey){try{firebase.initializeApp(FIREBASE_CONFIG);var au=firebase.auth();
  $('loginForm').addEventListener('submit',function(e){e.preventDefault();$('lErr').textContent='';$('lBtn').disabled=true;au.signInWithEmailAndPassword($('lEmail').value.trim(),$('lPass').value).catch(function(er){$('lErr').textContent=loginMsg(er.code||'')}).then(function(){$('lBtn').disabled=false})});
  $('conn').textContent='بانتظار تسجيل الدخول…';
  au.onAuthStateChanged(function(u){if(u){$('login').classList.remove('show');$('logout').style.display='';$('lPass').value='';start(firebase.firestore(),'متصل — '+u.email,u.email)}else{S.db=null;$('dot').classList.remove('on');$('conn').textContent='غير مسجّل';$('logout').style.display='none';$('login').classList.add('show');$('main').innerHTML='';$('side').innerHTML=''}});return}catch(e){console.error('firebase',e)}}
 var te='';try{te=localStorage.getItem('moqawel_test_email')||''}catch(e){}
 await start(makeLocalDb(),'تخزين محلي على هذا الجهاز (بدون اتصال بالسحابة)',te);
}
document.addEventListener('visibilitychange',function(){if(!document.hidden&&S.db&&!$('modal').classList.contains('show')&&Date.now()-(S.lastLoad||0)>120000){S.lastLoad=Date.now();loadAll().then(render)}});
var BUILD='__BUILD__';
(function(){var v=document.getElementById('ver');if(v)v.textContent='v '+BUILD})();
async function checkUpdate(manual){try{if(!/^https?:/.test(location.protocol))return;var r=await fetch(location.pathname+'?_='+Date.now(),{cache:'no-store'});if(!r.ok)return;var m=(await r.text()).match(/var BUILD='([^']+)'/);if(!m||m[1]===BUILD){if(manual)toast('أنت على آخر إصدار ('+BUILD+')');return}var k='upd_'+m[1],did=null;try{did=sessionStorage.getItem(k)}catch(e){}
 if(did&&!manual){toast('يوجد إصدار أحدث ('+m[1]+') — أغلق الصفحة وافتحها من جديد');return}
 if($('modal').classList.contains('show')){toast('يوجد إصدار جديد — سيُحمَّل بعد إغلاق النافذة');setTimeout(function(){checkUpdate()},15000);return}
 try{sessionStorage.setItem(k,'1')}catch(e){}toast('تحديث إلى الإصدار الجديد…');setTimeout(function(){location.reload()},700)}catch(e){}}
ACT.upd=function(){checkUpdate(true)};
document.addEventListener('visibilitychange',function(){if(!document.hidden)checkUpdate()});
setTimeout(checkUpdate,2500);setInterval(checkUpdate,600000);
boot();
