import json,datetime,collections
from openpyxl import Workbook
from openpyxl.styles import Font,PatternFill,Alignment,Border,Side
from openpyxl.utils import get_column_letter as L
d=json.load(open('/tmp/claude-0/w4.json'))
W0,W1='2026-10-29','2026-11-04'
mapped=set(d['mapped'])
ASOF=datetime.date(2026,11,4)
NAVY='1F3A5F';SKY='DCEBFA';RED='FDE2E1';AMB='FFF3D6';GRN='E3F5E1'
thin=Side(style='thin',color='B8C4D0');BR=Border(left=thin,right=thin,top=thin,bottom=thin)
wb=Workbook()
def sheet(name,first=False):
    ws=wb.active if first else wb.create_sheet()
    ws.title=name;ws.sheet_view.rightToLeft=True;ws.sheet_properties.tabColor=NAVY
    ws.page_setup.orientation='landscape';ws.page_setup.fitToWidth=1;ws.page_setup.fitToHeight=0
    ws.sheet_properties.pageSetUpPr.fitToPage=True
    return ws
def title(ws,t,sub='',ncol=10):
    ws.merge_cells(start_row=1,start_column=1,end_row=1,end_column=ncol)
    c=ws.cell(1,1,t);c.font=Font(name='Arial',size=15,bold=True,color='FFFFFF');c.fill=PatternFill('solid',fgColor=NAVY);c.alignment=Alignment(horizontal='center',vertical='center');ws.row_dimensions[1].height=28
    if sub:
        ws.merge_cells(start_row=2,start_column=1,end_row=2,end_column=ncol);c=ws.cell(2,1,sub);c.font=Font(name='Arial',size=10,italic=True,color='555555');c.alignment=Alignment(horizontal='center',wrap_text=True);ws.row_dimensions[2].height=30
def table(ws,r0,heads,rows,money=(),widths=None,flagcol=None,total=None):
    for j,h in enumerate(heads,1):
        c=ws.cell(r0,j,h);c.font=Font(name='Arial',bold=True,color='FFFFFF',size=10);c.fill=PatternFill('solid',fgColor='2E6DA4');c.alignment=Alignment(horizontal='center',vertical='center',wrap_text=True);c.border=BR
    ws.row_dimensions[r0].height=32
    for i,row in enumerate(rows,1):
        for j,v in enumerate(row,1):
            c=ws.cell(r0+i,j,v);c.font=Font(name='Arial',size=10);c.border=BR;c.alignment=Alignment(vertical='center',wrap_text=isinstance(v,str) and len(v)>28)
            if j-1 in money and isinstance(v,(int,float)):c.number_format='#,##0.00;[Red]-#,##0.00;-'
        if flagcol is not None and row[flagcol]:
            for j in range(1,len(heads)+1):ws.cell(r0+i,j).fill=PatternFill('solid',fgColor=AMB)
    n=len(rows)
    if total:
        tr=r0+n+1
        ws.cell(tr,1,'الإجمالي').font=Font(name='Arial',bold=True)
        for j in total:
            c=ws.cell(tr,j+1,f'=SUM({L(j+1)}{r0+1}:{L(j+1)}{r0+n})' if n else 0);c.font=Font(name='Arial',bold=True);c.number_format='#,##0.00';c.fill=PatternFill('solid',fgColor=SKY);c.border=BR
        ws.cell(tr,1).fill=PatternFill('solid',fgColor=SKY)
    if widths:
        for j,w in enumerate(widths,1):ws.column_dimensions[L(j)].width=w
    ws.freeze_panes=ws.cell(r0+1,3)
    return r0+n+(2 if total else 1)
def age(dt):
    try:return (ASOF-datetime.date.fromisoformat(dt)).days
    except:return None
# ---------- subcontractors
subs=[];exc=[]
payments=collections.defaultdict(float)
for e in d['ex']:
    if e['kind']=='conpay' and e.get('con'):payments[(e['con'],e['site'])]+=e['out']
