'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { type CheckItem, type Inspection, type Section, isReviewed } from '@/lib/model';
import { minutesLabel, sectionMinutes } from '@/lib/inspection-time';

const angles=[66,52,32,14,7,1,-6];
const stops=['Front','Passenger side','Rear & cargo','Driver side','Cabin','Driver’s seat','Handover'];
const regions:Record<string,string>={
 'quick-vin':'310,145 476,145 476,193 310,193',
 'route-front-body':'284,188 500,188 500,292 284,292',
 'route-windshield-outside':'302,140 483,140 500,234 285,234',
 'route-passenger-front':'369,148 630,148 630,317 369,317',
 'route-passenger-rear':'178,140 370,140 370,316 178,316',
 'route-rear-body':'299,131 509,131 509,309 299,309',
 'quick-equipment':'321,183 492,183 492,268 321,268',
 'route-driver-rear':'426,145 626,145 626,314 426,314',
 'quick-charge-door':'526,181 626,181 626,245 526,245',
 'route-driver-front':'172,146 426,146 426,316 172,316',
 'route-rear-cabin':'452,144 549,153 549,251 450,246',
 'route-passenger-cabin':'319,142 451,143 479,244 319,235',
 'route-driver-cabin':'311,145 508,145 508,244 311,244',
 'quick-driver-position':'421,145 513,151 513,247 421,247',
 'quick-climate-display':'316,173 490,173 490,219 316,219',
 'quick-order-mileage':'311,145 508,145 508,244 311,244',
};
// Cropped from the owner's configurator screenshots; coordinates use a 1000 × 490 view.
const detailViews:Record<string,{image:string;region:string}>={
 'route-front-body':{image:'frunk',region:'132,35 450,30 556,210 445,377 113,377 110,220 190,196'},
 'route-rear-body':{image:'cargo',region:'515,50 820,45 777,390 500,390'},
 'quick-equipment':{image:'cargo',region:'533,155 715,155 742,310 539,310'},
 'route-rear-cabin':{image:'rear-seats',region:'340,0 670,0 650,117 593,183 576,376 426,376 411,180 347,113'},
 'route-passenger-cabin':{image:'front-seats',region:'0,0 230,0 250,165 315,196 423,355 438,490 0,490'},
 'route-driver-cabin':{image:'dashboard',region:'0,0 1000,0 1000,145 573,155 568,404 282,404 282,490 0,490'},
 'quick-driver-position':{image:'front-seats',region:'485,83 595,73 632,162 653,267 684,387 818,422 866,490 599,490 449,358 442,205'},
 'quick-climate-display':{image:'dashboard',region:'356,157 823,157 828,318 358,318'},
 'quick-order-mileage':{image:'dashboard',region:'360,155 535,155 542,222 360,222'},
 'quick-ready-to-leave':{image:'dashboard',region:'289,145 822,145 831,326 576,330 570,411 295,411'},
};
const frameUrl=(frame:number)=>'/r2-360/'+String(((frame-1)%72+72)%72+1).padStart(5,'0')+'.webp';
function VehicleGuide({stop,item}:{stop:number;item:CheckItem}){
 const [frame,setFrame]=useState(66),[moving,setMoving]=useState(false),[failed,setFailed]=useState(false);
 const position=useRef(66);
 useEffect(()=>{let cancelled=false;let timer:ReturnType<typeof setTimeout>;let n=1;const preload=()=>{if(cancelled||n>72)return;for(let count=0;count<6&&n<=72;count++,n++){const image=new Image();image.src=frameUrl(n);}timer=setTimeout(preload,180)};timer=setTimeout(preload,400);return()=>{cancelled=true;clearTimeout(timer)}},[]);
 useEffect(()=>{const target=angles[stop];if(matchMedia('(prefers-reduced-motion: reduce)').matches){position.current=target;setFrame(target);setMoving(false);return}const from=position.current;let raf=0;const start=performance.now();setMoving(from!==target);const tick=(now:number)=>{const p=Math.min((now-start)/450,1);const next=from+(target-from)*(1-Math.pow(1-p,3));position.current=next;setFrame(Math.round(next));if(p<1)raf=requestAnimationFrame(tick);else setMoving(false)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[stop]);
 const detail=detailViews[item.id]||(item.id.startsWith('accessory-')?detailViews['quick-equipment']:undefined);
 const source=detail?'/r2-details/'+detail.image+'.webp':frameUrl(frame);
 useEffect(()=>{setFailed(false)},[source]);
 useEffect(()=>{for(const name of ['frunk','cargo','rear-seats','front-seats','dashboard']){const image=new Image();image.src='/r2-details/'+name+'.webp'}},[]);
 const region=detail?.region||regions[item.id]||(item.id.startsWith('accessory-')?regions['quick-equipment']:'284,140 500,140 500,293 284,293');
 return <div className="route-car"><div className="route-car-heading"><span>YOUR WALKAROUND</span><span>{stop+1} / 7</span></div>{!failed?<svg className={detail?'route-detail-view':undefined} viewBox={detail?'0 0 1000 490':'150 105 500 245'} role="img" aria-label={'Rivian R2 area guide: '+item.title}>
 <defs><filter id="r2-muted"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope={detail?0.65:0.36} intercept={detail?0.25:0.58}/><feFuncG type="linear" slope={detail?0.65:0.36} intercept={detail?0.25:0.58}/><feFuncB type="linear" slope={detail?0.65:0.36} intercept={detail?0.25:0.58}/></feComponentTransfer></filter><clipPath id="r2-area"><polygon points={region}/></clipPath></defs>
 <image href={source} width={detail?1000:800} height={detail?490:450} filter="url(#r2-muted)" onError={()=>setFailed(true)}/>
 <g clipPath="url(#r2-area)" opacity={!detail&&moving?0:1} style={{transition:'opacity 120ms'}}><image href={source} width={detail?1000:800} height={detail?490:450}/></g></svg>:<p className="source-small">Vehicle artwork unavailable. Follow the area named below.</p>}
 <div className="route-current"><span className="route-dot"/><div><strong>{stops[stop]}</strong><p>{item.title}</p></div></div><p className="route-art-caption">Color shows the area to inspect · Rivian reference views</p></div>
}
export function InspectionWalkthrough({sections,doc,renderCheck,onReview}:{sections:Section[];doc:Inspection;renderCheck:(item:CheckItem)=>ReactNode;onReview:()=>void}){
 const root=useRef<HTMLDivElement>(null),guide=useRef<HTMLElement>(null);
 const [active,setActive]=useState({stop:0,id:sections[0].items[0].id});
 useEffect(()=>{let raf=0;const update=()=>{raf=0;const cards=root.current?.querySelectorAll<HTMLElement>('[data-route-check]');if(!cards?.length)return;const mobile=window.innerWidth<=800;const line=mobile?Math.min((guide.current?.getBoundingClientRect().bottom||180)+36,window.innerHeight*.6):window.innerHeight*.34;let chosen=cards[0];for(const card of cards){if(card.getBoundingClientRect().top<=line)chosen=card;else break;}const id=chosen.dataset.routeCheck!;const stop=Number(chosen.dataset.routeStop);setActive(old=>old.id===id?old:{id,stop})};const schedule=()=>{if(!raf)raf=requestAnimationFrame(update)};window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);schedule();return()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(raf)}},[sections]);
 const item=sections[active.stop]?.items.find(item=>item.id===active.id)||sections[0].items[0];
 return <div className="route-layout" ref={root}><aside className="route-guide" ref={guide}><VehicleGuide stop={active.stop} item={item}/><nav className="route-nav" aria-label="Walkaround stops">{sections.map((s,i)=><button key={s.id} aria-current={active.stop===i?'step':undefined} onClick={()=>document.getElementById('route-stop-'+s.id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}><span>{i+1}</span>{stops[i]}<small>{s.items.filter(item=>isReviewed(doc.entries[item.id])).length}/{s.items.length}</small></button>)}</nav></aside><div className="route-checks"><p className="route-intro">One exterior lap → cabin → driver’s seat. Scroll to follow the route; the R2 turns with you.</p><div className="cycle-guide"><span>✓ 1 tap · Good</span><span>− 2 · Minor</span><span>× 3 · Major</span><span>4 · Reset</span></div>{sections.map((section,index)=><section className="route-stop" id={'route-stop-'+section.id} key={section.id}><div className="section-heading"><div><span className="section-number">STOP {index+1} / 7 · {minutesLabel(sectionMinutes[section.id])}</span><h2>{section.title}</h2><p>{section.subtitle}</p></div></div><div className="item-list">{section.items.map(item=>item.id.startsWith('accessory-')?null:<div key={item.id} data-route-check={item.id} data-route-stop={index} className={item.id==='quick-equipment'?'accessory-group':undefined}>{renderCheck(item)}{item.id==='quick-equipment'&&section.items.some(i=>i.id.startsWith('accessory-'))&&<div className="accessory-checks"><p className="accessory-checks-heading">Your ordered accessories · check each item</p>{section.items.filter(i=>i.id.startsWith('accessory-')).map(extra=><div key={extra.id} data-route-check={extra.id} data-route-stop={index}>{renderCheck(extra)}</div>)}</div>}</div>)}</div></section>)}<button className="btn primary full" onClick={onReview}>Review inspection →</button></div></div>
}
