// Temporary testing UI. Set false to remove the button and disable auto-jumps.
export const ENABLE_TEST_NAVIGATION=true;
export function installTestNavigation({open,close}){
 const params=new URLSearchParams(location.search);
 if(!ENABLE_TEST_NAVIGATION||!(params.get('dev')==='1'||params.get('testJump')==='1'))return;
 const root=document.getElementById('game');
 const toggle=document.createElement('button');toggle.id='testChapterButton';toggle.textContent='测试 · 跳章节';toggle.setAttribute('aria-label','测试：跳转章节');
 const panel=document.createElement('section');panel.id='testChapterMenu';panel.className='hidden';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','测试章节选择');
 const card=document.createElement('div');card.className='menu-card';
 const heading=document.createElement('h2');heading.textContent='跳转章节';card.append(heading);
 const note=document.createElement('p');note.textContent='临时测试工具 · 可从章节开头开始，或跳到任务完成、可进入下一章的状态。仅使用独立测试存档。';card.append(note);
 for(const [id,name]of [['0','序章 · 她的家'],['1','第一章 · 商场'],['2','第二章 · 我们的房间'],['3','第三章 · 酒店'],['4','第四章 · 回忆长廊']]){
  const button=document.createElement('button');button.className='test-chapter-option';button.textContent=name;button.onclick=()=>{const url=new URL(location.href);url.search='';url.searchParams.set('chapter',id);url.searchParams.set('testJump','1');location.assign(url.href);};card.append(button);
  const complete=document.createElement('button');complete.className='test-chapter-option';complete.textContent=id==='4'?'第四章已完成 · 查看结局':id==='0'?'序章已完成 · 可出门':`第 ${id} 章任务已完成 · 可进入下一章`;complete.onclick=()=>{const url=new URL(location.href);url.search='';url.searchParams.set('chapter',id);url.searchParams.set('testJump','1');url.searchParams.set('complete','1');location.assign(url.href);};card.append(complete);
 }
 const subheading=document.createElement('p');subheading.textContent='第三章 · 下一次出门';card.append(subheading);
 for(const [id,name]of [['hotpotstreet','火锅街'],['nightmarket','夜市'],['cakeshop','蛋糕店']]){
  const button=document.createElement('button');button.className='test-chapter-option';button.textContent='下一次出门 → '+name;
  button.onclick=()=>{const url=new URL(location.href);url.search='';url.searchParams.set('chapter','3');url.searchParams.set('testJump','1');url.searchParams.set('destination',id);location.assign(url.href);};card.append(button);
 }
 const dismiss=document.createElement('button');dismiss.className='quiet';dismiss.textContent='取消，继续当前游戏';dismiss.onclick=()=>{panel.classList.add('hidden');close();toggle.focus();};card.append(dismiss);
 toggle.onclick=()=>{if(!panel.classList.contains('hidden'))return;open();panel.classList.remove('hidden');dismiss.focus();};
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();dismiss.click();}});
 panel.append(card);root.append(toggle,panel);
}
