import {CORRECT_CAKE,CAKE_ASSETS} from './chapter3-logic.js';
const BG={home:'home-v5',mall:'mall-v3',restaurant:'restaurant-v5',cinema:'cinema-v4',beach:'beach-bench-v6',metro:'metro-clean-v3',taxi:'taxi-street-v4',room2:'room2-v3',travel:'road-v2',pink:'pinkbeach-v2',aquarium:'aquarium-v2',ice:'icerink-v1',airport:'airport-v1',hotel:'hotel-v3',hotpotstreet:'hotpotstreet-v1',haidilao:'haidilao-v2',coconut:'coconut-v1',rotating:'rotating-v1',nightmarket:'nightmarket-v2',cakeshop:'cakeshop-v4',hall:'memory-corridor-v1'};
const SPRITES=['heroine-walk-left-v1','heroine-walk-right-v1','ivan-walk-left-v1','ivan-walk-right-v1','heroine-idle-v3','ivan-idle-v3','heroine-seat-v3','ivan-seat-v4'];
const PROPS={hotpotstreet:['hotpotcrown-worn-v2'],taxi:['taxi-car-v4'],home:['cat-walk-a-v1','cat-walk-b-v1'],hall:[`cake-${CORRECT_CAKE}-v1`,'birthday-candle-v1','heroine-shoot-v2','ivan-shield-v2','memory-ghost-ranged-v1','memory-ghost-melee-v1','memory-ghost-boss-v1'],hotel:['birthday-candle-v1','hotpotcrown-worn-v2','bugskewer-v3','cake-cream-v1'],nightmarket:['bugskewer-v3','ivan-mouth-v1','season-salt-v1','season-chili-v1'],cakeshop:[...Object.values(CAKE_ASSETS),'ivan-carry-v1'],travel:['car-couple-v2'],pink:['swingframe-v1'],aquarium:['barb-v1','grouper-v1','reef-shark-v1'],ice:['skater-v1','skater-male-v1','skating-pair-v1'],airport:['plane-v1']};
const cache=new Map();
function loadOnce(path,trim=false,attempt=0){if(cache.has(path))return cache.get(path).promise;const asset={image:new Image(),ready:false,bounds:null};asset.promise=new Promise(resolve=>{asset.image.onload=()=>{asset.ready=true;asset.bounds={x:0,y:0,w:asset.image.width,h:asset.image.height};if(trim){const c=document.createElement('canvas');c.width=asset.image.width;c.height=asset.image.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(asset.image,0,0);const d=g.getImageData(0,0,c.width,c.height).data;if(path.includes('/memory-ghost-')){asset.alpha=new Uint8Array(c.width*c.height);for(let i=0;i<asset.alpha.length;i++)asset.alpha[i]=d[i*4+3];}
 let l=c.width,r=0,top=c.height,bottom=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){if(d[(y*c.width+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}if(r>=l&&bottom>=top)asset.bounds={x:l,y:top,w:r-l+1,h:bottom-top+1};}resolve(asset);};asset.image.onerror=()=>{asset.failed=true;if(cache.get(path)===asset)cache.delete(path);resolve(asset);};asset.image.src=attempt?`${path}?retry=${Date.now()}-${attempt}`:path;});cache.set(path,asset);return asset.promise;}
async function load(path,trim=false){
 for(let attempt=0;attempt<3;attempt++){
  const asset=await loadOnce(path,trim,attempt);
  if(asset.ready||attempt===2)return asset;
 }
}
export async function prepareScene(scene){const jobs=[...(['haidilao','coconut','rotating'].includes(scene)?[load('./assets/characters/hotpot-food-v1.png')]:[]),...(scene==='cinema'?[load('./assets/backgrounds/romance-film-v2.png')]:[]),load(`./assets/backgrounds/${BG[scene]||BG.home}.png`),...(PROPS[scene]||[]).map(k=>load(`./assets/characters/${k}.png`,true)),...SPRITES.map(k=>load(`./assets/characters/${k}.png`,true))];return (await Promise.all(jobs)).every(a=>a.ready);}
function round(ctx,x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
export function label(ctx,value,x,y,{active=false,done=false}={}){ctx.save();ctx.font='13px "Microsoft YaHei",sans-serif';const w=ctx.measureText(value).width+32;ctx.shadowColor='#34291f38';ctx.shadowBlur=12;round(ctx,x-w/2,y-18,w,30,15,active?'#fae8c9f5':'#fff3dfe8');ctx.shadowBlur=0;ctx.lineWidth=1;ctx.strokeStyle=done?'#779a7d':'#c8a982';ctx.stroke();ctx.fillStyle='#534637';ctx.textAlign='center';ctx.fillText((done?'✓ ':'')+value,x,y+2);ctx.restore();}
export function drawMarker(ctx,x,y,active,t){
 ctx.save();
 const pulse=active?Math.sin(t*4)*2:0,rx=(active?38:32)+pulse,ry=(active?19:16)+pulse*.5;
 ctx.shadowColor='#168dff';ctx.shadowBlur=active?18:9;
 ctx.strokeStyle=active?'#8ce8ff':'#269eff';ctx.lineWidth=active?4:3;
 ctx.fillStyle=active?'#168dff55':'#168dff30';
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;ctx.strokeStyle=active?'#e2faff':'#98dcff';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.ellipse(x,y,rx-6,ry-4,0,0,Math.PI*2);ctx.stroke();
 if(active){ctx.fillStyle='#a9edff';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText('◇',x,y-28-Math.sin(t*4)*3);}
 ctx.restore();
}
export function drawCharacter(ctx,who,x,y,{height=135,face=1,seated=false,moving=false,time=0,tilt=0,shadow=true,pose=null}={}){
 const key=pose==='shoot'&&who==='heroine'?'heroine-shoot-v2':pose==='shield'&&who==='ivan'?'ivan-shield-v2':seated?(who==='ivan'?'ivan-seat-v4':'heroine-seat-v3'):moving?`${who}-walk-${Math.floor(time/.20)%2?'right':'left'}-v1`:`${who}-idle-v3`,a=cache.get(`./assets/characters/${key}.png`);if(!a?.ready)return;
 const b=a.bounds;
 // Both heroine walk frames share a 1024x1536 canvas and matching head position.
 // Anchor to frame one, not each pose's changing skirt/foot silhouette.
 const alignedWalk=who==='heroine'&&(moving||pose==='shoot')&&!seated;
 const unit=height/(alignedWalk?1404:b.h);
 const w=alignedWalk?height*792/1404:height*b.w/b.h;
 const drawX=alignedWalk?(b.x-542)*unit:-w/2;
 const drawY=alignedWalk?(b.y-1450)*unit:-height;
 const drawW=b.w*unit,drawH=b.h*unit;
 if(pose==='shield'){const ref=cache.get('./assets/characters/ivan-walk-left-v1.png')?.bounds;if(ref){const unit=height/ref.h;ctx.save();ctx.translate(x,y);ctx.scale(face===-1?1:-1,1);ctx.drawImage(a.image,b.x,b.y,b.w,b.h,(b.x-ref.x-ref.w/2)*unit,(b.y-ref.y-ref.h)*unit,b.w*unit,b.h*unit);ctx.restore();return;}}
 ctx.save();if(shadow){const g=ctx.createRadialGradient(x,y,1,x,y,w*.46);g.addColorStop(0,'#30201e4d');g.addColorStop(1,'#30201e00');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,w*.5,8,0,0,Math.PI*2);ctx.fill();}
 // Stable pixel alignment avoids idle-only subpixel blur.
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.translate(moving||tilt?x:Math.round(x),moving||tilt?y:Math.round(y));ctx.rotate(tilt);ctx.scale((who==='ivan'?-face:face)<0?-1:1,1);ctx.drawImage(a.image,b.x,b.y,b.w,b.h,alignedWalk?drawX:Math.round(drawX),alignedWalk?drawY:Math.round(drawY),alignedWalk?drawW:Math.round(drawW),alignedWalk?drawH:Math.round(drawH));ctx.restore();
}
export function drawBackground(ctx,scene,time){const a=cache.get(`./assets/backgrounds/${BG[scene]||BG.home}.png`);ctx.fillStyle='#253c3b';ctx.fillRect(0,0,1100,620);if(a?.ready)ctx.drawImage(a.image,0,0,1100,620);else{ctx.fillStyle='#f1d9b6';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText('正在展开这一页回忆…',550,310);}
 // Soft visual movement stays separate from baked scenery.
 if(scene==='beach'){ctx.save();ctx.globalAlpha=.14;ctx.strokeStyle='#fff5dc';ctx.lineWidth=1;for(let i=0;i<8;i++){const x=45+i*48+Math.sin(time*.7+i)*8,y=360+i*24+Math.sin(i*3)*10;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+25,y);ctx.stroke();}ctx.restore();}
 if(scene==='home'||scene==='restaurant'){ctx.save();for(let i=0;i<13;i++){ctx.fillStyle=`rgba(255,239,193,${.12+Math.sin(time+i)*.08})`;ctx.beginPath();ctx.arc(80+(i*83)%880,145+(i*37+time*3)%300,1.2,0,Math.PI*2);ctx.fill();}ctx.restore();}
 const g=ctx.createLinearGradient(0,0,0,145);g.addColorStop(0,'#102c3599');g.addColorStop(1,'#102c3500');ctx.fillStyle=g;ctx.fillRect(0,0,1100,145);
}
export function speechBubble(ctx,value,x,y){ctx.save();ctx.font='16px "Microsoft YaHei",sans-serif';const w=ctx.measureText(value).width+30;ctx.shadowColor='#1c1d2444';ctx.shadowBlur=15;round(ctx,x-w/2,y-36,w,40,10,'#fff1dd');ctx.shadowBlur=0;ctx.fillStyle='#fff1dd';ctx.beginPath();ctx.moveTo(x-6,y+3);ctx.lineTo(x,y+12);ctx.lineTo(x+7,y+3);ctx.fill();ctx.fillStyle='#674c3c';ctx.textAlign='center';ctx.fillText(value,x,y-10);ctx.restore();}

export function drawProp(ctx,key,x,y,{height=100,face=1}={}){const a=cache.get('./assets/characters/'+key+'.png');if(!a?.ready)return;const b=a.bounds,w=height*b.w/b.h;ctx.save();ctx.translate(x,y);ctx.scale(face,1);ctx.drawImage(a.image,b.x,b.y,b.w,b.h,-w/2,-height,w,height);ctx.restore();}

// Original three-shot short, projected only inside the painted cinema screen.
export function drawCinemaFilm(ctx,elapsed){
 const a=cache.get('./assets/backgrounds/romance-film-v2.png');if(!a?.ready)return;
 const time=Math.max(0,Math.min(11.999,elapsed)),shot=Math.floor(time/4),phase=time%4;
 const panel=a.image.width/3,h=a.image.height,zoom=1+phase*.012;
 ctx.save();ctx.beginPath();ctx.moveTo(957,0);ctx.lineTo(1100,64);ctx.lineTo(1091,445);ctx.lineTo(940,230);ctx.closePath();ctx.clip();
 ctx.fillStyle='#101324';ctx.fillRect(935,0,165,450);
 const paint=(index,alpha)=>{
  ctx.globalAlpha=alpha;
  for(let x=940;x<1100;x+=2){
   const u=(x-940)/160,top=(x-957)*.45,bottom=230+(x-940)*1.425;
   ctx.drawImage(a.image,index*panel+(panel-panel/zoom)/2+u*panel/zoom,(h-h/zoom)/2,panel/zoom/80,h/zoom,x,top,2.5,bottom-top);
  }
 };
 const fade=shot>0?Math.min(1,phase/.65):1;
 if(fade<1)paint(shot-1,1);paint(shot,fade);
 ctx.restore();
}

// Repaint the table and flower silhouette above actors walking behind it.
export function drawRestaurantTableForeground(ctx){
 const a=cache.get('./assets/backgrounds/restaurant-v5.png');if(!a?.ready)return;
 ctx.save();ctx.beginPath();ctx.ellipse(551,246,147,40,0,0,Math.PI*2);
 ctx.moveTo(513,270);ctx.lineTo(580,270);ctx.lineTo(580,326);ctx.lineTo(552,350);ctx.lineTo(514,324);ctx.closePath();
 ctx.clip();ctx.drawImage(a.image,0,0,1100,620);ctx.restore();
}

// Coordinates match home-v5 in the 1100 x 620 game canvas.
export function drawHomeTableForeground(ctx){
 const a=cache.get(`./assets/backgrounds/${BG.home}.png`);if(!a?.ready)return;
 ctx.save();ctx.beginPath();
 for(const polygon of [
  [[414,373],[630,373],[633,428],[390,428]],
  [[393,427],[407,427],[405,469],[396,469]],
  [[613,427],[626,427],[624,469],[615,469]],
  [[478,407],[475,385],[481,370],[465,364],[458,350],[466,337],[480,335],[484,321],[498,325],[510,320],[517,333],[534,338],[541,354],[531,367],[516,375],[518,399],[510,409]]
 ]){ctx.moveTo(...polygon[0]);for(const point of polygon.slice(1))ctx.lineTo(...point);ctx.closePath();}
 ctx.clip();ctx.drawImage(a.image,0,0,1100,620);ctx.restore();
}

// Reuse the exact painted railing pixels as a foreground layer. Leave the
// gaps between bars transparent and the central staircase unobstructed.
export function drawMallRailingForeground(ctx){
 const a=cache.get('./assets/backgrounds/mall-v3.png');if(!a?.ready)return;
 ctx.save();ctx.scale(1100/1672,620/941);ctx.beginPath();
 for(const [x,y,w,h] of [
  [0,312,700,12],[976,314,696,11],
  [0,381,699,11],[978,381,694,11],
  [119,310,13,76],[246,319,16,68],[515,319,16,68],[674,320,13,67],
  [983,321,15,66],[1144,321,15,67],[1410,321,15,67],[1526,320,13,67],
  [690,309,17,79],[965,310,17,79]
 ])ctx.rect(x,y,w,h);
 for(const [x,y,r] of [[699,302,8],[973,302,8],[125,301,7]]){ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2);}
 ctx.clip();ctx.drawImage(a.image,0,0,1672,941);ctx.restore();
}

