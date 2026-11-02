// Scene geometry is defined in the same 1100 x 620 space as the painted backgrounds.
export const ARRIVALS={home:[530,530],mall:[550,550],cinema:[170,550],restaurant:[550,535],beach:[880,185],metro:[480,470],taxi:[690,505],room2:[380,490],travel:[550,500],pink:[550,500],aquarium:[550,535],ice:[550,500],airport:[550,500],hotel:[750,460],hotpotstreet:[550,520],haidilao:[930,535],coconut:[930,535],rotating:[930,535],nightmarket:[550,520],cakeshop:[950,535],hall:[950,510]};
export const HOTSPOTS={home:{phone:[580,500],door:[895,280]},mall:{restaurant:[250,245],cinema:[825,245],beach:[885,525],metro:[205,525]},cinema:{ivan:[600,305],exit:[130,550]},restaurant:{table:[330,390],exit:[550,555]},beach:{ivan:[650,320],exit:[900,120]},room2:{calendar:[215,350],door:[200,550]},aquarium:{tub:[550,425],exit:[920,530]}};
export function isWalkable(scene,x,y){
 if(scene==='beach'){
  // Stone platform and upper-right road, traced against beach-bench-v6.
  const inside=polygon=>{let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
   const [ax,ay]=polygon[i],[bx,by]=polygon[j];
   if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;
  }return hit;};
  // Include the backrest and arms, not just the seat/legs. Test an
  // 18 x 10 foot ellipse against every edge so the actor has real volume.
  const bench=[[610,225],[645,200],[775,235],[770,280],[765,322],[725,325],[605,280],[605,245]];
  if(inside(bench))return false;
  for(let i=0;i<bench.length;i++){
   const a=bench[i],b=bench[(i+1)%bench.length];
   const ax=(a[0]-x)/18,ay=(a[1]-y)/10;
   const dx=(b[0]-a[0])/18,dy=(b[1]-a[1])/10;
   const t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy)));
   if((ax+t*dx)**2+(ay+t*dy)**2<=1)return false;
  }
  return inside([[360,180],[485,155],[800,155],[835,165],[940,225],[1010,245],[935,440],[400,220]])||inside([[815,180],[825,105],[980,35],[1005,65],[950,180],[940,225]]);
 }
 if(x<65||x>1035||y<225||y>570)return false;
 if(scene==='hotel')return y>=545||(x>=490&&y>=365)||(x>=900&&y>=325);
 if(['haidilao','coconut','rotating'].includes(scene))return y>=465;
 // Keep feet on pavement and clear of foreground plants and lanterns.
 if(scene==='hotpotstreet')return y>=400&&(y<=510||(x>=260&&x<=865));
 if(scene==='cakeshop')return y>=450;
 if(scene==='hall')return y>=465;
 if(scene==='mall')return(y>=505)||(y>=235&&y<=260)||(x>=475&&x<=625&&y>=245&&y<=525);
 if(scene==='room2'){if(x>=290&&x<=345&&y>=500)return false;return (y>=465&&x>=100)||(x>=205&&x<=560&&y>=310);}
 if(scene==='aquarium')return y>=405;
 if(scene==='home'){
  // Digital piano and its bench along the right wall.
  if(x>=975&&y<=355)return false;
  if(x>=925&&x<=1015&&y>=225&&y<=325)return false;
  // Keep the floor strip between the bed and table open on both sides.
  if(x>=375&&x<=650&&y>=385&&y<=480)return false;
  return y>=400||(x>=310&&x<=990&&y>=350)||(x>=790&&x<=970&&y>=270);
 }
 if(scene==='cinema')return (x>=125&&x<=990&&y>=515)||(x>=585&&x<=715&&y>=225)||(x>=460&&x<=715&&y>=445);
 if(scene==='restaurant')return y>=385;
 return y>=385;
}
export function safePosition(scene,x,y){return isWalkable(scene,x,y)?[x,y]:(ARRIVALS[scene]||ARRIVALS.home);}