for s in d['sheets']:
    wk=s['weeks']
    if not wk:continue
    inw=[w for w in wk if W0<=w['date']<=W1]
    last=wk[-1]
    mp=s['site'] in mapped
    if not inw and not (mp and abs(s['owed'])>0.5):continue
    new=sum(w['cost'] for w in inw);ent=sum(w['dcost'] for w in inw);adv=sum(w['cust'] for w in inw)
    prevcum=last['G']-(last['cost'] if inw and last in inw else 0)
    pay=payments.get((s['con'],s['site']),0)
    items='؛ '.join(sorted({it['d'].strip() for w in inw for it in w['items']})[:3]) if inw else ''
    status='طلب اعتماد' if inw else 'رصيد مرحّل'
    note=''
    if not mp:note='خارج مشاريع النظام السبعة'
    gd=(last['G']-last['P'])-s['owed']
    if inw and abs(gd)>1:
        note=(note+'؛ ' if note else '')+'فرق بين (التراكمي − المدفوع سابقًا) والرصيد بالكشف: '+format(round(gd),',')
    subs.append([s['con'],s['site'],round(prevcum,2),round(last['G'],2),round(new,2),round(last['P'],2),round(adv,2),0,round(ent-adv,2),round(pay,2),round(s['owed'],2),items,status,note])
    if not inw: pass
subs.sort(key=lambda r:(r[13]!='' ,-r[10]))
# ---------- workers
wrows=[];wexc=[];seen=collections.Counter()
for w in d['wages']:
    for r in w['rows']:seen[(w['site'],r['name'].strip())]+=1
for w in d['wages']:
    mp=w['site'] in mapped or w['site'] in [p[0] for p in d['proj']]
    for r in w['rows']:
        gross=r['total'];adv=r['adv'];net=r['net']
        fl=[]
        if seen[(w['site'],r['name'].strip())]>1:fl.append('اسم مكرر')
        if net<0:fl.append('صافي سالب')
        if abs(gross-(r.get('sheet_total') or gross))>1:fl.append('فرق عن الكشف')
        if r.get('rule_total') is not None and abs(r['rule_total']-gross)>1:fl.append('معدل السهرة/التطبيقة يختلف عن قاعدة (نصف يومية/يومية) — المعدل من الكشف')
        wrows.append([r['name'],w['site'],r['rate'],r['days'],r['ot_n'],r['ot_v'],r['sh_n'],r['sh_v'],round(gross,2),round(r.get('sheet_total') or 0,2),round(adv,2),0,round(net,2),0,round(net,2),'طلب اعتماد','؛ '.join(fl)])
        if fl:wexc.append((w['site'],r['name'],'؛ '.join(fl)))
# ---------- expenses
CL={'exp':'مصروف مباشر على المشروع','purchase':'مشتريات مواد','conpay':'دفعة لمقاول باطن','suppay':'دفعة مورد/مقاول (غير محدد)','adv':'سلفة','advcust':'عهدة/سلفة موظف','in':'عهدة مستلمة (تمويل)','refund':'مرتجع (يخفض التكلفة)'}
erows=[]
for e in d['ex']:
    amt=e['out'] or e['inn']
    sign=-amt if e['kind']=='refund' else (amt if e['out'] else amt)
    erows.append([e['date'],e['bayan'],e['site'] or '— بدون مشروع —',CL.get(e['kind'],e['kind']),e.get('cat') or e.get('band') or '',round(e['out'],2),round(e['inn'],2),'نقدي — عهدة محمد عصام','لا يوجد مستند مرفق' if e['kind'] in('purchase',) else '؛ '.join(e['flags'])])
erows.sort(key=lambda r:r[0])
# ---------- advances
arows=[]
for e in d['ex']:
    if e['kind'] in('adv','advcust'):
        arows.append(['محمد عصام (عهدة الموقع)' if e['kind']=='advcust' else 'سلفة عامل/موظف',e['date'],e['site'] or '— غير محدد —',e['bayan'],round(e['out'],2),0,0,round(e['out'],2),age(e['date']),'مفتوحة'+(' — متأخرة' if (age(e['date']) or 0)>30 else ''),'لا يوجد مستند' ])
