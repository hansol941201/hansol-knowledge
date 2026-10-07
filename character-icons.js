// Original user artwork displayed through isolated SVG viewports.
const CHARACTER_ICONS = [["bear","분홍 곰",8,22,84,78],["dinosaur","공룡",101,22,86,82],["pig","돼지",198,24,83,78],["fork-hair","노란 머리 포크",292,3,99,123],["fork-hat","모자 포크",398,3,103,123],["bonnet","분홍 모자",10,134,88,98],["potato-man","감자 아저씨",107,132,91,101],["potato-woman","감자 아주머니",203,132,88,101],["dog","스프링 강아지",294,136,202,103],["horse","말",8,263,91,96],["cowgirl","카우걸",108,266,94,97],["cowboy","카우보이",208,263,98,101],["astronaut","우주인",308,265,91,96],["fork","포크",404,263,94,107],["rocket","로켓",16,388,85,109],["alien-smile","웃는 외계인",108,397,95,90],["alien-hands","볼 잡은 외계인",212,397,96,91],["alien-glasses","안경 외계인",313,399,94,92],["ball","별 공",417,417,66,73]].map(([id,name,x,y,w,h])=>({id:'character-'+id,name,x,y,w,h}));
function characterIconMarkup(src) {
 const item=CHARACTER_ICONS.find(i=>src==='theme-art/favorite-characters.png#'+i.id);
 if(!item)return '';
 return `<svg class="character-icon" xmlns="http://www.w3.org/2000/svg" viewBox="${item.x} ${item.y} ${item.w} ${item.h}" aria-hidden="true" focusable="false"><image href="theme-art/favorite-characters.png" width="512" height="501" /></svg>`;
}
