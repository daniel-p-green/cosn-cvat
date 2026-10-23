import fs from 'node:fs';
import assert from 'node:assert/strict';
import {blank, validateDraft, MAX_BACKUP_BYTES} from '../dist/model.js';
import {MAX_CELL_CHARACTERS, MAX_WORKBOOK_EXPANDED_BYTES} from '../dist/limits.js';
import {TextAreaField} from '../dist/kit.js';
const questions=JSON.parse(fs.readFileSync(new URL('../dist/questions.json',import.meta.url))).questions;
const setters=[
 ...questions.filter(q=>q.kind!=='choice').map(q=>[q.id,d=>d.records[q.id]={answer:''},(d,s)=>d.records[q.id].answer=s,d=>d.records[q.id].answer]),
 ...['additional','evidence'].map(k=>[k,d=>d.records['DOCU-01']={answer:'Yes'},(d,s)=>d.records['DOCU-01'][k]=s,d=>d.records['DOCU-01'][k]]),
 ...['framework','preparedDate','analystNotes'].map(k=>[k,()=>{},(d,s)=>d.review[k]=s,d=>d.review[k]]),
 ['qualitative rationale',()=>{},(d,s)=>d.review.qualitative['COMP-01'].notes=s,d=>d.review.qualitative['COMP-01'].notes],
 ['applicability reason',d=>d.review.applicability['DOCU-01']={state:'not-applicable',reason:''},(d,s)=>d.review.applicability['DOCU-01'].reason=s,d=>d.review.applicability['DOCU-01'].reason],
 ['category reason',d=>d.review.categoryApplicability[questions[0].section]={state:'not-applicable',reason:''},(d,s)=>d.review.categoryApplicability[questions[0].section].reason=s,d=>d.review.categoryApplicability[questions[0].section].reason],
 ['interpretation reason',d=>d.review.favorableOverrides['COMP-05']={answer:'No',reason:''},(d,s)=>d.review.favorableOverrides['COMP-05'].reason=s,d=>d.review.favorableOverrides['COMP-05'].reason],
 ...['tool','website','use','data','help'].map(k=>['teacher '+k,()=>{},(d,s)=>d.intake[k]=s,d=>d.intake[k]]),
 ...['subject','body','context'].map(k=>['request '+k,()=>{},(d,s)=>d.request[k]=s,d=>d.request[k]]),
];
let checks=0;
for(const [name,setup,set,get]of setters)for(const length of[20001,32767,32768]){
 const d=blank();setup(d);const text='é'.repeat(length);set(d,text);const before=JSON.stringify(d);
 if(length<=32767){const r=validateDraft(JSON.parse(before),questions);assert.equal(get(r),text,name+' boundary preserved');}
 else assert.throws(()=>validateDraft(d,questions),/too long/i,name+' oversized input rejected');
 assert.equal(JSON.stringify(d),before,name+' input was not truncated or mutated');checks++;
}
assert.equal(MAX_CELL_CHARACTERS,32767);assert(TextAreaField({id:'capacity',label:'Text'}).includes('maxlength="32767"'));
assert.equal(MAX_BACKUP_BYTES,64*1024*1024);assert.equal(MAX_WORKBOOK_EXPANDED_BYTES,256*1024*1024);
console.log(`PASS ${checks} text-capacity cases: all source free-text inputs and review/teacher/request text preserve20,001/32,767 and reject32,768 without mutation; shared control and bounded archive limits.`);
