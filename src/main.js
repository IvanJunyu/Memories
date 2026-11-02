import {cakeReady} from './chapter4-combat.js';
import {chapterTitle,CHAPTER_TITLE_SECONDS} from './chapter-transition.js';
import {applyChapterCompletion,applyChapter3Destination} from './test-completion.js';
import {METRO_DURATION,metroPose,taxiFacing,TAXI_END,taxiCarX} from './commute.js';
import {createRoomCat} from './cat.js';
import {createFollower} from './follower.js';
import {ENABLE_TEST_NAVIGATION,installTestNavigation} from './test-navigation.js';
import {createChapter4} from './chapter4.js';
import {createChapter3} from './chapter3.js';
import {CHAPTER3_SCENES,taskCount} from './chapter3-logic.js';
import {createChapter2} from './chapter2.js';
import {countTrips,CHAPTER2_SCENES} from './chapter2-logic.js';
import {ARRIVALS,HOTSPOTS,isWalkable,safePosition} from './geometry.js';
import {prepareScene,drawCinemaFilm,drawBackground,drawCharacter,drawProp,drawRestaurantTableForeground,drawHomeTableForeground,drawMallRailingForeground,label,drawMarker,speechBubble} from './art.js';
import {freshState,restore,SAVE_KEY as BASE_SAVE_KEY,countMemories,canEnterMetro,complete} from './state.js';
const chapter2Demo=new URLSearchParams(location.search).get('chapter')==='2';
const chapter3Demo=new URLSearchParams(location.search).get('chapter')==='3';
const chapter4Demo=new URLSearchParams(location.search).get('chapter')==='4';
const jumpChapter=new URLSearchParams(location.search).get('chapter');
const testJump=ENABLE_TEST_NAVIGATION&&new URLSearchParams(location.search).get('testJump')==='1'&&['0','1','2','3','4'].includes(jumpChapter);
const jumpDestination=testJump&&jumpChapter==='3'&&['hotpotstreet','nightmarket','cakeshop'].includes(new URLSearchParams(location.search).get('destination'))?new URLSearchParams(location.search).get('destination'):null;
const jumpComplete=testJump&&new URLSearchParams(location.search).get('complete')==='1';
const SAVE_KEY=testJump?BASE_SAVE_KEY+'-jump-test-'+jumpChapter+(jumpComplete?'-complete':'')+(jumpDestination?'-'+jumpDestination:''):chapter4Demo?BASE_SAVE_KEY+'-chapter4-demo':chapter3Demo?BASE_SAVE_KEY+'-chapter3-demo':chapter2Demo?BASE_SAVE_KEY+'-chapter2-demo':BASE_SAVE_KEY;
const artPreview=new URLSearchParams(location.search).has('art');
const $=id=>document.getElementById(id), canvas=$('world'), ctx=canvas.getContext('2d');
let saved=null;try{saved=restore(localStorage.getItem(SAVE_KEY));}catch{}
let state=freshState(),started=false,paused=false,busy=false,dialogue=null,fadeTime=null,filmTime=null,cinematic=null,t=0,toastUntil=0,nearest=null,restartConfirm=false;
const keys=new Set(),joy={x:0,y:0,id:null},actor={face:1,moving:false}, W=1100,H=620;
const follower=createFollower();
const roomCat=createRoomCat();
prepareScene('home');
const labels={home:['序章 / 一次约定','她的家'],mall:['第一章 / 和你见面','商场'],cinema:['第一章 / 回忆 01','电影院'],restaurant:['第一章 / 回忆 02','餐厅'],beach:['第一章 / 回忆 03','海边'],metro:['旅途 / 回家的路','地铁'],taxi:['旅途 / 一句晚安','出租车旁'],room2:['第二章 / 一起出发','我们的房间'],travel:['第二章 / 一起出发','在路上'],pink:['第二章 / 回忆 01','粉色沙滩'],aquarium:['第二章 / 回忆 02','海洋馆'],ice:['第二章 / 回忆 03','滑冰场'],airport:['第二章 / 下一站','机场'],hotel:['第三章 / 旅行清单','酒店房间'],hotpotstreet:['第三章 / 火锅之旅','火锅街'],haidilao:['第三章 / 火锅之旅','海底捞'],coconut:['第三章 / 火锅之旅','椰子鸡'],rotating:['第三章 / 火锅之旅','旋转火锅'],nightmarket:['第三章 / 夜市冒险','炸虫子小摊'],cakeshop:['第三章 / 甜蜜心意','蛋糕店'],hall:['第四章 / 回忆','回忆长廊']};
const c2=createChapter2({skatingBlocked:()=>!started||paused||busy||document.hidden||artPreview,drawLobby,isMoving:()=>!locked()&&actor.moving,getState:()=>state,save,talk,transition,clearInput,toast,canvas,keys,joy,pause:openMenu,blocked:()=>!started||paused||busy||!!dialogue||document.hidden||artPreview,milestone:()=>show('milestone',true)});
const c3=createChapter3({drawLobby,getFollower:()=>follower.actor,getFacing:()=>actor.face,isMoving:()=>!locked()&&actor.moving,getState:()=>state,save:()=>{save();updateHud();},talk,transition,clearInput,toast,canvas,keys,joy,blocked:()=>!started||paused||busy||!!dialogue||document.hidden||artPreview});
const c4=createChapter4({talk,getState:()=>state,save:()=>{save();updateHud();},clearInput,keys,joy,blocked:()=>!started||paused||busy||!!dialogue||document.hidden||artPreview});
const show=(id,on)=>$(id).classList.toggle('hidden',!on);
function save(){if(artPreview)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));saved=restore(JSON.stringify(state));}catch{toast('当前浏览器无法保存进度，本次仍可继续游玩。');}}
function toast(msg){$('toast').textContent=msg;$('toast').style.opacity=1;toastUntil=t+3;}
function clearInput(){actor.moving=false;c2.clear();c3.clear();keys.clear();joy.x=joy.y=0;joy.id=null;$('stick').style.transform='';}
function locked(){return !started||paused||busy||dialogue||c2.locked()||c3.locked()||c4.locked()||filmTime!==null||cinematic||document.hidden||!$('milestone').classList.contains('hidden');}
function talk(lines,done=()=>{},auto=false){const passive=state.scene==='ice';if(!passive)clearInput();dialogue={lines,index:0,done,auto:auto||passive,passive,remaining:2.6};dialog.classList.toggle('passive',passive);show('dialog',true);drawLine();}
function drawLine(){dialogue.remaining=dialogue.passive?4:2.6;const [name,line]=dialogue.lines[dialogue.index];$('speaker').textContent=name;$('line').textContent=line;}
function next(){if(!dialogue)return;if(++dialogue.index<dialogue.lines.length)drawLine();else{const cb=dialogue.done;dialogue=null;show('dialog',false);cb();}}
$('next').onclick=next;
function transition(scene,x=ARRIVALS[scene][0],y=ARRIVALS[scene][1],after=()=>{},blackHold=0){if(busy)return;clearInput();busy=true;const title=chapterTitle(state.scene,scene);$('chapterTitle').textContent=title;$('chapterTitle').style.opacity=0;$('fade').style.opacity=1;fadeTime={elapsed:0,scene,x,y,after,title,blackHold:Math.max(blackHold,title?CHAPTER_TITLE_SECONDS:0),switched:false,ready:false};const f=fadeTime;prepareScene(scene).then(ok=>{if(ok)f.ready=true;else{fadeTime=null;busy=false;$('chapterTitle').style.opacity=0;$('fade').style.opacity=0;toast('场景加载失败，请刷新重试；进度已保存。');c2.enter(state.scene);c3.enter(state.scene);c4.enter(state.scene);}});}
function setScene(scene,x,y){state.scene=scene;state.x=x;state.y=y;if(scene==='taxi')startTaxi();follower.reset(scene,state.x,state.y);nearest=null;save();updateHud();}
function updateHud(){const [chapter,name]=labels[state.scene];$('chapter').textContent=chapter;$('location').textContent=name;$('progress').textContent=`${CHAPTER2_SCENES.includes(state.scene)?'日历':'回忆'} ${CHAPTER2_SCENES.includes(state.scene)?countTrips(state):countMemories(state)} / 3`;const goals={home:state.phoneRead?'走向大门，去商场见 Ivan':'靠近桌上的手机，查看消息',mall:canEnterMetro(state)?'三段回忆已集齐 · 前往一楼左侧地铁站':'探索三个地点 · 中央楼梯连接两层',cinema:state.movieWatched?'电影看完了 · 从出口离开完成回忆':'靠近 Ivan，一起看电影',restaurant:state.memories.restaurant?'鱼汤回忆已收集 · 可以返回商场':'靠近餐桌，与 Ivan 一起吃饭',beach:state.memories.beach?'海边回忆已收集 · 可以返回商场':'走到长凳前，坐到 Ivan 身边',metro:'',taxi:'',room2:countTrips(state)===3?'三次出行完成 · 走向门口去机场':'查看左侧日历 · 走向左下门口出发',travel:'选择目的地，和 Ivan 一起出发',pink:'秋千左右两端精准点击 · 连续 10 次完成',aquarium:'靠近中央小浴缸，捞起三条小鱼',ice:'平稳滑行 45 秒 · 避开其他人',airport:'',hotel:''};$('objective').textContent=c3.owns(state.scene)?c3.objective():goals[state.scene];if(c3.owns(state.scene))$('progress').textContent=`清单 ${taskCount(state.chapter3)} / 3`;if(state.scene==='hall'){$('progress').textContent='回忆 '+c4.progress();$('objective').textContent=c4.objective();}}
function reward(event,name){const before=countMemories(state);complete(state,event);save();updateHud();if(countMemories(state)>before)toast(`✦ ${name} · 回忆已收集`);}
function points(){if(c3.owns(state.scene))return c3.points();if(c2.owns(state.scene))return c2.points();switch(state.scene){
 case 'home':return [{x:HOTSPOTS.home.phone[0],y:HOTSPOTS.home.phone[1],label:'查看手机',run:()=>talk([['手机','Ivan：哈喽哈咯，好久不见啊！'],['手机','Ivan：我们在商场见吧。']],()=>{complete(state,'phone');save();updateHud();})},{x:HOTSPOTS.home.door[0],y:HOTSPOTS.home.door[1],label:'出门去商场',run:()=>state.phoneRead?transition('mall'):talk([['提示','手机有消息，先看看手机里的消息吧。']])}];
 case 'mall':return [{x:250,y:245,label:'餐厅',sign:[274,52,145],run:()=>transition('restaurant')},{x:825,y:245,label:'电影院',sign:[830,54,155],run:()=>transition('cinema')},{x:885,y:525,label:'海边',sign:[880,323,120],run:()=>transition('beach')},{x:205,y:525,label:canEnterMetro(state)?'进入地铁站':'地铁站 · 尚未解锁',sign:[216,326,120],run:()=>canEnterMetro(state)?transition('metro',470,365,startMetro):talk([['地铁站',`还有 ${3-countMemories(state)} 个地方没有去。先去逛逛吧。`]])}];
 case 'cinema':return [{x:HOTSPOTS.cinema.ivan[0],y:HOTSPOTS.cinema.ivan[1],label:state.movieWatched?'坐下和 Ivan 说话':'坐下看电影',run:()=>{
  [state.x,state.y]=HOTSPOTS.cinema.ivan;actor.face=1;
  talk(state.movieWatched?[['提示','电影已经看完啦']]:[['放映室','银幕亮起，一起看看最新的电影吧']],()=>{if(!state.movieWatched){filmTime=0;$('filmCaption').textContent='她：我还以为，你不会来了。';$('filmProgress').value=0;show('film',true);clearInput();}});
  dialogue.cinemaSeated=!state.movieWatched;
 }},{x:HOTSPOTS.cinema.exit[0],y:HOTSPOTS.cinema.exit[1],label:'离开电影院',run:()=>{reward('leaveCinema','一起看电影');transition('mall',825,245);}}];
 case 'restaurant':return [{x:HOTSPOTS.restaurant.table[0],y:HOTSPOTS.restaurant.table[1],label:'坐到桌边',run:()=>{
  [state.x,state.y]=HOTSPOTS.restaurant.table;actor.face=1;
  talk(state.memories.restaurant?[['Ivan','再坐一会儿吧。']]:[['餐厅','你在桌边坐下，看起来是一顿很美味的晚餐，还有一大碗鱼汤'],['Ivan','这个鱼汤很好喝，我给你盛一碗。'],['互动','你端起碗，喝下了鱼汤。']],()=>reward('drinkSoup','一碗鱼汤'));
  dialogue.restaurantSeated=true;
 }},{x:550,y:555,label:'返回商场',run:()=>transition('mall',250,245)}];
 case 'beach':return [{x:HOTSPOTS.beach.ivan[0],y:HOTSPOTS.beach.ivan[1],label:'坐到 Ivan 身边',run:()=>{
  [state.x,state.y]=HOTSPOTS.beach.ivan;actor.face=-1;
  talk(state.memories.beach?[['Ivan','我们再坐一会儿，看看海吧。']]:[['海边','你在 Ivan 身边坐下，一起看着远处的海。'],['Ivan','海风吹着好舒服~'],['Ivan','月光衬托着你的脸真美~']],()=>{
   [state.x,state.y]=HOTSPOTS.beach.ivan;nearest=null;clearInput();reward('seaDialogueEnd','一起看海');
  });dialogue.beachSeated=true;
 }},{x:HOTSPOTS.beach.exit[0],y:HOTSPOTS.beach.exit[1],label:'沿公园道路返回商场',run:()=>transition('mall',885,525)}];
 case 'room2':return [{x:550,y:395,label:'查看后续计划',run:()=>show('milestone',true)}];default:return [];}}