cin=sum(e['inn'] for e in d['ex'] if e['kind']=='in');cout=sum(e['out'] for e in d['ex'] if e['kind'] not in('in','refund'));cref=sum(e['inn'] for e in d['ex'] if e['kind']=='refund')
# ---------- project summary
proj=collections.OrderedDict()
def P(n):
    if n not in proj:proj[n]=dict(sub=0,lab=0,pur=0,exp=0,ref=0,cum=0,owed=0,wnet=0)
    return proj[n]
for s in d['sheets']:
    if not s['weeks']:continue
    inw=[w for w in s['weeks'] if W0<=w['date']<=W1]
    if inw or (s['site'] in mapped and abs(s['owed'])>0.5):
        p=P(s['site']);p['sub']+=sum(w['cost'] for w in inw);p['cum']+=s['weeks'][-1]['G'];p['owed']+=s['owed']
for w in d['wages']:
    p=P(w['site']);p['lab']+=sum(r['total'] for r in w['rows']);p['wnet']+=sum(r['net'] for r in w['rows'])
for e in d['ex']:
    p=P(e['site'] or '— بدون مشروع —')
    if e['kind']=='purchase':p['pur']+=e['out']
    elif e['kind'] in('exp','adv','advcust') and e['kind']=='exp':p['exp']+=e['out']
    elif e['kind']=='refund':p['ref']+=e['inn']
prow=[]
for n,p in proj.items():
    tot=p['sub']+p['lab']+p['pur']+p['exp']-p['ref']
    prow.append([n,round(p['sub'],2),round(p['lab'],2),round(p['pur'],2),round(p['exp'],2),-round(p['ref'],2),0,round(tot,2),round(p['cum'],2),round(p['owed']+p['wnet'],2),'ضمن النظام' if n in mapped else 'خارج مشاريع النظام'])
# ---------- exceptions
ex=[]
for e in d['ex']:
    for f in e['flags']:ex.append(['مصروفات',e['date'],e['site'] or '—',e['bayan'],e['out'] or e['inn'],f,'حدّد المشروع/المقاول ثم اعتمد'])
    if e['kind']=='conpay' and not e.get('con'):ex.append(['مصروفات',e['date'],e['site'],e['bayan'],e['out'],'دفعة مقاول بلا مقاول محدد','اختر المقاول'])
    if not e['site'] and e['kind'] not in('in',):ex.append(['مصروفات',e['date'],'—',e['bayan'],e['out'] or e['inn'],'بدون مشروع','حدّد المشروع'])
for s in subs:
    if s[12]=='طلب اعتماد':ex.append(['مقاول',W1,s[1],s[0],s[10],'لا يوجد رصيد سابق مسجل بالنظام — الأساس مأخوذ من كشف المقاول وليس من سجلات سابقة','مراجعة الرصيد الافتتاحي مع المحاسب'])
    if 'خارج' in s[13]:ex.append(['مقاول',W1,s[1],s[0],s[10],'الموقع خارج مشاريع النظام السبعة','ربط بمشروع أو استبعاد'])
    if 'فرق بين' in s[13]:ex.append(['مقاول',W1,s[1],s[0],s[10],s[13],'قارن الكشف بالمدفوعات والعهدة'])
