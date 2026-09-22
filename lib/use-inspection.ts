'use client';
import { newId } from '@/lib/id';
import { useEffect, useRef, useState, useCallback } from 'react';
import { mergeDocuments, setPath, documentSchema, type Inspection, type SavedInspection, type MergeConflict } from './model';
export type SaveState='saved'|'saving'|'pending'|'offline'|'error'|'conflict';
const same=(a:Inspection,b:Inspection)=>JSON.stringify(a)===JSON.stringify(b);
export async function api<T=unknown>(path:string,init?:RequestInit):Promise<T> {
 const response=await fetch('/api/inspections'+path,{...init,cache:'no-store',headers:{'Content-Type':'application/json','X-Inspection-Client':'1',...init?.headers}});
 const payload=await response.json().catch(()=>({error:'The server is unavailable. Keep this page open and try again.'})) as {error?:string};
 if(!response.ok)throw Object.assign(new Error(payload.error||'Unable to save your inspection.'),{status:response.status,data:payload});
 return payload as T;
}
export function useInspection(userKey:string) {
 const [document,setDocument]=useState<Inspection|null>(null),[record,setRecord]=useState<SavedInspection|null>(null),[saveState,setSaveState]=useState<SaveState>('saved'),[message,setMessage]=useState(''),[conflicts,setConflicts]=useState<MergeConflict[]>([]),[localProtected,setLocalProtected]=useState(false);
 const pendingRemote=useRef<SavedInspection|null>(null),refreshPaused=useRef(false),generation=useRef(0);
 const draft=useRef<Inspection|null>(null),base=useRef<SavedInspection|null>(null),inFlight=useRef<Promise<boolean>|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),mergeCandidate=useRef<Inspection|null>(null),saveRef=useRef<()=>Promise<boolean>>(async()=>false),conflicted=useRef(false);
 const tabKey=useRef<string>('');
 const key=useCallback((id:string)=>{if(!tabKey.current){try{tabKey.current=sessionStorage.getItem('r2-pickup-tab')||newId();sessionStorage.setItem('r2-pickup-tab',tabKey.current);}catch{tabKey.current=newId();}}return 'r2-pickup-draft:v1:'+userKey+':'+id+':'+tabKey.current;},[userKey]);
 const persist=useCallback(()=>{if(!base.current||!draft.current)return;try{localStorage.setItem(key(base.current.id),JSON.stringify({base:base.current,document:draft.current,at:Date.now()}));setLocalProtected(true);}catch{setLocalProtected(false);}},[key]);
 const clearDraft=useCallback(()=>{if(base.current)try{localStorage.removeItem(key(base.current.id));}catch{}setLocalProtected(false);},[key]);
 const renderDraft=(d:Inspection)=>{draft.current=d;setDocument(d)};
 const reconcile=useCallback((remote:SavedInspection)=>{
  if(!base.current||!draft.current)return;
  const result=mergeDocuments(base.current.document,draft.current,remote.document);
  if(result.conflicts.length){pendingRemote.current=remote;mergeCandidate.current=result.merged;conflicted.current=true;setConflicts(result.conflicts);setSaveState('conflict');setMessage('The same detail changed on another device. Choose which version to keep.');persist();return;}
  base.current=remote;setRecord(remote);renderDraft(result.merged);persist();
  if(same(result.merged,remote.document)){clearDraft();setSaveState('saved');setMessage('');}else{setSaveState('pending');}
 },[persist,clearDraft]);
 const saveNow=useCallback(async():Promise<boolean>=>{
  if(inFlight.current)return inFlight.current;
  if(timer.current)clearTimeout(timer.current);
  const task=async()=>{
   if(!base.current||!draft.current||conflicted.current)return false;
   for(let attempt=0;attempt<12;attempt++){
    if(same(draft.current,base.current.document)){setSaveState('saved');setMessage('');clearDraft();return true;}
    if(!navigator.onLine){setSaveState('offline');setMessage('Waiting for a connection. Keep this page open.');persist();return false;}
    const snapshot=structuredClone(draft.current),current=base.current;
    setSaveState('saving');setMessage('');
    try{
      const saved=await api('',{method:'PUT',body:JSON.stringify({id:current.id,revision:current.revision,mutationId:newId(),document:snapshot})}) as SavedInspection;
      // Only acknowledge the submitted snapshot. Later edits stay in draft.
      base.current=saved;setRecord(saved);persist();
    }catch(error){
      const e=error as Error&{status?:number;data?:{current?:SavedInspection}};
      if(e.status===409&&e.data?.current){reconcile(e.data.current);if(conflicted.current)return false;continue;}
      setSaveState(navigator.onLine?'error':'offline');setMessage(e.message);persist();return false;
    }
   }
   setSaveState('pending');timer.current=setTimeout(()=>void saveRef.current(),400);return false;
  };
  const promise=task();inFlight.current=promise;try{return await promise;}finally{inFlight.current=null;}
 },[clearDraft,persist,reconcile]);
 useEffect(()=>{saveRef.current=saveNow},[saveNow]);
 const edit=useCallback((update:(doc:Inspection)=>Inspection)=>{
  if(!draft.current||conflicted.current)return;
  const updated=update(draft.current);renderDraft(updated);setSaveState('pending');persist();
  if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void saveRef.current(),650);
 },[persist]);
 const attach=useCallback((saved:SavedInspection)=>{
  generation.current++;
  if(timer.current)clearTimeout(timer.current);
  base.current=saved;setRecord(saved);renderDraft(saved.document);setSaveState('saved');setMessage('');conflicted.current=false;setConflicts([]);
  try{const ownKey=key(saved.id);let backupKey=ownKey;let stored=localStorage.getItem(ownKey);if(!stored){const candidates=Object.keys(localStorage).filter(k=>k.startsWith('r2-pickup-draft:v1:'+userKey+':'+saved.id+':')).map(k=>({key:k,raw:localStorage.getItem(k)!})).sort((a,b)=>(JSON.parse(b.raw).at||0)-(JSON.parse(a.raw).at||0));if(candidates[0]){backupKey=candidates[0].key;stored=candidates[0].raw;}}if(stored){const backup=JSON.parse(stored);const recovered=documentSchema.parse(backup.document);const previousDoc=documentSchema.parse(backup.base?.document);if(backup.base?.id===saved.id&&Number.isInteger(backup.base.revision)&&backup.base.revision>0&&recovered.meta.vin===saved.document.meta.vin){base.current={...backup.base,document:previousDoc};renderDraft(recovered);reconcile(saved);if(backupKey!==ownKey){persist();localStorage.removeItem(backupKey);}if(!conflicted.current)timer.current=setTimeout(()=>void saveRef.current(),400);}}}catch{base.current=saved;setRecord(saved);renderDraft(saved.document);setSaveState('saved');conflicted.current=false;setConflicts([]);setMessage('A saved local draft could not be restored. Your server copy is open.');}
 },[key,reconcile,persist,userKey]);
 const resolve=useCallback((choices:Record<string,'mine'|'theirs'>)=>{
  if(!mergeCandidate.current)return;
  const d=structuredClone(mergeCandidate.current);
  for(const conflict of conflicts)setPath(d,conflict.path,choices[conflict.path]==='mine'?conflict.mine:conflict.theirs);
  if(pendingRemote.current){base.current=pendingRemote.current;setRecord(pendingRemote.current);pendingRemote.current=null;}
  renderDraft(d);conflicted.current=false;setConflicts([]);mergeCandidate.current=null;setSaveState('pending');setMessage('');persist();timer.current=setTimeout(()=>void saveRef.current(),100);
 },[conflicts,persist]);
 const refresh=useCallback(async()=>{
  if(!base.current||!draft.current||inFlight.current||conflicted.current||refreshPaused.current||!navigator.onLine)return;
  const requestedId=base.current.id,requestedGeneration=generation.current;
  try{const saved=await api('?id='+encodeURIComponent(base.current.id)+'&last4='+draft.current.meta.vin.slice(-4)) as SavedInspection;if(!base.current||base.current.id!==requestedId||generation.current!==requestedGeneration||inFlight.current||conflicted.current||refreshPaused.current)return;
   if(saved.revision>base.current.revision)reconcile(saved);
   if(draft.current&&base.current&&!same(draft.current,base.current.document)&&!conflicted.current)void saveRef.current();
  }catch{/* A refresh must not replace or discard the draft. */}
 },[reconcile]);
 useEffect(()=>{
  const onVisible=()=>{if(documentGlobalVisible())void refresh()};
  const onOnline=()=>{void refresh();void saveRef.current()};
  const onHide=()=>{if(draft.current&&base.current&&!same(draft.current,base.current.document)){persist();void saveRef.current();}};
  const beforeUnload=(e:BeforeUnloadEvent)=>{if(draft.current&&base.current&&!same(draft.current,base.current.document)){e.preventDefault();e.returnValue='';}};
  window.addEventListener('focus',onVisible);window.addEventListener('online',onOnline);window.addEventListener('pagehide',onHide);window.addEventListener('beforeunload',beforeUnload);window.document.addEventListener('visibilitychange',onVisible);
  const poll=setInterval(onVisible,20000);
  return()=>{clearInterval(poll);if(timer.current)clearTimeout(timer.current);window.removeEventListener('focus',onVisible);window.removeEventListener('online',onOnline);window.removeEventListener('pagehide',onHide);window.removeEventListener('beforeunload',beforeUnload);window.document.removeEventListener('visibilitychange',onVisible);};
 },[refresh,persist]);
 const close=useCallback(async()=>{if(!(await saveNow()))return false;generation.current++;draft.current=null;base.current=null;setDocument(null);setRecord(null);return true;},[saveNow]);
 return {document,record,saveState,message,conflicts,localProtected,attach,edit,saveNow,resolve,close,setRefreshPaused:(paused:boolean)=>{refreshPaused.current=paused}};
}
function documentGlobalVisible(){return window.document.visibilityState==='visible'}
