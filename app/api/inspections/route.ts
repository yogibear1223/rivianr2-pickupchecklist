import { inspectionUser } from '@/lib/identity';
import { getDatabase } from '@/db';
import { documentSchema, type Inspection } from '@/lib/model';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers});
type Row={id:string;document:string;revision:number;updated_at:string;mutation_id:string;last4:string};
const saved=(row:Row)=>({id:row.id,document:JSON.parse(row.document),revision:row.revision,updatedAt:row.updated_at});
async function owner(){return (await inspectionUser())?.userId;}
async function bodyOf(request:Request) {
 if(request.headers.get('x-inspection-client')!=='1'||!request.headers.get('content-type')?.includes('application/json')||request.headers.get('sec-fetch-site')==='cross-site')throw new Error('INVALID_REQUEST');
 if(Number(request.headers.get('content-length')||0)>180000) throw new Error('TOO_LARGE');
 const text=await request.text();if(text.length>180000)throw new Error('TOO_LARGE');return JSON.parse(text);
}
function failure(error:unknown) {
 if(error instanceof z.ZodError)return json({error:error.issues[0]?.message||'Please check the inspection details.'},400);
 if(error instanceof SyntaxError || (error instanceof Error && ['INVALID_REQUEST','TOO_LARGE'].includes(error.message)))return json({error:'The request could not be accepted.'},400);
 console.error('Inspection storage request failed',error instanceof Error?error.name:'unknown');
 return json({error:'Your inspection could not be saved or loaded. Keep this page open and try again.'},503);
}
export async function GET(request:Request) {
 try { const user=await owner();if(!user)return json({error:'Sign in to open your inspections.'},401);
 const db=getDatabase();const url=new URL(request.url);const id=url.searchParams.get('id'),suffix=url.searchParams.get('last4');
 if(id) {if(!suffix||!/^[A-HJ-NPR-Z0-9]{4}$/.test(suffix))return json({error:'Enter the last four VIN characters.'},400);
  const row=await db.prepare('SELECT * FROM inspections WHERE id = ? AND user_id = ? AND last4 = ?').bind(id,user,suffix).first<Row>();
  if(!row)return json({error:'No matching inspection in your account.'},404);return json(saved(row));}
 const rows=await db.prepare('SELECT id, document, last4, revision, updated_at, mutation_id FROM inspections WHERE user_id = ? ORDER BY updated_at DESC').bind(user).all<Row>();
 return json({inspections:rows.results.map(r=>{const d=JSON.parse(r.document) as Inspection;const entries=Object.values(d.entries);return {id:r.id,last4:r.last4,deliveryDate:d.meta.deliveryDate,location:d.meta.location,updatedAt:r.updated_at,total:entries.length,completed:entries.filter(e=>[1,2,3,'na'].includes(e.status)).length,issues:entries.filter(e=>[2,3].includes(e.status as number)&&!e.resolved).length};})});
 }catch(error){return failure(error);}
}
const createSchema=z.object({id:z.string().uuid(),mutationId:z.string().uuid(),document:documentSchema});
export async function POST(request:Request) {
 try{const user=await owner();if(!user)return json({error:'Sign in to save your inspection.'},401);
 const payload=createSchema.parse(await bodyOf(request));const db=getDatabase();const prior=await db.prepare('SELECT * FROM inspections WHERE user_id = ? AND (id = ? OR vin = ?)').bind(user,payload.id,payload.document.meta.vin).first<Row>();
 if(prior){if(prior.id===payload.id&&prior.mutation_id===payload.mutationId)return json(saved(prior));return json({error:'This VIN already has an inspection. Open the saved inspection to continue.'},409);}
 const now=new Date().toISOString();const vin=payload.document.meta.vin;
 await db.prepare('INSERT INTO inspections (id,user_id,vin,last4,document,revision,mutation_id,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?,?)').bind(payload.id,user,vin,vin.slice(-4),JSON.stringify(payload.document),payload.mutationId,now,now).run();
 return json({id:payload.id,document:payload.document,revision:1,updatedAt:now},201);
 }catch(error){return failure(error);}
}
const updateSchema=z.object({id:z.string().uuid(),revision:z.number().int().positive(),mutationId:z.string().uuid(),document:documentSchema});
export async function PUT(request:Request) {
 try{const user=await owner();if(!user)return json({error:'Sign in again to sync your changes.'},401);
 const payload=updateSchema.parse(await bodyOf(request));const db=getDatabase();const previous=await db.prepare('SELECT * FROM inspections WHERE id = ? AND user_id = ?').bind(payload.id,user).first<Row>();
 if(!previous)return json({error:'Inspection not found in your account.'},404);
 if(previous.mutation_id===payload.mutationId)return json(saved(previous));
 // VIN is the inspection identity. It cannot change during an update.
 const oldDoc=JSON.parse(previous.document) as Inspection;
 if(payload.document.meta.vin!==oldDoc.meta.vin)return json({error:'The VIN cannot be changed after setup. Start a new inspection for a different vehicle.'},400);
 const now=new Date().toISOString();
 const result=await db.prepare('UPDATE inspections SET document = ?, revision = revision + 1, mutation_id = ?, updated_at = ? WHERE id = ? AND user_id = ? AND revision = ?').bind(JSON.stringify(payload.document),payload.mutationId,now,payload.id,user,payload.revision).run();
 if(!result.meta.changes){const current=await db.prepare('SELECT * FROM inspections WHERE id = ? AND user_id = ?').bind(payload.id,user).first<Row>();return json({error:'This inspection changed on another device.',current:current?saved(current):null},409);}
 return json({id:payload.id,document:payload.document,revision:payload.revision+1,updatedAt:now});
 }catch(error){return failure(error);}
}
