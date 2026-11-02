export const DESTINATIONS=['pink','aquarium','ice'];
export const CHAPTER2_SCENES=['room2','travel','pink','aquarium','ice','airport'];
export const countTrips=s=>DESTINATIONS.filter(k=>s.chapter2.places[k]).length;
export function newChapter2(){return {places:{pink:false,aquarium:false,ice:false},spoken:{},pending:null,returning:false,flightComplete:false};}
export function completeTrip(s,place){if(!DESTINATIONS.includes(place))return;s.chapter2.places[place]=true;s.chapter2.pending=null;s.chapter2.returning=true;}
export const SWING_PERIOD=3.2;
export function swingWindow(time){const phase=(time%(SWING_PERIOD/2))/SWING_PERIOD;return phase>=.16&&phase<=.34;}
export function hitSwing(game){const cycle=Math.floor(game.time/(SWING_PERIOD/2));if(swingWindow(game.time)&&game.lastCycle!==cycle){game.lastCycle=cycle;game.streak++;return true;}game.streak=0;return false;}
export function missSwing(game,previousTime){
 let missed=false;
 const half=SWING_PERIOD/2,end=SWING_PERIOD*.34;
 for(let i=Math.max(0,Math.ceil((previousTime-end)/half));i*half+end<game.time;i++){
  if(game.lastCycle!==i){game.streak=0;missed=true;}
 }
 return missed;
}
export function advanceNet(net,target,dt){const dx=target.x-net.x,dy=target.y-net.y,len=Math.hypot(dx,dy),step=Math.min(len,121.6*dt);if(len){net.x+=dx/len*step;net.y+=dy/len*step;}}
export function makeFish(){return Array.from({length:7},(_,i)=>({id:i,x:260+(i*97)%580,y:270+(i*53)%200,vx:(i%2?1:-1)*(142+i*12)*1.2,vy:((i%3-1)*74+27)*1.2,phase:i,caught:false}));}
export function stepFish(fish,dt,time,net=null){
 for(const f of fish){
  if(f.caught)continue;
  f.cruiseX??=f.vx;f.cruiseY??=f.vy;
  const dx=net?f.x-net.x:0,dy=net?f.y-net.y:0,distance=Math.hypot(dx,dy);
  const fleeing=!!net&&distance<95,speed=Math.hypot(f.cruiseX,f.cruiseY);
  let tx=f.cruiseX,ty=f.cruiseY;
  if(fleeing){
   // Steer gradually away from the actual net, never teleport away from a catch.
   const nx=distance>.01?dx/distance:Math.cos(f.phase),ny=distance>.01?dy/distance:Math.sin(f.phase);
   tx=nx*speed;ty=ny*speed;
   if(f.x<250&&tx<0)tx=Math.abs(tx);if(f.x>850&&tx>0)tx=-Math.abs(tx);
   if(f.y<255&&ty<0)ty=Math.abs(ty);if(f.y>470&&ty>0)ty=-Math.abs(ty);
  }
  const turn=1-Math.exp(-(fleeing?3:1.4)*dt);
  f.vx+=(tx-f.vx)*turn;f.vy+=(ty-f.vy)*turn;
  f.x+=f.vx*dt;f.y+=(f.vy+Math.sin(time*2+f.phase)*51.6*(fleeing?.25:1))*dt;
  if(f.x<230||f.x>870){f.x=Math.max(230,Math.min(870,f.x));f.vx*=-1;f.cruiseX=f.x===230?Math.abs(f.cruiseX):-Math.abs(f.cruiseX);}
  if(f.y<235||f.y>490){f.y=Math.max(235,Math.min(490,f.y));f.vy*=-1;f.cruiseY=f.y===235?Math.abs(f.cruiseY):-Math.abs(f.cruiseY);}
 }
}
export function catchFish(fish,net,active){if(!active)return 0;let count=0;for(const f of fish)if(!f.caught&&Math.hypot((f.x-net.x)/20,(f.y-net.y)/16)<1){f.caught=true;count++;}return count;}
export function skatingCollision(x,y,others){return others.some(o=>Math.hypot(x-26-o.x,(y-o.y)*1.35)<48||Math.hypot(x+28-o.x,(y-o.y)*1.35)<48);}
export function unsafeMovement(samples,now,x,y){samples.push({time:now,x,y});while(samples.length&&now-samples[0].time>.28)samples.shift();if(samples.length<2)return false;const first=samples[0],elapsed=now-first.time;return elapsed>.12&&Math.hypot(x-first.x,y-first.y)>120;}
export function makeSkater(index=0,random=Math.random){
 const baseY=245+random()*310;
 return {x:1120+index*210+random()*100,y:baseY,baseY,speed:105+random()*52,phase:random()*Math.PI*2,model:random()<.5?'skater-v1':'skater-male-v1'};
}
export function iceRestPose(time,from={x:380,y:480}){
 const destination={x:990,y:246},duration=Math.max(1.2,Math.hypot(destination.x-from.x,destination.y-from.y)/130);
 const progress=Math.min(1,time/duration);
 return {x:from.x+(destination.x-from.x)*progress,y:from.y+(destination.y-from.y)*progress,seated:progress===1,face:destination.x>=from.x?1:-1,done:time>=duration+5,duration};
}
export function advanceIce(game,dt,{direction:d={x:0,y:0},target={x:game.x,y:game.y},active=false}={}){
 const m=Math.hypot(d.x,d.y)||1;
 let nx=game.x+d.x/m*196*dt,ny=game.y+d.y/m*196*dt;
 if(active){const dx=target.x-game.x,dy=target.y-game.y,len=Math.hypot(dx,dy),step=Math.min(len,544*dt);if(len){nx=game.x+dx/len*step;ny=game.y+dy/len*step;}}
 game.x=Math.max(65,Math.min(1035,nx));game.y=Math.max(230,Math.min(600,ny));
 for(const o of game.others){o.x-=o.speed*dt;o.y=o.baseY+Math.sin(game.time*.7+o.phase)*19;}
 game.others=game.others.filter(o=>o.x>-70);
 game.spawnIn=(game.spawnIn??1+Math.random())-dt;
 if(game.spawnIn<=0){if(game.others.length<6){const o=makeSkater();o.x=1160;game.others.push(o);}game.spawnIn=1+Math.random();}
 if(unsafeMovement(game.samples,game.time,game.x,game.y)||(game.invulnerable===0&&skatingCollision(game.x,game.y,game.others))){game.safe=0;return 'fall';}
 game.safe+=dt;
 return game.safe>=45?'win':'playing';
}
