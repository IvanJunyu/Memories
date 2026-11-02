// A second finger must be able to shoot while the primary finger holds the stick.
export function installPriorityTouch(button,{enabled,activate}){
 let suppressClick=false;
 button.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='touch'){suppressClick=false;return;}
  if(!enabled()||button.disabled)return;
  suppressClick=true;
  if(event.cancelable)event.preventDefault();
  activate();
 },{capture:true,passive:false});
 button.addEventListener('click',event=>{
  if(suppressClick&&(event.detail>0||event.pointerType==='touch')){
   suppressClick=false;event.preventDefault();event.stopImmediatePropagation();
  }
 },true);
 return ()=>enabled()&&!button.disabled;
}