for site,nm,f in wexc:ex.append(['عمال',W1,site,nm,0,f,'مراجعة'])
if cin or cout:ex.append(['عهدة',W1,'—','محمد عصام',round(cin-cout,2),'لا يوجد رصيد افتتاحي للعهدة قبل 29/10 — الرصيد الظاهر يخص الأسبوع فقط','أدخل الرصيد الافتتاحي للعهدة'])
# =============== write workbook
ws=sheet('1 لوحة التحكم الأسبوعية',True);title(ws,'كشف الحسابات الأسبوعي للمواقع — الخميس 04-11-2026','الفترة 29-10-2026 → 04-11-2026 — لا توجد سجلات سابقة في النظام، لذا الأرصدة التراكمية مأخوذة من كشوف المقاولين نفسها',6)
subw=[r for r in subs if r[12]=='طلب اعتماد']
K=[('المطلوب صرفه للمقاولين هذا الأسبوع (بعد السلف)',sum(r[8] for r in subw)),('مدفوع للمقاولين هذا الأسبوع (من العهدة)',sum(r[9] for r in subs)),('إجمالي المتبقي للمقاولين (كل الأرصدة المعروضة)',sum(r[10] for r in subs)),
('إجمالي أجور العمال (قبل الخصم)',sum(r[8] for r in wrows)),('إجمالي سلف/خصومات العمال',sum(r[10] for r in wrows)),('صافي مستحق العمال',sum(r[12] for r in wrows)),('المدفوع للعمال فعليًا',0),
('إجمالي مصروفات الأسبوع (مباشر + مشتريات)',sum(e['out'] for e in d['ex'] if e['kind'] in('exp','purchase'))),('سلف جديدة صُرفت',sum(r[4] for r in arows)),('سلف تمت تسويتها',0),('عهدة مستلمة هذا الأسبوع',cin),('المرتجعات',cref),
('إجمالي المطلوب للصرف الأسبوعي (مقاولون + عمال)',sum(r[8] for r in subw)+sum(r[12] for r in wrows)),('عدد الحركات المالية',len(d['ex'])+len(subw)+len(wrows)),('عدد البنود التي تحتاج مراجعة',len(ex))]
r=4
for k,v in K:
    ws.cell(r,1,k).font=Font(name='Arial',bold=True,size=11);ws.cell(r,1).fill=PatternFill('solid',fgColor=SKY);ws.cell(r,1).border=BR
    c=ws.cell(r,2,round(v,2) if isinstance(v,float) else v);c.number_format='#,##0.00';c.font=Font(name='Arial',size=11,bold=True);c.border=BR
    if k.startswith('إجمالي المطلوب'):
        for j in (1,2):ws.cell(r,j).fill=PatternFill('solid',fgColor=GRN)
    r+=1
ws.column_dimensions['A'].width=52;ws.column_dimensions['B'].width=22
ws.cell(r+1,1,'ملاحظة: المدفوع للعمال والسلف المسواة = صفر لأن الكشوف لا تتضمن سندات صرف فعلية؛ يُسجَّل الصرف الفعلي بسند في النظام.').font=Font(name='Arial',italic=True,size=9)
ws=sheet('2 تسويات المقاولين');title(ws,'تسويات مقاولي الباطن — سجل واحد لكل مقاول لكل مشروع','المستحق هذا الأسبوع = الفرق بين التراكمي الحالي والسابق. الأرصدة التراكمية من كشف المقاول. حالة الدفع قابلة للاختيار.',14)
hd=['المقاول','المشروع','التراكمي السابق','التراكمي الحالي','أعمال الأسبوع الجديدة','المدفوع سابقًا (تراكمي)','السلف المخصومة','خصومات معتمدة أخرى','المطلوب صرفه (بعد السلف)','المدفوع هذا الأسبوع','الرصيد المتبقي','البنود الرئيسية','الحالة','ملاحظة']
end=table(ws,4,hd,subs,money=range(2,11),widths=[26,34,15,15,15,15,13,13,15,15,15,40,14,26],flagcol=13,total=[2,3,4,5,6,7,8,9,10])
from openpyxl.worksheet.datavalidation import DataValidation
dv=DataValidation(type='list',formula1='"طلب اعتماد,معتمد للصرف,مدفوع جزئيًا,مدفوع بالكامل,معلّق,يحتاج تسوية,رصيد مرحّل"');ws.add_data_validation(dv);dv.add(f'M5:M{4+len(subs)}')
ws=sheet('3 كشف أجور العمال');title(ws,'أجور العمال اليومية 29-10 → 04-11-2026','الأجر = (أيام × يومية) + (سهرات × معدل السهرة) + (تطبيقات × معدل التطبيقة) — بالمعدلات المكتوبة في كشف كل عامل',17)
hd=['العامل','المشروع','اليومية','أيام','سهرات','معدل السهرة','تطبيقات','معدل التطبيقة','الإجمالي المحسوب','الإجمالي بالكشف','سلف أسبوعية/مستديمة','خصومات','صافي المستحق','المدفوع فعليًا','المتبقي','الحالة','ملاحظات']
table(ws,4,hd,wrows,money=[2,5,7,8,9,10,11,12,13,14],widths=[24,36,10,8,8,11,9,11,14,14,13,10,14,12,12,14,44],flagcol=16,total=[8,9,10,11,12,13,14])
dv2=DataValidation(type='list',formula1='"طلب اعتماد,معتمد للصرف,مدفوع جزئيًا,مدفوع بالكامل,معلّق,يحتاج تسوية"');ws.add_data_validation(dv2);dv2.add(f'P5:P{4+len(wrows)}')
ws=sheet('4 تسوية العهد والسلف');title(ws,'العهد والسلف — محمد عصام وسلف العمال','لا توجد سجلات سابقة: الأرصدة الافتتاحية للعهد غير معروفة وتحتاج إدخالًا يدويًا',11)
nxt=table(ws,4,['المسؤول','التاريخ','المشروع','البيان','المبلغ الأصلي','المسوّى','الخصومات السابقة','الرصيد المفتوح','العمر (يوم)','الحالة','المستند'],arows,money=[4,5,6,7],widths=[26,12,34,40,14,12,14,14,10,18,16],total=[4,7])
ws.cell(nxt+1,1,'حركة عهدة الأسبوع').font=Font(name='Arial',bold=True,size=12)
for i,(k,v) in enumerate([('عهدة مستلمة',cin),('مصروفات خرجت من العهدة',cout),('مرتجعات',cref),('صافي حركة العهدة (بدون افتتاحي)',cin-cout+cref)]):
    ws.cell(nxt+2+i,1,k).border=BR;c=ws.cell(nxt+2+i,2,round(v,2));c.number_format='#,##0.00';c.border=BR
