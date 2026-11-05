const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const pg=await(await b.newContext()).newPage();let ok=0,bad=0;const T=(n,c)=>{c?ok++:bad++;console.log(c?'  ✔':'  ✘',n)};
pg.on('pageerror',e=>{bad++;console.log('PAGEERR',e.message)});pg.on('dialog',d=>d.type()==='prompt'?d.accept(d.message().includes('مسح')?'مسح':'تصفير'):d.accept());
await pg.route(/gstatic|cdnjs|googleapis|jsdelivr/,r=>r.abort());await pg.goto('file:///home/claude/refaata2/index.html');await pg.waitForFunction(()=>window.S&&S.db);
await pg.evaluate(()=>{S.projects=[{id:'p1',name:'م1',value:1000,boq:[]},{id:'p2',name:'م2',value:5,boq:[]}];S.accounts=[{id:'a1',name:'خزينة',kind:'cash',opening:100000}];S.cfg.contractors=[{id:'c1',name:'ابراهيم',trade:'أعمال معدنية'}];S.cfg.workers=[]});
const V=async id=>(await pg.inputValue(id)).replace(/,/g,'');
/* الأجور */
await pg.evaluate(()=>openForm('labor'));await pg.selectOption('#t_proj','p1');
await pg.evaluate(()=>{const e=document.querySelector('#lines .ln');e.querySelector('.w_name').value='عامل';e.querySelector('.w_rate').value=400;e.querySelector('.w_days').value=6;e.querySelector('.w_otn').value=6;e.querySelector('.w_shn').value=1;S.recalc()});
T('إجمالي الأجر: 6 أيام + 6 سهرات (نصف يومية) + تطبيقة (يومية) = 4000',(await pg.innerText('.w_tot')).replace(/,/g,'')==='4000');
T('قيمة السهرة المقترحة 200',(await pg.getAttribute('.w_otv','placeholder')).replace(/,/g,'')==='200');
T('قيمة التطبيقة المقترحة 400',(await pg.getAttribute('.w_shv','placeholder')).replace(/,/g,'')==='400');
await pg.click('[data-a=mclose]');
/* تصنيف المقايسة */
const tr=await pg.evaluate(()=>['تكسير ارضيات قديمة','صب خرسانة مسلحة للقواعد','توريد وتركيب باب المونيوم','توريد وتركيب باب خشب','ارضيات جرانيت','بورسلين 60×60','دهان بلاستيك','سقف معلق جبس','فينيل ارضيات','معالجة خرسانة بالحقن','نقاط اضاءة ولوحات كهرباء','مواسير صرف ومحابس','تكييف وحدة داخلية','مصعد','انذار حريق كاشف دخان','غازات طبية اكسجين','نظم معلومات شبكات','سماعات صوتيات','اعمال حداده كريتال','بياض محارة'].map(boqTrade));
const exp=['أعمال تعديل وتكسير','أعمال خرسانات','أعمال ألومنيوم','أعمال نجارة','أرضيات جرانيت','أرضيات بورسلين','أعمال دهانات','أعمال أسقف ثانوية','أرضيات فينيل','أعمال معالجة خرسانة','أعمال كهربائية','أعمال صحية','أعمال تكييف','أعمال مصاعد','أعمال إنذار حريق','أعمال غازات طبية','أعمال نظم معلومات','أعمال صوتيات','أعمال معدنية','أعمال بياض'];
exp.forEach((e,i)=>T('تصنيف: '+e,tr[i]===e||(console.log('   got',tr[i]),false)));
/* تنبيه الفرق بين المقايسة والعقد */
await pg.evaluate(()=>{S.projects[0].boq=[{id:'b1',name:'بند',qty:1,price:2000,group:'x'}]});
T('تنبيه اختلاف المقايسة عن قيمة العقد',await pg.evaluate(()=>boqGapHtml(S.projects[0]).includes('أكبر')));
await pg.evaluate(()=>{S.projects[0].boq[0].price=1000});T('لا تنبيه عند التطابق',await pg.evaluate(()=>boqGapHtml(S.projects[0])==='' ));
/* تصنيف تلقائي بزر */
await pg.evaluate(()=>{S.projects[0].boq=[{id:'b1',name:'توريد وتركيب باب المونيوم',qty:1,price:10,group:'باب'},{id:'b2',name:'شيء غامض',qty:1,price:10,group:''}];S.vp='p1';ACT.boqAutoCat()});await pg.waitForTimeout(300);
T('زر التصنيف التلقائي',await pg.evaluate(()=>S.projects[0].boq[0].group==='أعمال ألومنيوم'));
/* رقم المستخلص التلقائي */
const n1=await pg.evaluate(()=>nextSubNo('p1','c1'));T('أول مستخلص رقم 1',n1==='1');
await pg.evaluate(()=>{S.txs.push({id:'s1',type:'sub',status:'approved',project_id:'p1',party_id:'c1',no:'1',date:'2026-10-01',lines:[{name:'أعمال معدنية',qty:1,price:100}],gross:100,net:100,paid:0,paid_set:true})});
T('المستخلص التالي رقم 2',await pg.evaluate(()=>nextSubNo('p1','c1'))==='2');
await pg.evaluate(()=>openForm('sub'));await pg.selectOption('#t_proj','p1');await pg.selectOption('#t_con','c1');await pg.waitForTimeout(200);
T('الرقم يُملأ تلقائيًا في نموذج المستخلص',await V('#c_no')==='2');
await pg.click('[data-a=mclose]');
/* سداد: البند تلقائي */
await pg.evaluate(()=>{S.projects[0].boq=[{id:'b1',code:'1',name:'أعمال حديد',qty:1,price:100,group:'أعمال معدنية'}];S.txs[0].lines=[{boq_id:'b1',qty:1,price:100}]});
await pg.evaluate(()=>openForm('payment','','contractor'));await pg.selectOption('#t_con','c1');await pg.selectOption('#t_proj','p1');await pg.waitForTimeout(300);
T('بند المقاول يُختار تلقائيًا عند السداد',await pg.inputValue('#t_boq')==='b1');
T('تظهر البنود التي يعمل بها',(await pg.innerText('#conhint')).includes('أعمال حديد'));
await pg.click('[data-a=mclose]');
/* قراءة فاتورة Excel */
const pr=await pg.evaluate(()=>invParseRows([['فاتورة رقم','123'],['المورد','شركة النور'],['التاريخ','2026-10-20'],['الصنف','الوحدة','الكمية','السعر','الإجمالي'],['أسمنت','طن',2,1500,3000],['رمل','م3',5,200,1000],['الإجمالي','','','',4000]]));
T('الفاتورة: صنفان',pr.lines.length===2&&pr.lines[0].price===1500);T('الفاتورة: رقم ومورد وتاريخ',pr.meta.inv==='123'&&pr.meta.sup==='شركة النور'&&pr.meta.date==='2026-10-20');
/* دفعات الاستيراد */
await pg.evaluate(async()=>{S.txs=[];for(const [id,b] of [['x1','2026-10-21'],['x2','2026-10-21'],['x3','2026-10-28']]){const t={id:id,type:'expense',status:'approved',date:b,category:'نقل',amount:10,imp_batch:b};await dbSet('txs',t);S.txs.push(t)}go('import');render()});
T('بطاقة الدفعات ظاهرة',(await pg.innerText('#main, main, .main').catch(()=>pg.innerText('body'))).includes('الدفعات المستوردة'));
await pg.evaluate(()=>ACT.impDelBatch('2026-10-21'));await pg.waitForTimeout(400);
T('حذف دفعة خميس معين فقط',await pg.evaluate(()=>S.txs.length===1&&S.txs[0].imp_batch==='2026-10-28'));
await pg.evaluate(()=>ACT.impWipeTx());await pg.waitForTimeout(400);
T('مسح الحركات يُبقي المشاريع',await pg.evaluate(()=>S.txs.length===0&&S.projects.length===2&&S.accounts.length===1));
console.log('نجح',ok,'/ فشل',bad);await b.close()})();
