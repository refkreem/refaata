/* ===== الذكاء الاصطناعي (اختياري) =====
   مفتاح Claude API يُحفظ على هذا الجهاز فقط (localStorage) ولا يُرسل إلا إلى api.anthropic.com.
   بدون مفتاح يعمل النظام كالمعتاد بالقواعد المدمجة. كل ما يقترحه الذكاء الاصطناعي يُعرض للمراجعة ولا يُعتمد تلقائيًا. */
var AI_GLOSS='أنت محاسب ومهندس تكلفة مصري في شركة مقاولات تعمل في تطوير المستشفيات (رعايات، عمليات، تكييف، غازات طبية، تشطيبات). افهم العامية المصرية والتعبيرات الهندسية والمحاسبية: '+
 'يومية=أجر يوم عامل/فني؛ سهرة=نصف يومية إضافية؛ تطبيقة=يومية كاملة إضافية؛ سلفة=دفعة مقدمة تُخصم من الأجر أو المستخلص؛ عهدة=مبلغ مسلَّم لمهندس الموقع يصرف منه؛ مرتجع/رد=مبلغ مردود؛ '+
 'مقاول/مقاول باطن/صنايعي/فني/عامل/مساعد؛ توريد=شراء مواد؛ توريد وتركيب؛ توريد وتنفيذ؛ مقطوعية/قطعي=مبلغ إجمالي ثابت؛ مستخلص/شهادة=حساب أعمال منفذة؛ خصم ما سبق صرفه=ما دُفع سابقًا؛ '+
 'مصنعيات=أجر تنفيذ بلا مواد؛ نقل/ترحيل/مشال=مواصلات وتحميل؛ ضيافة/بوفيه/شاي=ضيافة؛ إكرامية/حلاوة=إكراميات؛ مخلفات/ردم/تكسير=أعمال هدم ونقل مخلفات؛ بياض/محارة؛ دهانات/نقاش/معجون؛ '+
 'سباك/صحي/مواسير؛ كهربائي/أسلاك/لوحة؛ نجار/خشب/أبواب؛ حداد/معدنيات/ابواب حديد؛ سقف معلق/جبس بورد؛ سيراميك/بورسلين/رخام/جرانيت/أرضيات؛ تكييف/دكت/صاج؛ سقالات؛ صنفرة وجلي؛ عزل؛ ألومنيوم؛ إنذار حريق. '+
 'الأسماء قد تتضمن الحرفة قبل الاسم (مثل: نقاش محمود، سباك احمد). لا تخترع أرقامًا ولا أسماء: إن لم يكن الحقل ظاهرًا اتركه فارغًا أو null.';
function aiKey(){try{return localStorage.getItem('moq_ai_key')||''}catch(e){return''}}
function aiModel(){try{return localStorage.getItem('moq_ai_model')||'claude-sonnet-5-5'}catch(e){return'claude-sonnet-5-5'}}
function aiOn(){return !!aiKey()}
async function aiCall(system,content,maxTok){var k=aiKey();if(!k)throw new Error('لم يُضبط مفتاح الذكاء الاصطناعي (الإعدادات ← الذكاء الاصطناعي)');
 var r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:aiModel(),max_tokens:maxTok||2000,system:system,messages:[{role:'user',content:content}]})});
 if(!r.ok){var tx='';try{tx=(await r.json()).error.message}catch(e){}throw new Error('تعذّر الاتصال بالذكاء الاصطناعي ('+r.status+') '+tx)}
 var j=await r.json();return(j.content||[]).map(function(b){return b.text||''}).join('')}
