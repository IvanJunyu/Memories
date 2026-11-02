import {HALL,FIXED_ENEMIES,RANDOM_SEAMS} from './chapter4-content.js';
export const ARENA={wallY:170,top:285,bottom:550,startY:450,cakeY:450};
export function moveInArena(x,y,dx,dy,dt,barrier=HALL.end){const length=Math.max(1,Math.hypot(dx,dy));return {x:Math.max(barrier,Math.min(HALL.start,x+dx/length*180*dt)),y:Math.max(ARENA.top,Math.min(ARENA.bottom,y+dy/length*180*dt))};}
export function projectileHits(x0,y0,x1,y1,x,y,rx,ry){const dx=x1-x0,dy=y1-y0;let lo=0,hi=1;for(const [p,v,r] of [[x0-x,dx,rx],[y0-y,dy,ry]]){if(Math.abs(v)<1e-9){if(Math.abs(p)>r)return false;}else{const a=(-r-p)/v,b=(r-p)/v;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return false;}}return true;}
export function createEnemy(kind,x,y){const hp=kind==='boss'?30:2;return {kind,x,y,hp,max:hp};}
export function newCombat(random=Math.random){
 const enemies=FIXED_ENEMIES.map(e=>createEnemy(e.kind,e.screen*1100+e.u*1100,ARENA.top+e.v*(ARENA.bottom-ARENA.top)));
 for(const seam of RANDOM_SEAMS)enemies.push({...createEnemy(random()<.5?'melee':'ranged',seam-65,ARENA.top+35+random()*(ARENA.bottom-ARENA.top-70)),seam});
 return {version:1,shields:3,dead:false,fallenX:null,fallenY:null,enemies};
}
export function damage(c,x,y=ARENA.startY){if(c.dead)return;if(c.shields>0){c.shields--;if(!c.shields){c.fallenX=x;c.fallenY=y;}return 'blocked';}c.dead=true;return 'dead';}
export function canFinish(c,x,y=ARENA.cakeY){return cakeReady(c)&&!c.dead&&c.enemies.every(e=>e.hp===0)&&x<=HALL.end&&Math.abs(y-ARENA.cakeY)<=55;}


// One logical viewport wide, independent of display size or camera movement.
export const BULLET_RANGE=1100;
export function advanceProjectile(p,vx,vy,dt){
 const speed=Math.hypot(vx,vy),remaining=Math.max(0,BULLET_RANGE-(p.distance||0));
 const travel=Math.min(remaining,speed*Math.max(0,dt));
 if(speed>0){p.x+=vx/speed*travel;p.y+=vy/speed*travel;}
 p.distance=(p.distance||0)+travel;
}

export function hallCamera(x){return Math.max(0,Math.min(HALL.length-1100,x-700));}
export function spearTouches(e,p){const direction=e.face||1;return projectileHits(e.x+direction*15,e.y-52,e.x+direction*80,e.y-52,p.x,p.y-63,19,37);}
export function updateEnemy(e,p,dt,camera,random=Math.random){
 const result={shot:null,melee:false};if(e.hp<=0)return result;
 // Activation is permanent after the actual on-screen silhouette first appears.
 if(!e.active){if(e.x+80<camera||e.x-80>camera+1100)return result;e.active=true;}
 e.face=p.x>=e.x?1:-1;
 if(e.kind==='ranged'){
  e.driftTime=(e.driftTime||0)-dt;
  if(e.driftTime<=0){const angle=random()*Math.PI*2;e.vx=Math.cos(angle)*25;e.vy=Math.sin(angle)*25;e.driftTime=1+random()*2;}
  e.x=Math.max(HALL.end+100,Math.min(HALL.start,e.x+e.vx*dt));e.y=Math.max(ARENA.top,Math.min(ARENA.bottom,e.y+e.vy*dt));
 }else if(e.kind==='melee'){
  e.cooldown=Math.max(0,(e.cooldown||0)-dt);
  const dx=p.x-e.x,dy=p.y-11-e.y,length=Math.hypot(dx,dy);
  if(length>55){const travel=Math.min(length-55,75*dt);e.x+=dx/length*travel;e.y=Math.max(ARENA.top,Math.min(ARENA.bottom,e.y+dy/length*travel));}
  if(e.cooldown<=0&&spearTouches(e,p))result.melee=true;
  return result;
 }
 e.fireTime=(e.fireTime??(e.kind==='boss'?1.25:2))-dt;
 if(e.fireTime<=1e-9){const x=e.x+e.face*30,y=e.y-60,angle=Math.atan2(p.y-63-y,p.x-x);result.shot={x,y,vx:Math.cos(angle)*240,vy:Math.sin(angle)*240};e.fireTime+=e.kind==='boss'?1.25:2;}
 return result;
}


