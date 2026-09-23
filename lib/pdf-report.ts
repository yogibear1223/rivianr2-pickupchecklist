import { jsPDF } from 'jspdf';
import { reportFonts } from './report-font';
import { counts, labels, isIssue, displayDate, blankEntry, type Inspection, type Section, type Entry } from './model';
export async function createInspectionPdf(doc:Inspection,sections:Section[],options:{issuesOnly:boolean;saved:boolean;updatedAt:string;pickupOnly?:boolean;issueSections?:Section[]}):Promise<Blob>{
 const pdf=new jsPDF({unit:'pt',format:'letter',compress:true,putOnlyUsedFonts:true});
 pdf.addFileToVFS('Inspection-Regular.ttf',reportFonts.normal);pdf.addFont('Inspection-Regular.ttf','Inspection','normal');
 pdf.addFileToVFS('Inspection-Bold.ttf',reportFonts.bold);pdf.addFont('Inspection-Bold.ttf','Inspection','bold');
 pdf.setProperties({title:'R2 Delivery Inspection - '+doc.meta.vin.slice(-4),subject:options.issuesOnly?'Recorded issues':options.pickupOnly?'Parked pickup inspection and ordered accessories':'Pickup and follow-up record',creator:'R2 Pickup Day'});
 const W=612,H=792,M=43,CW=W-M*2;let y=45;const bottom=H-52;
 const ink:[number,number,number]=[32,49,41],muted:[number,number,number]=[88,105,88];
 const sanitize=(v:string)=>v.replace(/[^\u0020-\u024e\u2000-\u206f\u20a0-\u20cf\n\t]/g,'?').replace(/\t/g,'  ');
 const font=(size:number,bold=false,color: [number,number,number]=ink)=>{pdf.setFont('Inspection',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...color)};
 const continuation=()=>{pdf.addPage();y=43;font(9,true,muted);pdf.text('R2 PICKUP DAY  /  VIN '+doc.meta.vin.slice(-4),M,y);y+=23;};
 const ensure=(height:number)=>{if(y+height>bottom)continuation()};
 const paragraph=(text:string,size=10,bold=false,color: [number,number,number]=ink,indent=0,width=CW-indent)=>{
  font(size,bold,color);const lines=pdf.splitTextToSize(sanitize(text||''),width) as string[];const step=size*1.45;
  for(const line of lines){ensure(step);font(size,bold,color);pdf.text(line,M+indent,y);y+=step;}return lines.length;
 };
 const sectionTitle=(title:string,subtitle?:string)=>{ensure(170);y+=14;pdf.setDrawColor(200,210,194);pdf.line(M,y-8,W-M,y-8);paragraph(title,15,true);if(subtitle)paragraph(subtitle,9,false,muted);y+=11;};
 font(11,true,muted);pdf.text('R2  /  PICKUP DAY',M,y);y+=33;
 paragraph(options.issuesOnly?'Recorded concerns':options.pickupOnly?'Pickup checklist':'Pickup & follow-up',26,true);y+=6;
 paragraph(options.pickupOnly?'20 core parked checks plus ordered accessories • 15–20 minute target • Driving starts after acceptance.':'Pickup and after-delivery findings. Driving checks are completed after acceptance.',9,false,muted);y+=6;
 paragraph('Exported '+new Date().toLocaleString()+'  •  '+(options.saved?'Saved inspection':'DRAFT — current edits not confirmed synced'),9,false,muted);y+=13;
 const c=counts(doc,sections),allConcerns=counts(doc,options.issueSections||sections);paragraph(`${options.pickupOnly?'Pickup: ':''}${c.reviewed} of ${c.total} reviewed  |  ${c.good} good  |  ${c.minor} minor  |  ${c.major} major`,11,true);paragraph(`${c.pending} unchecked / not tested  |  ${c.na} not applicable  |  ${allConcerns.open} unresolved issues across the record`,9,false,muted);y+=16;
 const metaRows:[string,string][]=[['VIN',doc.meta.vin],['Delivery',displayDate(doc.meta.deliveryDate)+(doc.meta.deliveryTime?' at '+doc.meta.deliveryTime:'')],['Location',doc.meta.location],['Inspector / specialist',[doc.meta.inspector,doc.meta.specialist].filter(Boolean).join(' / ')||'Not recorded'],['Trim / package',[doc.meta.trim,doc.meta.package].filter(Boolean).join(' / ')],['Exterior / interior',[doc.meta.paint,doc.meta.interior].filter(Boolean).join(' / ')],['Wheels & tires',doc.meta.wheels||'Not recorded'],['Options & accessories',doc.meta.accessories||'Not recorded'],['Handoff readings',[doc.meta.odometer?'Odometer: '+doc.meta.odometer:'',doc.meta.battery?'Battery: '+doc.meta.battery:'',doc.meta.software?'Software: '+doc.meta.software:''].filter(Boolean).join(' | ')||'Not recorded']];
 for(const [label,value] of metaRows){ensure(34);paragraph(label.toUpperCase(),8,true,muted);paragraph(value,10);y+=6;}
 const deadline=doc.entries['quick-reporting-deadline']?.note;
 paragraph('COSMETIC-REPORTING INSTRUCTIONS',8,true,muted);paragraph(deadline||'Not recorded. Confirm the applicable deadline with your delivery specialist.',10);y+=8;
 const outcome={'undecided':'Not decided yet','accepted':'Accepted','accepted-with-follow-up':'Accepted with follow-up','deferred':'Delivery deferred'}[doc.deliveryDecision];
 paragraph('DELIVERY OUTCOME',8,true,muted);paragraph(outcome,11,true);y+=8;
 if(doc.overallNotes){sectionTitle('Handoff notes');paragraph(doc.overallNotes,10);}
 const entries=(options.issueSections||sections).flatMap(s=>s.items.map(item=>({item,section:s.title,entry:doc.entries[item.id]||blankEntry()})));
 const issueEntries=entries.filter(r=>isIssue(r.entry)).sort((a,b)=>Number(b.entry.status)-Number(a.entry.status));
 if(issueEntries.length){sectionTitle('Issues across all stages',`${allConcerns.open} unresolved. Includes pickup, follow-up and earlier recorded concerns. Confirm agreed actions in Rivian’s service record.`);
  for(const {item,section,entry} of issueEntries){ensure(65);const color:[number,number,number]=entry.status===3?[155,45,39]:[129,88,0];paragraph(`${labels[String(entry.status)].toUpperCase()}${entry.resolved?' — RESOLVED':''}`,8,true,color);paragraph(item.title,11,true);paragraph(section,8,false,muted);if(entry.note)paragraph('Observation: '+entry.note,10);if(entry.action)paragraph('Agreed action: '+entry.action,10);if(!entry.note&&!entry.action)paragraph('No notes or agreed action recorded.',9,false,muted);y+=12;}
 }else if(options.issuesOnly){sectionTitle('No issues recorded');paragraph(c.pending?`${c.pending} checks remain unchecked or not tested. This report does not indicate a completed inspection.`:'No minor or major issues are currently recorded.',10);}
 if(!options.issuesOnly){
  for(let i=0;i<sections.length;i++){const section=sections[i];sectionTitle(String(i+1).padStart(2,'0')+' / '+section.title,section.subtitle);
   for(const item of section.items){const entry:Entry=doc.entries[item.id]||blankEntry();ensure(70);
    const color:[number,number,number]=entry.status===3?[155,45,39]:entry.status===2?[129,88,0]:entry.status===1?[28,103,60]:muted;
    if(options.pickupOnly)paragraph(labels[String(entry.status)].toUpperCase()+(entry.resolved&&isIssue(entry)?' — RESOLVED':'')+' / '+item.title,10.5,true,color);
    else {paragraph(labels[String(entry.status)].toUpperCase()+(entry.resolved&&isIssue(entry)?' — RESOLVED':''),8,true,color);paragraph(item.title+(item.conditional?' (if equipped)':''),10.8,true);}
    paragraph(item.detail,9,false,muted);
    if(entry.note)paragraph('Observation: '+entry.note,10);
    if(entry.action)paragraph('Agreed action: '+entry.action,10);
    y+=13;
   }
  }
 }
 sectionTitle('Follow-up & reporting');paragraph('Continue driving, charging and longer setup checks after you take delivery. Reinspect during your first week and report concerns promptly through the Rivian app. Confirm the applicable cosmetic-reporting deadline with your delivery specialist in writing; first week is a planning target, not a universal reporting entitlement.',9,false,muted);
 paragraph('Personal record adapted from the supplied Super EV LOG delivery-day checklist. Unchecked and not tested do not mean passed. A PDF is a snapshot; the editable inspection remains in the app. Earlier saved checks retain their original meaning.',9,false,muted);
 paragraph('Configuration reference: rivian.com/r2 • rivian.com/configurations/builder/r2',8,false,muted);
 paragraph('Checklist source: Super EV LOG • youtube.com/watch?v=jAC7ajGA_S4 • Reporting: rivian.com/experience/service',8,false,muted);
 if(options.updatedAt)paragraph('Latest confirmed server save: '+new Date(options.updatedAt).toLocaleString(),8,false,muted);
 const pages=pdf.getNumberOfPages();for(let p=1;p<=pages;p++){pdf.setPage(p);font(8,false,muted);pdf.setDrawColor(211,219,205);pdf.line(M,H-38,W-M,H-38);pdf.text('R2 '+doc.meta.vin.slice(-4)+' • '+doc.meta.deliveryDate+' • Personal inspection record',M,H-24);pdf.text(`${p} / ${pages}`,W-M,H-24,{align:'right'});}
 return pdf.output('blob');
}
