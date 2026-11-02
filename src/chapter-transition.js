const TITLES={ 'home:mall':'第一章', 'taxi:room2':'第二章', 'airport:hotel':'第三章', 'hotel:hall':'第四章' };
export function chapterTitle(from,to){return TITLES[`${from}:${to}`]||'';}
export const CHAPTER_TITLE_SECONDS=2;