export function drawHallBackground(ctx,camera,length){
 const a=cache.get('./assets/backgrounds/memory-corridor-v1.png');ctx.fillStyle='#080810';ctx.fillRect(0,0,1100,620);if(!a?.ready)return;
 // Map the painted wall and foreground edges onto the existing arena boundaries.
 const w=a.image.width,h=a.image.height;
 for(let i=Math.floor(camera/1100);i<Math.ceil((camera+1100)/1100)&&i*1100<length;i++){
  ctx.save();ctx.translate(i*1100-camera,0);if(i%2){ctx.translate(1100,0);ctx.scale(-1,1);}
  ctx.drawImage(a.image,0,0,w,h*.35,0,0,1100,170);
  ctx.drawImage(a.image,0,h*.35,w,h*.51,0,170,1100,380);
  ctx.drawImage(a.image,0,h*.86,w,h*.14,0,550,1100,70);ctx.restore();
 }
}

export function drawHotpotFood(ctx,item,x,y,size){
 const a=cache.get('./assets/characters/hotpot-food-v1.png');if(!a?.ready)return;
 const w=a.image.width/3,h=a.image.height;
 ctx.drawImage(a.image,item*w,h*.29,w,h*.41,x-size*.7,y-size,size*1.4,size);
}

export function drawBirthdayCandle(ctx,x,y,{height=34,lit=false,time=0}={}){
 drawProp(ctx,'birthday-candle-v1',x,y,{height});if(!lit)return;
 ctx.save();ctx.translate(x,y-height+2);
 const sway=Math.sin(time*3.8)*1.2,h=height*.32+Math.sin(time*5)*.6;
 ctx.shadowColor='#ffbe55';ctx.shadowBlur=16;ctx.fillStyle='#ffc75c';
 ctx.beginPath();ctx.moveTo(0,2);ctx.bezierCurveTo(-5,-1,-3,-h*.6,sway,-h);ctx.bezierCurveTo(3+sway,-h*.5,5,-1,0,2);ctx.fill();
 ctx.shadowBlur=4;ctx.fillStyle='#fff7cf';ctx.beginPath();ctx.moveTo(0,1);ctx.bezierCurveTo(-2,-1,-1,-4,sway*.3,-h*.55);ctx.bezierCurveTo(2,-4,2,-1,0,1);ctx.fill();ctx.restore();
}

