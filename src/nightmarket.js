import {drawProp,label,drawNightPotFront} from './art.js';
import {advanceNight,inOil} from './chapter3-logic.js';
import {LINES} from './chapter3-dialogue.js';
const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
const lerp=(a,b,t)=>a+(b-a)*ease(t);
export const NIGHT={tray:{x:430,y:405},oil:{x:765,y:394},ready:{x:745,y:295},mouth:{x:354,y:200},bottles:{salt:{x:935,y:190},chili:{x:1025,y:230}}};
export function createNightMarket(api){
 let phase='drag',time=0,drag=null,offset={x:0,y:0},skewer={...NIGHT.tray},from={...NIGHT.tray},selected=null;
 const c=()=>api.getState().chapter3;
 const clear=()=>{drag=null;};
 const resetSkewer=()=>{skewer={...(c().nightStep===3?NIGHT.ready:NIGHT.tray)};};
 function resume(){time=0;clear();c().nightSeasoned??={salt:false,chili:false};
  if(c().nightStep>=3){phase='face';skewer={...NIGHT.ready};}
  else if(c().nightStep===2){phase='bottles';skewer={...NIGHT.ready};}
  else{phase='drag';skewer={...NIGHT.tray};}
 }
 function enter(){resume();if(c().nightStep===0){phase='intro';api.say(LINES.nightIntro,()=>{advanceNight(c(),0);api.save();resume();});}}
 function beginFry(){if(phase!=='drag'||c().nightStep!==1||!inOil(skewer))return false;from={...skewer};phase='fry';time=0;clear();api.clearInput();return true;}
 function beginFeed(){if(phase!=='feed'||c().nightStep!==3||Math.hypot((skewer.x-NIGHT.mouth.x)/38,(skewer.y-NIGHT.mouth.y)/33)>1)return false;from={...skewer};phase='eating';time=0;clear();api.clearInput();return true;}
 function season(id){if(phase!=='season'||c().nightSeasoned[id])return;selected=id;phase='pour';time=0;api.clearInput();}
 function down(p,id){if(api.blocked())return;
  if(phase==='season'){for(const [key,b]of Object.entries(NIGHT.bottles))if(Math.abs(p.x-b.x)<36&&p.y>b.y-80&&p.y<b.y+12){season(key);return;}return;}
  if(!['drag','feed'].includes(phase)||Math.abs(p.x-skewer.x)>28||Math.abs(p.y-skewer.y)>80)return;
  drag=id;offset={x:skewer.x-p.x,y:skewer.y-p.y};api.canvas.setPointerCapture(id);
 }
 function move(p,id){if(drag!==id||api.blocked())return;skewer={x:Math.max(40,Math.min(1060,p.x+offset.x)),y:Math.max(80,Math.min(510,p.y+offset.y))};}
 function up(p,id){if(drag!==id)return;if(api.blocked()){cancel();return;}move(p,id);clear();if(!(phase==='drag'?beginFry():beginFeed())){resetSkewer();api.toast(phase==='drag'?'把这一串拖到油锅中间再松手':'把虫子串拖进 Ivan 张开的嘴里');}}
 function cancel(){if(drag!==null){clear();resetSkewer();}}
 function hit(){if(api.blocked())return;if(phase==='drag')beginFry();else if(phase==='feed')beginFeed();}
 function update(dt){if(api.blocked())return true;time+=dt;
  if(phase==='drag'||phase==='feed'){const k=api.keys;skewer.x=Math.max(40,Math.min(1060,skewer.x+((k.has('arrowright')||k.has('d')?1:0)-(k.has('arrowleft')||k.has('a')?1:0))*240*dt));skewer.y=Math.max(80,Math.min(510,skewer.y+((k.has('arrowdown')||k.has('s')?1:0)-(k.has('arrowup')||k.has('w')?1:0))*240*dt));}
  if(phase==='season'){if(api.keys.has('1'))season('chili');else if(api.keys.has('2'))season('salt');}
  if(phase==='fry'&&time>=5){advanceNight(c(),1);api.save();phase='bottles';time=0;skewer={...NIGHT.ready};}
  if(phase==='bottles'&&time>=.9){phase='season';time=0;}
  if(phase==='pour'&&time>=2.8){c().nightSeasoned[selected]=true;api.save();selected=null;time=0;if(c().nightSeasoned.salt&&c().nightSeasoned.chili){advanceNight(c(),2);api.save();phase='face';}else phase='season';}
  if(phase==='face'&&time>=1.2){phase='feed';time=0;}
  if(phase==='eating'&&time>=1){phase='outro';api.say(LINES.nightEnd,()=>{advanceNight(c(),3);api.save();api.done();});}
  return true;
 }
 function paintSkewer(ctx,x,y,{angle=0,scale=1,alpha=1,height=150}={}){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.scale(scale,scale);drawProp(ctx,'bugskewer-v3',0,height/2,{height});ctx.restore();}
 function draw(ctx,t){
  // Tray servings are scenery only; hit testing uses the separate active skewer.
  for(let i=0;i<8;i++)paintSkewer(ctx,135+i*35,407,{angle:.8,height:125});
  const feed=['face','feed','eating','outro'].includes(phase);
  if(feed){const x=phase==='face'?lerp(-160,300,time/1.2):300;drawProp(ctx,'ivan-mouth-v1',x,284,{height:230});}
  let pose={...skewer},angle=0,alpha=1,scale=1;
  if(phase==='fry'){
   if(time<.9){pose={x:lerp(from.x,765,time/.9),y:lerp(from.y,394,time/.9)};angle=lerp(0,-1.15,time/.9);}
   else if(time<4){pose={x:765+Math.sin(t*9)*2,y:394+Math.sin(t*7)*2};angle=-1.15;alpha=.72;}
   else{pose={x:lerp(765,745,time-4),y:lerp(394,295,time-4)};angle=lerp(-1.15,0,time-4);}
  }
  if(phase==='eating'){pose={x:lerp(from.x,NIGHT.mouth.x,time),y:lerp(from.y,NIGHT.mouth.y,time)};scale=1-ease(time);alpha=1-ease(time);}
  if(phase!=='outro')paintSkewer(ctx,pose.x,pose.y,{angle,alpha,scale});
  if(phase==='fry'&&time<4){drawNightPotFront(ctx);ctx.save();for(let i=0;i<24;i++){const x=685+(i*37)%155,y=365+(i*19)%50;ctx.strokeStyle='#ffe4a9aa';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(x,y-Math.sin(t*6+i)*5,2+(i%4),1.5+(i%3),0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
  for(const id of ['salt','chili']){
   const home={x:id==='salt'?1000:1045,y:id==='salt'?320:335},float=NIGHT.bottles[id];let x=home.x,y=home.y,rotation=0;
   if(['bottles','season','pour'].includes(phase)&&!c().nightSeasoned[id]){x=phase==='bottles'?lerp(home.x,float.x,time/.9):float.x;y=phase==='bottles'?lerp(home.y,float.y,time/.9):float.y+Math.sin(t*2)*3;}
   if(phase==='pour'&&selected===id){const u=time<.7?time/.7:time>2.1?1-(time-2.1)/.7:1;x=lerp(float.x,775,u);y=lerp(float.y,205,u);rotation=-2.15*ease(u);}
   ctx.save();ctx.translate(x,y);ctx.rotate(rotation);drawProp(ctx,id==='salt'?'season-salt-v1':'season-chili-v1',0,0,{height:65});ctx.restore();
   if(phase==='season'&&!c().nightSeasoned[id])label(ctx,id==='salt'?'点击盐罐 · 2':'点击辣椒面 · 1',x,y+25);
  }
  if(phase==='pour'&&time>.7&&time<2.1){ctx.save();ctx.fillStyle=selected==='salt'?'#fff8e5':'#c64c20';for(let i=0;i<28;i++){const v=(time*1.8+i/28)%1;ctx.fillRect(720+v*25+(i*17)%12,240+v*100,2.2,2.2);}ctx.restore();}
  const text=phase==='drag'?'1 / 3 · 拖动右侧这一串，放进油锅':phase==='fry'?'正在炸制 · 等待虫子串升起':['bottles','season','pour'].includes(phase)?'2 / 3 · 点击浮起的辣椒面和盐罐，分别撒料':feed?'3 / 3 · 把虫子串拖进 Ivan 嘴里':'';
  if(text)label(ctx,text,550,120);
 }
 return {enter,update,draw,down,move,up,cancel,clear,hit};
}