function interact(){if(dialogue){next();return;}if(c4.locked()){c4.hit();return;}if(c3.locked()){c3.hit();return;}if(c2.locked()){c2.hit();return;}if(locked())return;if(state.scene==='hall'){c4.hit();return;}if(nearest)nearest.run();}
$('action').onclick=interact;
// Handle touchscreen button taps directly so rapid taps cannot become browser zoom.
const buttonTouches=new Map();
$('game').addEventListener('touchstart',e=>{
 for(const touch of e.changedTouches){const button=touch.target.closest?.('button');if(button)buttonTouches.set(touch.identifier,{button,x:touch.clientX,y:touch.clientY});}
},{passive:true});
$('game').addEventListener('touchend',e=>{
 for(const touch of e.changedTouches){const start=buttonTouches.get(touch.identifier);buttonTouches.delete(touch.identifier);if(!start)continue;
  if(e.cancelable)e.preventDefault();
  if(Math.hypot(touch.clientX-start.x,touch.clientY-start.y)>16)continue;
  const end=document.elementFromPoint(touch.clientX,touch.clientY)?.closest('button');
  if(end===start.button&&!end.disabled)end.click();
 }
},{passive:false});
$('game').addEventListener('touchcancel',e=>{for(const touch of e.changedTouches)buttonTouches.delete(touch.identifier);},{passive:true});
$('game').addEventListener('dblclick',e=>{if(e.target.closest?.('button'))e.preventDefault();});

