import { writeFileSync, mkdirSync } from 'node:fs';
import { createInspectionPdf } from '../lib/pdf-report';
import { blankEntry,blankMeta,type Inspection,type Section } from '../lib/model';
import data from '../lib/checklist.json';
const sections=data.sections as Section[];
const doc:Inspection={schemaVersion:1,checklistVersion:'test',meta:{...blankMeta(),vin:'7PD2EAAB0VN000001',deliveryDate:'2026-09-24',location:'Sample delivery center',interior:'Black Crater Signature',wheels:'21-inch Liquid Tungsten All-Season'},entries:Object.fromEntries(sections.flatMap(s=>s.items).map(i=>[i.id,blankEntry()])),overallNotes:'Sample record for layout verification. Échelle, café — punctuation and accents.',deliveryDecision:'accepted-with-follow-up'};
doc.entries.paint={status:2,note:'Small paint chip on passenger-side front door, near the lower edge. Photo 04.',action:'Delivery specialist will document paint repair. Ticket TEST-001.',resolved:false};
doc.entries.glass={status:3,note:'Sample major issue used only to verify report layout. '+('Long note line for pagination, measurement and visual quality review. '.repeat(54)),action:'Resolve before driving.',resolved:false};
doc.entries['vin-match'].status=1;doc.entries['wireless-charging'].status='na';doc.entries['headlights'].status='later';
mkdirSync('.sites-runtime/pdf-qa',{recursive:true});
for(const issuesOnly of [false,true]) {const blob=await createInspectionPdf(doc,sections,{issuesOnly,saved:true,updatedAt:'2026-09-22T23:00:00Z'});writeFileSync('.sites-runtime/pdf-qa/'+(issuesOnly?'issues':'full')+'.pdf',Buffer.from(await blob.arrayBuffer()));}
console.log('Generated full and issues PDF reports with long notes and all key status types.');
