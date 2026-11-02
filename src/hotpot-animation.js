export const MEAL_DURATION=8;
export const MEALS={
 haidilao:{item:0,source:[418,202],pots:[[515,200],[585,200]],bowls:[[400,222],[702,222]],size:32},
 coconut:{item:1,source:[445,245],pots:[[520,247],[580,247]],bowls:[[414,267],[692,267]],size:30},
 rotating:{item:2,source:[565,153],pots:[[480,224],[630,224]],bowls:[[419,247],[682,247]],size:32}
};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function foodPose(scene,index,time){
 const m=MEALS[scene],t=time-index*.25;if(!m||t<0||t>=7.5)return null;
 const [sx,sy]=m.source,[px,py]=m.pots[index],[bx,by]=m.bowls[index];
 const mix=(a,b,u)=>a+(b-a)*smooth(u);
 let x=sx,y=sy,alpha=1,scale=1;
 if(t<1)y=mix(sy,sy-75,t);
 else if(t<2){x=mix(sx,px,t-1);y=mix(sy-75,py-80,t-1);}
 else if(t<2.8){x=px;y=mix(py-80,py+8,(t-2)/.8);}
 else if(t<4.5){x=px+Math.sin((t-2.8)*8)*4;y=py+5+Math.sin((t-2.8)*10)*5;}
 else if(t<5.3){x=px;y=mix(py+5,py-80,(t-4.5)/.8);}
 else if(t<6.3){x=mix(px,bx,t-5.3);y=mix(py-80,by-65,t-5.3)-Math.sin((t-5.3)*Math.PI)*12;}
 else {x=bx;y=mix(by-65,by,(t-6.3)/.8);alpha=1-smooth((t-7)/.5);scale=1-.5*smooth((t-6.8)/.7);}
 return {x,y,alpha,scale,submerged:t>=2.8&&t<4.5};
}
