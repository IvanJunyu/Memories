import {isWalkable} from './geometry.js';

export function catCanWalk(x,y){
 return [-26,0,26].every(dx=>[-8,8].every(dy=>isWalkable('home',x+dx,y+dy)));
}

// Short, unobstructed strolls with rests; cosmetic state never changes story progress.
export function createRoomCat(random=Math.random){
 const actor={x:740,y:520,face:-1,moving:false,time:0};
 let target=null,rest=1;
 function reset(){Object.assign(actor,{x:740,y:520,face:-1,moving:false,time:0});target=null;rest=1;}
 function choose(){
  for(let attempt=0;attempt<32;attempt++){
   const angle=random()*Math.PI*2,length=65+random()*160;
   const x=actor.x+Math.cos(angle)*length,y=actor.y+Math.sin(angle)*length;
   const steps=Math.ceil(length/4);
   if(Array.from({length:steps},(_,i)=>(i+1)/steps).every(k=>catCanWalk(actor.x+(x-actor.x)*k,actor.y+(y-actor.y)*k)))return {x,y};
  }
  return null;
 }
 function update(dt,active=true){
  actor.moving=false;if(!active)return;
  dt=Math.min(Math.max(dt,0),.05);
  if(rest>0){rest-=dt;return;}
  if(!target){target=choose();if(!target){rest=.5;return;}}
  const dx=target.x-actor.x,dy=target.y-actor.y,d=Math.hypot(dx,dy),step=Math.min(d,25*dt);
  if(d<1){target=null;rest=1+random()*2.5;return;}
  const x=actor.x+dx/d*step,y=actor.y+dy/d*step;
  if(!catCanWalk(x,y)){target=null;rest=.5;return;}
  actor.x=x;actor.y=y;if(Math.abs(dx)>.5)actor.face=Math.sign(dx);
  actor.moving=true;actor.time+=dt;
 }
 return {actor,update,reset};
}