function openMenu(){if(artPreview||!started||busy)return;paused=true;clearInput();show('menu',true);show('returnRoom',c2.owns(state.scene)&&!['room2','hotel','airport'].includes(state.scene)&&!state.chapter2.pending);restartConfirm=false;$('restartNote').textContent='';}
$('menuBtn').onclick=openMenu;$('resume').onclick=()=>{paused=false;show('menu',false);clearInput();};
async function start(newGame){roomCat.reset();state=newGame?freshState():(saved||freshState());if(testJump&&jumpChapter==='1'&&(newGame||!saved)){state.phoneRead=true;state.scene='mall';[state.x,state.y]=ARRIVALS.mall;}if((chapter2Demo||chapter3Demo||chapter4Demo)&&(newGame||!saved)){state.phoneRead=true;state.movieWatched=true;state.memories={cinema:true,restaurant:true,beach:true};state.introComplete=true;state.scene='room2';[state.x,state.y]=ARRIVALS.room2;if(chapter3Demo||chapter4Demo){state.chapter2.places={pink:true,aquarium:true,ice:true};state.chapter2.flightComplete=true;state.scene='hotel';[state.x,state.y]=ARRIVALS.hotel;if(chapter4Demo){state.chapter3={shops:{haidilao:true,coconut:true,rotating:true},nightStep:4,cake:true,candleLit:true,returning:false};state.scene='hall';}}}if(jumpComplete)applyChapterCompletion(state,Number(jumpChapter));if(jumpDestination)applyChapter3Destination(state,jumpDestination);started=true;paused=false;busy=false;filmTime=null;cinematic=null;dialogue=null;fadeTime=null;show('dialog',false);show('film',false);show('milestone',false);show('titleScreen',false);show('menu',false);$('fade').style.opacity=0;clearInput();[state.x,state.y]=safePosition(state.scene,state.x,state.y);follower.reset(state.scene,state.x,state.y);busy=true;const ready=await prepareScene(state.scene);busy=false;if(!ready)toast('部分画面加载失败，请刷新重试');save();updateHud();if(state.scene==='metro')startMetro();c2.enter(state.scene);c3.enter(state.scene);c4.enter(state.scene);}
$('start').onclick=()=>start(true);$('continue').onclick=()=>start(false);show('continue',!!saved);
$('returnRoom').onclick=()=>{paused=false;dialogue=null;show('dialog',false);show('menu',false);clearInput();transition('room2');};
$('restart').onclick=()=>{if(!restartConfirm){restartConfirm=true;$('restartNote').textContent='再次点击“重新开始”会清除本轮进度。';return;}start(true);};
$('again').onclick=()=>{show('milestone',false);openMenu();restartConfirm=true;$('restartNote').textContent='点击“重新开始”确认清除本轮进度。';};$('stay').onclick=()=>show('milestone',false);
$('leaveFilm').onclick=()=>{filmTime=null;show('film',false);transition('mall',825,245);};
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d','W','A','S','D','e','E'].includes(e.key))e.preventDefault();if(['e','E',' '].includes(e.key)&&!e.repeat){if(!paused&&started)interact();}else if(e.key==='Escape'){if(paused)$('resume').click();else openMenu();}else keys.add(e.key.toLowerCase());});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{clearInput();if(started&&!paused)openMenu();});
document.addEventListener('visibilitychange',()=>{clearInput();if(document.hidden&&started){save();if(!busy)openMenu();}});window.addEventListener('resize',()=>{clearInput();if(started&&c2.locked())openMenu();});
const joystick=$('joystick');
function moveJoy(e){if(joy.id!==e.pointerId)return;const r=joystick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,m=Math.hypot(dx,dy),limit=r.width*.32;joy.x=dx/Math.max(limit,m);joy.y=dy/Math.max(limit,m);$('stick').style.transform=`translate(${joy.x*limit}px,${joy.y*limit}px)`;}
joystick.addEventListener('pointerdown',e=>{if(locked()||joy.id!==null)return;joy.id=e.pointerId;joystick.setPointerCapture(e.pointerId);moveJoy(e);});joystick.addEventListener('pointermove',moveJoy);for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,e=>{if(e.pointerId===joy.id)clearInput();});
function walkable(x,y){return isWalkable(state.scene,x,y);}
function update(dt){roomCat.update(dt,state.scene==='home'&&!locked()&&!artPreview);actor.moving=false;t+=dt;if(t>toastUntil)$('toast').style.opacity=0;if(!started||paused||document.hidden||artPreview)return;
 if(fadeTime){const f=fadeTime;f.elapsed+=dt;if(f.title&&!f.switched&&f.elapsed>=.65)$('chapterTitle').style.opacity=1;if(f.elapsed>=.65+(f.blackHold||0)&&f.ready&&!f.switched){f.switched=true;f.elapsed=.65;setScene(f.scene,f.x,f.y);$('chapterTitle').style.opacity=0;$('fade').style.opacity=0;}if(f.switched&&f.elapsed>=1.3){fadeTime=null;busy=false;c2.enter(f.scene);c3.enter(f.scene);c4.enter(f.scene);f.after();}return;}
 if(busy)return;
 if(filmTime!==null){filmTime+=dt;$('filmProgress').value=filmTime;$('filmCaption').textContent=['她：我还以为，你不会来了。','他：答应陪你看的星星，还没看呢。','她：那以后，也一起看吧。'][Math.min(2,Math.floor(filmTime/4))];if(filmTime>=12){filmTime=null;show('film',false);complete(state,'movie');[state.x,state.y]=HOTSPOTS.cinema.ivan;follower.reset('cinema',state.x,state.y);clearInput();save();updateHud();toast('电影结束了，和 Ivan 一起从左下出口离开吧。');}return;}
 if(dialogue&&['pink','ice'].includes(state.scene))c2.update(dt);
 if(dialogue?.auto){dialogue.remaining-=dt;if(dialogue.remaining<=0)next();return;}if(cinematic){updateCinematic(dt);return;}if(dialogue||!$('milestone').classList.contains('hidden'))return;if(c4.update(dt)){
 const hall=state.chapter4;
 nearLabel.textContent=hall.complete?'旅程完成':hall.combat?.dead?'点击互动 · 重新挑战':cakeReady(hall.combat||{})?(hall.x<=220&&Math.abs(hall.y-450)<=55?'点击互动 · 蛋糕':'靠近蛋糕后互动'):hall.combat?.cakeDrop>0?'等待蛋糕落地':'点击互动 · 射击';
 action.disabled=hall.complete;
 return;
 }if(c3.update(dt)||c2.update(dt))return;
 let dx=joy.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=joy.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}const oldX=state.x,oldY=state.y;const speed=150;if(walkable(state.x+dx*dt*speed,state.y))state.x+=dx*dt*speed;if(walkable(state.x,state.y+dy*dt*speed))state.y+=dy*dt*speed;actor.moving=Math.hypot(state.x-oldX,state.y-oldY)>.001;if(dx)actor.face=Math.sign(dx);if(state.scene!=='cinema'||state.movieWatched)follower.update(state.scene,state.x,state.y,dt);
 nearest=points().filter(p=>Math.hypot(p.x-state.x,p.y-state.y)<85).sort((a,b)=>Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y))[0]||null;
 $('nearLabel').textContent=nearest?nearest.label+' · 点击互动':'靠近物件探索';$('action').disabled=!nearest;
 if(Math.floor(t)!==Math.floor(t-dt)&&(dx||dy))save();
}
function startMetro(){cinematic={kind:'metro',time:0,step:0,ivanX:610};clearInput();}
function startTaxi(){cinematic={kind:'taxi',time:0,step:0,ivanX:820,ivanY:510};state.x=750;state.y=510;}
function updateCinematic(dt){if(dialogue)return;const c=cinematic;c.time+=dt;if(c.kind==='metro'){if(c.time>=METRO_DURATION){transition('taxi',750,510);}return;}
 if(c.step===0){state.x=750-Math.min(c.time/2,1)*180;if(c.time>=2){c.step=1;c.time=0;actor.face=1;talk([["你","前面就是我家了，你也快回去吧"],["你","拜拜~"],["Ivan","拜拜~"]],()=>{c.step=2;c.time=0;},true);}}
 else if(c.step===2){c.ivanX=820-Math.min(c.time/.65,1)*205;if(c.time>=.95){c.step=3;c.time=0;}}
 else if(c.step===3){if(c.time>=2.8){c.step=4;c.time=0;}}
 else if(c.step===4){const p=Math.min(c.time/TAXI_END.run,1);c.ivanX=615+p*325;c.ivanY=510-p*100;if(c.time>=TAXI_END.run){c.step=5;c.time=0;}}
 else if(c.step===5){if(c.time>=TAXI_END.board){c.step=6;c.time=0;}}
 else if(c.step===6){if(c.time>=TAXI_END.drive){c.step=7;c.time=0;$('fade').style.opacity=1;}}
 else if(c.step===7){if(c.time>=TAXI_END.fade){c.step=8;c.time=0;}}
 else if(c.step===8){if(c.time>=TAXI_END.black){cinematic=null;complete(state,'introEnd');transition('room2');}}
}
function draw(){
 // Render directly at display density instead of enlarging a 1100px bitmap.
 const rect=canvas.getBoundingClientRect();
 const density=Math.max(1,Math.min(3,Math.min(rect.width/W,rect.height/H)*(window.devicePixelRatio||1)));
 const pixelWidth=Math.round(W*density),pixelHeight=Math.round(H*density);
 if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
 ctx.setTransform(pixelWidth/W,0,0,pixelHeight/H,0,0);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(c4.draw(ctx,t)||c3.draw(ctx,t)||c2.draw(ctx,t,{preview:artPreview}))return;
 drawBackground(ctx,state.scene,t);
 if(state.scene==='cinema')drawCinemaFilm(ctx,filmTime??(state.movieWatched?11.99:0));
 const moving=!locked()&&actor.moving;
 if(started&&!locked())for(const p of points())drawMarker(ctx,p.x,p.y,p===nearest,t);
 if(state.scene==='metro'){
  const mt=cinematic?.kind==='metro'?cinematic.time:0,pose=metroPose(mt);
  drawCharacter(ctx,'ivan',610,520,{height:310,seated:true,face:-1,time:t,shadow:false});
  ctx.save();ctx.translate(490+pose.lean*30,400+pose.lean*20);ctx.rotate(pose.lean*.30);ctx.translate(-490,-400);
  drawCharacter(ctx,'heroine',490,520,{height:300,seated:true,face:1,time:t,shadow:false});ctx.restore();
  label(ctx,mt>3?'慢慢地，困意涌了上来……':'车厢轻轻摇晃。',550,585);
  const black=Math.max(pose.blink,pose.sleep);if(black>0){ctx.save();ctx.fillStyle='black';ctx.globalAlpha=black;ctx.fillRect(0,0,W,H);ctx.restore();}
 }else if(state.scene==='taxi'){
  const taxiStep=cinematic?.step??0,taxiTime=cinematic?.time??0;
  const carX=taxiCarX(taxiStep,taxiTime);
  drawProp(ctx,'taxi-car-v4',carX,395,{height:220});
  drawCharacter(ctx,'heroine',state.x,510,{height:210,face:taxiFacing(cinematic?.step).heroine,time:t,moving:cinematic?.step===0&&cinematic.time<2});
  if(taxiStep<5)drawCharacter(ctx,'ivan',cinematic?.ivanX||820,cinematic?.ivanY||510,{height:218,face:taxiFacing(cinematic?.step).ivan,time:t,moving:(taxiStep===2&&taxiTime<.65)||(taxiStep===4&&taxiTime<1.3)});
  if(taxiStep===3){speechBubble(ctx,'这是还给你的~',cinematic.ivanX,240);ctx.save();ctx.font='30px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f28a9c';ctx.shadowColor='#ffd1dc';ctx.shadowBlur=10;ctx.fillText('♥',(state.x+cinematic.ivanX)/2,273+Math.sin(t*3)*2);ctx.restore();}
 }else{
  const cast=[];if(state.scene==='home'){const cat=roomCat.actor;cast.push(['cat',cat.x,cat.y,{height:62,face:cat.face}]);}if(state.scene==='mall'){const f=follower.actor;cast.push(['ivan',f.x,f.y,{face:f.face,moving:!locked()&&f.moving,height:f.y<280?119:139}]);}
  if(state.scene==='restaurant')cast.push(['ivan',715,370,{seated:true,face:-1,height:210,shadow:false}]);
  if(state.scene==='cinema'){if(state.movieWatched){const f=follower.actor;cast.push(['ivan',f.x,f.y,{face:f.face,moving:!locked()&&f.moving,height:140}]);}else cast.push(['ivan',540,410,{seated:true,face:1,height:130,shadow:false}]);}
  if(state.scene==='beach')cast.push(['ivan',710,320,{face:-1,height:112,seated:true,shadow:false}]);
  const restaurantSeated=state.scene==='restaurant'&&dialogue?.restaurantSeated;
  const cinemaSeated=state.scene==='cinema'&&(filmTime!==null||dialogue?.cinemaSeated);
  const beachSeated=state.scene==='beach'&&dialogue?.beachSeated;
  cast.push(['heroine',restaurantSeated?385:beachSeated?650:cinemaSeated?550:state.x,restaurantSeated?370:beachSeated?300:cinemaSeated?330:state.y,{face:beachSeated?-1:cinemaSeated?1:actor.face,shadow:!restaurantSeated&&!beachSeated&&!cinemaSeated,seated:restaurantSeated||beachSeated||cinemaSeated,height:state.scene==='home'?190:state.scene==='restaurant'?(restaurantSeated?205:215):cinemaSeated?126:beachSeated?108:state.scene==='beach'?116:state.scene==='mall'&&state.y<280?115:135,moving}]);
  cast.sort((a,b)=>a[2]-b[2]);for(const [who,x,y,opts]of cast){if(who==='cat'){const cat=roomCat.actor;drawProp(ctx,cat.moving&&Math.floor(cat.time/.32)%2?'cat-walk-b-v1':'cat-walk-a-v1',x,y,opts);}else drawCharacter(ctx,who,x,y,{...opts,time:t});if(state.scene==='restaurant'&&opts.seated)drawRestaurantTableForeground(ctx);if(state.scene==='home'&&y<385)drawHomeTableForeground(ctx);if(state.scene==='mall'&&y<=280)drawMallRailingForeground(ctx);}
  if(started&&!locked())for(const p of points()){if(state.scene==='mall'){
   const [x,y,width]=p.sign;ctx.save();ctx.font='600 16px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=p===nearest?'#75421e':'#534637';ctx.fillText(p.label,x,y,width);ctx.restore();
  }else if(p===nearest)label(ctx,p.label,p.x,Math.max(95,p.y-145),{active:true});}
 }
}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;update(dt);draw();$('controls').style.visibility=locked()||artPreview?'hidden':'visible';requestAnimationFrame(frame);}updateHud();requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{if(started)save();});


