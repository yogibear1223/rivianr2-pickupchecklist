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
  let video:HTMLVideoElement|null=null;
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
    if(cancelled)return;
    // The short muted recordings contain real hinged motion; screenshots remain the fallback.
    const motion=!reduce&&changed?(entering?'doors':detail?.image==='frunk'?'frunk':detail?.image==='cargo'?'cargo':null):null;
    let motionSeconds=0;
    if(motion){
     const clip=document.createElement('video');video=clip;clip.muted=true;clip.playsInline=true;clip.preload='auto';clip.setAttribute('aria-hidden','true');clip.style.cssText='position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';surface.parentElement?.appendChild(clip);
     try{
      await new Promise<void>((resolve,reject)=>{const timeout=window.setTimeout(()=>{clean();reject(new Error('Clip timed out'))},3500);const clean=()=>{clearTimeout(timeout);clip.onloadeddata=null;clip.onerror=null};clip.onloadeddata=()=>{clean();resolve()};clip.onerror=()=>{clean();reject(new Error('Clip unavailable'))};clip.src='/r2-motion/'+motion+'.mp4';clip.load()});
      if(cancelled){clip.remove();return}clip.playbackRate=1.25;
      await new Promise<void>((resolve,reject)=>{const timeout=window.setTimeout(()=>reject(new Error('Playback timed out')),2000);clip.play().then(()=>{clearTimeout(timeout);resolve()},error=>{clearTimeout(timeout);reject(error)})});
      motionSeconds=clip.duration/clip.playbackRate;
     }catch{clip.pause();clip.remove();video=null}
    }
    if(cancelled)return;
    setFailed(false);lastScene.current=key;lastInterior.current=!!detail?.interior;
    const start=performance.now(),duration=reduce?0:changed?500:Math.abs(angle-from)>0.02?380:240;
    const motionDuration=motionSeconds*1000;
    const frameMap=new Map(indices.map((n,i)=>[n,frames[i]]));
    const drawImage=(im:HTMLImageElement,opacity=1)=>{ctx.save();ctx.globalAlpha*=opacity;if(detail)ctx.drawImage(im,0,0,1000,490);else ctx.drawImage(im,-300,-210,1600,900);ctx.restore()};
    const render=(now:number)=>{
     if(cancelled)return;
     const elapsed=now-start,progress=duration?clamp((elapsed-motionDuration)/duration):1,t=ease(progress);
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
      if(video&&motionDuration){
       // Blend the actual opening sequence in, then dissolve into the close inspection view.
       ctx.save();ctx.globalAlpha=1-t;ctx.filter='grayscale(.75)';ctx.drawImage(video,0,0,1000,490);ctx.restore();
       const reveal=ease(clamp(elapsed/250));ctx.save();ctx.globalAlpha=1-reveal;ctx.drawImage(old,0,0);ctx.restore();
      }else{ctx.save();ctx.globalAlpha=1-t;ctx.drawImage(old,0,0);ctx.restore()}
     }else if(painted.current&&!changed&&(detail||Math.abs(angle-from)<.02)&&progress<1){ctx.save();ctx.globalAlpha=1-t;ctx.drawImage(old,0,0);ctx.restore()}
     painted.current=true;if(progress<1)raf=requestAnimationFrame(render);else if(video){video.pause();video.remove();video=null}
    };raf=requestAnimationFrame(render);
   }catch{if(!cancelled&&!painted.current)setFailed(true)}
  };void prepare();return()=>{cancelled=true;cancelAnimationFrame(raf);if(video){video.pause();video.removeAttribute('src');video.load();video.remove();video=null}};
 },[angle,itemId,stop]);
 return <div className="vehicle-scene">{failed?<p className="source-small">Artwork unavailable. Follow the area named below.</p>:<canvas ref={canvas} width={1000} height={490} role="img" aria-label={'Rivian R2 area guide: '+title}/>}</div>
}
