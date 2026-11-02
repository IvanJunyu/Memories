import {newChapter4,restoreChapter4} from './chapter4-logic.js';
import {newChapter2,CHAPTER2_SCENES,DESTINATIONS,countTrips} from './chapter2-logic.js';
import {newChapter3,restoreChapter3,CHAPTER3_SCENES,SHOPS,nextTask} from './chapter3-logic.js';
export const SAVE_KEY = 'bao-birthday-v1';
export function freshState(){return {version:1,scene:'home',x:530,y:530,phoneRead:false,movieWatched:false,memories:{cinema:false,restaurant:false,beach:false},introComplete:false,chapter2:newChapter2(),chapter3:newChapter3(),chapter4:newChapter4()};}
export function countMemories(s){return ['cinema','restaurant','beach'].filter(k=>s.memories[k]===true).length;}
export function canEnterMetro(s){return countMemories(s)===3;}
export function complete(s,event){
 if(event==='phone')s.phoneRead=true;
 if(event==='movie')s.movieWatched=true;
 if(event==='leaveCinema'&&s.movieWatched)s.memories.cinema=true;
 if(event==='drinkSoup')s.memories.restaurant=true;
 if(event==='seaDialogueEnd')s.memories.beach=true;
 if(event==='introEnd'&&canEnterMetro(s))s.introComplete=true;
 return s;
}
export function restore(raw){
 try{
  const v=JSON.parse(raw);if(v?.version!==1)return null;
  const s=freshState();
  for(const key of ['phoneRead','movieWatched','introComplete'])s[key]=v[key]===true;
  for(const key of Object.keys(s.memories))s.memories[key]=v.memories?.[key]===true;
  if(s.memories.cinema&&!s.movieWatched)s.memories.cinema=false;
  if(!canEnterMetro(s))s.introComplete=false;
  if(s.introComplete){
   for(const place of DESTINATIONS)s.chapter2.places[place]=v.chapter2?.places?.[place]===true;
   for(const key of ['swing3','swing6','ice10','ice30'])s.chapter2.spoken[key]=v.chapter2?.spoken?.[key]===true;
   if(DESTINATIONS.includes(v.chapter2?.pending))s.chapter2.pending=v.chapter2.pending;
   s.chapter2.flightComplete=countTrips(s)===3&&v.chapter2?.flightComplete===true;
  }
  const scenes=['home','mall','cinema','restaurant','beach','metro','taxi',...CHAPTER2_SCENES,...CHAPTER3_SCENES];
  s.scene=scenes.includes(v.scene)?v.scene:'home';
  if(s.scene!=='home'&&!s.phoneRead)s.scene='home';
  if(['metro','taxi'].includes(s.scene))s.scene=canEnterMetro(s)?'metro':'mall';
  if(CHAPTER2_SCENES.includes(s.scene)&&!s.introComplete)s.scene=s.phoneRead?'mall':'home';
  if(s.introComplete&&v.chapter2?.returning===true)s.scene='room2';
  if(['airport','hotel'].includes(s.scene)&&countTrips(s)!==3)s.scene='room2';
  if(s.scene==='hotel'&&!s.chapter2.flightComplete)s.scene='airport';
  if(s.chapter2.pending)s.scene=s.chapter2.pending;
  if(s.chapter2.flightComplete)s.chapter3=restoreChapter3(v.chapter3);
  if(CHAPTER3_SCENES.includes(s.scene)){
   if(!s.chapter2.flightComplete)s.scene=s.introComplete?(countTrips(s)===3?'airport':'room2'):(s.phoneRead?'mall':'home');
   else if(s.chapter3.candleLit)s.scene='hall';
   else if(s.chapter3.returning)s.scene='hotel';
   else if(s.scene==='hall'&&!s.chapter3.candleLit)s.scene='hotel';
   else if(s.scene!=='hotel'&&s.scene!=='hall'){
    const task=SHOPS.includes(s.scene)?'hotpotstreet':s.scene;
    if(nextTask(s.chapter3)!==task && !(task==='hotpotstreet'&&nextTask(s.chapter3)==='nightmarket'))s.scene='hotel';
   }
  }
  if(s.chapter3.candleLit)s.chapter4=restoreChapter4(v.chapter4);
  s.x=Number.isFinite(v.x)?Math.max(90,Math.min(1010,v.x)):510;
  s.y=Number.isFinite(v.y)?Math.max(205,Math.min(570,v.y)):420;
  return s;
 }catch{return null;}
}