export const CAKE_DROP_SECONDS=6;
export const BOSS_COLUMN_COUNT=10,BOSS_SHOTS_PER_COLUMN=10,BOSS_VOLLEY_INTERVAL=.3;
function bossVolley(e,out){for(let i=0;i<BOSS_COLUMN_COUNT;i++){const a=i*Math.PI*2/BOSS_COLUMN_COUNT;out.shots.push({x:e.x+Math.cos(a)*95,y:e.y-85+Math.sin(a)*95,vx:Math.cos(a)*155,vy:Math.sin(a)*155,boss:true});}}
function startBossStream(e,out){bossVolley(e,out);e.phase='ringStream';e.phaseTime=0;e.volleys=1;}
export function updateBoss(e,p,dt,camera,random=Math.random){
 const out={shots:[],impact:null};if(e.hp<=0){e.warning=null;return out;}
 if(!e.active){if(e.x+150<camera||e.x-150>camera+1100)return out;e.active=true;e.phase='ring';e.phaseTime=0;}
 e.driftTime=(e.driftTime||0)-dt;
 if(e.driftTime<=0){e.vy=random()<.5?-50:50;e.driftTime=1+random()*2;}
 e.y=Math.max(ARENA.top,Math.min(ARENA.bottom,e.y+e.vy*dt));
 if(e.y<=ARENA.top)e.vy=50;else if(e.y>=ARENA.bottom)e.vy=-50;
 e.phaseTime+=dt;
 if(e.phase==='ring'&&e.phaseTime>=.7){startBossStream(e,out);
 }else if(e.phase==='ringStream'){
  while(e.volleys<BOSS_SHOTS_PER_COLUMN&&e.phaseTime+1e-9>=e.volleys*BOSS_VOLLEY_INTERVAL){bossVolley(e,out);e.volleys++;}
  if(e.volleys===BOSS_SHOTS_PER_COLUMN){e.phase='meteor';e.phaseTime=0;e.warning={x:p.x,y:p.y,radius:55};}

 }else if(e.phase==='meteor'&&e.phaseTime>=3){out.impact=e.warning;e.warning=null;startBossStream(e,out);}
 return out;
}
export function meteorHits(mark,p){return Math.hypot(mark.x-p.x,mark.y-p.y)<=mark.radius;}
export function updateCake(c,dt){if(c.enemies.find(e=>e.kind==='boss')?.hp>0)return;c.cakeDrop=Math.min(CAKE_DROP_SECONDS,(c.cakeDrop||0)+dt);}
export function cakeReady(c){return c.cakeDrop>=CAKE_DROP_SECONDS;}





export function tryPlayerShot(c,time){if(c.dead||time<(c.nextShotAt??0))return false;c.nextShotAt=time+1;return true;}



export function enemyArt(e){return {key:`memory-ghost-${e.kind}-v1`,height:e.kind==='boss'?210:100,face:e.kind==='boss'?1:(e.face||1)};}
// Sweep the full 14x5 rendered bullet over the sprite's actual visible pixels.
// Returns the first contact along its path, so overlapping enemies are resolved in travel order.
export function enemyBulletHitTime(e,oldX,newX,y,asset){
 if(!asset||e.hp<=0)return null;
 const {bounds:b,width,alpha}=asset,{height,face}=enemyArt(e),scale=height/b.h,w=b.w*scale;
 const left=e.x-w/2,top=e.y-height,minX=Math.min(oldX,newX),maxX=Math.max(oldX,newX)+14;
 if(maxX<left||minX>left+w||y+5<top||y>e.y)return null;
 const sx0=Math.max(0,Math.floor((minX-left)/scale)),sx1=Math.min(b.w-1,Math.ceil((maxX-left)/scale));
 const sy0=Math.max(0,Math.floor((y-top)/scale)),sy1=Math.min(b.h-1,Math.ceil((y+5-top)/scale));
 let earliest=Infinity;
 for(let sy=sy0;sy<=sy1;sy++)for(let sx=sx0;sx<=sx1;sx++){
  const sourceX=b.x+(face<0?b.w-1-sx:sx);
  if(alpha[(b.y+sy)*width+sourceX]<=32)continue;
  const pixelLeft=left+sx*scale,pixelRight=pixelLeft+scale;
  const delta=newX-oldX;
  const time=delta<0?(oldX-pixelRight)/(-delta):delta>0?(pixelLeft-oldX-14)/delta:0;
  if(time<=1)earliest=Math.min(earliest,Math.max(0,time));
 }
 return Number.isFinite(earliest)?earliest:null;
}

