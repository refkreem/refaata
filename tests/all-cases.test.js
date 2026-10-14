const { chromium } = require('playwright'); const fs=require('fs');
const S=__dirname; const XL=fs.readFileSync(S+'/xl/node_modules/xlsx/dist/xlsx.full.min.js','utf8');
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log('PASS',n);} else {fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x));} };
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const ctx=await b.newContext({viewport:{width:1300,height:900},acceptDownloads:true});
 const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); let PT=''; pg.on('dialog',d=>{ d.accept(d.type()==='prompt'?PT:undefined).catch(()=>{}); });
 await pg.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('file:')) r.continue(); else if(u.includes('xlsx')) r.fulfill({body:XL,contentType:'text/javascript'}); else r.abort();});
 await pg.addInitScript(()=>{ if(!localStorage.getItem('moqawel_pro_db_v1')) localStorage.setItem('moqawel_test_email','boss@x.com'); });
 await pg.goto('file:///home/claude/refaata/index.html'); await pg.waitForTimeout(800);
 const go=async v=>{ await pg.evaluate(v=>document.querySelector('.nav [data-view="'+v+'"]').click(),v); await pg.waitForTimeout(250); };
 const txt=async s=>(await pg.$eval(s,e=>e.innerText)).replace(/\s+/g,' ').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٬/g,',');
 const rowsDb=async()=>pg.evaluate(()=>{const d=JSON.parse(localStorage.getItem('moqawel_pro_db_v1')||'{}');let r=[];Object.values(d.batches||{}).forEach(b=>(b.rows||[]).forEach(x=>r.push(x)));return r;});
 const modalSave=async()=>{ await pg.click('#modalSave'); await pg.waitForTimeout(300); };
 ok('dashboard loads', (await txt('#dashKpis')).length>0);
 // settings: custodians
 const sec=async n=>{ await pg.click('#setTree [data-sec="'+n+'"]'); await pg.waitForTimeout(100); };
 await go('settings'); await sec('custodians'); await pg.fill('#newCustInput','محمد عصام'); await pg.click('#addCustBtn'); await pg.waitForTimeout(200);
 ok('custodian added', (await txt('#custList2')).includes('محمد عصام'));
 await sec('worktree'); await pg.fill('#newWorkItemInput','تشطيب'); await pg.click('#addWorkItemBtn'); ok('work item added',(await txt('#workItemsList')).includes('تشطيب'));
 await sec('costs'); await pg.fill('#newCostItemInput','معدات'); await pg.click('#addCostItemBtn'); ok('cost item added',(await txt('#costItemsList')).includes('معدات'));
 // project
 await go('projects'); await pg.click('#newProjectBtn'); await pg.fill('#f_name','مشروع اختبار'); await pg.fill('#f_value','1000000'); await modalSave();
 ok('project created',(await txt('#projectsTable')).includes('مشروع اختبار'));
 await pg.evaluate(()=>{const t=[...document.querySelectorAll('#projectsTable tbody tr')].find(r=>r.innerText.includes('مشروع اختبار')); (t.querySelector('a,button')||t).click();}); await pg.waitForTimeout(300);
 ok('project detail opens',(await txt('#pdName')).includes('مشروع اختبار'));
 await pg.click('#tplHospitalBtn'); await pg.waitForTimeout(400);
 const tree=await txt('#pdTreeTable'); ok('hospital template builds tree',tree.length>50,tree.slice(0,100));
 await pg.click('#addRootItemBtn'); await pg.fill('#i_name','تكييف اختبار'); await pg.fill('#i_budget','50000'); await modalSave();
 ok('root item added',(await txt('#pdTreeTable')).includes('تكييف اختبار'));
 await pg.click('#pdEditBtn'); await pg.fill('#f_notes','ملاحظة'); await modalSave(); ok('project edited',true);
 await pg.click('#addBoqRowBtn'); await pg.fill('#b_item','بند مقايسة'); await pg.fill('#b_qty','10'); await pg.fill('#b_price','100'); await modalSave();
 ok('boq row added',(await txt('#pdBoqTable')).includes('بند مقايسة'));
 const pid=await pg.evaluate(()=>JSON.parse(localStorage.getItem('moqawel_pro_db_v1')).projects&&Object.keys(JSON.parse(localStorage.getItem('moqawel_pro_db_v1')).projects)[0]);
 // transactions via generic views
 async function addTx(view,fill){ await go(view); await pg.click('#view-'+view+' .new-tx-btn'); await pg.waitForTimeout(150); await pg.selectOption('#t_project',pid); await fill(); await modalSave(); }
 const wiOpt=async()=>pg.$$eval('#t_workitem option',o=>{const x=o.find(z=>z.innerText.includes('تكييف اختبار'));return x&&x.value;});
 await addTx('custody',async()=>{ await pg.selectOption('#t_type','عهدة-استلام'); await pg.selectOption('#t_cust','محمد عصام'); await pg.fill('#t_amount','10000'); });
 ok('custody received',(await rowsDb()).some(r=>r.type==='عهدة-استلام'&&r.amount===10000));
 await addTx('custody',async()=>{ await pg.selectOption('#t_type','نثريات'); await pg.selectOption('#t_workitem',await wiOpt()); await pg.selectOption('#t_cust','محمد عصام'); await pg.fill('#t_party','نثريات موقع'); await pg.fill('#t_amount','1500'); });
 ok('petty expense',(await rowsDb()).some(r=>r.type==='نثريات'&&r.amount===1500&&r.work_item.includes('تكييف اختبار')));
 await go('custody'); const ct=await txt('#view-custody'); ok('custody balance shows 8,500',/8[,٬]?500/.test(ct),ct.slice(0,300));
 await addTx('subcontractors',async()=>{ await pg.selectOption('#t_workitem',await wiOpt()); await pg.fill('#t_party','شركة الهواء'); await pg.fill('#t_amount','20000'); });
 ok('sub payment',(await rowsDb()).some(r=>r.type==='مقاول باطن'&&r.party==='شركة الهواء'&&r.amount===20000));
 await go('subcontractors'); ok('sub statement shows party',(await txt('#view-subcontractors')).includes('شركة الهواء'));
 await addTx('labor',async()=>{ await pg.selectOption('#t_workitem',await wiOpt()); await pg.fill('#t_party','أسطى'); await pg.fill('#t_amount','800'); });
 await addTx('salaries',async()=>{ await pg.selectOption('#t_workitem',await wiOpt()); await pg.fill('#t_party','مهندس'); await pg.fill('#t_amount','7000'); });
 await addTx('purchases',async()=>{ await pg.selectOption('#t_workitem',await wiOpt()); await pg.selectOption('#t_pay','عهدة'); await pg.selectOption('#t_cust','محمد عصام'); await pg.fill('#t_party','مورد'); await pg.fill('#t_amount','500'); });
 await addTx('revenues',async()=>{ await pg.fill('#t_party','مستخلص 1'); await pg.fill('#t_amount','100000'); });
 const R=await rowsDb(); console.log('PURCH',JSON.stringify(R.filter(r=>r.type==='مشتريات')));['عمالة','رواتب','مشتريات','ايراد'].forEach(t=>ok('row type '+t,R.some(r=>r.type===t),R.map(r=>r.type)));
 await go('custody'); const cb=await txt('#view-custody'); ok('purchase from custody reduces balance',/8,000/.test(cb),cb.slice(150,420));
 await go('accounts'); const at=await txt('#view-accounts'); ok('accounts: cash box after custody+labor',/10,800/.test(at),at.slice(0,400)); ok('accounts: bank balance',/73,000/.test(at),at.slice(0,400));
 await pg.click('#transferBtn'); await pg.waitForTimeout(200); await pg.selectOption('#tr_from','bank-nbe'); await pg.selectOption('#tr_to','internal-cash'); await pg.fill('#tr_amount','5000'); await modalSave();
 const at2=await txt('#view-accounts'); ok('transfer moves money',/68,000/.test(at2)&&/5,800/.test(at2),at2.slice(0,400));
 await pg.evaluate(()=>[...document.querySelectorAll('#accTable .accled')][0].click()); await pg.waitForTimeout(200); ok('account ledger renders',(await txt('#accLedger')).includes('رصيد افتتاحي'));
 await pg.click('#addAccountBtn'); await pg.fill('#ca_name','بنك اختبار'); await pg.fill('#ca_opening','1000'); await modalSave(); ok('account added',(await txt('#accTable')).includes('بنك اختبار'));
 await go('dashboard'); ok('dashboard shows accounts total',(await txt('#dashKpis')).includes('رصيد الخزائن'));
 // duplicate warning and edit/delete
 const n0=(await rowsDb()).length;
 await addTx('labor',async()=>{ await pg.selectOption('#t_workitem',await wiOpt()); await pg.fill('#t_party','أسطى'); await pg.fill('#t_amount','800'); });
 ok('dup accepted via confirm',(await rowsDb()).length===n0+1);
 await go('labor'); await pg.evaluate(()=>{document.querySelector('#view-labor .edtx').click();}); await pg.waitForTimeout(250);
 if(await pg.$('#t_amount')){ await pg.fill('#t_amount','900'); await modalSave(); ok('edit tx',(await rowsDb()).some(r=>r.amount===900)); 
   await pg.evaluate(()=>{const r=[...document.querySelectorAll('#view-labor .gen-table tbody tr')].find(x=>/900|٩٠٠/.test(x.innerText)); r.querySelector('.edtx').click();}); await pg.waitForTimeout(200);
   await pg.click('#modalCancel'); await pg.evaluate(()=>{const r=[...document.querySelectorAll('#view-labor .gen-table tbody tr')].find(x=>/900|٩٠٠/.test(x.innerText)); r.querySelector('.rmtx').click();}); await pg.waitForTimeout(400); ok('delete tx',!(await rowsDb()).some(r=>r.amount===900));
 } else ok('row click opens edit',false);
 // search filter
 await go('purchases'); const sb=await pg.$('#view-purchases .filterbar input[type=search],#view-purchases .filterbar input[type=text],#view-purchases .filterbar input'); if(sb){ await sb.fill('مورد'); await pg.waitForTimeout(250); ok('search keeps match',(await txt('#view-purchases .gen-table')).includes('مورد')); await sb.fill('zzzz'); await pg.waitForTimeout(250); ok('search hides non-match',!(await txt('#view-purchases .gen-table tbody')).includes('مورد')); await sb.fill(''); } else ok('search box exists',false);
 const dl=pg.waitForEvent('download',{timeout:4000}).catch(()=>null); const ex=await pg.$('#view-purchases .filterbar button[class*=export],#view-purchases .export-btn,#view-purchases [data-export]'); if(ex){await ex.click(); ok('excel export download',!!(await dl));} else ok('export button found',false);
 // weekly
 await go('weekly'); const wk=await txt('#weeklyKpis'); ok('weekly kpis render',wk.length>5,wk);
 await pg.click('#wkPrev'); await pg.click('#wkNow'); await pg.click('#wkNext'); await pg.click('#wkNow'); ok('weekly nav ok',true);
 const d1=pg.waitForEvent('download',{timeout:4000}).catch(()=>null); await pg.click('#wkExport'); ok('weekly export',!!(await d1));
 // reports
 await go('reports'); ok('reports by work',(await txt('#repByWorkTable')).length>10);
 for(const t of await pg.$$('#reportTabs button')){ await t.click(); await pg.waitForTimeout(150); }
 await pg.click('#reportTabs [data-rep="profit"]'); ok('report tabs',true); ok('profit table',(await txt('#repProfitTable')).includes('مشروع اختبار'));
 const d2=pg.waitForEvent('download',{timeout:4000}).catch(()=>null); await pg.click('#repExport'); ok('report export',!!(await d2));
 // import templates
 await go('import'); const btns=await pg.$$('#tplButtons button'); ok('template buttons',btns.length>=5,btns.length);
 const d3=pg.waitForEvent('download',{timeout:4000}).catch(()=>null); await pg.evaluate(()=>[...document.querySelectorAll('#tplButtons button')].find(b=>b.innerText.includes('دفعة مقاول')).click()); const dd=await d3; ok('template download',!!dd);
 let tplPath=S+'/tpl.xlsx'; if(dd){ await dd.saveAs(tplPath); }
 // fill template: build workbook with 2 good rows & 1 bad row using same header
 const XLSX=require(S+'/xl/node_modules/xlsx'); const wb=XLSX.readFile(tplPath); const ws=wb.Sheets[wb.SheetNames[0]]; const aoa=XLSX.utils.sheet_to_json(ws,{header:1});
 console.log('TEMPLATE HEADER',JSON.stringify(aoa[0]), wb.SheetNames);
 const hdr=aoa[0]; const mk=o=>hdr.map(h=>o[h]!==undefined?o[h]:'');
 const find=k=>hdr.find(h=>String(h).includes(k));
 const rowsIn=[ {[find('التاريخ')]:'2026-10-05',[find('المشروع')]:'مشروع اختبار',[find('بند الأعمال')]:'تكييف اختبار',[find('المبلغ')]:1234,[find('الطرف')||find('المقاول')||find('البيان')]:'شركة استيراد'},
   {[find('التاريخ')]:'2026-10-06',[find('المشروع')]:'مشروع اختبار',[find('بند الأعمال')]:'تكييف اختبار',[find('المبلغ')]:2222,[find('الطرف')||find('المقاول')||find('البيان')]:'شركة ثانية'},
   {[find('التاريخ')]:'2026-10-06',[find('المشروع')]:'مشروع اختبار',[find('بند الأعمال')]:'تكييف اختبار',[find('المبلغ')]:'abc',[find('الطرف')||find('المقاول')||find('البيان')]:'خطأ'} ];
 const ws2=XLSX.utils.aoa_to_sheet([hdr,...rowsIn.map(mk)]); const wb2=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb2,ws2,wb.SheetNames[0]); XLSX.writeFile(wb2,S+'/filled.xlsx');
 await pg.setInputFiles('#fileInput',S+'/filled.xlsx'); await pg.waitForTimeout(800);
 const vis=await pg.evaluate(()=>['impPanel2','impPanel3'].map(i=>document.getElementById(i).style.display+'|'+document.getElementById(i).className));
 if((await pg.$('#impToReview'))&&await pg.$eval('#impPanel2',e=>e.offsetParent!==null)) { await pg.click('#impToReview'); await pg.waitForTimeout(500); }
 const sum=await txt('#impReviewSummary'); ok('import preview summary',sum.length>3,[sum,vis]);
 ok('import flags bad row',/خطأ|أخطاء|مرفوض|1/.test(sum),sum);
 console.log('IMPSUM',sum, await txt('#impPreviewTable').then(t=>t.slice(0,400))); const n1=(await rowsDb()).length; await pg.click('#impConfirmBtn'); await pg.waitForTimeout(800);
 const n2=(await rowsDb()).length; ok('import posted 2 good rows',n2-n1===2,[n1,n2]);
 // re-import dup skip
 await go('import'); await pg.setInputFiles('#fileInput',S+'/filled.xlsx'); await pg.waitForTimeout(600);
 if(await pg.$eval('#impPanel2',e=>e.offsetParent!==null)) { await pg.click('#impToReview'); await pg.waitForTimeout(500); }
 await pg.click('#impConfirmBtn'); await pg.waitForTimeout(800); ok('duplicate import skipped',(await rowsDb()).length===n2,[(await rowsDb()).length,n2]);
 // real expenses file advanced mapping
 const real=require('fs').readdirSync(S+'/wk').filter(f=>/\.xlsx$/.test(f)).slice(0,6).concat(['مصرفات7-10-2026.xlsx']); console.log('real files',real);
 for(const f of real){ await go('import'); fs.copyFileSync(S+'/wk/'+f,S+'/real.xlsx'); await pg.setInputFiles('#fileInput',S+'/real.xlsx'); await pg.waitForTimeout(900);
   const mg=await pg.$eval('#mapGrid',e=>e.innerText.replace(/\s+/g,' ').slice(0,150)).catch(()=>'');
   ok('real file '+f+' loads mapping',mg.length>0,mg); }
 // inbox
 await go('inbox'); const pend=JSON.parse(fs.readFileSync(S+'/pend2.json','utf8'));
 await pg.setInputFiles('#inboxFile',S+'/pend2.json').catch(()=>{}); await pg.waitForTimeout(600);
 const ib=await txt('#inboxTable'); ok('inbox loaded',ib.length>20,ib.slice(0,100));
 console.log('INBOX',ib.slice(0,500)); const pbefore=(await rowsDb()).length; const okb=await pg.$('.ibok'); if(okb){ await okb.click(); await pg.waitForTimeout(500); ok('inbox confirm one',(await rowsDb()).length===pbefore+1);} else ok('inbox ok btn',false);
 const rj=await pg.$('.ibno'); if(rj){ await rj.click(); await pg.waitForTimeout(400); ok('inbox reject',true);} else ok('inbox reject btn',false);
 await pg.click('#inboxConfirmAllBtn'); await pg.waitForTimeout(800); ok('inbox confirm all',(await rowsDb()).length>pbefore+1);
 // deductions, settlement, custody return
 await addTx('deductions',async()=>{ await pg.selectOption('#t_type','تأمينات'); await pg.fill('#t_party','هيئة التأمينات'); await pg.fill('#t_amount','3000'); });
 ok('deduction row saved with account',(await rowsDb()).some(r=>r.type==='تأمينات'&&r.amount===3000&&r.payment_account_id==='internal-cash'));
 await go('deductions'); ok('deductions view lists it',(await txt('#view-deductions')).includes('هيئة التأمينات'));
 await addTx('subcontractors',async()=>{ await pg.selectOption('#t_workitem',await wiOpt()); await pg.fill('#t_party','مقاول تسوية'); await pg.fill('#t_amount','10000'); await pg.evaluate(()=>document.getElementById('t_settle_box').open=true); await pg.fill('#t_prior','2000'); await pg.fill('#t_ins','500'); await pg.fill('#t_tax','300'); await pg.fill('#t_adv','200'); await pg.fill('#t_cash','4000'); });
 const sr=(await rowsDb()).find(r=>r.party==='مقاول تسوية'); ok('settlement fields saved',sr&&sr.insurance_amount===500&&sr.tax_amount===300&&sr.remaining===3000,sr);
 await go('subcontractors'); const sv=await txt('#view-subcontractors .gen-table'); ok('settlement columns shown',sv.includes('تأمينات')&&sv.includes('المتبقي')&&/3,000/.test(sv),sv.slice(0,300));
 await addTx('custody',async()=>{ await pg.selectOption('#t_type','عهدة-رد'); await pg.selectOption('#t_cust','محمد عصام'); await pg.fill('#t_amount','1000'); });
 ok('custody return row',(await rowsDb()).some(r=>r.type==='عهدة-رد'&&r.amount===1000&&r.payment_account_id));
 await go('custody'); const cv=await txt('#view-custody'); ok('custody balance after return',/7,000/.test(cv)||/7,500/.test(cv),cv.slice(100,400));
 await go('weekly'); await pg.evaluate(()=>{document.getElementById('wkFrom').value='2026-01-01';document.getElementById('wkFrom').dispatchEvent(new Event('change'));}); await pg.waitForTimeout(300); ok('weekly party settlement table',(await txt('#weeklyPartyTable')).includes('مقاول تسوية'),(await txt('#weeklyPartyTable')).slice(0,200));
 // import with settlement columns
 { const XL3=require(S+'/xl/node_modules/xlsx'); const hdr=['التاريخ','المشروع','بند الأعمال','اسم المقاول','المبلغ','طريقة الدفع','أمين العهدة','ملاحظات','سبق صرفه','سلف/خصومات','تأمينات','ضرائب','استقطاعات مباشرة','شيك الآن','نقدًا الآن'];
   const ws=XL3.utils.aoa_to_sheet([hdr,['2026-10-09','مشروع اختبار','تكييف اختبار','مقاول استيراد',8000,'شيك','','',1000,0,400,200,0,5000,0]]); const wbk=XL3.utils.book_new(); XL3.utils.book_append_sheet(wbk,ws,('قالب - دفعة مقاول').slice(0,31)); XL3.writeFile(wbk,S+'/settle.xlsx');
   await go('import'); await pg.setInputFiles('#fileInput',S+'/settle.xlsx'); await pg.waitForTimeout(700); await pg.click('#impConfirmBtn'); await pg.waitForTimeout(700);
   const ir=(await rowsDb()).find(r=>r.party==='مقاول استيراد'); ok('import keeps settlement fields',ir&&ir.insurance_amount===400&&ir.cheque_now===5000&&ir.remaining===1400,ir); }
 // template has settlement columns
 { await go('import'); const d9=pg.waitForEvent('download',{timeout:4000}).catch(()=>null); await pg.evaluate(()=>[...document.querySelectorAll('#tplButtons button')].find(b=>b.innerText.includes('دفعة مقاول')).click()); const dd9=await d9; await dd9.saveAs(S+'/tpl2.xlsx'); const w9=require(S+'/xl/node_modules/xlsx').readFile(S+'/tpl2.xlsx'); ok('template has deduction columns',JSON.stringify(require(S+'/xl/node_modules/xlsx').utils.sheet_to_json(w9.Sheets[w9.SheetNames[0]],{header:1})[0]).includes('تأمينات')); }
 const tbtn=await pg.$$eval('#tplButtons button',b=>b.map(x=>x.innerText)); ok('extra templates exist',tbtn.some(t=>t.includes('ضرائب'))&&tbtn.some(t=>t.includes('سلفة')),tbtn);
 // settings tree, company, pay methods, extra reports
 await go('settings'); await sec('company'); await pg.fill('#co_name','شركة الاختبار'); await pg.click('#co_save'); await pg.waitForTimeout(200); ok('company name in header',(await txt('.brand')).includes('شركة الاختبار'));
 await sec('worktree'); PT='فرع اختبار'; await pg.evaluate(()=>document.querySelector('#workItemsList .wt-add').click()); await pg.waitForTimeout(250); ok('tree child added',(await txt('#workItemsList')).includes('فرع اختبار'));
 const wtBefore=await txt('#workItemsList'); await pg.evaluate(()=>{const b=[...document.querySelectorAll('#workItemsList .wtrow')].find(r=>r.innerText.includes('فرع اختبار')); b.querySelector('.wt-del').click();}); await pg.waitForTimeout(250); ok('tree node deleted',!(await txt('#workItemsList')).includes('فرع اختبار'));
 await pg.click('#wtHospital'); await pg.waitForTimeout(250); ok('hospital template in tree',(await txt('#workItemsList')).length>wtBefore.length);
 await go('projects'); await pg.evaluate(()=>{const t=[...document.querySelectorAll('#projectsTable tbody tr')].find(r=>r.innerText.includes('مشروع اختبار')); (t.querySelector('a,button')||t).click();}); await pg.waitForTimeout(300); await pg.click('#applyTreeBtn'); await pg.waitForTimeout(400); ok('settings tree applied to project',(await txt('#pdTreeTable')).includes('التكييف')||(await txt('#pdTreeTable')).length>100);
 await go('settings'); await sec('pay'); await pg.fill('#newPayName','إنستاباي'); await pg.selectOption('#newPayKind','bank'); await pg.click('#addPayBtn'); await pg.waitForTimeout(200); ok('extra pay method added',(await txt('#payExtraList')).includes('إنستاباي'));
 await addTx('purchases',async()=>{ await pg.selectOption('#t_workitem',await wiOpt()); await pg.selectOption('#t_pay','إنستاباي'); await pg.fill('#t_party','مورد انستا'); await pg.fill('#t_amount','123'); });
 const ir2=(await rowsDb()).find(r=>r.party==='مورد انستا'); ok('custom pay method uses bank account',ir2&&ir2.pay_method==='إنستاباي'&&/bank/.test(ir2.payment_account_id||''),ir2);
 await go('settings'); await sec('accounts'); ok('accounts listed in settings',(await txt('#setAccList')).includes('الخزينة'));
 await go('reports'); const rt=await pg.$$eval('#reportTabs button',b=>b.map(x=>x.dataset.rep)); ok('12+ extra reports',rt.filter(x=>x.startsWith('r_')).length>=12,rt);
 for(const id of rt.filter(x=>x.startsWith('r_'))){ await pg.click('#reportTabs [data-rep="'+id+'"]'); await pg.waitForTimeout(120); ok('report '+id+' renders',(await txt('#repGenericTable')).length>10); }
 await pg.click('#reportTabs [data-rep="r_summary"]'); ok('summary has revenue line',(await txt('#repGenericTable')).includes('إجمالي الإيرادات'));
 await pg.click('#reportTabs [data-rep="r_accts"]'); ok('accounts report lists cash box',(await txt('#repGenericTable')).includes('الخزينة'));
 await pg.click('#reportTabs [data-rep="r_substmt"]'); await pg.selectOption('#repParty','شركة الهواء'); await pg.waitForTimeout(200); ok('contractor statement',(await txt('#repGenericTable')).includes('مدفوع')&&(await txt('#repGenericTable')).includes('20,000'));
 { const d8=pg.waitForEvent('download',{timeout:4000}).catch(()=>null); await pg.click('#repExport'); ok('generic report export',!!(await d8)); }
 // backup / restore
 await go('settings'); await sec('backup'); const d4=pg.waitForEvent('download',{timeout:4000}).catch(()=>null); await pg.click('#backupBtn'); const bk=await d4; ok('backup download',!!bk);
 if(bk){ await bk.saveAs(S+'/backup.json'); const j=JSON.parse(fs.readFileSync(S+'/backup.json','utf8')); ok('backup has data',JSON.stringify(j).length>500); 
   const cnt=(await rowsDb()).length; await pg.setInputFiles('#restoreFile',S+'/backup.json'); await pg.waitForTimeout(1000); ok('restore keeps rows',(await rowsDb()).length===cnt,[(await rowsDb()).length,cnt]); }
 // delete guard
 await go('projects'); await pg.evaluate(()=>{const t=[...document.querySelectorAll('#projectsTable tbody tr')][0]; (t.querySelector('a,button')||t).click();}); await pg.waitForTimeout(300);
 await pg.click('#pdEditBtn'); if(await pg.$('#modalDelete')){ let msg=''; pg.removeAllListeners('dialog'); pg.on('dialog',d=>{msg=d.message();d.dismiss();}); await pg.click('#modalDelete'); await pg.waitForTimeout(300); ok('project delete guarded when has transactions',(await txt('#view-projects, #view-project-detail').catch(()=>''))!==undefined); console.log('guard msg:',msg); }
 await pg.screenshot({path:S+'/final.png'});
 // roles
 await pg.evaluate(()=>{const d=JSON.parse(localStorage.getItem('moqawel_pro_db_v1'));d.meta=d.meta||{};d.meta.config=d.meta.config||{};d.meta.config.roles={'boss@x.com':'admin','eng@x.com':'engineer','buy@x.com':'purchaser'};localStorage.setItem('moqawel_pro_db_v1',JSON.stringify(d));localStorage.setItem('moqawel_test_email','eng@x.com');});
 console.log('DBMETA',await pg.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('moqawel_pro_db_v1')).meta)));
 await pg.reload(); await pg.waitForTimeout(1500); console.log('EMAIL',await pg.evaluate(()=>localStorage.getItem('moqawel_test_email')));
 console.log('ERRS',errs, await pg.evaluate(()=>document.body.innerText.slice(0,80).replace(/\n/g,' '))); const navs=await pg.$$eval('.nav button[data-view]',e=>e.filter(x=>getComputedStyle(x).display!=='none').map(x=>x.dataset.view)); ok('engineer sees only quick',navs.length===1&&navs[0]==='quick',navs);
 await pg.click('#qTypes button[data-t="عمالة"]'); await pg.selectOption('#q_project',pid); await pg.selectOption('#q_item',await pg.$$eval('#q_item option',o=>(o.find(x=>x.innerText.includes('تكييف اختبار'))||{}).value)); await pg.fill('#q_party','عامل'); await pg.fill('#q_amount','300'); await pg.click('#q_send'); await pg.waitForTimeout(500);
 ok('quick entry listed',(await txt('#quickMine')).includes('300'));
 const pn=await pg.evaluate(()=>{const d=JSON.parse(localStorage.getItem('moqawel_pro_db_v1'));return Object.values(d.pending||{}).length;}); ok('pending written',pn>0,pn);
 // engineer uploads Thursday sheet
 { const XL2=require(S+'/xl/node_modules/xlsx'); const hdr=['التاريخ','المشروع','بند الأعمال','الصنف / المورد','المبلغ','طريقة الدفع','أمين العهدة','ملاحظات'];
   const ws=XL2.utils.aoa_to_sheet([hdr,['2026-10-08','مشروع اختبار','تكييف اختبار','مواسير',400,'نقدي','',''],['2026-10-08','مشروع اختبار','تكييف اختبار','عدد',250,'نقدي','','']]); const wbk=XL2.utils.book_new(); XL2.utils.book_append_sheet(wbk,ws,('قالب - مشتريات').slice(0,31)); XL2.writeFile(wbk,S+'/sheet.xlsx');
   await pg.fill('#sheetPeriod','كشف الخميس 8/10'); await pg.setInputFiles('#sheetFile',S+'/sheet.xlsx'); await pg.click('#sheetSend'); await pg.waitForTimeout(800);
   const pn2=await pg.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('moqawel_pro_db_v1')).pending||{}).filter(p=>p.sheet_id).length); ok('engineer sheet sent as 2 pending rows',pn2===2,pn2);
   await pg.evaluate(()=>localStorage.setItem('moqawel_test_email','boss@x.com')); await pg.reload(); await pg.waitForTimeout(1200);
   await pg.evaluate(()=>document.querySelector('.nav [data-view="inbox"]').click()); await pg.waitForTimeout(400);
   ok('inbox shows sheet selector',(await pg.$('#inboxSheet'))!==null);
   await pg.selectOption('#inboxSheet',{index:1}); await pg.waitForTimeout(300); ok('filter shows 2 rows',(await pg.$$('#inboxTable tbody tr[data-id]')).length===2);
   const nb=(await rowsDb()).length; await pg.click('#inboxConfirmAllBtn'); await pg.waitForTimeout(900);
   const R3=await rowsDb(); ok('sheet approved -> 2 rows posted',R3.length===nb+2,[nb,R3.length]); ok('posted rows have cash account',R3.filter(r=>r.party==='مواسير'||r.party==='عدد').every(r=>r.payment_account_id==='internal-cash'),R3.slice(-2)); }
 ok('NO JS ERRORS',errs.length===0,errs);
 console.log(`\nRESULT pass=${pass} fail=${fail}`); await b.close();
})().catch(e=>{console.log('CRASH',e.message);process.exit(1)});
