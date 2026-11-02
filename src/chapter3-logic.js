export const SHOPS=['haidilao','coconut','rotating'];
export const SHOP_NAMES={haidilao:'海底捞',coconut:'椰子鸡',rotating:'旋转火锅'};
export const CHAPTER3_SCENES=['hotel','hotpotstreet',...SHOPS,'nightmarket','cakeshop','hall'];
// Whole cream cake reconstructed from the supplied personal cake reference.
export const CAKES=[['strawberry','草莓'],['chocolate','巧克力'],['cream','奶油碎屑'],['blueberry','蓝莓'],['matcha','抹茶']];
export const CORRECT_CAKE='cream';
export function newChapter3(){return {shops:{haidilao:false,coconut:false,rotating:false},nightStep:0,nightSeasoned:{salt:false,chili:false},cake:false,cakeCarried:false,candleLit:false,returning:false,crownAwarded:false};}
export const hotpotDone=c=>SHOPS.every(k=>c.shops[k]===true);
export const taskCount=c=>Number(hotpotDone(c))+Number(c.nightStep===4)+Number(c.cake);
export function nextTask(c){return !hotpotDone(c)?'hotpotstreet':c.nightStep<4?'nightmarket':!c.cake?'cakeshop':null;}
export function eatHotpot(c,shop){if(!SHOPS.includes(shop)||c.shops[shop])return false;c.shops[shop]=true;return true;}
export function advanceNight(c,expected){if(!hotpotDone(c)||c.nightStep!==expected||expected>=4)return false;c.nightStep++;return true;}
export function chooseCake(c,id){if(c.nightStep!==4||!hotpotDone(c)||c.cake||id!==CORRECT_CAKE)return false;c.cake=true;return true;}
export function canLight(c){return taskCount(c)===3&&!c.candleLit;}
export function inOil(p){return ((p.x-765)/175)**2+((p.y-394)/90)**2<=1;}
export function restoreChapter3(v={}){const c=newChapter3();for(const k of SHOPS)c.shops[k]=v.shops?.[k]===true;if(hotpotDone(c))c.nightStep=Number.isInteger(v.nightStep)?Math.max(0,Math.min(4,v.nightStep)):0;c.nightSeasoned={salt:c.nightStep>=3||(c.nightStep===2&&v.nightSeasoned?.salt===true),chili:c.nightStep>=3||(c.nightStep===2&&v.nightSeasoned?.chili===true)};c.cake=c.nightStep===4&&v.cake===true;c.cakeCarried=c.nightStep===4&&!c.cake&&v.cakeCarried===true;c.candleLit=taskCount(c)===3&&v.candleLit===true;c.crownAwarded=hotpotDone(c)&&v.crownAwarded===true;c.returning=v.returning===true;return c;}

export const CAKE_ASSETS={cream:'cake-cream-v1',strawberry:'cake-strawberry-v3',chocolate:'cake-chocolate-v3',blueberry:'cake-blueberry-v3',matcha:'cake-matcha-v1'};
