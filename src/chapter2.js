import {HOTSPOTS} from './geometry.js';
import {drawBackground,drawCharacter,drawProp,label,drawMarker} from './art.js';
import {CHAPTER2_SCENES,countTrips,completeTrip,SWING_PERIOD,swingWindow,hitSwing,missSwing,advanceNet,makeFish,stepFish,catchFish,makeSkater,advanceIce,iceRestPose} from './chapter2-logic.js';
import {DIALOGUE} from './chapter2-dialogue.js';

export function createChapter2(api){
 const root=document.getElementById('game');
 const travel=document.createElement('section');travel.id='travelMenu';travel.className='hidden';travel.setAttribute('aria-label','选择目的地');root.append(travel);
 const panel=document.createElement('section');panel.id='miniPanel';panel.className='hidden';panel.innerHTML='<div id="miniValue" role="status"></div><p id="miniHint"></p><button id="swingHit">现在用力 · 点击 / 空格</button>';root.append(panel);
 const value=panel.querySelector('#miniValue'),hint=panel.querySelector('#miniHint'),hitButton=panel.querySelector('button');
 let talking=false;
 let game=null,clock=0,pointer=null,target={x:550,y:390},active=false,tripBusy=false;
 const state=()=>api.getState();
 const visible=(el,on)=>el.classList.toggle('hidden',!on);
 const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
 function clear(){pointer=null;active=false;if(game?.samples)game.samples.length=0;}
 function talkOnce(key){if(talking||state().chapter2.spoken[key])return false;talking=true;if(game?.kind!=='ice')clear();api.talk(DIALOGUE[key],()=>{talking=false;state().chapter2.spoken[key]=true;api.save();if(game&&game.kind!=='ice')game.grace=.75;});return true;}
 function finish(place){
  if(game?.stage==='rest'||state().chapter2.returning)return;
  state().chapter2.pending=place;api.save();const from={x:game?.x||550,y:game?.y||460};clear();game={kind:place,stage:'rest',time:0,spoken:false,from};hint.textContent='';
 }
 function restDialogue(){
  if(game.spoken)return;game.spoken=true;
  const place=game.kind,key=place==='pink'?'pinkEnd':place==='ice'?'iceEnd':'aquariumEnd';
  api.talk(DIALOGUE[key],()=>{completeTrip(state(),place);api.save();api.toast('✦ 新的一页回忆 · 已记入日历');api.transition('room2');});
 }
 function travelMenu(){
  const total=countTrips(state());travel.innerHTML='<p class="eyebrow">OUR LITTLE GETAWAY</p><h2>一起去哪里？</h2><p>日历 '+total+' / 3</p>';
  const entries=total===3?[['airport','机场 →']]:[['pink','粉色沙滩'],['aquarium','海洋馆'],['ice','滑冰场'],['room2','回家']];
  for(const [scene,name]of entries){const b=document.createElement('button');b.textContent=name+(state().chapter2.places[scene]?' ✓':'');b.onclick=()=>{if(tripBusy||api.blocked())return;tripBusy=true;visible(travel,false);travel.querySelectorAll('button').forEach(x=>x.disabled=true);api.transition(scene,undefined,undefined,()=>{tripBusy=false;});};travel.append(b);}
 }
 function enter(scene,{preview=false}={}){
  clear();talking=false;game=null;tripBusy=false;clock=0;value.textContent='';hint.textContent='';visible(travel,false);visible(panel,false);visible(hitButton,false);
  if(preview)return;
  if(scene==='room2'){state().chapter2.returning=false;api.save();}
  if(scene==='travel'){travelMenu();visible(travel,true);}
  if(scene==='pink'){game={kind:'pink',stage:'play',time:0,streak:0,lastCycle:-1,grace:1};visible(panel,true);visible(hitButton,true);hint.textContent='左右两端变绿时都要精准点击，错按或漏按都会清零。';}
  if(scene==='ice'){
   game={kind:'ice',stage:'play',time:0,safe:0,x:380,y:460,grace:0,samples:[],fall:0,invulnerable:0,others:[],spawnIn:1+Math.random()};
   visible(panel,true);hint.textContent='轻轻拖动两人躲开其他人；突然大幅拖动会摔倒。电脑可用方向键。';
   if(state().chapter2.pending!=='ice'){talking=true;api.talk(DIALOGUE.iceIntro,()=>{talking=false;});}
  }
  if(scene==='aquarium'&&state().chapter2.pending!=='aquarium')talkOnce('aquariumIntro');
  if(scene==='airport')game={kind:'flight',stage:'play',time:0};
  if(state().chapter2.pending===scene){game={kind:scene,stage:'rest',time:0,spoken:false};visible(panel,true);}
 }
 function points(){
  if(state().scene==='room2')return [
   {x:HOTSPOTS.room2.calendar[0],y:HOTSPOTS.room2.calendar[1],label:'查看日历',run:()=>api.talk([['我们的日历',`还有 ${3-countTrips(state())} 次出行`],['一起去过的地方',`粉色沙滩 ${state().chapter2.places.pink?'✓':'○'}　海洋馆 ${state().chapter2.places.aquarium?'✓':'○'}　滑冰场 ${state().chapter2.places.ice?'✓':'○'}`]])},
   {x:HOTSPOTS.room2.door[0],y:HOTSPOTS.room2.door[1],label:countTrips(state())===3?'出门去机场':'一起出门',run:()=>api.transition('travel')}
  ];
  if(state().scene==='aquarium'&&!game)return [
   {x:550,y:425,label:'靠近小浴缸 · 捞鱼',run:startFishing},
   {x:920,y:530,label:'回房间（未完成）',run:()=>api.transition('room2')}
  ];
  return [];
 }
 function startFishing(){clear();api.clearInput();game={kind:'fish',stage:'play',time:0,caught:0,net:{x:550,y:390},fish:makeFish()};visible(panel,true);hint.textContent='按住并拖动鱼网，抄网会延迟跟随；把小鱼套进网口即可捕获。电脑也可用方向键移动鱼网。';}
 function hit(){if(api.blocked()||game?.kind!=='pink'||game.stage!=='play'||game.grace>0)return;const good=hitSwing(game);setText(value,`连续精准 ${game.streak} / 10`);if(!good)api.toast('没踩准节奏，连续次数归零，再试一次。');if(game.streak>=10){finish('pink');return;}if(game.streak===3)talkOnce('swing3');if(game.streak===6)talkOnce('swing6');}
 hitButton.onclick=hit;
 function canvasPoint(e){const r=api.canvas.getBoundingClientRect(),scale=Math.min(r.width/1100,r.height/620),left=r.left+(r.width-1100*scale)/2,top=r.top+(r.height-620*scale)/2;return{x:(e.clientX-left)/scale,y:(e.clientY-top)/scale};}
 api.canvas.addEventListener('pointerdown',e=>{
  if((game?.kind==='ice'?(api.skatingBlocked?.()??api.blocked()):api.blocked())||pointer!==null||game?.stage!=='play')return;
  if(game.kind==='pink'){hit();return;}
  if(!['fish','ice'].includes(game.kind))return;
  pointer=e.pointerId;active=true;target=canvasPoint(e);api.canvas.setPointerCapture(pointer);
 });
 api.canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&!(game?.kind==='ice'?(api.skatingBlocked?.()??api.blocked()):api.blocked()))target=canvasPoint(e);});
 api.canvas.addEventListener('pointerup',e=>{if(e.pointerId===pointer)clear();});
 api.canvas.addEventListener('pointercancel',()=>{clear();if(game?.stage==='play')api.pause();});
 api.canvas.addEventListener('lostpointercapture',clear);
 function direction(){return{x:(api.keys.has('arrowright')||api.keys.has('d')?1:0)-(api.keys.has('arrowleft')||api.keys.has('a')?1:0),y:(api.keys.has('arrowdown')||api.keys.has('s')?1:0)-(api.keys.has('arrowup')||api.keys.has('w')?1:0)};}
 function fall(){game.safe=0;game.fall=1.35;game.samples=[];clear();api.toast('两个人摔倒了，休息一下，再慢慢出发。');}
 function update(dt){
  clock+=dt;
  if(!CHAPTER2_SCENES.includes(state().scene))return false;
  if(state().scene==='travel')return true;
  if(!game)return false;
  if(game.kind==='pink'&&game.stage==='play'&&(api.blocked()||game.grace>0)){game.time+=dt;game.lastCycle=Math.floor(game.time/(SWING_PERIOD/2));if(!api.blocked())game.grace=Math.max(0,game.grace-dt);hitButton.classList.toggle('ready',false);setText(value,'准备好，一起继续…');return true;}
  const previousTime=game.time;game.time+=dt;
  if(game.stage==='rest'){
   visible(hitButton,false);
   if(game.kind==='pink'){
    setText(value,'');
    hint.textContent='';
    if(game.time>=14&&!game.spoken)restDialogue();
   }else if(game.kind==='ice'){
    const pose=iceRestPose(game.time,game.from);
    setText(value,'');
    hint.textContent='';
    if(pose.seated&&!game.restDialogueStarted){game.restDialogueStarted=true;talking=true;api.talk(DIALOGUE.iceEnd,()=>{talking=false;if(game?.kind==='ice')game.restDialogueDone=true;});}
     if(pose.done&&game.restDialogueDone&&!game.spoken){game.spoken=true;completeTrip(state(),'ice');api.save();api.toast('✦ 新的一页回忆 · 已记入日历');api.transition('room2');}
   }else{setText(value,'');if(game.time>1.4)restDialogue();}
   return true;
  }
  if(game.kind==='flight'){
   if(game.time>=9&&!game.departed){game.time=9;game.departed=true;state().chapter2.flightComplete=true;api.save();api.transition('hotel',undefined,undefined,undefined,5);}return true;
  }
  if(game.grace>0){game.grace-=dt;setText(value,'准备好，一起继续…');return true;}
  if(game.kind==='pink'){
   if(missSwing(game,previousTime))api.toast('错过精准时机，连续次数归零。');
   const ready=swingWindow(game.time)&&game.lastCycle!==Math.floor(game.time/(SWING_PERIOD/2));setText(value,`连续精准 ${game.streak} / 10 · ${ready?'现在！':'等待左右端点'}`);hitButton.classList.toggle('ready',ready);hitButton.disabled=false;return true;
  }
  if(game.kind==='fish'){
   const d=direction(),keyboard=d.x||d.y;
   if(keyboard){target={x:game.net.x+d.x*110,y:game.net.y+d.y*110};}
   target.x=Math.max(230,Math.min(870,target.x));target.y=Math.max(235,Math.min(490,target.y));
   if(active||keyboard)advanceNet(game.net,target,dt);
   stepFish(game.fish,dt,game.time,game.net);
   game.caught+=catchFish(game.fish,game.net,active||keyboard);
   setText(value,`已捞到 ${Math.min(3,game.caught)} / 3 条小鱼`);
   if(game.caught>=3)finish('aquarium');return true;
  }
  if(game.kind==='ice'){
   if(game.stage==='intro')return true;
   if(game.stage==='lead'){game.x=230+150*Math.min(1,game.time/2);setText(value,'Ivan 牵着你，慢慢进入冰场…');if(game.time>=2){game.stage='play';game.time=0;target={x:game.x,y:game.y};}return true;}
   if(game.fall>0){game.fall-=dt;setText(value,'重新站稳 · 计时归零');if(game.fall<=0){game.x=380;game.y=490;game.invulnerable=2;game.samples=[];target={x:380,y:490};for(const o of game.others)if(o.x<650)o.x+=800;}return true;}
   game.invulnerable=Math.max(0,game.invulnerable-dt);
   const result=advanceIce(game,dt,{direction:direction(),target,active});
   if(result==='fall'){fall();return true;}
   setText(value,`平稳滑行 ${Math.floor(game.safe)} / 45 秒`);
   if(result==='win'){if(!talking)finish('ice');return true;}
   if(game.safe>=30&&!state().chapter2.spoken.ice30){talkOnce('ice30');return true;}
   if(game.safe>=10&&!state().chapter2.spoken.ice10)talkOnce('ice10');return true;
  }
  return false;
 }
 function text(ctx,str,x,y,size=18,color='#4f554e'){ctx.fillStyle=color;ctx.font=`${size}px "Microsoft YaHei",sans-serif`;ctx.textAlign='center';ctx.fillText(str,x,y);}
 function round(ctx,x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
 function pair(ctx,x,y,{seated=false,height=135,tilt=0,moving=false}={}){drawCharacter(ctx,'heroine',x-30,y,{height,seated,tilt,moving,time:clock});drawCharacter(ctx,'ivan',x+34,y,{height:height+4,seated,face:-1,tilt:-tilt,moving,time:clock});}
 function fishSprite(ctx,f,size=42){drawProp(ctx,'barb-v1',f.x,f.y+size/2,{height:size,face:f.vx<0?-1:1});}
 function draw(ctx,time,{preview=false}={}){
  const scene=state().scene;if(!CHAPTER2_SCENES.includes(scene))return false;
  drawBackground(ctx,scene,time);
  if(scene==='room2'){
   for(const p of points())drawMarker(ctx,p.x,p.y,Math.hypot(state().x-p.x,state().y-p.y)<85,time);
   api.drawLobby(ctx,time);
   label(ctx,`我们的日历  ${countTrips(state())} / 3`,100,175);
   for(const p of points())label(ctx,p.label,p.x,p.y-35);return true;
  }
  if(scene==='travel'){
   // Match the original painted lane's slope; paint before the car for occlusion.
   const phase=(time*220)%350;
   ctx.save();ctx.strokeStyle='#fff2d6bb';ctx.lineWidth=4;
   for(let x=-350-phase;x<1100;x+=350){ctx.beginPath();ctx.moveTo(x,474+x*.032);ctx.lineTo(x+235,474+(x+235)*.032);ctx.stroke();}
   ctx.restore();
   const x=740+Math.sin(time*.5)*8;drawProp(ctx,'car-couple-v2',x,535+Math.sin(time*12)*.6,{height:165});return true;
  }
  if(scene==='airport'){
   const progress=game?.departed?1:Math.min((game?.time||0)/9,1),x=240+progress*1100,y=520-Math.pow(Math.max(0,(progress-.25)/.75),1.5)*440;
   ctx.save();ctx.translate(x,y);ctx.rotate(-Math.max(0,progress-.25)*.2);drawProp(ctx,'plane-v1',0,0,{height:150});ctx.restore();label(ctx,'下一站，新的旅程。',550,560);return true;
  }
  if(scene==='hotel'){pair(ctx,550,500);return true;}
  const rest=game?.stage==='rest';
  if(scene==='pink'){
   drawProp(ctx,'swingframe-v1',550,510,{height:437});
   if(rest){
    ctx.save();ctx.translate(550,105);ctx.scale(1.15,1.15);ctx.strokeStyle='#92744a';ctx.lineWidth=4;for(const x of [-80,80]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,270);ctx.stroke();}round(ctx,-99,258,198,16,5,'#ae794f');ctx.restore();
    // Walk in front of the swing support, then approach the bench from the sand.
    const t=game.time;
    let x,y;
    if(t<.8){x=550;y=456+79*t/.8;}
    else if(t<3.2){x=550+430*(t-.8)/2.4;y=535;}
    else{x=980;y=535-125*Math.min(1,(t-3.2)/.8);}
    const spacing=35-10*Math.max(0,Math.min(1,(t-3.2)/.8)),seatY=y+(t>=4?15:0);
    drawCharacter(ctx,'heroine',x-spacing,seatY,{height:t>=4?150:145,seated:t>=4,moving:t<4,face:t>=4?-1:1,time});
    drawCharacter(ctx,'ivan',x+spacing,seatY+5,{height:t>=4?150:145,seated:t>=4,moving:t<4,face:t>=4?-1:1,time});
   }
   else{
    const phase=(game?.time??time)/SWING_PERIOD*Math.PI*2,amplitude=.16+(game?.streak||0)*.022,angle=Math.sin(phase)*amplitude;
    ctx.save();ctx.translate(550,105);ctx.scale(1.15,1.15);ctx.rotate(angle);ctx.strokeStyle='#92744a';ctx.lineWidth=4;for(const x of [-80,80]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,270);ctx.stroke();}round(ctx,-99,258,198,16,5,'#ae794f');pair(ctx,0,305,{seated:true,height:143});ctx.restore();
    if(!preview){const ready=game&&!api.blocked()&&swingWindow(game.time)&&game.grace<=0&&game.lastCycle!==Math.floor(game.time/(SWING_PERIOD/2));label(ctx,ready?'✦ 精准时机 · 现在点击':'跟随秋千的节奏',550,65,{active:ready});}
   }return true;
  }
  if(scene==='aquarium'){
   // Rear center display tank; keep fish above its stone sill and inside the glass.
   ctx.save();ctx.beginPath();ctx.roundRect(457,87,187,154,12);ctx.clip();ctx.globalAlpha=.85;
   for(let i=0;i<2;i++){
    const phase=time*.24+i*2.4,height=i===0?43:39;
    drawProp(ctx,i===0?'grouper-v1':'reef-shark-v1',550+Math.sin(phase)*27,133+i*63+Math.sin(time*.5+i)*5+height/2,{height,face:Math.cos(phase)<0?-1:1});
   }
   ctx.restore();
   // Outer tank glass only: rock sills begin below y=270 in aquarium-v2.
   for(const left of [0,915]){
    ctx.save();ctx.beginPath();ctx.rect(left,40,185,220);ctx.clip();ctx.globalAlpha=.85;
    for(let i=0;i<2;i++){
     const phase=time*.28+i*2.1+left*.003,height=i===0?46:42;
     drawProp(ctx,i===0?'grouper-v1':'reef-shark-v1',left+92+Math.sin(phase)*25,115+i*85+Math.sin(time*.5+i)*7+height/2,{height,face:Math.cos(phase)<0?-1:1});
    }
    ctx.restore();
   }
   if(game?.kind==='fish'&&!rest){
    ctx.fillStyle='#061525cc';ctx.fillRect(0,150,1100,430);round(ctx,193,196,714,330,65,'#34465c');round(ctx,210,213,680,295,52,'#23657c');
    ctx.save();ctx.beginPath();ctx.roundRect(215,217,670,285,45);ctx.clip();for(let i=0;i<12;i++){ctx.strokeStyle='#e1fbff33';ctx.beginPath();ctx.ellipse(260+i*49,315+Math.sin(time+i)*65,42,11,0,0,Math.PI*2);ctx.stroke();}for(const f of game.fish)if(!f.caught)fishSprite(ctx,f,12.6);ctx.restore();
    const n=game.net;ctx.strokeStyle='#e8dbb9';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(n.x+11.2,n.y+9.6);ctx.lineTo(n.x+40,n.y+40);ctx.stroke();ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(n.x,n.y,20,16,0,0,Math.PI*2);ctx.fillStyle=active?'#fff8df44':'#fff8df18';ctx.fill();ctx.stroke();ctx.lineWidth=1;ctx.save();ctx.beginPath();ctx.ellipse(n.x,n.y,17.6,13.6,0,0,Math.PI*2);ctx.clip();for(let i=-30;i<=30;i+=9){ctx.beginPath();ctx.moveTo(n.x+i,n.y-30);ctx.lineTo(n.x+i,n.y+30);ctx.moveTo(n.x-35,n.y+i);ctx.lineTo(n.x+35,n.y+i);ctx.stroke();}ctx.restore();
   }else{if(!rest)for(const p of points())drawMarker(ctx,p.x,p.y,Math.hypot(state().x-p.x,state().y-p.y)<85,time);drawCharacter(ctx,'ivan',650,440,{height:135,face:-1,time});drawCharacter(ctx,'heroine',rest?520:state().x,rest?440:state().y,{height:135,time,moving:!rest&&api.isMoving()});if(!rest)for(const p of points())label(ctx,p.label,p.x,p.y-30);}
   return true;
  }
  if(scene==='ice'){
   const g=game?.kind==='ice'?game:null;
   const others=g?.others||[];
   const cast=others.map(o=>({y:o.y,draw:()=>drawProp(ctx,o.model||'skater-v1',o.x,o.y,{height:120,face:o.model==='skater-male-v1'?1:-1})}));
   const restPose=rest?iceRestPose(game.time,game.from):null;
   cast.push({y:restPose?.y||g?.y||480,draw:()=>{if(restPose){
    for(const [who,offset] of [['heroine',-25],['ivan',25]])drawCharacter(ctx,who,restPose.x+offset,restPose.y,{height:120,seated:restPose.seated,moving:!restPose.seated,face:restPose.seated?-1:restPose.face,time:game.time});
    return;
   }ctx.save();ctx.translate(g?.x||380,g?.y||480);if(g?.fall>0)ctx.rotate(.85);drawProp(ctx,'skating-pair-v1',0,0,{height:132});ctx.restore();}});
   cast.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());return true;
  }
  return true;
 }
 return {enter,points,update,draw,clear,hit,locked:()=>!!game||['travel','airport'].includes(state().scene),owns:scene=>CHAPTER2_SCENES.includes(scene)};
}
