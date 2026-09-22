import { z } from 'zod';
export type Status = 0 | 1 | 2 | 3 | 'na' | 'later';
export type CheckItem = { id: string; title: string; detail: string; conditional?: string | boolean; critical?: boolean };
export type Section = {id: string; title: string; subtitle: string; items: CheckItem[]};
const short = z.string().max(250);
export const metaSchema = z.object({
 vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/,'Enter a 17-character VIN without I, O or Q.'),
 deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Choose your delivery date.').refine(s=> !Number.isNaN(Date.parse(s+'T12:00:00Z')) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s,'Choose a valid date.'),
 deliveryTime: short, location: z.string().min(1).max(250), inspector: short,
 trim: short, paint: short, wheels: short, interior: short, package: short,
 accessories: z.string().max(2000), specialist: short, odometer: short, battery: short, software: short,
});
export const entrySchema = z.object({status: z.union([z.literal(0),z.literal(1),z.literal(2),z.literal(3),z.literal('na'),z.literal('later')]), note:z.string().max(4000),action:z.string().max(2000),resolved:z.boolean()});
export const documentSchema = z.object({schemaVersion:z.literal(1),checklistVersion:z.string().max(80),meta:metaSchema,entries:z.record(z.string().regex(/^[a-z0-9_-]{1,100}$/),entrySchema).refine(v=>Object.keys(v).length<=200),overallNotes:z.string().max(8000),deliveryDecision:z.enum(['undecided','accepted','accepted-with-follow-up','deferred'])});
export type VehicleMeta = z.infer<typeof metaSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Inspection = z.infer<typeof documentSchema>;
export type SavedInspection = {id:string;document:Inspection;revision:number;updatedAt:string};
export type InspectionSummary = {id:string;last4:string;deliveryDate:string;location:string;updatedAt:string;completed:number;total:number;issues:number};
export const blankEntry = (): Entry => ({status:0,note:'',action:'',resolved:false});
export const blankMeta = (): VehicleMeta => ({vin:'',deliveryDate:'',deliveryTime:'',location:'',inspector:'',trim:'R2 Performance',paint:'Launch Green',wheels:'',interior:'',package:'Launch Package',accessories:'',specialist:'',odometer:'',battery:'',software:''});
export const labels: Record<string,string> = {'0':'Unchecked','1':'Good','2':'Minor issue','3':'Major issue',na:'Not applicable',later:'Not tested'};
export const nextStatus = (status: Status):Status => typeof status==='number' ? ((status+1)%4) as Status : 1;
export const isIssue = (entry?:Entry) => entry?.status===2 || entry?.status===3;
export const isReviewed = (entry?:Entry) => entry!=null && ([1,2,3,'na'] as Status[]).includes(entry.status);
export function counts(doc:Inspection,sections:Section[]) {
 const items=sections.flatMap(s=>s.items);const entries=items.map(i=>doc.entries[i.id]||blankEntry());
 return {total:items.length,reviewed:entries.filter(isReviewed).length,good:entries.filter(e=>e.status===1).length,minor:entries.filter(e=>e.status===2).length,major:entries.filter(e=>e.status===3).length,na:entries.filter(e=>e.status==='na').length,pending:entries.filter(e=>!isReviewed(e)).length,open:entries.filter(e=>isIssue(e)&&!e.resolved).length};
}
export function displayDate(value:string) { return value ? new Date(value+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : 'Date to be confirmed'; }
export function flatten(doc:Inspection):Record<string,string|number|boolean> {
 const result:Record<string,string|number|boolean>={overallNotes:doc.overallNotes,deliveryDecision:doc.deliveryDecision};
 for(const [k,v] of Object.entries(doc.meta)) result['meta.'+k]=v;
 for(const [id,entry] of Object.entries(doc.entries)) for(const [k,v] of Object.entries(entry)) result['entries.'+id+'.'+k]=v;
 return result;
}
export type MergeConflict={path:string;mine:string|number|boolean;theirs:string|number|boolean};
export function setPath(doc:Inspection,path:string,value:unknown) {
 const parts=path.split('.');let target=doc as unknown as Record<string,unknown>;
 for(const part of parts.slice(0,-1)) { if(!target[part]) target[part]={}; target=target[part] as Record<string,unknown>; }
 target[parts[parts.length-1]]=value;
}
export function mergeDocuments(base:Inspection,mine:Inspection,theirs:Inspection) {
 const a=flatten(base),b=flatten(mine),c=flatten(theirs);const merged=structuredClone(theirs);const conflicts:MergeConflict[]=[];
 for(const path of new Set([...Object.keys(a),...Object.keys(b),...Object.keys(c)])) {
   if(b[path]===a[path]) continue;
   if(c[path]===a[path]||b[path]===c[path]) setPath(merged,path,b[path]);
   else conflicts.push({path,mine:b[path]??'',theirs:c[path]??''});
 }
 // A repair confirmation must not silently resolve a newly changed concern.
 for(const id of new Set([...Object.keys(base.entries),...Object.keys(mine.entries),...Object.keys(theirs.entries)])) {
  const start=base.entries[id]||blankEntry(),local=mine.entries[id]||blankEntry(),remote=theirs.entries[id]||blankEntry();
  const localConcern=local.status!==start.status||local.note!==start.note;
  const remoteConcern=remote.status!==start.status||remote.note!==start.note;
  if(local.resolved!==remote.resolved&&((localConcern&&remote.resolved!==start.resolved)||(remoteConcern&&local.resolved!==start.resolved))) {
   const path='entries.'+id+'.resolved';
   if(!conflicts.some(c=>c.path===path))conflicts.push({path,mine:local.resolved,theirs:remote.resolved});
  }
 }
 return {merged,conflicts};
}
