import {newCombat,ARENA,CAKE_DROP_SECONDS} from './chapter4-combat.js';
import {HALL,MEMORIES} from './chapter4-content.js';
export function newChapter4(){return{x:HALL.start,read:[],complete:false,introSeen:false};}
export function nextMemory(c){return [...MEMORIES].sort((a,b)=>b.x-a.x).find(m=>c.x<=m.x&&!c.read.includes(m.id));}
export function finishHall(c){if(c.x>HALL.end||MEMORIES.some(m=>!c.read.includes(m.id)))return false;c.complete=true;return true;}
export function restoreChapter4(v={}){const c=newChapter4();c.introSeen=v.introSeen===true;c.x=Number.isFinite(v.x)?Math.max(HALL.end,Math.min(HALL.start,v.x)):HALL.start;c.read=MEMORIES.filter(m=>Array.isArray(v.read)&&v.read.includes(m.id)).map(m=>m.id);c.complete=v.complete===true&&c.x<=HALL.end&&c.read.length===MEMORIES.length;if(c.complete){c.y=ARENA.cakeY;c.combat=completedCombat();}return c;}

function completedCombat(){const c=newCombat();c.enemies.forEach(e=>e.hp=0);c.cakeDrop=CAKE_DROP_SECONDS;return c;}
export function completedChapter4(){return {x:HALL.end,y:ARENA.cakeY,read:MEMORIES.map(m=>m.id),complete:true,introSeen:true,combat:completedCombat()};}

