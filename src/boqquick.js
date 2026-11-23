/* إضافة بند للمقايسة من داخل نموذج الإنجاز/التقرير اليومي عند عدم وجوده */
document.addEventListener('change',function(ev){var sel=ev.target;if(!sel||sel.tagName!=='SELECT'||sel.value!=='__new')return;
 var pid=sel.id==='t_boq'?v$('t_proj'):(sel.id||'').indexOf('sw_b')===0?v$('sr_p'):'';if(!pid||!proj(pid))return;
 var old=sel.parentNode.querySelector('.nbq');if(old)old.remove();
 var d=document.createElement('div');d.className='nbq hint';d.style.cssText='display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:6px;margin-top:6px';
 d.innerHTML='<input placeholder="وصف البند (مثال: تركيب سيراميك)" class="nb_n"><input placeholder="الوحدة (م2)" class="nb_u"><input type="number" step="any" placeholder="الكمية" class="nb_q"><input type="number" step="any" placeholder="سعر الوحدة" class="nb_p"><button type="button" class="btn sm p nb_ok">إضافة</button>';
 sel.parentNode.appendChild(d);var q=function(c){return d.querySelector(c)};
 q('.nb_ok').onclick=async function(){var n=q('.nb_n').value.trim();if(!n){toast('اكتب وصف البند');return}var p=proj(pid);p.boq=p.boq||[];var it={id:uid(),code:String(p.boq.length+1),name:n,unit:q('.nb_u').value.trim(),qty:num(q('.nb_q').value),price:num(q('.nb_p').value),cost_price:0,group:''};p.boq.push(it);
  if(!(await dbSet('projects',p))){p.boq.pop();return}
  sel.innerHTML=sel.id==='t_boq'?boqOpts(pid,it.id,'new'):srBoqOpts(pid,it.id);sel.value=it.id;d.remove();sel.dispatchEvent(new Event('change',{bubbles:true}));toast('أُضيف البند إلى مقايسة المشروع')};
 sel.value=''});
