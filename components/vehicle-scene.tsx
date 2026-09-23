'use client';
import {useEffect,useRef,useState} from 'react';
import {detailFor,exteriorPaths,frameUrl,routeAngles} from '@/lib/vehicle-views';
const cache=new Map<string,Promise<HTMLImageElement>>();
function loadImage(src:string){let promise=cache.get(src);if(!promise){promise=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>{image.decode().then(()=>resolve(image),()=>resolve(image))};image.onerror=()=>{cache.delete(src);reject(new Error('Artwork unavailable'))};image.src=src});cache.set(src,promise)}return promise}
const ease=(n:number)=>n*n*(3-2*n);
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function VehicleScene({stop,itemId,angle,title}:{stop:number;itemId:string;angle:number;title:string}){
 const canvas=useRef<HTMLCanvasElement>(null),position=useRef(66),lastScene=useRef(''),lastInterior=useRef(false),painted=useRef(false);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{let cancelled=false;const warm=async()=>{for(let i=1;i<=72&&!cancelled;i+=6){await Promise.allSettled(Array.from({length:Math.min(6,73-i)},(_,j)=>loadImage(frameUrl(i+j))))}};void warm();for(const name of ['frunk','cargo','rear-seats','front-seats','dashboard','open-doors'])void loadImage('/r2-details/'+name+'.webp').catch(()=>{});return()=>{cancelled=true}},[]);
 useEffect(()=>{
  const surface=canvas.current,ctx=surface?.getContext('2d');if(!surface||!ctx)return;
  let cancelled=false,raf=0;
  const detail=detailFor(itemId),key=detail?.image||'exterior';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const changed=lastScene.current!==key,entering=!!detail?.interior&&!lastInterior.current&&painted.current;
  const old=document.createElement('canvas');old.width=1000;old.height=490;old.getContext('2d')!.drawImage(surface,0,0);
  const from=position.current;
  const prepare=async()=>{
   try{
    // Decode the complete turn before moving; the previous rendered view stays visible while loading.
    const indices=Array.from({length:Math.abs(Math.ceil(angle)-Math.floor(from))+3},(_,i)=>Math.min(Math.floor(from),Math.floor(angle))-1+i);
    const frames=detail?[]:await Promise.all(indices.map(n=>loadImage(frameUrl(n))));
    const detailImage=detail?await loadImage('/r2-details/'+detail.image+'.webp'):null;
    const door=entering?await loadImage('/r2-details/open-doors.webp'):null;
    if(cancelled)return;
    setFailed(false);lastScene.current=key;lastInterior.current=!!detail?.interior;
    const start=performance.now(),duration=reduce?0:entering?1150:changed?650:Math.abs(angle-from)>0.02?380:240;
    const frameMap=new Map(indices.map((n,i)=>[n,frames[i]]));
    const drawImage=(im:HTMLImageElement,opacity=1)=>{ctx.save();ctx.globalAlpha*=opacity;if(detail)ctx.drawImage(im,0,0,1000,490);else ctx.drawImage(im,-300,-210,1600,900);ctx.restore()};
    const render=(now:number)=>{
     if(cancelled)return;
     const progress=duration?clamp((now-start)/duration):1,t=ease(progress);
     position.current=from+(angle-from)*t;
     ctx.clearRect(0,0,1000,490);ctx.fillStyle='#f4f4ee';ctx.fillRect(0,0,1000,490);
     const path=detail?.path||exteriorPaths[itemId];
     const low=Math.floor(position.current),mix=position.current-low;
     const draw=()=>{if(detailImage)drawImage(detailImage);else {const a=frameMap.get(low),b=frameMap.get(low+1);if(a)drawImage(a);if(b&&mix>0)drawImage(b,mix)}};
     ctx.save();ctx.filter='grayscale(1)';ctx.globalAlpha=detail?0.65:0.5;draw();ctx.restore();
     // Curved highlight geometry follows visible panel and seat contours.
     if(path){ctx.save();if(!detail){ctx.translate(-300,-210);ctx.scale(2,2)}ctx.clip(new Path2D(path));ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=detail?1:clamp(1-Math.abs(position.current-routeAngles[stop])/2);draw();ctx.restore()}
     // Image changes blend over the last painted frame, including interrupted transitions.
     if(painted.current&&changed&&progress<1){
      if(entering&&door){
       const open=ease(clamp(progress/.38)),zoom=ease(clamp((progress-.2)/.65)),inside=ease(clamp((progress-.56)/.44));
       ctx.save();ctx.globalAlpha=1-inside;ctx.fillStyle='#f4f4ee';ctx.fillRect(0,0,1000,490);ctx.translate(500,245);ctx.scale(1+zoom*1.25,1+zoom*1.25);ctx.translate(itemId==='route-rear-cabin'?-655:-478,-210);ctx.drawImage(door,0,0,1000,490);ctx.restore();
       ctx.save();ctx.globalAlpha=1-open;ctx.drawImage(old,0,0);ctx.restore();
      }else{ctx.save();ctx.globalAlpha=1-t;ctx.drawImage(old,0,0);ctx.restore()}
     }else if(painted.current&&!changed&&(detail||Math.abs(angle-from)<.02)&&progress<1){ctx.save();ctx.globalAlpha=1-t;ctx.drawImage(old,0,0);ctx.restore()}
     painted.current=true;if(progress<1)raf=requestAnimationFrame(render);
    };raf=requestAnimationFrame(render);
   }catch{if(!cancelled&&!painted.current)setFailed(true)}
  };void prepare();return()=>{cancelled=true;cancelAnimationFrame(raf)};
 },[angle,itemId,stop]);
 return <div className="vehicle-scene">{failed?<p className="source-small">Artwork unavailable. Follow the area named below.</p>:<canvas ref={canvas} width={1000} height={490} role="img" aria-label={'Rivian R2 area guide: '+title}/>}</div>
}
