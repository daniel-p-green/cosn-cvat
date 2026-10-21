export const KEY='cosn-cvat-lite-4.1-draft-v1';
export const blank=()=>({schema:'cosn-cvat-local-draft',schemaVersion:1,workbookVersion:'4.1',records:{},updatedAt:null});
export const responseState=r=>r?.answer?.trim()?'recorded':r?.unknown?'unknown':'unanswered';
export const counts=(questions,draft)=>questions.reduce((a,q)=>{const r=draft.records[q.id]||{};a[responseState(r)]++;if(r.flag)a.flagged++;if(r.evidence?.trim())a.evidence++;return a},{recorded:0,unknown:0,unanswered:0,flagged:0,evidence:0});
export function validateDraft(input,questions){
 if(!input||input.schema!=='cosn-cvat-local-draft'||input.schemaVersion!==1||input.workbookVersion!=='4.1'||!input.records||typeof input.records!=='object'||Array.isArray(input.records))throw Error('Choose a CoSN CVAT Lite 4.1 JSON draft exported by this site.');
 const known=new Map(questions.map(q=>[q.id,q]));const draft=blank();
 for(const [id,r] of Object.entries(input.records)){
  if(!known.has(id))throw Error('This draft contains an unrecognized question ID: '+id+'. Nothing was imported.');
  if(!r||typeof r!=='object'||Array.isArray(r))throw Error('The draft contains an invalid response. Nothing was imported.');
  const clean={};for(const key of ['answer','additional','evidence','provider']){if(r[key]!==undefined&&typeof r[key]!=='string')throw Error('A response has an invalid text field. Nothing was imported.');clean[key]=r[key]||'';if(clean[key].length>20000)throw Error('A response is too long. Keep each field under 20,000 characters.');}
  if(known.get(id).kind==='choice'&&!['','Yes','No'].includes(clean.answer))throw Error('A Yes/No response is invalid. Nothing was imported.');
  if(!['','Vendor','District IT','Educator / public source'].includes(clean.provider))throw Error('The response source is invalid. Nothing was imported.');
  if(r.unknown!==undefined&&typeof r.unknown!=='boolean'||r.flag!==undefined&&typeof r.flag!=='boolean')throw Error('A response has an invalid follow-up state. Nothing was imported.');
  clean.unknown=!clean.answer&&!!r.unknown;clean.flag=!!r.flag;draft.records[id]=clean;
 }
 draft.updatedAt=new Date().toISOString();return draft;
}
export function exportCSV(questions,draft){
 const cell=v=>'"'+String(v??'').replace(/^[\s]*[=+@-]/,"'$&").replaceAll('"','""')+'"';
 const rows=[['ID','Section','Original question','Response status','Vendor answer','Additional information','Evidence reference / notes','Response provided by','Follow-up requested','Workbook version']];
 for(const q of questions){const r=draft.records[q.id]||{};rows.push([q.id,q.section,q.text,responseState(r),r.answer||'',r.additional||'',r.evidence||'',r.provider||'',r.flag?'Yes':'No','4.1']);}
 return '\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n');
}
