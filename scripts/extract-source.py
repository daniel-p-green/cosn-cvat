"""Read-only OOXML extraction. Canonical prompts are copied verbatim, including source typos."""
import json, re, zipfile, xml.etree.ElementTree as E, hashlib, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=ROOT/'source/CoSN-K-12CVAT-Lite-V4.1-2.xlsx'; z=zipfile.ZipFile(p)
n={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
strings=[''.join(si.itertext()) for si in E.fromstring(z.read('xl/sharedStrings.xml'))]
def sheet(i):
 root=E.fromstring(z.read(f'xl/worksheets/sheet{i}.xml')); rows=[]
 for row in root.findall('.//m:sheetData/m:row',n):
  cells={}
  for c in row:
   v=c.find('m:v',n); val=v.text if v is not None else ''
   if c.get('t')=='s':val=strings[int(val)]
   elif c.get('t')=='inlineStr':val=''.join(c.find('m:is',n).itertext())
   cells[re.sub(r'\d','',c.get('r'))]=val or ''
  rows.append((int(row.get('r')),cells))
 return root,rows
root,rows=sheet(4); refs={d.get('A'):d for _,d in sheet(7)[1]}; cross={d.get('A'):d for _,d in sheet(5)[1]}; headers=dict(sheet(5)[1])[22]
validation=set()
for v in root.findall('.//m:dataValidation',n):
 for ran in v.get('sqref').split():
  nums=list(map(int,re.findall(r'\d+',ran)));validation.update(range(nums[0],nums[-1]+1))
questions=[]; sections=[]; section='General Information'
for row,d in rows:
 id=d.get('A','')
 if re.fullmatch(r'[A-Z]{4}-\d{2}',id):
  ref=refs.get(id,{}); cw=cross.get(id,{})
  questions.append({'id':id,'text':d.get('B',''),'section':section,'row':row,'kind':'choice' if row in validation else 'text','owner':'District IT' if id in ['GNRL-11','GNRL-12'] else 'Vendor','guidance':d.get('E',''),'reason':ref.get('C',''),'followup':ref.get('D',''),'crosswalk':{headers[k]:cw.get(k,'') for k in ['C','D','E','F','G','H'] if cw.get(k,'') not in ['', '0']}})
 elif id in ['General Information','Documentation','Company Overview','Application/Service Security','Authentication, Authorization, and Accounting','Business Continuity Plan','Change Management','Data','Database','Datacenter','Disaster Recovery Plan','Firewalls, IDS, IPS, and Networking','Physical Security','Policies, Procedures, and Processes','Systems Management & Configuration','Vulnerability Scanning']:
  section=id
  if section not in sections:sections.append(section)
# DATE-01 precedes the section header; it belongs to General Information.
meta={'title':'CoSN K-12 Community Vendor Assessment Tool (CVAT) - Lite','version':'4.1','url':'https://www.cosn.org/wp-content/uploads/2022/11/CoSN-K-12CVAT-Lite-V4.1-2.xlsx','sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'retrieved':'2026-10-21','sections':sections,'questions':questions}
(ROOT/'dist/questions.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
# Preserve drawing text, instructions, comments and source structure for audit.
drawing_text={name:[''.join(p.itertext()) for p in E.fromstring(z.read(name)).findall('.//a:p',n)] for name in z.namelist() if re.fullmatch(r'xl/drawings/drawing\d+.xml',name)}
(ROOT/'source/drawing-text.json').write_text(json.dumps(drawing_text,indent=2))
print(json.dumps({'fields':len(questions),'assessment':sum(not q['id'].startswith(('GNRL','DATE')) for q in questions),'yesNo':sum(q['kind']=='choice' for q in questions),'sections':len(sections),'sha256':meta['sha256']}))
