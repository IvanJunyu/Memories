const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export const METRO_DURATION=16;
export function metroPose(time){
 const blink=(start,close,hold,open)=>{
  const t=time-start;
  if(t<0||t>close+hold+open)return 0;
  if(t<close)return smooth(t/close);
  if(t<close+hold)return 1;
  return 1-smooth((t-close-hold)/open);
 };
 return {lean:smooth((time-8)/5),blink:Math.max(blink(3.5,.9,.25,1.1),blink(6.3,1.2,.4,1.3)),sleep:smooth((time-14)/2)};
}
export function taxiFacing(step){return {heroine:step===0?-1:1,ivan:step===4?1:-1};}
export const TAXI_END={run:1.3,board:.8,drive:4,fade:.8,black:3};
export function taxiCarX(step,time){return step<6?850:step===6?850-1200*Math.min(1,time/TAXI_END.drive)**1.4:-350;}