function aiJson(t){t=String(t||'');var a=t.search(/[\[{]/);if(a<0)throw new Error('ردّ غير مفهوم');var open=t[a],close=open==='['?']':'}',z=t.lastIndexOf(close);return JSON.parse(t.slice(a,z+1))}
/* نص من ملف Word (.docx): الفقرات والجداول بترتيبها */
async function aiDocxText(file){if(typeof impLoadZip==='function')await impLoadZip();var z=await JSZip.loadAsync(await file.arrayBuffer());var x=await z.file('word/document.xml').async('string');
 return x.replace(/<\/w:tc>/g,' | ').replace(/<\/w:tr>/g,'\n').replace(/<\/w:p>/g,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/[ \t]+/g,' ').trim()}
function aiB64(file){return new Promise(function(ok,no){var fr=new FileReader();fr.onload=function(){ok(String(fr.result).split(',')[1])};fr.onerror=no;fr.readAsDataURL(file)})}
function aiImgB64(file){return new Promise(function(ok){if(typeof invImgShrink!=='function'){aiB64(file).then(function(b){ok({d:b,t:file.type})});return}invImgShrink(file,function(d,t){ok({d:String(d).split(',')[1],t:t})})})}
/* فاتورة (صورة / PDF / Word) → مورد، رقم، تاريخ، أصناف */
async function aiInvoice(file){var nm=file.name||'',blocks=[];
 if(/\.docx$/i.test(nm)){blocks.push({type:'text',text:'نص الفاتورة:\n'+await aiDocxText(file)})}
 else if(/^image/.test(file.type)){var im=await aiImgB64(file);blocks.push({type:'image',source:{type:'base64',media_type:im.t||'image/jpeg',data:im.d}})}
 else if(/pdf/i.test(file.type)||/\.pdf$/i.test(nm)){blocks.push({type:'document',source:{type:'base64',media_type:'application/pdf',data:await aiB64(file)}})}
 else throw new Error('صيغة غير مدعومة للتحليل');
 blocks.push({type:'text',text:'استخرج بيانات هذه الفاتورة. أجب بـ JSON فقط بالشكل: {"supplier":string|null,"invoice_no":string|null,"date":"YYYY-MM-DD"|null,"total":number|null,"category":"كهربائية|صحية|معمارية|إنذار|غازات|تكييف|أخرى","lines":[{"item":string,"unit":string,"qty":number,"price":number}],"notes":string}. الأصناف بأسماء عربية مفهومة كما في الفاتورة. price = سعر الوحدة.'});
 return aiJson(await aiCall(AI_GLOSS,blocks,2500))}
/* تعبئة نموذج الفاتورة/المصروف من نتيجة الذكاء الاصطناعي */
function aiInvoiceApply(kind,res,msg){var L=(res.lines||[]).filter(function(l){return l&&l.item}).map(function(l){return{item:String(l.item),unit:l.unit||'',qty:num(l.qty)||1,price:r2(num(l.price))}});
 if(kind==='purchase'){var host=$('lines');if(!host)return;Array.prototype.slice.call(host.querySelectorAll('.ln')).forEach(function(e){if(!q(e,'.l_item').trim()&&!num(q(e,'.l_qty')))e.remove()});L.forEach(function(l){host.insertAdjacentHTML('beforeend',S.purLine(l))});
  if(res.invoice_no&&!v$('t_inv'))$('t_inv').value=res.invoice_no;if(res.supplier&&!v$('t_sup'))$('t_sup').value=res.supplier;if(res.date&&$('t_date'))$('t_date').value=res.date;S.recalc&&S.recalc()}
 else{var tot=num(res.total)||sum(L,function(l){return l.qty*l.price});if($('t_amt'))$('t_amt').value=r2(tot);if($('t_desc')&&!v$('t_desc'))$('t_desc').value=(res.supplier?res.supplier+' — ':'')+L.slice(0,6).map(function(l){return l.item}).join(' + ');if(res.date&&$('t_date'))$('t_date').value=res.date;S.recalc&&S.recalc()}
 if(msg)msg.innerHTML='<b>🤖 حلّل الذكاء الاصطناعي الفاتورة: '+L.length+' صنفًا'+(res.supplier?' — المورد: '+h(res.supplier):'')+'</b> — راجع الأرقام جيدًا قبل الحفظ.'}
/* بيانات مصروفات غير واضحة (استيراد الخميس) → تصنيف + اسم الشخص/الجهة ودوره */
async function aiClassifyRows(rows,cats){var out=[];for(var i=0;i<rows.length;i+=30){var part=rows.slice(i,i+30);
 var t=await aiCall(AI_GLOSS,[{type:'text',text:'هذه بنود مصروفات أسبوعية من شيت موقع. صنّف كل بند. التصنيفات المتاحة: '+cats.join('، ')+'. أجب بـ JSON فقط: مصفوفة [{"i":رقم,"cat":تصنيف من القائمة أو null,"person":اسم شخص/جهة مذكورة أو null,"role":"contractor|worker|supplier|engineer|null","why":سبب قصير}]. إن لم تتأكد ضع null.\n'+JSON.stringify(part)}],2500);
 out=out.concat(aiJson(t))}return out}
ACT.impAI=async function(){var st=S.imp;if(!st)return;if(!aiOn()){toast('اضبط مفتاح الذكاء الاصطناعي من الإعدادات أولًا');return}
 var B=impDefaults(st),cats=(S.cfg.ecats||[]).slice();IMP_CATS.forEach(function(c){if(cats.indexOf(c[1])<0)cats.push(c[1])});
 var rows=B.ex.map(function(e,ix){return{e:e,ix:ix}}).filter(function(o){return o.e.kind==='exp'&&(o.e.cat==='أخرى'||o.e.flags.length)&&!o.e.ai});if(!rows.length){toast('لا توجد بنود غير واضحة');return}
 toast('الذكاء الاصطناعي يحلّل '+rows.length+' بندًا…');try{var res=await aiClassifyRows(rows.map(function(o,k){return{i:k,bayan:o.e.bayan,band:o.e.band,site:o.e.site,amount:o.e.out}}),cats);var n=0;
  res.forEach(function(r){var o=rows[r.i];if(!o)return;var raw=st.exp.filter(function(x){return x.no===o.e.no&&x.date===o.e.date&&x.bayan===o.e.bayan})[0];if(!raw)return;raw.ai={cat:cats.indexOf(r.cat)>=0?r.cat:'',person:r.person||'',role:r.role||'',why:r.why||''};n++});
  toast('اقترح الذكاء الاصطناعي تصنيف '+n+' بندًا — راجعها في الخطوة ٥');render()}catch(e){toast(e.message||'فشل التحليل')}};
SETS.push(['ai','الذكاء الاصطناعي']);
SECT.ai=function(){return'<h3>الذكاء الاصطناعي (اختياري)</h3><div class="hint" style="margin-bottom:10px">يحلّل صور وPDF وWord الفواتير ويفهم عبارات المصروفات بالعامية المصرية. يحتاج مفتاح Claude API خاصًا بك. <b>يُحفظ المفتاح على هذا الجهاز فقط</b> (لا في قاعدة البيانات ولا يراه بقية المستخدمين) ويُرسل فقط إلى api.anthropic.com. كل نتيجة تُعرض للمراجعة ولا تُعتمد تلقائيًا. يتحمّل حسابك تكلفة الاستخدام.</div><div class="fg">'+fld('مفتاح API','<input type="password" id="ai_key" value="'+h(aiKey())+'" placeholder="sk-ant-…" autocomplete="off">')+fld('النموذج','<input id="ai_model" value="'+h(aiModel())+'">')+'</div><div class="flt"><button class="btn p" data-a="aiSave">حفظ على هذا الجهاز</button><button class="btn" data-a="aiClear">حذف المفتاح من هذا الجهاز</button></div>'};
ACT.aiSave=function(){try{localStorage.setItem('moq_ai_key',($('ai_key').value||'').trim());localStorage.setItem('moq_ai_model',($('ai_model').value||'').trim()||'claude-sonnet-5-5');toast('تم الحفظ على هذا الجهاز')}catch(e){toast('تعذّر الحفظ')}};
ACT.aiClear=function(){try{localStorage.removeItem('moq_ai_key')}catch(e){}toast('حُذف المفتاح');render()};