if(artPreview){
 started=true;show('titleScreen',false);$('menuBtn').style.display='none';$('objective').textContent='场景画册 · 可切换查看 · 不影响游戏存档';
 const bar=document.createElement('nav');bar.id='artGallery';bar.innerHTML='<label>场景 <select aria-label="预览场景">'+Object.entries(labels).map(([key,v])=>'<option value="'+key+'">'+v[1]+'</option>').join('')+'</select></label><a href="./">开始游玩 →</a>';document.getElementById('game').append(bar);
 bar.querySelector('select').onchange=async e=>{const scene=e.target.value;await prepareScene(scene);state.scene=scene;c2.enter(scene,{preview:true});c3.enter(scene,{preview:true});c4.enter(scene,{preview:true});[state.x,state.y]=ARRIVALS[scene];follower.reset(scene,state.x,state.y);if(scene==='taxi')state.x=570;updateHud();$('objective').textContent='场景画册 · 可切换查看 · 不影响游戏存档';};
}

// Temporary chapter jump: reload into an isolated test save to reset all active scenes safely.
let testWasPaused=false;
installTestNavigation({open:()=>{testWasPaused=paused;paused=true;clearInput();},close:()=>{paused=testWasPaused;clearInput();}});
if(testJump&&!artPreview)start(true);

function drawLobby(ctx,time,{heroineHeight,ivanHeight,ivanCarry=false,ivanOverlay=null}={}){const f=follower.actor;const moving=!locked()&&actor.moving;const cast=[['ivan',f.x,f.y,{height:ivanHeight??(state.scene==='hotel'?215:state.scene==='room2'?185:139),face:f.face,moving:!locked()&&f.moving}],['heroine',state.x,state.y,{height:heroineHeight??(state.scene==='hotel'?210:state.scene==='room2'?180:135),face:actor.face,moving}]];cast.sort((a,b)=>a[2]-b[2]);for(const [who,x,y,opts]of cast){if(who==='ivan'&&ivanCarry)drawProp(ctx,'ivan-carry-v1',x,y,{height:opts.height,face:-opts.face});else drawCharacter(ctx,who,x,y,{...opts,time});if(who==='ivan')ivanOverlay?.();}}





