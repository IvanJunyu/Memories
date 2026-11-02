// Replace these draft lines and photo slots with the user's selected memories.
// Photo paths must point to selected publishable copies in assets/memories/.
export const HALL={length:9900,start:9750,end:220};
export const MEMORIES=[
 {id:'begin',x:3300,text:'回头看，那些一起走过的日子，都在这里。',draft:true},
 {id:'together',x:2400,text:'一顿饭，一次出发，一段并肩走过的路。',draft:true},
 {id:'ordinary',x:1500,text:'那些平常的小事，因为有你，变得值得记住。',draft:true},
 {id:'wish',x:600,text:'还有很多风景，想继续和你一起看。',draft:true}
];
// Selected photos in filename order, encountered from right to left.
export const PHOTOS=[
 {id:'photo-1',x:9500,y:77,w:70.5,h:94,src:'./assets/memories/memory-01.jpg'},
 {id:'photo-2',x:8913,y:113,w:68.43,h:94,src:'./assets/memories/memory-165270347ebe4d4a533e6953cb42c2f6.png'},
 {id:'photo-3',x:8327,y:77,w:94,h:94,src:'./assets/memories/memory-1dd55207c85187d3cb745f3e0667ea46.jpg'},
 {id:'photo-4',x:7740,y:113,w:67.45,h:94,src:'./assets/memories/memory-b946d88c4250aada6884c19929cf596b.jpg'},
 {id:'photo-5',x:7153,y:77,w:70.46,h:94,src:'./assets/memories/memory-c1031b5d694c3f32472aba696bd555bb.jpg'},
 {id:'photo-6',x:6567,y:113,w:70.5,h:94,src:'./assets/memories/memory-02.jpg'},
 {id:'photo-7',x:5980,y:77,w:70.5,h:94,src:'./assets/memories/memory-img-0605.jpg'},
 {id:'photo-8',x:5393,y:113,w:70.5,h:94,src:'./assets/memories/memory-03.jpg'},
 {id:'photo-9',x:4807,y:77,w:70.5,h:94,src:'./assets/memories/memory-img-1543.png'},
 {id:'photo-10',x:4220,y:113,w:70.5,h:94,src:'./assets/memories/memory-04.jpg'},
 {id:'photo-11',x:3633,y:77,w:94,h:94,src:'./assets/memories/memory-05.jpg'},
 {id:'photo-12',x:3047,y:113,w:70.5,h:94,src:'./assets/memories/memory-06.jpg'},
 {id:'photo-13',x:2460,y:77,w:70.5,h:94,src:'./assets/memories/memory-07.jpg'},
 {id:'photo-14',x:1873,y:113,w:70.5,h:94,src:'./assets/memories/memory-08.jpg'},
 {id:'photo-15',x:1287,y:77,w:70.5,h:94,src:'./assets/memories/memory-09.jpg'},
 {id:'photo-16',x:700,y:113,w:94,h:94,src:'./assets/memories/memory-10.jpg'},
 {id:'photo-ending',x:150,y:87,w:112.5,h:150,featured:true,src:'./assets/memories/memory-ending-v1.jpg'},
];


// Screen index is measured from the cake/Boss end (left). Each screen is 1100 units.
export const FIXED_ENEMIES=[
 {kind:'melee',screen:7,u:.55,v:.48},
 {kind:'melee',screen:6,u:.48,v:.35},
 {kind:'melee',screen:5,u:.38,v:.26},{kind:'melee',screen:5,u:.40,v:.69},
 {kind:'ranged',screen:4,u:.33,v:.24},{kind:'ranged',screen:4,u:.32,v:.65},
 {kind:'ranged',screen:3,u:.39,v:.40},{kind:'melee',screen:3,u:.60,v:.40},
 {kind:'ranged',screen:2,u:.52,v:.23},{kind:'ranged',screen:2,u:.42,v:.39},{kind:'ranged',screen:2,u:.56,v:.69},{kind:'melee',screen:2,u:.77,v:.46},
 {kind:'ranged',screen:1,u:.47,v:.25},{kind:'ranged',screen:1,u:.35,v:.46},{kind:'ranged',screen:1,u:.34,v:.64},{kind:'ranged',screen:1,u:.46,v:.83},
 {kind:'melee',screen:1,u:.72,v:.40},{kind:'melee',screen:1,u:.75,v:.51},{kind:'melee',screen:1,u:.67,v:.63},
 {kind:'boss',screen:0,u:.45,v:.55}
];
export const RANDOM_SEAMS=[5500,4400,3300,2200,1100];


export const CHAPTER4_INTRO=[
 ['你','我们这是在哪'],
 ['Ivan','不知道啊，周围好黑啊'],
 ['未知','你们居然突破层层回忆来到了这里，看来小看你们之间的默契了'],
 ['未知','没关系，就算这样你们也没法逃脱，你们的回忆马上就是我的盘中餐啦！'],
 ['Ivan','绝对不能坐以待毙，我们得去阻止它！']
];