// Front glass is composited AFTER the cakes, before the actors and pickup animation.
export function drawCakeCabinetGlass(ctx){
 ctx.save();ctx.beginPath();ctx.rect(180,257,780,94);ctx.clip();
 ctx.fillStyle='#fff3dc09';ctx.fillRect(180,257,780,94);
 ctx.strokeStyle='#fff9e51c';ctx.lineWidth=7;
 for(const x of [280,530,890]){ctx.beginPath();ctx.moveTo(x,258);ctx.lineTo(x-82,348);ctx.stroke();}
 ctx.restore();
 const a=cache.get('./assets/backgrounds/cakeshop-v4.png');if(!a?.ready)return;
 ctx.save();ctx.beginPath();ctx.rect(164,351,818,14);ctx.clip();ctx.drawImage(a.image,0,0,1100,620);ctx.restore();
}

export function drawNightPotFront(ctx){
 const a=cache.get('./assets/backgrounds/nightmarket-v2.png');if(!a?.ready)return;
 ctx.save();ctx.beginPath();ctx.moveTo(592,429);ctx.bezierCurveTo(655,472,888,472,956,429);ctx.lineTo(956,486);ctx.lineTo(592,486);ctx.closePath();ctx.clip();ctx.drawImage(a.image,0,0,1100,620);ctx.restore();
}





// Same trimmed bounds and opacity data used by drawProp.
export function getPropCollisionData(key){const a=cache.get('./assets/characters/'+key+'.png');return a?.ready&&a.alpha?{bounds:a.bounds,width:a.image.width,alpha:a.alpha}:null;} 

