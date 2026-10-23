"""Verify native-saved fixture semantics against the untouched original. Does not operate Excel."""
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as E
import json,re,hashlib,posixpath,math,os
root=Path(__file__).resolve().parents[1];folder=root.parent/'cosn-cvat-review/v10-resumed/native-excel';NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
def load(path):
 z=ZipFile(path);wb=E.fromstring(z.read('xl/workbook.xml'));rr=E.fromstring(z.read('xl/_rels/workbook.xml.rels'));rels={r.get('Id'):r.get('Target')for r in rr};ss=[]
 if 'xl/sharedStrings.xml'in z.namelist():ss=[''.join(t.text or ''for t in a.findall('.//s:t',NS))for a in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS)]
 sheets={}
 for s in wb.findall('s:sheets/s:sheet',NS):
  target=rels[s.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')];target=target[1:]if target.startswith('/')else posixpath.normpath('xl/'+target);d=E.fromstring(z.read(target));cells={}
  for c in d.findall('.//s:c',NS):
   raw=c.findtext('s:v',namespaces=NS);val=ss[int(raw)]if c.get('t')=='s'and raw is not None else ''.join(t.text or ''for t in c.findall('.//s:t',NS))if c.get('t')=='inlineStr'else raw or ''
   cells[c.get('r')]={'value':val,'formula':c.find('s:f',NS)is not None,'type':c.get('t')}
  sheets[s.get('name')]={'state':s.get('state','visible'),'cells':cells,'xml':d}
 return z,sheets
source,original=load(root/'source/CoSN-K-12CVAT-Lite-V4.1-2.xlsx');native_file=Path(os.environ.get('CVAT_NATIVE_FILE',str(folder/'CoSN-native-saved-20261022.xlsx')));native,saved=load(native_file);questions=json.loads((root/'dist/questions.json').read_text())['questions'];editable_main={p+str(q['row'])for q in questions for p in ['C','D']};editable_report={'B10','F8','G33','H33','G34','H34','G35','H35'}
report={'originalTabs':[],'staticCellsChecked':0,'staticDifferences':[],'nativeExcelFile':str(native_file)}
for name,s in original.items():
 assert name in saved,'Original tab lost '+name
 assert saved[name]['state']==s['state'],'Hidden state changed '+name
 checks=0
 for ref,c in s['cells'].items():
  if c['formula']or not c['value']:continue
  if name=='CoSN K-12CVAT'and ref in editable_main:continue
  if name=='Analyst Report'and ref in editable_report:continue
  if name=='High Risk Non-Compliant':continue # Pivot contents intentionally refresh from edited answers.
  actual=saved[name]['cells'].get(ref,{}).get('value','')
  if actual!=c['value']:report['staticDifferences'].append({'sheet':name,'cell':ref,'expected':c['value'],'actual':actual})
  checks+=1
 report['staticCellsChecked']+=checks;report['originalTabs'].append({'name':name,'state':s['state'],'staticCellsChecked':checks})
expected=json.loads(Path(os.environ.get('CVAT_NATIVE_EXPECTED_CALCS',str(folder/'expected-edited-calculations.json'))).read_text());cats=[]
for i,c in enumerate(expected['categories'],13):
 vals=[float(saved['Analyst Report']['cells'][a+str(i)]['value'])for a in ['D','E','F']]
 want=[c['maxScore'],c['score'],c['ratio']]
 assert all(math.isclose(a,b,abs_tol=1e-11)for a,b in zip(vals,want)),(c['section'],vals,want)
 cats.append({'section':c['section'],'nativeMax':vals[0],'nativeScore':vals[1],'nativeFraction':vals[2]})
assert math.isclose(float(saved['Questions']['cells']['X25']['value']),expected['overall']['ratio'],abs_tol=1e-11)
assert saved['Questions']['cells']['W25']['value']==expected['overall']['grade']
assert float(saved['Analyst Report']['cells']['H36']['value'])==expected['adjustedCompany']['score']
report['all15CategoryCalculations']=cats;report['overallFraction']=float(saved['Questions']['cells']['X25']['value']);report['grade']=saved['Questions']['cells']['W25']['value'];report['adjustedCompany']=float(saved['Analyst Report']['cells']['H36']['value'])
report['nativeOriginalHighRiskIDs']=[c['value']for c in saved['High Risk Non-Compliant']['cells'].values()if re.fullmatch(r'[A-Z]{4}-\d\d',c['value'])]
def paras(z):
 result=[]
 for name in z.namelist():
  if re.fullmatch(r'xl/drawings/drawing\d+\.xml',name):
   d=E.fromstring(z.read(name))
   for p in d.findall('.//a:p',NS):
    t=''.join(x.text or ''for x in p.findall('.//a:t',NS));t=' '.join(t.split())
    if t:result.append(t)
 return result
origp=paras(source);newp=paras(native);report['sourceDrawingParagraphs']=len(origp);report['nativeDrawingParagraphs']=len(newp);report['missingDrawingParagraphs']=[t for t in origp if t not in newp]
report['sourceMediaCount']=len([n for n in source.namelist()if n.startswith('xl/media/')]);hashes={hashlib.sha256(native.read(n)).hexdigest()for n in native.namelist()if n.startswith('xl/media/')};report['byteIdenticalSourceMedia']=sum(hashlib.sha256(source.read(n)).hexdigest()in hashes for n in source.namelist()if n.startswith('xl/media/'))
assert not report['staticDifferences'],str(report['staticDifferences'])[:1500]
assert not report['missingDrawingParagraphs'],str(report['missingDrawingParagraphs'])[:1500]
report['passed']=True;(folder/os.environ.get('CVAT_PRESERVATION_RESULT','native-preservation-result.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items()if k not in ['all15CategoryCalculations']},indent=2))
