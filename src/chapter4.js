import {drawHallBackground,drawProp,drawBirthdayCandle,drawCharacter,getPropCollisionData,drawMarker} from './art.js';
import {HALL,PHOTOS,MEMORIES,CHAPTER4_INTRO} from './chapter4-content.js';
import {newCombat,damage,canFinish,ARENA,moveInArena,projectileHits,BULLET_RANGE,advanceProjectile,hallCamera,updateEnemy,updateBoss,meteorHits,updateCake,cakeReady,CAKE_DROP_SECONDS,tryPlayerShot,enemyArt,enemyBulletHitTime} from './chapter4-combat.js';
export function createChapter4(api){
 const root=document.getElementById('game'),panel=document.createElement('section');panel.id='birthdayEnding';panel.className='hidden';root.append(panel);
 const vitals=document.createElement('div');vitals.id='hallVitals';vitals.setAttribute('role','img');
 const heart='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 28C12 24 3 18 3 10C3 2 13 1 16 8C19 1 29 2 29 10C29 18 20 24 16 28Z"/></svg>';
 const shield='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3L28 8V16C28 23 21 28 16 30C11 28 4 23 4 16V8Z"/><path class="shield-mark" d="M16 9V23M10 15H22"/></svg>';
 vitals.innerHTML='<span class="heart">'+heart+'</span>'+Array.from({length:3},()=>'<span class="shield">'+shield+'</span>').join('');root.append(vitals);
 function updateVitals(c){vitals.children[0].classList.toggle('spent',c.dead);for(let i=0;i<3;i++)vitals.children[i+1].classList.toggle('spent',i>=c.shields);vitals.setAttribute('aria-label',`生命 ${c.dead?0:1}，格挡 ${c.shields}`);}
 const atlas=new Image();atlas.src='./assets/characters/combat-atlas-v2.png';
 const photos=new Map();let bullets=[],shots=[],guard=0,gameClock=0,saveTime=0,shootPose=0,moving=false,face=-1;
 const data=()=>api.getState().chapter4;
 function reset(){root.classList.remove('birthday-finale');Object.assign(data(),{x:HALL.start,y:ARENA.startY,complete:false,combat:newCombat()});bullets=[];shots=[];guard=0;gameClock=0;shootPose=0;moving=false;face=-1;panel.classList.add('hidden');api.clearInput();api.save();}
 function enter(scene,{preview=false}={}){root.classList.remove('birthday-finale');panel.classList.add('hidden');root.classList.toggle('in-hall',scene==='hall');if(scene!=='hall'||preview)return;if(data().complete){bullets=[];shots=[];guard=0;shootPose=0;moving=false;finish();return;}reset();if(!data().introSeen)api.talk(CHAPTER4_INTRO,()=>{data().introSeen=true;api.clearInput();api.save();});}
 function hit(){if(api.blocked()||data().complete)return;if(data().combat?.dead){reset();return;}if(canFinish(data().combat,data().x,data().y)){finish();return;}if(!tryPlayerShot(data().combat,gameClock))return;bullets.push({x:data().x-38,y:data().y-91});shootPose=.22;}
 function finish(){
  data().complete=true;data().read=MEMORIES.map(m=>m.id);bullets=[];shots=[];guard=0;shootPose=0;moving=false;
  panel.innerHTML=`<div class="finale-glow" aria-hidden="true"></div><div class="finale-layout">
   <figure class="finale-photo"><img src="./assets/memories/memory-ending-v1.jpg" alt="属于你们的回忆合照"><figcaption>与你，一路。</figcaption></figure>
   <div class="finale-letter"><p class="finale-date">11 / 03</p><h2>生日快乐！<br>我的哈尼</h2>
    <div class="finale-cake" aria-hidden="true"><img src="./assets/characters/cake-cream-v1.png" alt=""><span class="finale-candle"><i></i></span></div>
    
   </div></div>`;
  root.classList.add('birthday-finale');panel.setAttribute('aria-label','生日快乐，旅程已完成');panel.classList.remove('hidden');api.clearInput();api.save();
 }
 function update(dt){if(api.getState().scene!=='hall')return false;if(api.blocked()){moving=false;return true;}const d=data(),c=d.combat;dt=Math.min(dt,.05);guard=Math.max(0,guard-dt);shootPose=Math.max(0,shootPose-dt);moving=false;if(!c||c.dead||d.complete)return true;gameClock+=dt;
 const k=api.keys,dx=Math.max(-1,Math.min(1,api.joy.x+(k.has('a')||k.has('arrowleft')?-1:0)+(k.has('d')||k.has('arrowright')?1:0)));
 const dy=Math.max(-1,Math.min(1,api.joy.y+(k.has('w')||k.has('arrowup')?-1:0)+(k.has('s')||k.has('arrowdown')?1:0)));const oldX=d.x,oldY=d.y;const barrier=Math.max(HALL.end,...c.enemies.filter(e=>e.hp>0&&e.kind==='boss').map(e=>e.x+100));Object.assign(d,moveInArena(d.x,d.y,dx,dy,dt,barrier));moving=Math.hypot(d.x-oldX,d.y-oldY)>.001;if(Math.abs(d.x-oldX)>.001)face=dx<0?-1:1;
 for(const b of bullets){const old=b.x;advanceProjectile(b,-640,0,dt);let target=null,first=Infinity;for(const e of c.enemies){const time=enemyBulletHitTime(e,old,b.x,b.y,getPropCollisionData(enemyArt(e).key));if(time!==null&&time<first){first=time;target=e;}}if(target){target.hp--;b.x=-100;}}
 bullets=bullets.filter(b=>b.x>=0&&b.distance<BULLET_RANGE);
 const camera=hallCamera(d.x);
 for(const e of c.enemies){if(e.kind==='boss'){const event=updateBoss(e,d,dt,camera);shots.push(...event.shots);if(event.impact&&meteorHits(event.impact,d)&&guard<=0){const result=damage(c,d.x-55,d.y);if(result==='blocked')guard=.7;}continue;}const event=updateEnemy(e,d,dt,camera);if(event.shot)shots.push(event.shot);if(event.melee&&guard<=0&&!c.dead){const result=damage(c,d.x+(e.face===-1?55:-55),d.y);e.cooldown=1;if(result==='blocked')guard=.7;}}
 for(const s of shots){const old=s.x,oldY=s.y;advanceProjectile(s,s.vx,s.vy,dt);if(projectileHits(old,oldY,s.x,s.y,d.x,d.y-63,19,37)){s.x=HALL.length+1;if(guard<=0){const result=damage(c,d.x-55,d.y);if(result==='blocked')guard=.7;}}}shots=shots.filter(s=>s.distance<BULLET_RANGE&&s.x<=HALL.length&&s.x>=0&&s.y>=0&&s.y<=ARENA.bottom+100);
 if(c.dead){panel.innerHTML='<h2>旅程暂时停下了</h2><p>再试一次，一起走到蛋糕前。</p><button>重新挑战</button>';panel.querySelector('button').onclick=reset;panel.classList.remove('hidden');api.clearInput();}
 updateCake(c,dt);
 saveTime+=dt;if(saveTime>1){saveTime=0;api.save();}return true;}
 function sprite(ctx,index,x,y,size){if(!atlas.complete||!atlas.naturalWidth)return;const w=atlas.naturalWidth/3,h=atlas.naturalHeight/2;
 // Standing combat poses: align crown-to-sole height and foot anchor with walking sprites.
 if(index===0||index===1){const scale=atlas.naturalHeight/1024,top=16*scale,bottom=520*scale,sourceH=bottom-top,drawW=size*w/sourceH;ctx.drawImage(atlas,index*w,top,w,sourceH,x-drawW/2,y-size,drawW,size);return;}
 ctx.drawImage(atlas,index%3*w,Math.floor(index/3)*h,w,h,x-size/2,y-size,size,size);}
 function draw(ctx,t){if(api.getState().scene!=='hall')return false;const d=data(),c=d.combat||newCombat(),cam=hallCamera(d.x);drawHallBackground(ctx,cam,HALL.length);ctx.save();
 for(const p of PHOTOS){const x=p.x-cam;if(x<-p.w||x>1100+p.w)continue;ctx.strokeStyle='#aa9270';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,p.y-p.h/2);ctx.stroke();ctx.strokeRect(x-p.w/2-5,p.y-p.h/2-5,p.w+10,p.h+10);if(p.src){if(!photos.has(p.id)){const im=new Image();im.src=p.src;photos.set(p.id,im);}const im=photos.get(p.id);if(im.complete&&im.naturalWidth){const s=Math.min(p.w/im.width,p.h/im.height);ctx.drawImage(im,x-im.width*s/2,p.y-im.height*s/2,im.width*s,im.height*s);}}}
 if(cakeReady(c)&&!d.complete)drawMarker(ctx,HALL.end-cam,ARENA.cakeY,canFinish(c,d.x,d.y),t);
 if(c.cakeDrop>0){const progress=c.cakeDrop/CAKE_DROP_SECONDS,y=-100+(ARENA.cakeY+100)*(1-Math.pow(1-progress,2));ctx.save();ctx.globalAlpha=Math.min(1,progress/0.75);drawProp(ctx,'cake-cream-v1',150-cam,y,{height:90});drawBirthdayCandle(ctx,150-cam,y-58,{height:42,lit:true,time:t});ctx.restore();}
 const boss=c.enemies.find(e=>e.kind==='boss');
 if(boss?.hp>0&&boss.phase==='ring'){ctx.save();ctx.fillStyle='#c08bff';ctx.globalAlpha=.4+.6*boss.phaseTime/.7;for(let i=0;i<10;i++){const a=i*Math.PI*2/10;ctx.beginPath();ctx.arc(boss.x-cam+Math.cos(a)*95,boss.y-85+Math.sin(a)*95,8,0,Math.PI*2);ctx.fill();}ctx.restore();}
 if(boss?.warning){const mark=boss.warning,x=mark.x-cam;ctx.save();ctx.strokeStyle='#ff514c';ctx.fillStyle='#ff302a44';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,mark.y,mark.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ffb7a1';ctx.textAlign='center';ctx.font='18px sans-serif';ctx.fillText(Math.max(1,Math.ceil(3-boss.phaseTime)),x,mark.y+6);if(boss.phaseTime>=2.4){const y=mark.y-400*(3-boss.phaseTime)/.6;ctx.shadowColor='#ff351c';ctx.shadowBlur=25;ctx.fillStyle='#ff482b';ctx.beginPath();ctx.arc(x,y,26,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe2a0';ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.fill();}ctx.restore();}
 c.enemies.forEach((e,i)=>{if(e.hp<=0)return;const art=enemyArt(e),size=art.height;drawProp(ctx,art.key,e.x-cam,e.y,{height:size,face:art.face});ctx.fillStyle='#332338';ctx.fillRect(e.x-cam-45,e.y-10-size,90,6);ctx.fillStyle='#dc93bd';ctx.fillRect(e.x-cam-45,e.y-10-size,90*e.hp/e.max,6);});
 const walking=moving&&!c.dead&&!d.complete&&!api.blocked();
 if(guard>0)drawCharacter(ctx,'ivan',d.x-cam-60,d.y,{height:119,face:-1,pose:'shield',time:t});else if(c.shields>0)drawCharacter(ctx,'ivan',d.x-cam+80,d.y??ARENA.startY,{height:119,face,moving:walking,time:t});else sprite(ctx,2,c.fallenX-cam,c.fallenY+10,125);
 if(shootPose>0)drawCharacter(ctx,'heroine',d.x-cam,d.y??ARENA.startY,{height:115,face:-1,pose:'shoot',time:t});else drawCharacter(ctx,'heroine',d.x-cam,d.y??ARENA.startY,{height:115,face,moving:walking,time:t});ctx.fillStyle='#ffe6a3';for(const b of bullets)ctx.fillRect(b.x-cam,b.y,14,5);ctx.fillStyle='#c08bff';for(const s of shots){ctx.beginPath();ctx.arc(s.x-cam,s.y,8,0,Math.PI*2);ctx.fill();}
 ctx.restore();updateVitals(c);return true;}
 return {enter,hit,update,draw,locked:()=>api.getState().scene==='hall'&&!!(data().combat?.dead||data().complete),progress:()=>`${data().combat?.enemies.filter(e=>e.hp===0).length||0} / ${20+5}`,objective:()=>data().complete?'生日快乐':cakeReady(data().combat||{})?'靠近蛋糕，按互动完成旅程':'击败幽灵与 Boss · 躲开法球和红圈'};
}



















