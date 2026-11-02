import {newChapter3} from './chapter3-logic.js';
import {completedChapter4} from './chapter4-logic.js';
import {ARRIVALS} from './geometry.js';
// Only called from the explicitly enabled, isolated chapter-jump mode.
export function applyChapterCompletion(s,chapter){
 s.phoneRead=true;
 if(chapter>=1){s.movieWatched=true;s.memories={cinema:true,restaurant:true,beach:true};}
 if(chapter>=2){s.introComplete=true;s.chapter2.places={pink:true,aquarium:true,ice:true};s.chapter2.pending=null;s.chapter2.returning=false;}
 if(chapter>=3){s.chapter2.flightComplete=true;s.chapter3={shops:{haidilao:true,coconut:true,rotating:true},nightStep:4,cake:true,candleLit:false,returning:false};}
 if(chapter>=4){s.chapter3.candleLit=true;s.chapter4=completedChapter4();}
 s.scene=['home','mall','room2','hotel','hall'][chapter];
 [s.x,s.y]=ARRIVALS[s.scene];
 return s;
}

export function applyChapter3Destination(s,destination){
 if(!['hotpotstreet','nightmarket','cakeshop'].includes(destination))return s;
 applyChapterCompletion(s,2);s.chapter2.flightComplete=true;s.chapter3=newChapter3();
 if(destination!=='hotpotstreet'){s.chapter3.shops={haidilao:true,coconut:true,rotating:true};s.chapter3.crownAwarded=true;}
 if(destination==='cakeshop')s.chapter3.nightStep=4;
 s.scene='hotel';[s.x,s.y]=ARRIVALS.hotel;return s;
}

