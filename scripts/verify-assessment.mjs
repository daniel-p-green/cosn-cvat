/** Independent source-derived regression fixtures, without executing Excel itself. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {defaultReview, evaluateAssessment, guidanceFor, setAssessmentData} from '../dist/assessment-engine.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = JSON.parse(readFileSync(new URL('../dist/assessment-data.json', import.meta.url)));
const questions = JSON.parse(readFileSync(new URL('../dist/questions.json', import.meta.url))).questions;
setAssessmentData(data);
let checks = 0;
const same = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };
const near = (actual, expected, label) => { assert.ok(Math.abs(actual - expected) < 1e-10, `${label}: ${actual} ≠ ${expected}`); checks++; };

// A separate, string-splitting interpreter reads original XML, not generated ASTs.
// It supports only the actual IF, =, cell, and literal-string grammar encountered.
const oracle = JSON.parse(execFileSync('python3', ['-c', String.raw`
import zipfile, xml.etree.ElementTree as E, json, re
z=zipfile.ZipFile('source/CoSN-K-12CVAT-Lite-V4.1-2.xlsx')
n={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ss=[''.join(s.itertext()) for s in E.fromstring(z.read('xl/sharedStrings.xml'))]
rels={r.get('Id'):r.get('Target') for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
sheets={}; count=0
for s in E.fromstring(z.read('xl/workbook.xml')).find('m:sheets',n):
 t=rels[s.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')]
 x=E.fromstring(z.read(t.lstrip('/') if t.startswith('/') else 'xl/'+t)); cells={}
 count+=len(x.findall('.//m:f',n))
 for c in x.findall('.//m:sheetData/m:row/m:c',n):
  v=c.find('m:v',n); v=v.text if v is not None and v.text else ''
  if c.get('t')=='s':v=ss[int(v)]
  f=c.find('m:f',n); cells[c.get('r')]={'v':v,'f':f.text if f is not None else None,'hasF':f is not None}
 sheets[s.get('name')]=cells
def split(s, delim):
 parts=[]; start=0; depth=0; quote=False; i=0
 while i<len(s):
  c=s[i]
  if c=='"':
   if quote and i+1<len(s) and s[i+1]=='"':i+=2;continue
   quote=not quote
  if not quote:
   if c=='(':depth+=1
   elif c==')':depth-=1
   elif c==delim and depth==0:parts.append(s[start:i]);start=i+1
  i+=1
 parts.append(s[start:]);return parts
def run(f, cell, answer):
 f=f.strip()
 if f.startswith('IF('):
  args=split(f[3:-1],',');return run(args[1],cell,answer) if run(args[0],cell,answer) else run(args[2],cell,answer) if len(args)>2 else False
 eq=split(f,'=')
 if len(eq)==2:return run(eq[0],cell,answer)==run(eq[1],cell,answer)
 if f.startswith('"') and f.endswith('"'):return f[1:-1].replace('""','"')
 if f.replace('$','')==cell:return answer
 raise ValueError('Unsupported oracle formula '+f)
main=sheets['CoSN K-12CVAT']; score=sheets['Questions']; cw=sheets['Standards Crosswalk']; detail=sheets['Crosswalk Detail']
guidance={}; rows={}; matrix={}; dictionary=[]
for addr,c in main.items():
 if re.fullmatch('A[0-9]+',addr) and re.fullmatch('[A-Z]{4}-[0-9]{2}',c['v']):
  row=addr[1:]; e=main.get('E'+row,{'v':'','f':None}); f=e['f']
  guidance[c['v']]={'formula':f,'source':'CoSN K-12CVAT!E'+row,'cases':{a:run(f,'C'+row,a) if f else e['v'] for a in ['Yes','No','']}}
for r in range(2,64):
 id=score['B'+str(r)]['v'];rows[id]={'row':r,'weight':float(score.get('K'+str(r),{'v':0})['v'] or 0),'favorable':score.get('H'+str(r),{'v':''})['v'],'lookup':score.get('I'+str(r),{'hasF':False})['hasF']}
frameworks=[cw[c+'22']['v'] for c in 'CDEFGH']
for addr,c in cw.items():
 if re.fullmatch('A[0-9]+',addr) and re.fullmatch('[A-Z]{4}-[0-9]{2}',c['v']):
  r=addr[1:];matrix[c['v']]={f:cw[col+r]['v'] for col,f in zip('CDEFGH',frameworks) if col+r in cw and cw[col+r]['v']}
for addr,c in detail.items():
 if re.fullmatch('A[0-9]+',addr) and c['v'] and detail.get('B'+addr[1:],{}).get('v'):
  dictionary.append({'code':c['v'],'description':detail['B'+addr[1:]]['v'],'source':'Crosswalk Detail!'+addr+':B'+addr[1:]})
print(json.dumps({'formulaCount':count,'guidance':guidance,'rows':rows,'matrix':matrix,'frameworks':frameworks,'dictionary':dictionary,'overall':score['X25']['f'],'grade':score['W25']['f'],'adjusted':sheets['Analyst Report']['H36']['f']}))
`], {cwd: root, encoding:'utf8', maxBuffer: 8 * 1024 * 1024}));

same(createHash('sha256').update(readFileSync(new URL('../source/CoSN-K-12CVAT-Lite-V4.1-2.xlsx', import.meta.url))).digest('hex'), data.sourceSHA256, 'Exact original source SHA');
same(oracle.formulaCount, 1475, 'Formula elements including shared followers');
same(data.inventory.reduce((n,s) => n + s.formulaElements,0), oracle.formulaCount, 'Complete formula inventory');
same(data.inventory.reduce((n,s) => n + s.sharedFormulaElements,0),263,'Shared anchor and follower elements inspected');
same(data.inventory.reduce((n,s) => n + s.sharedFormulaAnchors,0),11,'All source shared formula anchors resolved');
same(data.inventory.filter(s => s.visibility === 'hidden').length,4,'Four hidden sheets');
same(data.inventory.find(s => s.name === 'Standards Crosswalk').hiddenColumns.map(c => [c.min,c.max]),[['5','5']],'Hidden ISO column preserved');
same(data.frameworks,oracle.frameworks,'Six exact source framework labels');
same(data.dictionary,oracle.dictionary,'Every historical crosswalk definition');
same(data.overall.formula,oracle.overall,'Overall exact source formula');
same(data.overall.gradeFormula,oracle.grade,'Grade exact source formula');
same(data.adjustedCompany.formula,oracle.adjusted,'Adjusted company exact source formula');
same(Object.keys(data.questions).length,76,'76 canonical fields');
same(Object.values(data.questions).filter(q => q.score).length,62,'62 hidden score records, COMP09 omitted');
same(Object.values(data.questions).filter(q => q.guidance.ast).length,59,'59 response-dependent formulas');
let branchChecks=0;
for (const [id, source] of Object.entries(oracle.guidance)) {
  for (const [answer, expected] of Object.entries(source.cases)) {
    const result = guidanceFor(id,answer);
    same(result.rawValue,expected,`${id}: exact guidance branch ${answer || 'blank'}`);
    same(result.source,source.source,`${id}: guidance cell traceability`);
    same(result.formula,source.formula,`${id}: guidance formula traceability`);
    branchChecks++;
  }
  same(data.questions[id].crosswalk,oracle.matrix[id] || {},`${id}: all source framework codes, including hidden ISO`);
}
for (const id of Object.keys(oracle.guidance)) {
  same(guidanceFor(id,'Unknown').rawValue,guidanceFor(id,'').rawValue,`${id}: app unknown is a blank vendor response`);
  same(guidanceFor(id,'Not sure').rawValue,guidanceFor(id,'').rawValue,`${id}: unrecognized choice is not a vendor attestation`);
}
same(guidanceFor('HLAP-03','No').resultType,'boolean','HLAP03 missing false branch is a boolean, not invented guidance');
same(guidanceFor('HLAP-03','No').rawValue,false,'HLAP03 No preserves source FALSE');
same(guidanceFor('HLAP-03','No').hasGuidance,false,'No prose invented for boolean false');
for (const [id, source] of Object.entries(oracle.rows)) {
  const record = data.questions[id].score;
  same([record.row,record.weight,record.favorableAnswer,record.vendorLookupPresent],[source.row,source.weight,source.favorable,source.lookup],`${id}: original score inputs`);
  same(record.weightedScoreFormula,`J${source.row}*K${source.row}`,`${id}: relative shared weighted-score references resolved`);
  if (source.lookup) same(record.vendorLookupFormula,`VLOOKUP(B${source.row},'CoSN K-12CVAT'!$A$6:$C$318,3,FALSE)`,`${id}: relative lookup and absolute input ranges resolved`);
  if (!['COMP-01','COMP-02'].includes(id)) same(record.complianceFormula.replaceAll(' ',''),`IF(ISNUMBER(FIND(H${source.row},I${source.row})),1,0)`,`${id}: relative compliance references resolved`);
}
const substantive=questions.filter(q => q.id!=='DATE-01' && !q.id.startsWith('GNRL-'));
const draftFor = response => ({records:Object.fromEntries(substantive.map((q,i) => [q.id,{answer:q.kind==='choice' ? typeof response==='function' ? response(q,i) : response : 'Synthetic narrative; no student records.',unknown:false}])),review:defaultReview()});
const calculate=(draft,mode='source') => evaluateAssessment(questions,draft,{mode});
function independentScores(draft,mode) {
  const totals=new Map();
  for (const [id,row] of Object.entries(oracle.rows)) {
    const prefix=id.slice(0,4), t=totals.get(prefix) || {score:0,maxScore:0,compliantCount:0};
    const answer=mode==='source' && !row.lookup ? '' : draft.records[id]?.answer || '';
    const compliant=['COMP-01','COMP-02'].includes(id) ? draft.review.qualitative[id].compliant==='Yes' : !!row.favorable && answer.includes(row.favorable);
    t.maxScore+=row.weight;t.score+=compliant ? row.weight : 0;t.compliantCount+=+compliant;totals.set(prefix,t);
  }
  return totals;
}
const cases=[['all Yes',draftFor('Yes')],['all No',draftFor('No')],['mixed',draftFor((q,i)=>i%3 ? 'No':'Yes')],['unanswered',draftFor('')]];
for (const [name,draft] of cases) {
  for(const mode of ['source','corrected']) {
    const actual=calculate(draft,mode), expected=independentScores(draft,mode);
    for(const category of actual.categories) {
      const source=expected.get(category.prefix);
      same([category.score,category.maxScore,category.compliantCount],[source.score,source.maxScore,source.compliantCount],`${name}/${mode}/${category.prefix}: raw score, denominator, compliant count`);
      near(category.ratio,source.score/source.maxScore,`${name}/${mode}/${category.prefix}: ratio`);
    }
    const average=[...expected.values()].reduce((n,c)=>n+c.score/c.maxScore,0)/15;
    near(actual.overall.ratio,average,`${name}/${mode}: unweighted mean of category fractions`);
    same(actual.overall.grade,average>=.9?'A':average>=.8?'B':average>=.7?'C':average>=.6?'D':'F',`${name}/${mode}: source letter formula`);
    same(actual.noApproval,true,`${name}/${mode}: no certification`);
  }
}
near(calculate(draftFor('Yes')).overall.percentage,84.93121693121694,'Known all-Yes source fixture');
near(calculate(draftFor('Yes'),'corrected').overall.percentage,86.93121693121692,'Known all-Yes corrected fixture');
near(calculate(draftFor('No')).overall.percentage,13.06878306878307,'Known all-No source fixture');
const unanswered=calculate(draftFor(''));
same([unanswered.counts.unanswered,unanswered.counts.recorded],[60,3],'Narratives present, 60 choices unanswered');
same(unanswered.status,'incomplete','Numeric F never clears incomplete answers');
assert.ok(unanswered.warnings.some(w=>w.includes('preliminary')));checks++;
const unknownDraft=draftFor('');
for(const q of substantive) unknownDraft.records[q.id]={answer:'',unknown:true};
const unknown=calculate(unknownDraft);
same([unknown.counts.unknown,unknown.counts.unanswered,unknown.overall.score,unknown.status],[63,0,0,'incomplete'],'Unknown remains distinct from No and unanswered');
const allCorrect=draftFor(q=>oracle.rows[q.id]?.favorable || 'Yes');
same(calculate(allCorrect,'corrected').overall.grade,'A','All favorable yields A only when missing lookups repaired');
same(calculate(allCorrect).overall.grade,'A','Source numerical A retained despite incomplete analyst review');
same(calculate(allCorrect).status,'incomplete','A is not completion, approval, or manual review');
const choices=substantive.filter(q=>q.kind==='choice'), grades=new Set();
for(let limit=0;limit<=choices.length;limit++) {
  const selected=new Set(choices.slice(0,limit).map(q=>q.id));
  const fixture=draftFor(q=>selected.has(q.id) ? oracle.rows[q.id].favorable : oracle.rows[q.id].favorable==='Yes'?'No':'Yes');
  const expected=independentScores(fixture,'source');
  const average=[...expected.values()].reduce((n,c)=>n+c.score/c.maxScore,0)/15;
  const actual=calculate(fixture);grades.add(actual.overall.grade);
  same(actual.overall.grade,average>=.9?'A':average>=.8?'B':average>=.7?'C':average>=.6?'D':'F','Source numerical grades across graduated source-derived answer fixtures');
}
same([...grades].sort(),['A','B','C','D','F'],'All five source letter bands exercised');
same(calculate(draftFor('No')).highRisk.length,23,'Original pivot misses final HLVU03');
same(calculate(draftFor('No'),'corrected').highRisk.length,24,'Corrected pivot includes HLVU03');
same(calculate(draftFor('No')).highRisk.some(q=>q.id==='HLVU-03'),false,'Source final-row defect visible');
same(calculate(draftFor('No'),'corrected').highRisk.some(q=>q.id==='HLVU-03'),true,'Corrected final-row high risk visible');

const manual=draftFor('Yes');
for(const [i,id] of ['COMP-01','COMP-02','COMP-09'].entries()) manual.review.qualitative[id]={compliant:i===1?'No':'Yes',score:[10,0,7.5][i],notes:'Synthetic analyst judgment'};
const reviewed=calculate(manual);
same([reviewed.adjustedCompany.baseScore,reviewed.adjustedCompany.manualScore,reviewed.adjustedCompany.score],[50,17.5,67.5],'Manual scores add to company raw score, independent of Yes/No');
near(reviewed.overall.percentage,calculate(draftFor('Yes')).overall.percentage,'Manual scores never alter aggregate');
same(reviewed.categories.find(c=>c.prefix==='COMP').compliantCount,4,'COMP09 manual Yes never enters hidden source COUNTIFS');
same(reviewed.status,'ready-for-analyst-review','Completed fields ready for review, never approved');
manual.review.qualitative['COMP-01'].score=11;
same(calculate(manual).qualitative[0].score,null,'Out-of-range manual score not used');
same(calculate(manual).status,'incomplete','Invalid manual score keeps review incomplete');
for(const framework of [...data.frameworks,'Custom district framework']) {
  const frameworkDraft=draftFor('Yes');frameworkDraft.review.framework=framework;frameworkDraft.review.preparedDate='2026-10-21';
  const result=calculate(frameworkDraft);
  same(result.framework,framework,'Framework metadata persists');
  same(result.preparedDate,'2026-10-21','Report prepared date persists');
  near(result.overall.percentage,84.93121693121694,'Framework changes do not change source score');
}
const applicability=draftFor('No');
applicability.review.applicability['HLVU-03']={state:'not-applicable',reason:'No hosted components; district verified.'};
same(calculate(applicability).questions.find(q=>q.id==='HLVU-03').weight,40,'Source retains denominator despite stored applicability');
same(calculate(applicability,'corrected').questions.find(q=>q.id==='HLVU-03').weight,0,'Reasoned corrected question exclusion');
same(calculate(applicability,'corrected').categories.find(c=>c.prefix==='HLVU').maxScore,80,'Excluded weight removed from denominator');
applicability.review.applicability['HLVU-03'].reason='';
const pending=calculate(applicability,'corrected');
same(pending.questions.find(q=>q.id==='HLVU-03').weight,40,'Partial reason stays saved but does not apply');
assert.ok(pending.warnings.some(w=>w.startsWith('HLVU-03:')));checks++;
applicability.review.categoryApplicability['Vulnerability Scanning']={state:'not-applicable',reason:'District determined this whole category outside this service scope.'};
const excludedCategory=calculate(applicability,'corrected');
same(excludedCategory.categories.find(c=>c.prefix==='HLVU').ratio,null,'Whole excluded category has no percentage');
same(excludedCategory.overall.categoryCount,14,'Whole excluded category removed from mean');
const noCategories=draftFor('Yes');
for(const category of data.categories) noCategories.review.categoryApplicability[category.section]={state:'not-applicable',reason:'Synthetic exclusion fixture'};
same([calculate(noCategories,'corrected').overall.ratio,calculate(noCategories,'corrected').overall.grade],[null,null],'All excluded has no invented score/grade');
const override=draftFor('No');
override.review.favorableOverrides['COMP-05']={answer:'No',reason:''};
same(calculate(override,'corrected').questions.find(q=>q.id==='COMP-05').score,0,'Unreasoned interpretation does not apply');
assert.ok(calculate(override,'corrected').warnings.some(w=>w.includes('interpretation needs')));checks++;
override.review.favorableOverrides['COMP-05'].reason='District interpretation of incident context, documented separately.';
same(calculate(override,'corrected').questions.find(q=>q.id==='COMP-05').score,20,'Explicit corrected interpretation only');
same(calculate(override).questions.find(q=>q.id==='COMP-05').score,0,'Source interpretation unchanged');
same(calculate(override,'corrected').counts.overrides,1,'Override traceable');
same(calculate(JSON.parse(JSON.stringify(override))),calculate(override),'Assessment deterministic after JSON transfer');
console.log(`PASS ${checks} assessment assertions; ${branchChecks} exact original guidance-cell branches including all 59 conditional formulas × 3 valid source inputs; all Yes/No/mixed/unanswered, all five letter bands, manual, framework, applicability, interpretation and JSON cases. Source-derived independent evaluation; Excel itself was not recalculated.`);
