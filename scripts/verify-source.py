"""Verify every shipped prompt directly against original OOXML, without third-party dependencies."""
import json,re,zipfile,xml.etree.ElementTree as E,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
z=zipfile.ZipFile(root/'source/CoSN-K-12CVAT-Lite-V4.1-2.xlsx')
n={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
strings=[''.join(si.itertext()) for si in E.fromstring(z.read('xl/sharedStrings.xml'))]
canonical={}
for row in E.fromstring(z.read('xl/worksheets/sheet4.xml')).findall('.//m:sheetData/m:row',n):
 d={}
 for c in row:
  v=c.find('m:v',n);value=v.text if v is not None else ''
  if c.get('t')=='s':value=strings[int(value)]
  d[re.sub(r'\d','',c.get('r'))]=value or ''
 if re.fullmatch(r'[A-Z]{4}-\d{2}',d.get('A','')):canonical[d['A']]=d['B']
qs=json.loads((root/'dist/questions.json').read_text())['questions']
assert {q['id']:q['text'] for q in qs}==canonical
assert len(qs)==76 and len(set(q['id'] for q in qs))==76
assert sum(q['kind']=='choice' for q in qs)==60
assert sum(not q['id'].startswith(('GNRL','DATE')) for q in qs)==63
assert len(set(q['section'] for q in qs))==16
assert all(q['owner']=='District IT' for q in qs if q['id'] in ['GNRL-11','GNRL-12'])
print('PASS: all 76 IDs and exact prompt text match the original workbook; 63 assessment prompts, 60 Yes/No controls, 16 sections, district-only fields.')
