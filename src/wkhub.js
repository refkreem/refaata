/* مركز الصرف الأسبوعي الموحّد: تبويبات بدل شاشات منفصلة (استيراد · المقاولون · العمال · الاحتياج النقدي · العهدة) */
var WKTABS=[['import','📥','استيراد الكشوف'],['wkpay','🤝','المقاولون'],['wkwages','👷','العمال'],['cashreq','💵','الاحتياج النقدي'],['custweek','🏦','العهدة']];
function wkTabs(cur){return'<div class="flt noprint wktabs" style="gap:6px;margin-bottom:10px">'+WKTABS.map(function(t){return'<button class="btn '+(t[0]===cur?'p':'')+'" data-a="wkTab" data-p="'+t[0]+'">'+t[1]+' '+t[2]+'</button>'}).join('')+'<button class="btn sm" data-a="go" data-p="conrec">🧾 مطابقة الشيتات</button></div>'}
ACT.wkTab=function(v){var w=S.wk&&S.wk.week;if(w){S.wg=S.wg||{};try{if(wgWeeks().indexOf(w)>=0)S.wg.week=w}catch(e){}}go(v,null,null,true)};
['import','wkpay','wkwages','cashreq','custweek'].forEach(function(v){var o=VIEWS[v];if(!o)return;VIEWS[v]=function(){return wkTabs(v)+o.apply(this,arguments)}});
