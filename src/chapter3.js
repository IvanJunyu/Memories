import {createNightMarket} from './nightmarket.js';
import {MEALS,MEAL_DURATION,foodPose} from './hotpot-animation.js';
import {drawBackground,drawCharacter,drawProp,label,drawMarker,drawHotpotFood,drawBirthdayCandle,drawCakeCabinetGlass} from './art.js';
import {CHAPTER3_SCENES,SHOPS,SHOP_NAMES,CAKES,CAKE_ASSETS,CORRECT_CAKE,hotpotDone,nextTask,taskCount,eatHotpot,advanceNight,chooseCake,canLight,inOil} from './chapter3-logic.js';
import {LINES} from './chapter3-dialogue.js';

export function createChapter3(api){
 const root=document.getElementById('game');
 const panel=document.createElement('section');panel.id='chapter3Panel';panel.className='hidden';panel.setAttribute('aria-label','第三章互动');root.append(panel);
 let mode=null,timer=0,drag=null,skewer={x:320,y:435},acting=false,seated=false,preview=false;
 const state=()=>api.getState(),data=()=>state().chapter3;
 const owns=s=>CHAPTER3_SCENES.includes(s);
 const hide=()=>{panel.classList.add('hidden');panel.replaceChildren();};
 const clear=()=>{drag=null;night.cancel();};
 function button(text,run){const b=document.createElement('button');b.textContent=text;b.onclick=()=>{if(api.blocked()||acting)return;run();};panel.append(b);return b;}
 function heading(title,description=''){panel.replaceChildren();panel.classList.remove('hidden');const h=document.createElement('h2');h.textContent=title;panel.append(h);if(description){const p=document.createElement('p');p.textContent=description;panel.append(p);}}
 function say(lines,done){acting=true;api.clearInput();hide();api.talk(lines,()=>{acting=false;done?.();});}
 function go(scene){hide();mode=null;acting=true;api.transition(scene);}
 function returnHotel(){data().returning=true;api.save();go('hotel');}
 function checklist(){
  if(state().scene!=='hotel'||api.blocked()||mode==='lighting')return;
  mode='checklist';api.clearInput();heading('这一次，一起去…');
  [['火锅',hotpotDone(data())],['夜市',data().nightStep===4],['蛋糕店',data().cake]].forEach(([name,done],i)=>{const p=document.createElement('p');p.className='checklist-row';p.textContent=`${done?'✓':'○'} ${i+1}. ${name}`;panel.append(p);});
  button('收起清单',()=>{hide();mode=null;});
 }
 const night=createNightMarket({...api,say,done:returnHotel});
 const cakeXs=[245,385,525,665,805];
 function pickCake(id){
  if(data().cakeCarried||mode||acting)return;
  if(id!==CORRECT_CAKE){api.toast('总感觉不太对，再选一个吧');return;}
  if(data().nightStep!==4||!hotpotDone(data()))return;
  data().cakeCarried=true;mode='cakePickup';timer=0;api.clearInput();api.save();
 }
 function enter(scene,{preview:artPreview=false}={}){
  clear();hide();panel.classList.remove('compact','cakes');acting=false;mode=null;timer=0;seated=false;preview=artPreview;
  if(preview||!owns(scene))return;
  if(scene==='hotel'){data().returning=false;api.save();}
  if(scene==='hotpotstreet'&&hotpotDone(data())&&!data().crownAwarded){mode='crowning';api.clearInput();}
  if(scene==='nightmarket'){mode='night';night.enter();}
  if(scene==='cakeshop'&&!data().cakeCarried)say(LINES.cakeIntro);
 }
 function eat(shop){if(data().shops[shop]){api.toast('这家已经吃过啦，去看看其他店吧。');return;}mode='dining';timer=0;seated=true;api.clearInput();}
 function light(){if(!canLight(data())||mode)return;mode='lighting';timer=0;api.clearInput();api.toast('烛光亮起，下一页回忆正在展开…');}
 function points(){const s=state().scene;if(mode||acting)return[];
  if(s==='hotel')return [{x:280,y:555,label:'查看桌上清单',labelY:505,run:checklist},{x:990,y:375,label:'出门',labelY:130,run:()=>{const destination=nextTask(data());if(destination)go(destination);else api.toast('清单已完成，去点燃桌上蛋糕的蜡烛吧。');}},...(canLight(data())?[{x:505,y:445,label:'点燃蛋糕蜡烛',run:light}]:[])];
  if(s==='hotpotstreet')return [...SHOPS.map((shop,i)=>({x:[255,575,900][i],y:405,hideLabel:true,label:SHOP_NAMES[shop]+(data().shops[shop]?' ✓':''),run:()=>data().shops[shop]?api.toast('这家已完成，去下一家或从街道出口回酒店。'):go(shop)})),{x:80,y:470,label:hotpotDone(data())?'离开街道 · 回酒店':'出口 · 还没吃完三家',run:()=>hotpotDone(data())?go('hotel'):api.toast('三家不同的火锅都吃过，才能带着王冠回去。')}];
  if(s==='cakeshop')return [...(!data().cakeCarried?CAKES.map(([id],i)=>({x:cakeXs[i],y:465,label:'选择蛋糕',hideLabel:true,labelY:425,run:()=>pickCake(id)})):[]),{x:980,y:545,label:'离开蛋糕店',labelY:500,run:()=>{if(!data().cakeCarried){api.toast('先选好要带回去的蛋糕吧');return;}if(chooseCake(data(),CORRECT_CAKE)){data().cakeCarried=false;returnHotel();}}}];
  if(SHOPS.includes(s))return [{x:{haidilao:300,coconut:305,rotating:340}[s],y:{haidilao:470,coconut:485,rotating:475}[s],labelY:420,label:data().shops[s]?'这家已完成':'和 Ivan 吃火锅',run:()=>eat(s)},{x:920,y:535,label:'返回火锅街',run:()=>go('hotpotstreet')}];
  return[];
 }
 function canvasPoint(e){const r=api.canvas.getBoundingClientRect(),scale=Math.min(r.width/1100,r.height/620);return{x:(e.clientX-r.left-(r.width-1100*scale)/2)/scale,y:(e.clientY-r.top-(r.height-620*scale)/2)/scale};}
 api.canvas.addEventListener('pointerdown',e=>{
  if(api.blocked()||acting)return;const p=canvasPoint(e);
  if(state().scene==='hotel'&&!mode&&p.x>192&&p.x<268&&p.y>395&&p.y<440){checklist();return;}
  if(state().scene==='nightmarket')night.down(p,e.pointerId);
 });
 api.canvas.addEventListener('pointermove',e=>{if(state().scene==='nightmarket')night.move(canvasPoint(e),e.pointerId);});
 api.canvas.addEventListener('pointerup',e=>{if(state().scene==='nightmarket')night.up(canvasPoint(e),e.pointerId);});
 api.canvas.addEventListener('pointercancel',()=>night.cancel());
 api.canvas.addEventListener('lostpointercapture',()=>night.cancel());
 function hit(){if(api.blocked()||acting)return;if(state().scene==='nightmarket')night.hit();}
 function update(dt){
  if(!owns(state().scene))return false;
  if(mode==='checklist'||acting)return true;
  if(mode==='night')return night.update(dt);
  if(mode){timer+=dt;
   if(mode==='cakePickup'&&timer>=2.4){mode=null;say(LINES.cakeEnd,()=>api.save());}
   if(mode==='crowning'&&timer>=4.5){mode='crownDialogue';say(LINES.crown,()=>{data().crownAwarded=true;mode=null;api.save();api.toast('✦ 火锅王冠 · 戴着它从左侧出口回酒店吧');});}
   if(mode==='dining'&&timer>=MEAL_DURATION){const shop=state().scene;mode='mealDialogue';say(LINES[shop],()=>{eatHotpot(data(),shop);api.save();seated=false;mode=null;if(hotpotDone(data()))api.toast('✦ 火锅王冠解锁！从街道出口返回酒店。');else api.toast('这家吃过啦 · '+SHOPS.filter(k=>data().shops[k]).length+' / 3');});}
   if(mode==='lighting'&&timer>=3){data().candleLit=true;api.save();go('hall');}
   return true;
  }
  return false;
 }
 function draw(ctx,time){const scene=state().scene;if(!owns(scene))return false;drawBackground(ctx,scene,time);const c=data();
  if(scene==='hotel'){
   ctx.save();ctx.translate(230,418);ctx.scale(.8,.6);ctx.rotate(-.08);ctx.fillStyle='#fff4dc';ctx.shadowColor='#543d3244';ctx.shadowBlur=8;ctx.fillRect(-40,-30,80,55);ctx.shadowBlur=0;ctx.fillStyle='#786756';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('旅行清单',0,-10);ctx.fillText('1.  2.  3.',0,10);ctx.restore();
   if(hotpotDone(c)){
    ctx.save();ctx.translate(230,340);
    const shadow=ctx.createRadialGradient(0,-2,2,0,-2,48);shadow.addColorStop(0,'#68481d38');shadow.addColorStop(1,'#68481d00');
    ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(0,-2,48,7,0,0,Math.PI*2);ctx.fill();
    drawProp(ctx,'hotpotcrown-worn-v2',0,0,{height:52});ctx.restore();
   }
   if(c.nightStep===4)for(let i=0;i<3;i++){ctx.save();ctx.translate(275+i*3,349+i*9);ctx.rotate(Math.PI/3);ctx.scale(1,.72);drawProp(ctx,'bugskewer-v3',0,0,{height:82});ctx.restore();}
   if(c.cake){drawProp(ctx,'cake-cream-v1',410,365,{height:98});drawBirthdayCandle(ctx,410,304,{height:44,lit:mode==='lighting'||c.candleLit,time});}
   label(ctx,`旅行清单 ${taskCount(c)} / 3`,230,380);
  }
  if(scene==='hotpotstreet')SHOPS.forEach((s,i)=>label(ctx,SHOP_NAMES[s],[263,581,916][i],[136,134,143][i],{done:c.shops[s]}));
  if(scene==='nightmarket'){night.draw(ctx,time);return true;}
  if(scene==='cakeshop'){
   CAKES.forEach(([id],i)=>{if(id!==CORRECT_CAKE||!c.cakeCarried)drawProp(ctx,CAKE_ASSETS[id],cakeXs[i],345,{height:68});});
   drawCakeCabinetGlass(ctx);
   if(!preview)for(const p of points()){drawMarker(ctx,p.x,p.y,Math.hypot(state().x-p.x,state().y-p.y)<85,time);if(!p.hideLabel)label(ctx,p.label,p.x,p.labelY);}
   const f=api.getFollower?.()??{x:820,y:535,face:-1};
   const hand={x:f.x-18*f.face,y:f.y-111};
   api.drawLobby(ctx,time,{heroineHeight:225,ivanHeight:230,ivanCarry:c.cakeCarried,ivanOverlay:c.cakeCarried&&mode!=='cakePickup'?()=>drawProp(ctx,CAKE_ASSETS[CORRECT_CAKE],hand.x,hand.y,{height:55}):null});
   if(mode==='cakePickup'){
    const u=Math.min(1,timer/2.4),ease=u*u*(3-2*u);
    drawProp(ctx,CAKE_ASSETS[CORRECT_CAKE],525+(hand.x-525)*ease,345+(hand.y-345)*ease-Math.sin(u*Math.PI)*80,{height:68-13*ease});
   }
   return true;
  }
  if(scene==='hall')label(ctx,'回忆长廊 · 照片与文字将在第四章加入',550,220);
  if(!preview)for(const p of points())drawMarker(ctx,p.x,p.y,Math.hypot(state().x-p.x,state().y-p.y)<85,time);
  const seat=SHOPS.includes(scene)&&seated;
  // Foot anchors align each seated sprite's hips with the painted chair cushion.
  const dining={haidilao:{left:300,right:800,y:414,height:270},coconut:{left:305,right:795,y:454,height:270},rotating:{left:340,right:760,y:440,height:270}}[scene];
  if(dining&&!seat){
   api.drawLobby(ctx,time,{heroineHeight:280,ivanHeight:285});
  }else if(dining){
   drawCharacter(ctx,'ivan',seat?dining.right:700,seat?dining.y:525,{height:seat?dining.height+5:285,seated:seat,face:-1,time,shadow:!seat});
   drawCharacter(ctx,'heroine',seat?dining.left:state().x,seat?dining.y:state().y,{height:seat?dining.height:280,seated:seat,face:1,time,shadow:!seat,moving:!mode&&api.isMoving()});
  }else if(scene==='hotel'||scene==='hotpotstreet')api.drawLobby(ctx,time);else {
  drawCharacter(ctx,'ivan',seat?790:scene==='hotel'?830:640,seat?365:scene==='hotel'?485:520,{height:seat?150:140,seated:seat,face:-1,time});
  drawCharacter(ctx,'heroine',seat?300:state().x,seat?365:state().y,{height:seat?145:135,seated:seat,time,moving:!mode&&api.isMoving()});
  }
  if(scene==='hotpotstreet'&&hotpotDone(c)&&(mode==='crowning'||mode==='crownDialogue'||c.crownAwarded)){
   const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
   const alpha=mode==='crowning'?smooth(timer/2):1;
   const descent=mode==='crowning'?smooth((timer-2)/2.5):1;
   ctx.save();ctx.globalAlpha=alpha;
   // Match the head rather than the full sprite's center; the band overlaps the hair.
   const face=api.getFacing?.()??1;
   ctx.translate(state().x+4*face,state().y-124-65*(1-descent));
   ctx.shadowColor='#ffd36a';ctx.shadowBlur=3;
   drawProp(ctx,'hotpotcrown-worn-v2',0,0,{height:24,face});
   ctx.shadowBlur=5;ctx.fillStyle='#fff9d5';
   for(const [i,x,y] of [[0,-17,-11],[1,0,-24],[2,17,-13]]){
    const pulse=Math.max(0,Math.sin(time*2.4+i*2.1))**8;
    if(pulse<.05)continue;
    const r=1+2.3*pulse;ctx.globalAlpha=alpha*pulse;
    ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.28,y-r*.28);ctx.lineTo(x+r,y);ctx.lineTo(x+r*.28,y+r*.28);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.28,y+r*.28);ctx.lineTo(x-r,y);ctx.lineTo(x-r*.28,y-r*.28);ctx.closePath();ctx.fill();
   }
   ctx.restore();
  }
  if(mode==='dining')for(let i=0;i<2;i++){
   const pose=foodPose(scene,i,timer),meal=MEALS[scene];if(!pose)continue;
   ctx.save();ctx.globalAlpha=pose.alpha;
   if(pose.submerged){ctx.beginPath();ctx.rect(pose.x-40,pose.y-60,80,55);ctx.clip();ctx.globalAlpha*=.7;}
   drawHotpotFood(ctx,meal.item,pose.x,pose.y,meal.size*pose.scale);ctx.restore();
  }
  if(!preview)for(const p of points())if(!p.hideLabel)label(ctx,p.label,p.x,p.labelY??p.y-120);
  return true;
 }
 return {owns,enter,points,clear,hit,update,draw,locked:()=>owns(state().scene)&&(!!mode||acting),objective:()=>state().scene==='hotel'?(taskCount(data())===3?'靠近桌上的蛋糕 · 亲手点燃蜡烛':'查看桌上清单 · 从右侧门口出发'):state().scene==='hotpotstreet'?'分别进店吃一次火锅 · 全部完成后从左侧出口回酒店':state().scene==='cakeshop'?(data().cakeCarried?'Ivan 已拿好蛋糕 · 到右下角门口互动离开':'走到蛋糕前的蓝圈 · 点击互动选择'):state().scene==='hall'?'第三章完成 · 回忆长廊入口':'跟随场景提示，和 Ivan 一起完成这次回忆'};
}
