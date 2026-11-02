import {isWalkable} from './geometry.js';
export const FOLLOW_SCENES=['mall','room2','hotel','cinema','hotpotstreet','haidilao','coconut','rotating','cakeshop'];
const followGap=scene=>({hotel:110,cakeshop:120,hotpotstreet:95,haidilao:135,coconut:135,rotating:135}[scene]??65);
// Follow the actual walked path, rather than cutting across furniture or floors.
export function createFollower(){
 let scene=null,trail=[],last=null;
 const actor={x:0,y:0,face:1,moving:false};
 function reset(s,x,y){scene=s;last={x,y};trail=[];actor.x=x;actor.y=y;actor.moving=false;actor.face=1;
  if(!FOLLOW_SCENES.includes(s))return;
  const GAP=followGap(s);
  for(const [dx,dy]of [[-GAP,0],[GAP,0],[0,GAP],[0,-GAP]]){
   if(Array.from({length:14},(_,i)=>isWalkable(s,x+dx*i/13,y+dy*i/13)).every(Boolean)){actor.x=x+dx;actor.y=y+dy;actor.face=dx>0?-1:1;break;}
  }
  trail.push({x,y});
 }
 function update(s,x,y,dt){
  if(scene!==s||!last)reset(s,x,y);
  actor.moving=false;if(!FOLLOW_SCENES.includes(s))return;
  // The heroine's movement resolves horizontal and vertical collision separately.
  if(x!==last.x)trail.push({x,y:last.y});
  if(y!==last.y)trail.push({x,y});
  last={x,y};
  let length=0,prev=actor;for(const p of trail){length+=Math.hypot(p.x-prev.x,p.y-prev.y);prev=p;}
  let budget=Math.min(Math.max(0,length-followGap(s)),180*dt);
  while(trail.length){const p=trail[0],dx=p.x-actor.x,dy=p.y-actor.y,d=Math.hypot(dx,dy);if(d<.001){trail.shift();continue;}if(budget<=.001)break;const step=Math.min(d,budget);actor.x+=dx/d*step;actor.y+=dy/d*step;if(Math.abs(dx)>.001)actor.face=Math.sign(dx);actor.moving=true;budget-=step;if(step>=d-.001)trail.shift();}
 }
 return {actor,reset,update};
}