ws=sheet('5 مصروفات الأسبوع');title(ws,'مصروفات الأسبوع — مصرفات 4-11-2026','المرتجع يخفض التكلفة ولا يُسجَّل مصروفًا موجبًا. التمويل الداخلي ليس مصروف مشروع.',9)
table(ws,4,['التاريخ','البيان','المشروع','التصنيف','البند','المنصرف','المستلم','طريقة الدفع/الحساب','ملاحظات'],erows,money=[5,6],widths=[12,44,36,26,18,13,13,24,38],total=[5,6])
ws=sheet('6 ملخص تكلفة المشاريع');title(ws,'ملخص تكلفة المشاريع — أسبوع 04-11-2026','التكلفة الأسبوعية = أعمال المقاولين الجديدة + أجور + مشتريات + مصروفات مباشرة − مرتجعات. العمود قبل الأخير = المتبقي (مقاولون + عمال).',11)
table(ws,4,['المشروع','أعمال مقاولين (الأسبوع)','أجور عمال','مشتريات','مصروفات مباشرة','مرتجعات','أعباء موزعة','إجمالي تكلفة الأسبوع','قيمة أعمال المقاولين التراكمية','التزامات قائمة','النطاق'],prow,money=range(1,10),widths=[44,16,14,14,14,12,12,16,18,16,18],total=[1,2,3,4,5,6,7,8,9])
ws=sheet('7 الاستثناءات والمراجعة');title(ws,'الاستثناءات وبنود المراجعة',f'{len(ex)} بندًا — لا يُعتمد الترحيل قبل مراجعتها',7)
table(ws,4,['المصدر','التاريخ','المشروع','البيان/الاسم','المبلغ','المشكلة','الإجراء المطلوب'],ex,money=[4],widths=[12,12,36,38,14,60,32])
wb.save('/tmp/claude-0/out/WEEKLY_SITE_ACCOUNTING_04-11-2026.xlsx')
print('subs',len(subs),'workers',len(wrows),'exp',len(erows),'adv',len(arows),'exceptions',len(ex),'proj',len(prow))
for k,v in K:print(k,round(v,2))
