(function(){
'use strict';
/* ========== базовое ========== */
const $=id=>document.getElementById(id);
const TAU=Math.PI*2,SQ3=Math.sqrt(3);
const R_=Math.random,rnd=(a,b)=>a+R_()*(b-a),pick=a=>a[(R_()*a.length)|0],clamp=(v,a,b)=>v<a?a:v>b?b:v;
const hash=(a,b)=>{let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const cv=$('cv');let ctx=cv.getContext('2d');let NOCA=false;
const far=document.createElement('canvas'),fctx=far.getContext('2d');
const near=document.createElement('canvas'),nctx=near.getContext('2d');
let W=1,H=1,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';far.width=Math.max(8,Math.ceil(W/8));far.height=Math.max(8,Math.ceil(H/8));near.width=Math.max(4,Math.ceil(W/14));near.height=Math.max(4,Math.ceil(H/14));}
addEventListener('resize',resize);resize();

/* ========== константы ========== */
const CELL_R=10,HEX=2*CELL_R*0.9/SQ3,DROP_R=14000,WK=DROP_R/7000,GOAL_CELLS=30;
const HDIR=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const hexXY=(q,r)=>[HEX*SQ3*(q+r/2),HEX*1.5*r];
const OBJ=[{m:100,d:220},{m:40,d:550},{m:20,d:1100},{m:10,d:2200}];
const TYPES={
 basic:{ru:'Обычная',hp:10,col:'#c9c2a8',desc:'Простая клетка: здоровье и размер.'},
 flag:{ru:'Жгутиковая',hp:8,col:'#e0c070',app:1,desc:'Жгутик толкает тело. Сзади — полная тяга.'},
 cilia:{ru:'Ресничная',hp:9,col:'#9fd0e0',app:1,desc:'Реснички: быстрый поворот и немного скорости.'},
 pseudo:{ru:'Ложноножка',hp:10,col:'#c8b0e0',app:1,desc:'Заглатывает добычу до ¾ твоего размера.'},
 spike:{ru:'Шип',hp:12,col:'#e08070',app:1,desc:'Колет всех, кого касается.'},
 sting:{ru:'Стрекательная',hp:9,col:'#f0a0d0',app:1,desc:'Стреляет ядовитой нитью в ближайшего врага.'},
 armor:{ru:'Оболочка',hp:30,col:'#a0a8b8',desc:'Втрое прочнее, урон по ней вдвое ниже.'},
 eye:{ru:'Глазок',hp:8,col:'#ff7040',app:1,desc:'Показывает угрозы за краем поля зрения.'},
 chloro:{ru:'Хлоропластная',hp:9,col:'#60c060',desc:'Фотосинтез: биомасса на свету.'},
 mouth:{ru:'Рот',hp:10,col:'#d09060',app:1,desc:'Откусывает от крупной добычи.'},
 slime:{ru:'Слизистая',hp:10,col:'#b0e0c0',desc:'Липкий след замедляет врагов, еда липнет.'},
 vacuole:{ru:'Вакуольная',hp:8,col:'#c0e8ff',desc:'Рывок (Пробел). Больше вакуолей — чаще рывок.'},
 nerve:{ru:'Нервная',hp:8,col:'#ffe070',desc:'+12% скорости и поворота (до 3 клеток).'},
 muscle:{ru:'Мышечная',hp:12,col:'#e06070',desc:'Сильная тяга, тело извивается.'},
 digest:{ru:'Пищеварительная',hp:10,col:'#e0a050',desc:'+30% биомассы от еды.'}
};
const NODES=[
 {id:'adhesion',ru:'Адгезия',grp:'Колония',cost:3,req:[],desc:'Дочерние клетки больше не уплывают, а прилипают — ты становишься колонией. Открывает рост клеток в редакторе.'},
 {id:'fastdiv',ru:'Быстрое деление',grp:'Колония',cost:8,req:['adhesion'],desc:'Новые клетки на 25% дешевле.'},
 {id:'flag',ru:'Жгутик',grp:'Движение',cost:4,req:[],unlock:'flag',desc:'Клетка со жгутиком — мотор тела. Лучше всего ставить сзади.'},
 {id:'cilia',ru:'Реснички',grp:'Движение',cost:4,req:[],unlock:'cilia',desc:'Ковёр ресничек: поворот и немного скорости.'},
 {id:'vacuole',ru:'Сократительная вакуоль',grp:'Движение',cost:7,req:['flag|cilia'],unlock:'vacuole',desc:'Резкий выброс воды — рывок на Пробел.'},
 {id:'flag2',ru:'Двойной жгутик',grp:'Движение',cost:10,req:['flag','adhesion'],desc:'У каждой жгутиковой клетки по два жгутика: +50% тяги.'},
 {id:'flag3',ru:'Винтовой жгутик',grp:'Движение',cost:14,req:['flag2'],desc:'Жгутик вращается спиралью, как пропеллер бактерии: тяга ×2 и +20% к повороту.'},
 {id:'cilia2',ru:'Мерцательный ковёр',grp:'Движение',cost:9,req:['cilia'],desc:'Реснички бьют согласованной волной: их тяга и поворот ×1.6.'},
 {id:'pseudo',ru:'Ложноножки',grp:'Питание',cost:5,req:[],unlock:'pseudo',desc:'Как у амёбы: заглатываешь добычу до ¾ своего размера (без них — до 45%).'},
 {id:'mouth',ru:'Рот',grp:'Питание',cost:8,req:['adhesion'],unlock:'mouth',desc:'Откусывает куски от крупной добычи и сразу их переваривает.'},
 {id:'jaws',ru:'Челюсти',grp:'Питание',cost:10,req:['mouth'],desc:'Твёрдые челюсти, как у коловратки: рот кусает в 1.8 раза сильнее и раскалывает панцири диатомей.'},
 {id:'chloro',ru:'Хлоропласты',grp:'Питание',cost:6,req:[],unlock:'chloro',desc:'Эндосимбиоз с водорослью: на свету клетка сама производит биомассу. Путь к растениям.'},
 {id:'eye2',ru:'Глазок с линзой',grp:'Чувства',cost:9,req:['eye'],desc:'Линза собирает свет: угрозы за краем поля видны в 1.6 раза дальше.'},
 {id:'eye',ru:'Глазок',grp:'Чувства',cost:5,req:[],unlock:'eye',desc:'Светочувствительное пятно, как у эвглены: видишь хищников за краем поля и яркие пятна света.'},
 {id:'membrane',ru:'Оболочка',grp:'Защита и атака',cost:5,req:[],unlock:'armor',desc:'Плотная клеточная стенка: втрое больше прочности, урон по ней вдвое ниже.'},
 {id:'double',ru:'Двойная мембрана',grp:'Защита и атака',cost:8,req:['membrane'],desc:'+30% здоровья всех клеток.'},
 {id:'spike',ru:'Шипы',grp:'Защита и атака',cost:6,req:[],unlock:'spike',desc:'Колют всех, кого касаются. Спереди — для охоты, по бокам — для защиты.'},
 {id:'sharp',ru:'Острые шипы',grp:'Защита и атака',cost:8,req:['spike'],desc:'+60% урона шипов.'},
 {id:'barb',ru:'Зазубренные шипы',grp:'Защита и атака',cost:12,req:['sharp'],desc:'Зазубрины оставляют в ране яд: жертва теряет здоровье ещё 3 секунды.'},
 {id:'slime',ru:'Слизь',grp:'Защита и атака',cost:6,req:['adhesion'],unlock:'slime',desc:'Липкий след замедляет преследователей, мелкая еда липнет к телу сама.'},
 {id:'sting',ru:'Стрекательные клетки',grp:'Защита и атака',cost:12,req:['spike','adhesion'],unlock:'sting',desc:'Как у гидры: выстреливают ядовитой нитью в ближайшего врага.'},
 {id:'regen',ru:'Регенерация',grp:'Древняя ДНК',rare:1,cost:0,req:[],desc:'Раны затягиваются втрое быстрее, даже в бою.'},
 {id:'cystn',ru:'Циста',grp:'Древняя ДНК',rare:1,cost:0,req:[],desc:'Раз в 2 минуты вместо смерти тело сворачивается в прочную цисту и выживает.'},
 {id:'electro',ru:'Электроцит',grp:'Древняя ДНК',rare:1,cost:0,req:[],desc:'Электрический разряд вокруг тела (клавиша Q): бьёт всех рядом, раз в 8 секунд.'},
 {id:'lumin',ru:'Биолюминесценция',grp:'Древняя ДНК',rare:1,cost:0,req:[],desc:'Тело светится: мелкие хищники (до 2.5 раз крупнее тебя) боятся нападать.'},
 {id:'magneto',ru:'Магнитосомы',grp:'Древняя ДНК',rare:1,cost:0,req:[],desc:'Кристаллы магнетита в клетках: голубые стрелки ведут к древним спорам.'},
 {id:'phago',ru:'Фагоцитоз',grp:'Трофеи боссов',rare:1,trophy:1,cost:0,req:[],desc:'Наследство гигантской амёбы: глотаешь добычу почти своего размера (до 90%).'},
 {id:'mastax',ru:'Мастакс',grp:'Трофеи боссов',rare:1,trophy:1,cost:0,req:[],desc:'Челюсти хищной коловратки: каждая клетка на краю тела слабо кусает тех, кого касается.'},
 {id:'nemabat',ru:'Батарея нематоцист',grp:'Трофеи боссов',rare:1,trophy:1,cost:0,req:[],desc:'Наследство старой гидры: стрекательные нити летят дальше и вдвое чаще, а ядро умеет стрелять само.'},
 {id:'parasite',ru:'Проникновение',grp:'Паразитизм',cost:7,req:[],desc:'Путь паразита: нажми R рядом с существом крупнее тебя, чтобы проникнуть внутрь и есть его изнутри. Внутри хищники тебя не видят. Хозяин может быть до уровня «сила хищника + 3».'},
 {id:'hooks',ru:'Крючья',grp:'Паразитизм',cost:8,req:['parasite'],desc:'Цепляешься изнутри: иммунитет хозяина выталкивает тебя вдвое реже.'},
 {id:'stealthP',ru:'Иммунная маскировка',grp:'Паразитизм',cost:10,req:['hooks'],desc:'Хозяин не замечает тебя: высасываешь в 1.5 раза больше, а выталкивает он ещё вдвое реже.'},
 {id:'puppet',ru:'Управление хозяином',grp:'Паразитизм',cost:14,req:['stealthP'],desc:'Как гриб-кордицепс: внутри хозяина ты управляешь его движением.'},
 {id:'spec',ru:'Специализация клеток',grp:'Специализация',cost:10,req:['adhesion'],minCells:6,desc:'Клетки делят работу. Шаг от колонии к настоящему многоклеточному. Открывает три новых типа клеток.'},
 {id:'nerve',ru:'Нервная клетка',grp:'Специализация',cost:8,req:['spec'],unlock:'nerve',desc:'Связывает клетки в сеть: +12% к скорости и повороту за каждую (до 3).'},
 {id:'muscle',ru:'Мышечная клетка',grp:'Специализация',cost:8,req:['spec'],unlock:'muscle',desc:'Сокращается: сильная тяга, тело плывёт волной.'},
 {id:'digest',ru:'Пищеварительная клетка',grp:'Специализация',cost:8,req:['spec'],unlock:'digest',desc:'+30% биомассы от любой еды за каждую клетку.'}
];
const NODE=Object.fromEntries(NODES.map(n=>[n.id,n]));
/* ===== пищевая цепь: уровни существ и «сила хищника» игрока ===== */
const TIER={euglena:1,diatom:1,vorticella:1,egg:1,paramecium:2,nematode:2,didinium:2,heliozoa:3,spiker:3,bell:3,rival:3,rotifer:4,volvox:4,amoeba:4,hydra:5,stentor:5,tardigrade:5,chaos:6,asplanchna:6,oldhydra:6,cyclops:7,daphnia:7};
const ATK_CELLS=['pseudo','spike','mouth','sting'],ATK_NODES=['jaws','sharp','barb','mastax','phago','nemabat'];
function tierOf(e){return TIER[e.sp]||0;}
function predLvl(){if(!D.cnt)return 0;let n=0;for(const t of ATK_CELLS)if(D.cnt[t])n++;for(const id of ATK_NODES)if(hasN(id))n++;return Math.min(6,n);}
const TIER_RU=['','крошечные','мелкие','средние','крупные','огромные','гиганты','чудовища'];
function edibleList(lv){return Object.keys(TIER).filter(k=>TIER[k]===lv&&SP[k]&&!SP[k].notSpecies).map(k=>SP[k].ru);}
function dnaDim(sp){const k=P.killed[sp]||1;return Math.max(0.3,1/(1+0.15*(k-1)));}
for(const n of NODES)if(ATK_NODES.includes(n.id)||['pseudo','spike','mouth','sting'].includes(n.id))n.desc+=' <b>+1 к силе хищника</b>'+(ATK_CELLS.includes(n.id)?' (если клетка есть в теле)':'')+'.';
let DAYK=1,host=null;const DAY_LEN=300;
function calcDay(){const t=((P.stats&&P.stats.time)||0)%DAY_LEN;DAYK=t<200?1:t<220?1-(t-200)/20*0.88:t<280?0.12:0.12+(t-280)/20*0.88;const nt=DAYK<0.5;if(nt!==!!P.nightNow){P.nightNow=nt;if(started&&P.stats.time>5)toast(nt?'<b>Ночь.</b> Солнце над прудом село: фотосинтез почти остановился, хищники охотятся смелее и быстрее. Зато в воде вспыхивают ночесветки — светящаяся еда.':'<b>Рассвет.</b> Свет вернулся — водоросли снова кормят тех, у кого есть хлоропласты.');}}
function isNight(){return DAYK<0.5;}
/* ранения: хищник может оторвать клетку с края тела */
function woundCell(w,a){if(!w||!w.edge||w.core||D.n<4||P.inv>0||host)return;const key=w.q+','+w.r;P.cdmg=P.cdmg||{};P.cdmg[key]=(P.cdmg[key]||0)+a;const thr=TYPES[w.t].hp*2.2*(w.t==='armor'?2:1);if(P.cdmg[key]>=thr){delete P.cdmg[key];biteOff(w);}}
function connectedWithout(q,r){const rest=P.cells.filter(c=>!(c.q===q&&c.r===r));if(!rest.length)return false;const set=new Set(rest.map(c=>c.q+','+c.r));const seen=new Set([rest[0].q+','+rest[0].r]);const st=[rest[0]];while(st.length){const c=st.pop();for(const[dq,dr]of HDIR){const k=(c.q+dq)+','+(c.r+dr);if(set.has(k)&&!seen.has(k)){seen.add(k);st.push({q:c.q+dq,r:c.r+dr});}}}return seen.size===rest.length;}
function biteOff(w){if(!connectedWithout(w.q,w.r))return;const i=P.cells.findIndex(c=>c.q===w.q&&c.r===w.r);if(i<=0)return;const c=P.cells.splice(i,1)[0];const tm=hasN('regen')?10:24;P.lost=P.lost||[];P.lost.push({q:c.q,r:c.r,t:c.t,time:tm,max:tm});
 spawnFood(w.wx,w.wy,'detritus',3);derive();P.hurt=0.5;pop(w.wx,w.wy,'Клетка оторвана!','#ff8a7a');
 if(!P.hintsDone.wound){P.hintsDone.wound=1;toast('<b>Хищник оторвал клетку!</b> Она отрастёт через '+tm+' с, если ты сыт. Ценные клетки прячь в центр тела, а по краям ставь оболочку — её оторвать вдвое труднее.');}}
function regrowTick(dt){if(P.cdmg)for(const k in P.cdmg){P.cdmg[k]-=dt*0.6;if(P.cdmg[k]<=0)delete P.cdmg[k];}
 if(!P.lost||!P.lost.length)return;for(const L of P.lost){if((P.sat||0)>0.15)L.time-=dt;}const set=new Set(P.cells.map(c=>c.q+','+c.r));let ch=false;
 P.lost=P.lost.filter(L=>{if(L.time>0)return true;if(set.has(L.q+','+L.r))return false;const nb=HDIR.some(([dq,dr])=>set.has((L.q+dq)+','+(L.r+dr)));if(!nb)return true;P.cells.push({q:L.q,r:L.r,t:L.t});set.add(L.q+','+L.r);ch=true;return false;});
 if(ch){derive();pop(P.x,P.y-D.R-8,'Клетка отросла','#9fe0a0');}}
function restoreLost(){if(!P.lost||!P.lost.length)return;const set=new Set(P.cells.map(c=>c.q+','+c.r));for(const L of P.lost)if(!set.has(L.q+','+L.r)){P.cells.push({q:L.q,r:L.r,t:L.t});set.add(L.q+','+L.r);}P.lost=[];derive();}
/* паразитизм */
function hostOk(e){const s=SP[e.sp];return s&&!s.kind&&!e.boss&&!e.rival&&!e.ally&&e.sp!=='cyclops'&&e.sp!=='daphnia'&&e.sp!=='egg'&&!e.dead&&!e.eaten&&e.r>D.R*1.2&&tierOf(e)<=D.pl+3;}
function tryInfest(){if(!started||paused||editorOpen)return;if(host){leaveHost(false,true);return;}if(!hasN('parasite'))return;
 let best=null,bd=1e9;for(const e of ents){if(!hostOk(e))continue;const d=Math.hypot(e.x-P.x,e.y-P.y)-e.r-D.R;if(d<25&&d<bd){bd=d;best=e;}}
 if(!best){toast('Рядом нет подходящего хозяина: нужно существо крупнее тебя, не выше уровня '+(D.pl+3)+'. Подплыви вплотную.');return;}
 host=best;best.infested=true;P.hostT=0;toast('Ты внутри: <b>'+SP[best.sp].ru+'</b>. Питаешься им изнутри, хищники тебя не видят. R — выйти.');}
function leaveHost(dead,manual){const e=host;host=null;if(!e)return;e.infested=false;const a=rnd(0,TAU);P.x=e.x+Math.cos(a)*(e.r+D.R+4);P.y=e.y+Math.sin(a)*(e.r+D.R+4);P.vx=Math.cos(a)*60;P.vy=Math.sin(a)*60;P.inv=Math.max(P.inv,1.2);
 if(dead)toast('Хозяин истощён и погиб — ты выбираешься наружу сытым.');else if(!manual)toast('Иммунитет хозяина вытолкнул тебя наружу!');}
function hostTick(dt){const e=host;if(!e||e.dead||e.eaten){if(e&&e.dead)leaveHost(true);else{host=null;}return;}
 P.x=e.x;P.y=e.y;P.vx=e.vx||0;P.vy=e.vy||0;const s=SP[e.sp];P.hostT+=dt;
 const drain=(2+tierOf(e)*1.4)*(hasN('stealthP')?1.5:1)*dt;e.hp-=drain*(hasN('stealthP')?0.7:1);gain(drain*s.food/(e.maxHp||s.hp)*0.9);P.sat=Math.min(1,P.sat+drain*0.004);
 if(e.hp<=0){killEnt(e);leaveHost(true);return;}
 const ex=0.06*(hasN('hooks')?0.5:1)*(hasN('stealthP')?0.5:1);if(P.hostT>3&&R_()<ex*dt){hurt(D.hpMax*0.08,null);leaveHost(false);}}
function giveDna(e,base){if(!base)return;const v=base*dnaDim(e.sp);P.dnaF=(P.dnaF||0)+v;let got=0;while(P.dnaF>=1){P.dnaF-=1;P.dna++;got++;}if(got)pop(e.x,e.y,'+'+got+' ДНК','#ffd47a');}
/* виды: r — радиус столкновения в мкм */
const SP={
 coccus:{ru:'Кокки',kind:'food',r:[1.3,2],hp:1,food:0.55,dna:0,spd:0,real:1,info:'Шарообразные бактерии. Главная еда мелочи.'},
 bacil:{ru:'Бациллы',kind:'food',r:[1.4,2],hp:1,food:0.8,dna:0,spd:9,real:1,info:'Палочковидные бактерии, извиваются.'},
 chlorella:{ru:'Хлорелла',kind:'food',r:[2.6,4.2],hp:2,food:1.4,dna:0,spd:0,real:1,info:'Одноклеточная зелёная водоросль. Больше всего её там, где светло.'},
 euglena:{ru:'Эвглена зелёная',r:[17,24],hp:8,food:7,dna:1,spd:38,turn:2,beh:'photo',flee:1,real:1,info:'Полурастение-полуживотное: фотосинтезирует, но и плавает за светом на жгутике. Красный глазок видит свет.'},
 diatom:{ru:'Диатомея',r:[14,26],hp:16,food:8,dna:1,spd:7,turn:0.6,beh:'glide',real:1,info:'Водоросль в стеклянном панцире из кремнезёма. Скользит по слизи.'},
 paramecium:{ru:'Инфузория-туфелька',r:[42,58],hp:22,food:15,dna:2,spd:85,turn:2.4,beh:'wander',flee:1,real:1,info:'Покрыта тысячами ресничек, плавает быстро и вращаясь. Любимая еда дидиниума.'},
 didinium:{ru:'Дидиниум',r:[26,38],hp:16,food:10,dna:3,spd:105,turn:3,beh:'hunt',preyOnly:'paramecium',dmg:7,real:1,info:'Хищная инфузория-бочонок. Охотится только на туфелек и глотает их целиком, хоть они больше него.'},
 heliozoa:{ru:'Солнечник',r:[22,34],hp:20,food:12,dna:3,spd:5,turn:0.5,beh:'trap',dmg:5,real:1,info:'Шар с лучами-аксоподиями. Всё, что коснётся лучей, прилипает.'},
 spiker:{ru:'Колючник',r:[22,50],hp:30,food:15,dna:4,spd:46,turn:2.2,beh:'hunt',dmg:9,prey:1.3,real:0,info:'Выдуманный хищник: шипастый комок, который охотится на всех, кто мельче.'},
 rotifer:{ru:'Коловратка',r:[70,95],hp:45,food:26,dna:4,spd:28,turn:1.5,beh:'rotifer',dmg:4,prey:2.2,real:1,info:'Настоящее многоклеточное животное размером с инфузорию. «Колёса» из ресничек гонят воду и еду в рот — не подплывай к ним спереди, пока мал.'},
 amoeba:{ru:'Амёба протей',r:[85,160],hp:65,food:32,dna:5,spd:13,turn:0.8,beh:'amoeba',real:1,info:'Переливается ложноножками и обволакивает добычу. Мелкому от неё не уйти, если зазевается.'},
 bell:{ru:'Светожгучка',r:[55,80],hp:28,food:20,dna:5,spd:14,turn:0.6,beh:'drift',dmg:5,sting:1,real:0,info:'Выдуманный колокол со жгучими нитями. Сам не охотится, но больно жжёт при касании. В темноте мерцает.'},
 volvox:{ru:'Вольвокс',r:[140,210],hp:85,food:42,dna:4,spd:18,turn:0.4,beh:'roll',real:1,info:'Шар-колония из сотен водорослей со жгутиками, внутри — дочерние колонии. Живой пример пути «клетки → колония».'},
 stentor:{ru:'Трубач (стентор)',r:[190,280],hp:130,food:55,dna:6,spd:0,turn:0,beh:'sessile',real:1,info:'Огромная синяя инфузория-труба, прикреплена ко дну. Венец ресничек закручивает воронку и засасывает мелочь.'},
 hydra:{ru:'Гидра',r:[90,120],hp:150,food:60,dna:8,spd:0,turn:0,beh:'hydra',dmg:6,real:1,info:'Пресноводный полип, родственник медуз. Сидит на месте, щупальца со стрекательными клетками ловят всё, что коснётся. Сбоку видна почка — так гидра размножается.'},
 nematode:{ru:'Нематода',r:[50,70],hp:40,food:30,dna:4,spd:42,turn:2.5,beh:'worm',real:1,info:'Круглый червь: извивается волной и ест бактерии. Безобидна, а для охотника — сытная добыча.'},
 cyclops:{ru:'Циклоп',r:[520,600],hp:4000,food:300,dna:30,spd:55,turn:0.8,beh:'cyclops',dmg:15,real:1,info:'Веслоногий рачок с одним глазом. Для жителей капли — огромное чудовище, которое ест всех подряд. Прячься!'},
 noct:{ru:'Ночесветка',kind:'food',r:[4,6],hp:1,food:2.2,dna:0,spd:4,real:1,info:'Светящаяся водоросль-динофлагеллята. Ночью вспыхивает голубым светом — по ней легко найти еду в темноте.'},
 phage:{ru:'Бактериофаг',kind:'virus',r:[1.3,1.7],hp:1,food:0.05,dna:0,spd:16,real:1,notSpecies:1,info:'Вирус, который заражает только бактерий: впрыскивает в них свою ДНК, и бактерия лопается, выпуская новые фаги. Тебе он не опасен.'},
 vorticella:{ru:'Сувойка',r:[9,12],hp:5,food:4,dna:1,spd:0,turn:0,beh:'vort',real:1,info:'Инфузория-колокольчик на длинном стебельке. Если потревожить, стебелёк мгновенно скручивается пружиной — одно из самых быстрых движений в природе.'},
 daphnia:{ru:'Дафния',r:[650,750],hp:5000,food:350,dna:35,spd:40,turn:0.6,beh:'daphnia',dmg:10,real:1,info:'Водяная блоха — рачок с прозрачным панцирем и огромным глазом. Ножками фильтрует воду и затягивает всё мелкое. Внутри видно сердце и яйца.'},
 slimemold:{ru:'Слизевик',kind:'struct',r:[1,1],hp:1,food:0,dna:0,real:1,info:'Плазмодий слизевика — одна гигантская клетка-сеть со множеством ядер. Ползёт жёлтыми жилками, переливая цитоплазму туда-обратно, и поглощает всё мелкое. Его можно откусывать.'},
 rival:{ru:'Колония-соперник',kind:'rival',r:[10,10],hp:10,food:20,dna:8,spd:0,turn:2,beh:'rival',real:0,notSpecies:1,info:'Другая колония клеток, которая, как и ты, растёт и эволюционирует. Может стать охотником, травоядным или бронированным танком.'},
 chaos:{ru:'Гигантская амёба',r:[360,400],hp:650,food:200,dna:12,spd:16,turn:0.7,beh:'amoeba',edmg:12,boss:'silt',real:1,notSpecies:1,info:'Chaos carolinensis — амёба-гигант до 5 мм, у неё сотни ядер. Хозяйка илистого дна.'},
 asplanchna:{ru:'Хищная коловратка',r:[200,230],hp:320,food:120,dna:12,spd:52,turn:1.8,beh:'hunt',dmg:12,prey:1.7,boss:'surface',real:1,notSpecies:1,info:'Asplanchna — прозрачный мешок с челюстями-мастаксом. Охотится на всё, что меньше неё. Гроза мелководья.'},
 oldhydra:{ru:'Старая гидра',r:[190,210],hp:480,food:160,dna:12,spd:0,turn:0,beh:'hydra',dmg:9,boss:'thicket',real:1,notSpecies:1,info:'Огромная гидра, притаившаяся в зарослях. Её щупальца достают дальше всех.'},
 egg:{ru:'Яйцо коловратки',r:[9,11],hp:6,food:8,dna:4,spd:0,turn:0,beh:'egg',real:1,notSpecies:1,info:'Коловратки откладывают яйца. Съешь яйцо — получишь много ДНК, а не успеешь — вылупится новая коловратка.'},
 tardigrade:{ru:'Тихоходка',r:[190,260],hp:320,food:110,dna:15,spd:24,turn:0.9,beh:'hunt',dmg:16,prey:1.15,real:1,info:'«Водяной медвежонок». Восемь лап с коготками, переживает почти всё. Самое опасное существо капли.'}
};

/* ========== стили методов микроскопии ========== */
const MODES={
 bright:{ru:'Светлое поле',bg0:'#f1ecdd',bg1:'#c9bea2',glow:0,dark:0,memW:1.1,
  mem:a=>`rgba(55,58,40,${a})`,cyto:(h,a)=>`hsla(${h},38%,55%,${a*0.2})`,nuc:a=>`rgba(95,88,70,${a*0.22})`,nucRim:a=>`rgba(60,58,44,${a*0.65})`,
  gran:a=>`rgba(55,50,35,${a*0.55})`,chlo:a=>`rgba(70,145,40,${a*0.72})`,mito:a=>`rgba(130,105,60,${a*0.45})`,vac:a=>`rgba(255,255,248,${a*0.55})`,vacRim:a=>`rgba(90,88,70,${a*0.45})`,
  hair:a=>`rgba(60,62,45,${a*0.5})`,part:a=>`rgba(80,72,55,${a})`,eye:a=>`rgba(205,55,25,${a})`,caR:a=>`rgba(255,40,0,${a*0.32})`,caB:a=>`rgba(0,90,255,${a*0.32})`,
  stain:(h,a)=>`hsla(${h},60%,40%,${a})`,memP:(h,a)=>`rgba(55,58,40,${a})`,light:'rgba(255,255,250,0.5)',vig:'rgba(70,58,35,0.55)',spike:a=>`rgba(70,60,45,${a*0.75})`},
 dark:{ru:'Тёмное поле',bg0:'#0d1116',bg1:'#010203',glow:1,dark:1,memW:1.3,
  mem:a=>`rgba(232,240,255,${a*0.9})`,cyto:(h,a)=>`hsla(${h},25%,45%,${a*0.10})`,nuc:a=>`rgba(200,210,235,${a*0.08})`,nucRim:a=>`rgba(215,228,255,${a*0.45})`,
  gran:a=>`rgba(240,245,255,${a*0.65})`,chlo:a=>`rgba(170,235,150,${a*0.45})`,mito:a=>`rgba(235,225,200,${a*0.4})`,vac:a=>`rgba(0,0,0,0)`,vacRim:a=>`rgba(220,230,255,${a*0.55})`,
  hair:a=>`rgba(225,232,255,${a*0.65})`,part:a=>`rgba(220,230,255,${a})`,eye:a=>`rgba(255,120,90,${a})`,caR:a=>`rgba(255,60,40,${a*0.45})`,caB:a=>`rgba(50,120,255,${a*0.45})`,
  stain:(h,a)=>`hsla(${h},50%,70%,${a*0.6})`,memP:(h,a)=>`rgba(232,240,255,${a*0.9})`,light:'rgba(120,140,170,0.10)',vig:'rgba(0,0,0,0.75)',spike:a=>`rgba(235,240,255,${a*0.8})`},
 phase:{ru:'Фазовый контраст',bg0:'#a3a89f',bg1:'#6b7069',glow:0,dark:0,memW:1.5,halo:a=>`rgba(250,253,248,${a*0.5})`,
  mem:a=>`rgba(22,25,22,${a*0.85})`,cyto:(h,a)=>`hsla(${h},10%,30%,${a*0.32})`,nuc:a=>`rgba(30,33,30,${a*0.5})`,nucRim:a=>`rgba(235,240,235,${a*0.6})`,
  gran:a=>`rgba(18,20,18,${a*0.75})`,chlo:a=>`rgba(25,55,22,${a*0.8})`,mito:a=>`rgba(30,30,25,${a*0.6})`,vac:a=>`rgba(225,230,225,${a*0.55})`,vacRim:a=>`rgba(20,22,20,${a*0.5})`,
  hair:a=>`rgba(25,28,25,${a*0.6})`,part:a=>`rgba(30,32,30,${a})`,eye:a=>`rgba(120,30,15,${a})`,caR:a=>`rgba(255,40,0,${a*0.25})`,caB:a=>`rgba(0,90,255,${a*0.25})`,
  stain:(h,a)=>`hsla(${h},25%,25%,${a})`,memP:(h,a)=>`rgba(22,25,22,${a*0.85})`,light:'rgba(255,255,255,0.22)',vig:'rgba(30,32,30,0.6)',spike:a=>`rgba(25,28,25,${a*0.8})`},
 fluo:{ru:'Флуоресценция',bg0:'#060609',bg1:'#000000',glow:1,dark:1,memW:1.2,
  mem:a=>`rgba(70,255,130,${a*0.55})`,cyto:(h,a)=>`hsla(${h},90%,50%,${a*0.05})`,nuc:a=>`rgba(70,110,255,${a*0.5})`,nucRim:a=>`rgba(120,160,255,${a*0.75})`,
  gran:a=>`rgba(255,150,50,${a*0.45})`,chlo:a=>`rgba(255,40,70,${a*0.8})`,mito:a=>`rgba(255,110,40,${a*0.55})`,vac:a=>`rgba(0,0,0,0)`,vacRim:a=>`rgba(70,255,130,${a*0.22})`,
  hair:a=>`rgba(70,255,130,${a*0.35})`,part:a=>`rgba(90,255,150,${a*0.55})`,eye:a=>`rgba(255,200,60,${a})`,caR:a=>`rgba(255,40,80,${a*0.4})`,caB:a=>`rgba(60,90,255,${a*0.4})`,
  stain:(h,a)=>`hsla(${h},100%,60%,${a*0.6})`,memP:(h,a)=>`hsla(${h},100%,62%,${a*0.75})`,light:'rgba(40,60,90,0.10)',vig:'rgba(0,0,0,0.8)',spike:a=>`rgba(140,255,180,${a*0.7})`}
};
const MODE_KEYS=['bright','dark','phase','fluo'];
let ST=MODES.bright;

/* ========== состояние ========== */
const SAVE_KEY='evo_stage1_v1';
let P,D={},ents=[],parts=[],farObj=[],nearObj=[],lights=[],slime=[],pops=[],shots=[];
let T=0,cam={x:0,y:0,s:1,ts:1,obj:0,trans:0},paused=true,editorOpen=false,started=false;
function newPlayer(){return{x:0,y:0,a:0,vx:0,vy:0,hp:10,cells:[{q:0,r:0,t:'basic'}],hue:150,pattern:'none',biomass:0,dna:0,dnaF:0,gen:1,un:{},
 dashT:0,dashCd:0,stingCd:0,inv:2,hurt:0,lastHit:99,mode:'bright',kingdom:null,stats:{time:0,eaten:0,kills:0,div:0,deaths:0,eggs:0,mutAcc:0,sinceDeath:0,maxAllies:0,spores:0,cured:0,cycSurv:0},seen:{},ate:{},killed:{},modesSeen:{},slimeT:0,hintsDone:{},defects:{},defT:0,cystCd:0,zapCd:0,sporeSeed:(Math.random()*1e9)|0,sporesOpen:{},bossDone:{}};}

/* ========== тело ========== */
const DEFECTS={limp:{ru:'Вялый жгутик',d:'−40% тяги жгутиков'},thin:{ru:'Тонкая мембрана',d:'−20% здоровья'},slowdig:{ru:'Медленное пищеварение',d:'−25% биомассы от еды'},shaky:{ru:'Дрожащие реснички',d:'−30% поворота'}};
function hasN(id){return!!P.un[id];}
function DEF(id){return!!(P.defects&&P.defects[id]>0);}
function derive(){
 const c=P.cells,n=c.length,set=new Set(c.map(k=>k.q+','+k.r));
 let mx=0,my=0;const pos=c.map(k=>{const p=hexXY(k.q,k.r);mx+=p[0];my+=p[1];return p;});mx/=n;my/=n;
 const cnt={},edge={};let R=0;
 D.cw=c.map((k,i)=>{
  const bx=pos[i][0]-mx,by=pos[i][1]-my;let ox=0,oy=0,free=0;
  for(const[dq,dr]of HDIR)if(!set.has((k.q+dq)+','+(k.r+dr))){const p=hexXY(dq,dr);ox+=p[0];oy+=p[1];free++;}
  const l=Math.hypot(ox,oy);
  if(free===6||l<0.01){if(k.t==='flag'||k.t==='vacuole'||k.t==='muscle'){ox=-1;oy=0;}else{ox=1;oy=0;}}else{ox/=l;oy/=l;}
  const isEdge=free>0;cnt[k.t]=(cnt[k.t]||0)+1;if(isEdge)edge[k.t]=(edge[k.t]||0)+1;
  R=Math.max(R,Math.hypot(bx,by)+CELL_R);
  return{bx,by,ox,oy,t:k.t,core:i===0,edge:isEdge,seed:hash(k.q+50,k.r+50),q:k.q,r:k.r,wx:0,wy:0};
 });
 D.mx=mx;D.my=my;D.n=n;D.R=R;D.cnt=cnt;D.edge=edge;
 const E=t=>edge[t]||0,C=t=>cnt[t]||0;
 const fm=(hasN('flag3')?2:hasN('flag2')?1.5:1)*(DEF('limp')?0.6:1),cm=hasN('cilia2')?1.6:1;
 let thr=1;for(const w of D.cw)if(w.t==='flag'&&w.edge)thr+=(w.ox<-0.3||n===1?1.6:1)*fm;
 thr+=0.45*E('cilia')*cm+0.9*C('muscle');
 const nb=1+0.12*Math.min(3,C('nerve'));
 D.speed=35*Math.sqrt(thr/n)*Math.pow(n,0.55)*nb;
 D.turn=3*(1+0.6*E('cilia')*cm+0.3*C('nerve'))/Math.pow(n,0.35)*nb*(hasN('flag3')&&E('flag')?1.2:1)*(DEF('shaky')?0.7:1);
 let hp=0;for(const w of D.cw)hp+=TYPES[w.t].hp;D.hpMax=Math.max(18,hp)*(hasN('double')?1.3:1)*(DEF('thin')?0.8:1);
 D.engulf=hasN('phago')?0.9:E('pseudo')>0?0.75:0.45;D.digest=(1+0.3*C('digest'))*(DEF('slowdig')?0.75:1);D.photo=0.3*C('chloro');
 D.dashCd=C('vacuole')?4/(1+0.4*(C('vacuole')-1)):0;D.spikeDps=6*(hasN('sharp')?1.6:1);D.mouthDps=hasN('jaws')?12.6:7;D.sting=Math.max(E('sting'),hasN('nemabat')?1:0);D.eyes=C('eye');D.slime=C('slime');
 D.armorFrac=C('armor')/n;
 D.met=(1/120)*Math.pow(n,0.1)*(1+0.12*C('muscle')+0.08*C('nerve'))*(1-Math.min(0.4,0.07*C('digest')));D.satGain=0.11/Math.pow(n,0.4);
 D.pl=predLvl();
 P.hp=Math.min(P.hp,D.hpMax);
}
function cellCost(){return Math.round((8+2.2*P.cells.length)*(hasN('fastdiv')?0.75:1));}
function updateCellWorld(){const ca=Math.cos(P.a),sa=Math.sin(P.a);for(const w of D.cw){w.wx=P.x+w.bx*ca-w.by*sa;w.wy=P.y+w.bx*sa+w.by*ca;}}

/* ========== мир ========== */
function flow(x,y){return[Math.sin(y*0.0021+T*0.13)*7+Math.sin((x+y)*0.0013-T*0.07)*5,Math.cos(x*0.0018-T*0.11)*7+Math.sin((x-y)*0.0011+T*0.05)*4];}
function lightAt(x,y){return lightAt0(x,y)*(0.12+0.88*DAYK);}
function lightAt0(x,y){let L=0.15+0.2*surfAt(x,y);for(const l of lights){const d2=((x-l.x)**2+(y-l.y)**2)/(l.r*l.r);if(d2<1)L=Math.max(L,0.15+0.85*(1-d2)*(1-d2));}return L*(1-0.65*siltAt(x,y))*(inThicket(x,y)?0.8:1);}
function initWorld(){
 lights=[];let lt=0;while(lights.length<Math.round(22*WK*WK)&&lt++<1600){const a=rnd(0,TAU),d=Math.sqrt(R_())*DROP_R*0.92;const x=Math.cos(a)*d,y=Math.sin(a)*d;const z=zoneZ(x,y);if(z>0.6||(z>0.45&&R_()<0.6))continue;lights.push({x,y,r:rnd(350,900)*(z<0.36?1.3:1),vx:rnd(-3,3),vy:rnd(-3,3)});}
 lights[0].x=120;lights[0].y=-60;lights[0].r=420;
 ents=[];parts=[];slime=[];pops=[];shots=[];
 for(let i=0;i<170;i++)parts.push({x:rnd(-1,1),y:rnd(-1,1),z:rnd(0.2,1),r:rnd(0.3,1.1),init:1});
 farObj=[];for(let i=0;i<20;i++)farObj.push({x:rnd(0,1),y:rnd(0,1),r:rnd(0.012,0.045),k:pick(['blob','rod','ring','cell','diatom']),a:rnd(0,TAU),h:rnd(0,360),v:rnd(-0.004,0.004)});
 nearObj=[];for(let i=0;i<4;i++)nearObj.push({x:rnd(0,1),y:rnd(0,1),r:rnd(0.12,0.3),a:rnd(0,TAU),k:pick(['blob','ring'])});
 fillWorld(true);
}
function viewD(){return OBJ[cam.obj].d;}
function spawnEnt(sp,x,y){
 const s=SP[sp];const r=rnd(s.r[0],s.r[1]);
 const e={sp,x,y,a:rnd(0,TAU),vx:0,vy:0,r,hp:s.hp*(r/s.r[0])**1.2,t:rnd(0,100),seed:R_(),tg:null,tgT:0,eaten:0,by:null,stuck:0,poison:0,n:1+((R_()*3)|0),fleeT:0,spdF:1,turnT:0,wa:rnd(0,TAU)};
 e.maxHp=e.hp;if(sp==='stentor'||sp==='hydra'||sp==='oldhydra'){e.ax=x;e.ay=y;}if(s.boss){e.boss=true;e.label=s.ru;}
 ents.push(e);return e;
}
function spawnFood(x,y,kind,amt){const e={sp:kind,x,y,a:rnd(0,TAU),vx:0,vy:0,r:kind==='plasmid'?4.5:rnd(2,4.5)*(amt>3?1.4:1),hp:1,maxHp:1,t:rnd(0,9),seed:R_(),eaten:0,food:amt||2,life:kind==='kin'?40:999};ents.push(e);return e;}
function scrDiag(){return Math.hypot(W,H)/2/cam.s;}
function spawnPos(minK,maxK,extra){const all=minK<0.5,dg=scrDiag(),ex=extra||0;for(let k=0;k<20;k++){const a=rnd(0,TAU),r=all?viewD()*rnd(Math.max(minK,0.3),1.3):dg*rnd(1.12,1.55)+ex;const x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r;if(x*x+y*y<DROP_R*DROP_R*0.97)return[x,y];}return[P.x+rnd(-1,1)*d,P.y+rnd(-1,1)*d];}
function spWeights(){
 const R=D.R||10;
 return{euglena:R<45?4:1.5,diatom:2,paramecium:R>9?3:1.5,didinium:1.2,heliozoa:1.4,spiker:R<14?0.075:0.7,rotifer:R>18?1.4:0.25,amoeba:1.1,bell:R>18?1:0.3,volvox:R>28?0.7:0.3,stentor:0.25,hydra:R>15?0.3:0.12,nematode:0.45,vorticella:0.6,tardigrade:R>45?0.7:0.05};
}
const ECO={paramecium:1,euglena:1,diatom:1,rotifer:1,nematode:1,vorticella:1};
function ecoHit(sp){if(ECO[sp]==null)return;ECO[sp]=Math.max(0.12,ECO[sp]*0.85);
 if(sp==='paramecium'&&ECO.paramecium<0.4&&!P.hintsDone.ecoPar){P.hintsDone.ecoPar=1;qtoast('Туфелек стало мало: <b>дидиниумам</b> нечего есть, и они пропадают, а бактерии без охотников размножаются.');}}
let spawnT=0,grpId=0,orgCount=0,allyCount=0,cycE=null,cycT=rnd(330,420),spores=[],zaps=[],sporeMsgT=0;
function srand(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let ZP=[0,0,0],thickets=[];const FIL_R=7;
function zoneZ(x,y){return 0.5+0.22*Math.sin(x*0.00045+ZP[0])+0.22*Math.sin(y*0.0005+ZP[1])+0.12*Math.sin((x+y)*0.0009+ZP[2]);}
function smooth(a,b,v){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);}
function siltAt(x,y){return smooth(0.58,0.7,zoneZ(x,y));}
function surfAt(x,y){return 1-smooth(0.3,0.42,zoneZ(x,y));}
function inThicket(x,y){for(const t of thickets){if((x-t.x)**2+(y-t.y)**2<t.r*t.r)return t;}return null;}
function zoneName(x,y){if(inThicket(x,y))return'thicket';const z=zoneZ(x,y);return z>0.64?'silt':z<0.36?'surface':'open';}
const ZONES={surface:{ru:'Светлое мелководье',info:'Много света: растут водоросли, плавают эвглены и вольвоксы. Хлоропласты работают в полную силу.'},silt:{ru:'Илистое дно',info:'Темно и мутно, мало света, зато много бактерий и детрита. Здесь живут амёбы и нематоды, а в иле лежат древние споры.'},thicket:{ru:'Заросли нитчатки',info:'Лабиринт из нитей водоросли спирогиры. Мелкий проскользнёт между нитями, а крупные хищники и циклоп сюда не пролезут — хорошее укрытие.'},open:{ru:'Открытая вода',info:'Толща воды между мелководьем и дном.'}};
const ZW={surface:{euglena:2,volvox:2,paramecium:1.3,amoeba:0.4,nematode:0.3,tardigrade:0.3,hydra:0.6},silt:{amoeba:2.2,nematode:2.5,heliozoa:1.3,euglena:0.3,volvox:0.3,tardigrade:1.8,diatom:1.4,stentor:0.6},thicket:{rotifer:2,hydra:2.5,diatom:1.8,vorticella:3,stentor:1.5,amoeba:0.3,tardigrade:0.2,volvox:0.3},open:{}};
function makeThickets(){const r=srand(P.sporeSeed+77);ZP=[r()*6,r()*6,r()*6];thickets=[];let tries=0;
 while(thickets.length<Math.round(6*WK*WK)&&tries++<1200){const a=r()*TAU,d=900+r()*(DROP_R-1700);const x=Math.cos(a)*d,y=Math.sin(a)*d;if(zoneZ(x,y)>0.6)continue;if(thickets.some(t=>Math.hypot(t.x-x,t.y-y)<t.r+1100))continue;
  const t={x,y,r:520+r()*380,fil:[]};const nf=10+((r()*5)|0);
  for(let i=0;i<nf;i++){let px=x+(r()-0.5)*t.r*1.7,py=y+(r()-0.5)*t.r*1.7,ang=r()*TAU;const pts=[];for(let k=0;k<30;k++){if((px-x)**2+(py-y)**2<(t.r*1.05)**2)pts.push([px,py]);ang+=(r()-0.5)*0.32;px+=Math.cos(ang)*32;py+=Math.sin(ang)*32;}
   if(pts.length>3)t.fil.push({pts,seed:r()});}
  thickets.push(t);}
}
function filPush(x,y,rad){let px=0,py=0;for(const t of thickets){const dd=Math.hypot(x-t.x,y-t.y);if(dd>t.r*1.1+rad)continue;
  for(const f of t.fil){const p=f.pts;for(let i=0;i<p.length-1;i++){const ax=p[i][0],ay=p[i][1],bx=p[i+1][0],by=p[i+1][1];const vx=bx-ax,vy=by-ay,L2=vx*vx+vy*vy;let u=((x-ax)*vx+(y-ay)*vy)/L2;u=u<0?0:u>1?1:u;const cx=ax+vx*u,cy=ay+vy*u,dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy);const m=rad+FIL_R-d;if(m>0&&d>0.01){px+=dx/d*m;py+=dy/d*m;}}}}
 return[px,py];}
let molds=[];
function makeMolds(){const r=srand(P.sporeSeed+313);molds=[];for(let i=0;i<Math.round(3*WK*WK);i++){let x=0,y=0;for(let k=0;k<80;k++){const a=r()*TAU,d=1500+r()*(DROP_R-2000);x=Math.cos(a)*d;y=Math.sin(a)*d;if(siltAt(x,y)>0.7&&!inThicket(x,y))break;}molds.push({x,y,nodes:[{x,y,p:-1,d:0,kids:0}],growT:0,eatT:0,regrow:0,seen:false});}}
function moldUpdate(dt){
 for(const m of molds){
  if(Math.hypot(m.x-P.x,m.y-P.y)>3200)continue;
  const N=m.nodes;
  if(!N.length){m.regrow-=dt;if(m.regrow<=0)N.push({x:m.x,y:m.y,p:-1,d:0,kids:0});continue;}
  m.growT-=dt;if(m.growT<=0&&N.length<170){m.growT=0.35;
   for(let tr=0;tr<6;tr++){let i;const tips=[];for(let k=Math.max(0,N.length-60);k<N.length;k++)if(!N[k].kids)tips.push(k);i=tips.length&&R_()<0.8?pick(tips):(R_()*N.length)|0;const n=N[i];
    let ang;const near=ents.find(e=>(e.sp==='detritus'||e.sp==='coccus'||e.sp==='bacil'||e.sp==='chlorella')&&Math.abs(e.x-n.x)<160&&Math.abs(e.y-n.y)<160);
    ang=near?Math.atan2(near.y-n.y,near.x-n.x)+rnd(-0.4,0.4):Math.atan2(n.y-m.y,n.x-m.x)+rnd(-0.9,0.9);if(n.p<0)ang=rnd(0,TAU);
    const nx=n.x+Math.cos(ang)*24,ny=n.y+Math.sin(ang)*24;if(siltAt(nx,ny)<0.25||Math.hypot(nx-m.x,ny-m.y)>900)continue;
    N.push({x:nx,y:ny,p:i,d:n.d+1,kids:0});n.kids++;break;}}
  m.eatT-=dt;if(m.eatT<=0){m.eatT=0.5;for(const e of ents){if(e.eaten||e.dead)continue;const s=SP[e.sp];if(!(e.sp==='detritus'||(s&&(s.kind==='food'||s.kind==='virus'))||(s&&e.r<14)))continue;if(Math.abs(e.x-m.x)>950||Math.abs(e.y-m.y)>950)continue;for(let k=N.length-1;k>=Math.max(0,N.length-120);k--){const n=N[k];if(Math.abs(n.x-e.x)<12&&Math.abs(n.y-e.y)<12){e.eaten=0.001;e.by={x:n.x,y:n.y,dead:false};break;}}}}
  // взаимодействие с игроком
  if(Math.abs(P.x-m.x)>950+D.R||Math.abs(P.y-m.y)>950+D.R)continue;
  if(!m.seen){const sx=(m.x-cam.x)*cam.s,sy=(m.y-cam.y)*cam.s;if(Math.abs(sx)<W*0.6&&Math.abs(sy)<H*0.6){m.seen=true;if(!P.seen.slimemold){P.seen.slimemold=1;qtoast('Новый вид в поле зрения: <b>Слизевик</b>. '+SP.slimemold.info);}}}
  let stuck=false,cut=new Set();
  for(const w of D.cw){if(Math.abs(w.wx-m.x)>950||Math.abs(w.wy-m.y)>950)continue;for(let k=0;k<N.length;k++){const n=N[k];if(Math.abs(n.x-w.wx)>CELL_R+8||Math.abs(n.y-w.wy)>CELL_R+8)continue;
   stuck=true;if(w.edge&&(w.t==='mouth'||w.t==='spike'||w.t==='pseudo'))cut.add(k);}}
  if(stuck&&P.inv<=0){P.vx*=0.9;P.vy*=0.9;if(D.R<35){deathCause='поглощён слизевиком';hurt(2*dt,null);}}
  if(cut.size){const rm=new Set(cut);let ch=true;while(ch){ch=false;for(let k=0;k<N.length;k++)if(!rm.has(k)&&rm.has(N[k].p)){rm.add(k);ch=true;}}
   const keep=[],map={};N.forEach((n,k)=>{if(!rm.has(k)){map[k]=keep.length;keep.push(n);}});keep.forEach(n=>{n.p=n.p>=0&&map[n.p]!=null?map[n.p]:-1;n.kids=0;});keep.forEach(n=>{if(n.p>=0)keep[n.p].kids++;});
   m.nodes=keep;if(!keep.length)m.regrow=60;const gb=Math.min(rm.size,12)*0.8;gain(gb);if(!m.popT||T-m.popT>1){m.popT=T;pop(P.x,P.y-D.R-10,'+'+gb.toFixed(0)+' биомассы (слизевик)','#e8c860');}}
 }
}
function drawMolds(hw,hh){
 for(const m of molds){if(Math.abs(m.x-cam.x)>hw+950||Math.abs(m.y-cam.y)>hh+950)continue;const N=m.nodes;if(!N.length)continue;
  const col=P.mode==='fluo'?a=>`rgba(255,200,60,${a*0.6})`:ST.dark?a=>`rgba(255,228,120,${a*0.55})`:P.mode==='phase'?a=>`rgba(70,62,20,${a*0.7})`:a=>`rgba(215,180,30,${a*0.6})`;
  ctx.lineCap='round';
  for(let k=1;k<N.length;k++){const n=N[k],p=N[n.p];if(!p)continue;const w=(1.3+3.8*Math.exp(-n.d/16))*(1+0.22*Math.sin(T*1.6-n.d*0.35));ctx.strokeStyle=col(0.9);ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(n.x,n.y);ctx.stroke();}
  ctx.fillStyle=col(0.4);for(const n of N)if(!n.kids){ell(n.x,n.y,6+1.5*Math.sin(T*2+n.d),4,n.p>=0?Math.atan2(n.y-N[n.p].y,n.x-N[n.p].x)+1.57:0);ctx.fill();}
  ctx.fillStyle=col(0.7);circ(m.x,m.y,9);ctx.fill();
  ctx.lineCap='butt';}
}
const RSTRAT={hunter:{ru:'охотник',w:{flag:3,spike:3,mouth:3,muscle:2,nerve:1,basic:1,sting:1}},grazer:{ru:'травоядный',w:{chloro:4,cilia:3,basic:2,digest:2,flag:1}},tank:{ru:'танк',w:{armor:4,spike:2,basic:2,slime:1,cilia:1}}};
const RTIER={basic:0,flag:0,cilia:0,chloro:1,spike:1,mouth:1,armor:1,slime:1,muscle:2,nerve:2,digest:2,sting:2};
function rivalType(e){const n=e.cells.length,tier=n<4?0:n<9?1:2;const w=RSTRAT[e.strat].w;let tot=0;for(const k in w)if(RTIER[k]<=tier)tot+=w[k];let r=R_()*tot;for(const k in w){if(RTIER[k]>tier)continue;r-=w[k];if(r<=0)return k;}return'basic';}
function rivalAddCell(e){const set=new Set(e.cells.map(c=>c.q+','+c.r)),fr=[];for(const c of e.cells)for(const[dq,dr]of HDIR){const k=(c.q+dq)+','+(c.r+dr);if(!set.has(k)){set.add(k);fr.push([c.q+dq,c.r+dr]);}}const t=rivalType(e);let best=pick(fr);
 if(t==='flag'||t==='muscle'){fr.sort((a,b)=>hexXY(a[0],a[1])[0]-hexXY(b[0],b[1])[0]);best=fr[(R_()*Math.min(3,fr.length))|0];}
 if(t==='spike'||t==='mouth'){fr.sort((a,b)=>hexXY(b[0],b[1])[0]-hexXY(a[0],a[1])[0]);best=fr[(R_()*Math.min(3,fr.length))|0];}
 e.cells.push({q:best[0],r:best[1],t});rivalGeom(e);}
function rivalGeom(e){const c=e.cells,n=c.length,set=new Set(c.map(k=>k.q+','+k.r));let mx=0,my=0;const pos=c.map(k=>{const p=hexXY(k.q,k.r);mx+=p[0];my+=p[1];return p;});mx/=n;my/=n;let R=0;const cnt={},edge={};
 e.cw=c.map((k,i)=>{const bx=pos[i][0]-mx,by=pos[i][1]-my;let ox=0,oy=0,free=0;for(const[dq,dr]of HDIR)if(!set.has((k.q+dq)+','+(k.r+dr))){const p=hexXY(dq,dr);ox+=p[0];oy+=p[1];free++;}const l=Math.hypot(ox,oy);if(free===6||l<0.01){ox=k.t==='flag'?-1:1;oy=0;}else{ox/=l;oy/=l;}cnt[k.t]=(cnt[k.t]||0)+1;if(free)edge[k.t]=(edge[k.t]||0)+1;R=Math.max(R,Math.hypot(bx,by)+CELL_R);return{bx,by,ox,oy,t:k.t,core:i===0,edge:free>0,seed:hash(k.q+90,k.r+90),wx:0,wy:0};});
 const E=t=>edge[t]||0,C=t=>cnt[t]||0;let thr=1+E('flag')*1.3+0.45*E('cilia')+0.9*C('muscle');const nb=1+0.12*Math.min(3,C('nerve'));
 e.speed=35*Math.sqrt(thr/n)*Math.pow(n,0.55)*nb*0.85;e.turnR=3*(1+0.6*E('cilia'))/Math.pow(n,0.35);let hp=0;for(const w of e.cw)hp+=TYPES[w.t].hp;const f=e.maxHp?e.hp/e.maxHp:1;e.maxHp=hp;e.hp=hp*f;e.r=R;e.n=n;e.weap=E('spike')+E('mouth')+C('sting');e.cnt=cnt;
 e.label='Соперник «'+e.name+'» · '+RSTRAT[e.strat].ru+' · '+n+' кл.';}
function spawnRival(){const[x,y]=spawnPos(0.8,1.4,150);const e={sp:'rival',rival:true,x,y,a:rnd(0,TAU),vx:0,vy:0,t:0,seed:R_(),hue:(P.hue+120+rnd(0,120))%360,pat:pick(['none','spots','stripes','ring']),strat:pick(Object.keys(RSTRAT)),bio:0,cells:[{q:0,r:0,t:'basic'}],eaten:0,poison:0,name:pick(ROOTS_R)+pick(ROOTS_R)};
 e.name=e.name.charAt(0).toUpperCase()+e.name.slice(1);const target=Math.max(2,Math.min(40,Math.round(D.n*rnd(0.7,1.25))));while(e.cells.length<target)rivalAddCell(e);rivalGeom(e);e.hp=e.maxHp;ents.push(e);
 if(!P.hintsDone.rival){P.hintsDone.rival=1;qtoast('Поблизости <b>колония-соперник</b>. Она, как и ты, ест, растёт и эволюционирует. Если она меньше и без оружия — добыча; если больше и с шипами — беги.');}}
const ROOTS_R=['ксил','бри','тор','мол','вар','зен','нок','ска','лум','дар'];
let rivalT=20;
function rivalUpdate(e,dt){
 e.t+=dt;if(e.poison>0){e.poison-=dt;e.hp-=3*dt;}if(e.hp<=0){killEnt(e);toast('Колония-соперник «'+e.name+'» побеждена! +'+SP.rival.dna+' ДНК.');P.stats.rivals=(P.stats.rivals||0)+1;return;}
 e.hp=Math.min(e.maxHp,e.hp+e.maxHp*0.01*dt);
 const ca=Math.cos(e.a),sa=Math.sin(e.a);for(const w of e.cw){w.wx=e.x+w.bx*ca-w.by*sa;w.wy=e.y+w.bx*sa+w.by*ca;}
 const pR=D.R,dP=Math.hypot(P.x-e.x,P.y-e.y);e.tgT=(e.tgT||0)-dt;
 if(e.tgT<=0){e.tgT=0.5;e.mode='food';e.tg=null;
  if(e.weap>0&&pR<e.r*0.95&&dP<900&&P.inv<=0)e.mode='hunt';
  else if(pR>e.r*1.15&&dP<450&&(D.edge.spike||D.edge.mouth||D.sting))e.mode='flee';
  if(e.mode==='food'){let bd=650;for(const o of ents){if(o.eaten||o.dead||o===e)continue;const s=SP[o.sp];const ok=o.sp==='detritus'||(s&&(s.kind==='food'||(s.kind!=='rival'&&s.kind!=='virus'&&!s.boss&&o.r<e.r*0.45)));if(!ok)continue;const d=Math.abs(o.x-e.x)+Math.abs(o.y-e.y);if(d<bd){bd=d;e.tg=o;}}}}
 let wa=e.a,thr=0.6;
 if(e.mode==='hunt'){wa=Math.atan2(P.y-e.y,P.x-e.x);thr=1;}else if(e.mode==='flee'){wa=Math.atan2(e.y-P.y,e.x-P.x);thr=1;}
 else if(e.tg&&!e.tg.dead&&!e.tg.eaten){wa=Math.atan2(e.tg.y-e.y,e.tg.x-e.x);thr=0.8;}else{e.wa=(e.wa||e.a)+rnd(-1,1)*dt;wa=e.wa;thr=0.4;}
 if(cycE&&cycE.life>0&&Math.hypot(e.x-cycE.x,e.y-cycE.y)<1100){wa=Math.atan2(e.y-cycE.y,e.x-cycE.x);thr=1;}
 steer(e,wa,dt,e.turnR);const fl=flow(e.x,e.y);const tv=e.speed*thr;const k=Math.min(1,dt*4);e.vx+=(Math.cos(e.a)*tv-e.vx)*k;e.vy+=(Math.sin(e.a)*tv-e.vy)*k;e.x+=(e.vx+fl[0]*0.6)*dt;e.y+=(e.vy+fl[1]*0.6)*dt;
 if(Math.hypot(e.x,e.y)>DROP_R*0.95){e.wa=Math.atan2(-e.y,-e.x);}
 // фотосинтез и пассивный рост
 e.bio+=dt*(0.12+0.25*(e.cnt.chloro||0)*lightAt(e.x,e.y));
 // еда
 for(const o of ents){if(o.eaten||o.dead||o===e)continue;if(Math.abs(o.x-e.x)>e.r+o.r+4||Math.abs(o.y-e.y)>e.r+o.r+4)continue;const s=SP[o.sp];const ok=o.sp==='detritus'||(s&&(s.kind==='food'||(s.kind!=='rival'&&s.kind!=='virus'&&!s.boss&&o.r<e.r*0.45)));if(!ok)continue;
  for(const w of e.cw){if(Math.hypot(w.wx-o.x,w.wy-o.y)<CELL_R+o.r){o.eaten=0.001;o.by=e;e.bio+=o.sp==='detritus'?o.food:(s?s.food:1);break;}}}
 const cost=Math.round(8+2.2*e.cells.length);if(e.bio>=cost&&e.cells.length<Math.min(40,D.n+8)){e.bio-=cost;rivalAddCell(e);}
 // бой с игроком
 if(dP<pR+e.r+4){let hitP=0,hitE=0,contact=false;
  for(const w of e.cw){if(!w.edge)continue;for(const pw of D.cw){if(Math.abs(pw.wx-w.wx)>CELL_R*2.4||Math.abs(pw.wy-w.wy)>CELL_R*2.4)continue;const d=Math.hypot(pw.wx-w.wx,pw.wy-w.wy);if(d>CELL_R*2.4)continue;contact=true;
   if(w.t==='spike'&&d<CELL_R*2.4)hitP+=6;if(w.t==='mouth'&&d<CELL_R*2.2)hitP+=7;
   if(pw.edge&&pw.t==='spike')hitE+=D.spikeDps;if(pw.edge&&pw.t==='mouth')hitE+=D.mouthDps;}}
  if(contact){if(e.r<=pR*D.engulf*0.9){eatEnt(e);P.stats.rivals=(P.stats.rivals||0)+1;toast('Ты поглотил колонию-соперника «'+e.name+'»!');return;}
   if(hitP&&P.inv<=0){deathCause='колония-соперник';hurt(Math.min(hitP,30)*dt,null);}
   if(hitE){e.hp-=Math.min(hitE,60)*dt;if(hasN('barb'))e.poison=3;}
   const dx=e.x-P.x,dy=e.y-P.y,dl=Math.hypot(dx,dy)||1,ov=pR+e.r-dl;if(ov>0){const mP=D.n,mE=e.n,tot=mP+mE;const pu=Math.min(ov,4);e.x+=dx/dl*pu*mP/tot;e.y+=dy/dl*pu*mP/tot;P.x-=dx/dl*pu*mE/tot;P.y-=dy/dl*pu*mE/tot;}}}
}
let bossT=40;
function bossCheck(dt){
 bossT-=dt;if(bossT>0)return;bossT=6;
 if(ents.some(e=>e.boss&&!e.dead))return;if(D.R<24)return;
 const zn=zoneName(P.x,P.y);const id=zn==='silt'?'chaos':zn==='surface'?'asplanchna':zn==='thicket'?'oldhydra':null;if(!id||P.bossDone[id])return;
 let x,y;if(id==='oldhydra'){const t=inThicket(P.x,P.y);let ok=false;for(let k=0;k<30;k++){const a=rnd(0,TAU),d=rnd(0.3,0.85)*t.r;x=t.x+Math.cos(a)*d;y=t.y+Math.sin(a)*d;const sx=(x-cam.x)*cam.s,sy=(y-cam.y)*cam.s;if(Math.abs(sx)>W/2+150||Math.abs(sy)>H/2+150){ok=true;break;}}if(!ok)return;}
 else{[x,y]=spawnPos(0.8,1.4,SP[id].r[1]*1.5);if(zoneName(x,y)!==zn)return;}
 spawnEnt(id,x,y);toast('<b>Мини-босс зоны «'+ZONES[zn].ru+'»:</b> '+SP[id].ru+'. '+SP[id].info+' Победи его — получишь уникальную мутацию.');
}
function bossKilled(e){const id=e.sp;if(P.bossDone[id])return;P.bossDone[id]=1;const node={chaos:'phago',asplanchna:'mastax',oldhydra:'nemabat'}[id];P.un[node]=1;derive();P.dna+=12;toast('<b>Мини-босс побеждён!</b> Трофей: <b>'+NODE[node].ru+'</b> — '+NODE[node].desc+' И +12 ДНК.');save();}
function makeSpores(){makeThickets();makeMolds();const r=srand(P.sporeSeed);spores=[];for(let i=0;i<Math.round(8*WK*WK);i++){let x=0,y=0;for(let k=0;k<60;k++){const a=r()*TAU,d=1300+r()*(DROP_R-1700);x=Math.cos(a)*d;y=Math.sin(a)*d;if(siltAt(x,y)>0.5&&!inThicket(x,y))break;}spores.push({id:i,x,y,prog:0,seed:r()});}}
function spawnCyclops(kind){kind=kind||(R_()<0.5?'cyclops':'daphnia');const a=rnd(0,TAU),d=viewD()*0.9+800;let x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;const l=Math.hypot(x,y);if(l>DROP_R*0.95){x*=DROP_R*0.95/l;y*=DROP_R*0.95/l;}const e=spawnEnt(kind,x,y);e.a=Math.atan2(P.y-y,P.x-x);e.life=rnd(120,160);e.deaths0=P.stats.deaths;cycE=e;toast(kind==='cyclops'?'Вода дрогнула — в каплю попал <b>циклоп</b>! Все разбегаются. Не попадайся ему в пасть. Заросли нитчатки — хорошее укрытие.':'Капля качнулась — прискакала <b>дафния</b>! Она фильтрует воду и затягивает всё мелкое. Держись подальше или прячься в зарослях.');}
function doZap(){if(!hasN('electro')||P.zapCd>0||paused||!started)return;P.zapCd=8;const rr=D.R+90;zaps.push({x:P.x,y:P.y,r:rr,t:0.45});for(const e of ents){const s=SP[e.sp];if(!s||s.kind==='food'||e.ally||e.eaten||e.dead)continue;if(Math.hypot(e.x-P.x,e.y-P.y)-e.r<rr){e.hp-=15;e.aggro=2;e.poison=Math.max(e.poison||0,1);if(e.hp<=0)killEnt(e);}}}
function updateSpores(dt){
 sporeMsgT-=dt;
 for(const s of spores){if(P.sporesOpen[s.id])continue;const d=Math.hypot(s.x-P.x,s.y-P.y);if(d>D.R+300)continue;
  if(!P.hintsDone.spore){const sx=(s.x-cam.x)*cam.s,sy=(s.y-cam.y)*cam.s;if(Math.abs(sx)<W/2&&Math.abs(sy)<H/2){P.hintsDone.spore=1;qtoast('Ты нашёл <b>древнюю спору</b> в иле. Внутри — редкая ДНК, которой нет в обычном древе. Вскрыть её смогут только <b>ложноножки</b>.');}}
  if(d>D.R+55)continue;
  let near=false;for(const w of D.cw)if(w.t==='pseudo'&&w.edge&&Math.hypot(w.wx-s.x,w.wy-s.y)<CELL_R+38){near=true;break;}
  if(near){s.prog+=dt;if(s.prog>=2)openSpore(s);}
  else{s.prog=Math.max(0,s.prog-dt*0.4);if(sporeMsgT<=0&&d<D.R+20){sporeMsgT=6;pop(s.x,s.y-24,hasN('pseudo')?'Подведи ложноножку к споре':'Нужны ложноножки','#bfe0ff');}}}
}
function openSpore(s){P.sporesOpen[s.id]=1;P.stats.spores++;P.dna+=5;const rare=NODES.filter(n=>n.rare&&!n.trophy&&!P.un[n.id]);if(rare.length){const n=pick(rare);P.un[n.id]=1;derive();toast('Спора вскрыта! Древняя ДНК дала редкий орган: <b>'+n.ru+'</b>. '+n.desc+' И ещё +5 ДНК.');pop(s.x,s.y-20,n.ru+'!','#ffd47a');}else{P.dna+=10;toast('Спора вскрыта: +15 ДНК (все редкие органы уже есть).');}save();}
function orgCap(){return Math.round(9+Math.min(6,(D.R||10)*0.08))+6;}
function maxAllies(){return 2+Math.floor(D.n/8);}
function lifePop(e,txt){const sx=(e.x-cam.x)*cam.s,sy=(e.y-cam.y)*cam.s;if(Math.abs(sx)<W/2&&Math.abs(sy)<H/2)pop(e.x,e.y-e.r-8,txt,'#bfe0ff');}
function fillWorld(all){
 const d=viewD();let food=0,org=0,plas=0;
 let vir=0;for(const e of ents){const s=SP[e.sp];if(e.sp==='plasmid')plas++;else if(!s||s.kind==='food')food++;else if(s.kind==='virus')vir++;else if(s.kind==='rival'||s.boss){}else org++;}
 const foodTarget=Math.round((all?110:95)*(1+(1-ECO.paramecium)*0.5+(1-(ECO.rotifer||1))*0.2)),orgTarget=Math.round(9+Math.min(6,(D.R||10)*0.08));
 let guard=0;
 while(food<foodTarget&&guard++<200){const[x,y]=all?spawnPos(0,1.25):spawnPos(0.75,1.3);
  const L=lightAt(x,y),sl=siltAt(x,y);if(sl>0.5&&R_()<0.3){spawnFood(x,y,'detritus',rnd(0.8,1.8));food++;continue;}const kind=R_()<(0.25+L*0.5)*(1-sl*0.8)?'chlorella':R_()<0.55?'coccus':'bacil';
  const n=kind==='coccus'?1+((R_()*4)|0):1;for(let i=0;i<n;i++){spawnEnt(kind,x+rnd(-12,12),y+rnd(-12,12));food++;}}
 const w=spWeights();for(const k in w){if(ECO[k]!=null)w[k]*=ECO[k];}w.didinium*=Math.pow(ECO.paramecium,1.6);
 const keys=Object.keys(w);let tot=0;for(const k of keys)tot+=w[k];
 guard=0;
 while(org<orgTarget&&guard++<60){const[x,y]=all?spawnPos(0.35,1.3):spawnPos(0.8,1.4,200);const zw=ZW[zoneName(x,y)]||{};let tz=0;const ww={};for(const kk of keys){ww[kk]=w[kk]*(zw[kk]!=null?zw[kk]:1);tz+=ww[kk];}
  let r=R_()*tz,k=keys[0];for(const kk of keys){r-=ww[kk];if(r<=0){k=kk;break;}}
  if(zoneName(x,y)==='thicket'&&SP[k].r[0]>60&&k!=='hydra'&&k!=='stentor')continue;
  if(k==='vorticella'){const n=3+((R_()*4)|0),a0=rnd(0,TAU);for(let i=0;i<n;i++){const v=spawnEnt(k,x,y);v.ax=x;v.ay=y;v.sa=a0+(i-(n-1)/2)*0.38+rnd(-0.1,0.1);v.len=rnd(55,95);v.coil=0;}org+=n;}
  else if(k==='paramecium'){const gid=++grpId,n=3+((R_()*4)|0),a0=rnd(0,TAU);for(let i=0;i<n;i++){const e2=spawnEnt(k,x+rnd(-90,90),y+rnd(-90,90));e2.grp=gid;e2.a=e2.wa=a0+rnd(-0.3,0.3);}org+=n;}
  else{spawnEnt(k,x,y);org++;}}
 const noc=ents.reduce((n,e)=>n+(e.sp==='noct'&&!e.eaten?1:0),0);if(DAYK<0.6&&noc<30&&R_()<0.5){const[x,y]=spawnPos(0.4,1.2);for(let i=0;i<3;i++)spawnEnt('noct',x+rnd(-40,40),y+rnd(-40,40));}
 if(vir<10&&R_()<(all?1:0.05)){const bs=ents.filter(e=>(e.sp==='coccus'||e.sp==='bacil')&&Math.hypot(e.x-P.x,e.y-P.y)>scrDiag()*(all?0.3:1.05));const b0=bs.length?pick(bs):null;if(b0)for(let i=0;i<4;i++)spawnEnt('phage',b0.x+rnd(-30,30),b0.y+rnd(-30,30));}
 if(plas<(hasN('adhesion')?3:4)&&R_()<(all?1:(hasN('adhesion')?0.02:0.03))){const[x,y]=spawnPos(all?0.3:(hasN('adhesion')?0.8:0.55),hasN('adhesion')?1.3:1.05);spawnFood(x,y,'plasmid',1);}
}
function despawn(){const lim=Math.max(viewD()*1.9,scrDiag()*2.1);ents=ents.filter(e=>{if(e.eaten>=1||e.dead)return false;if(e.ally||e===cycE)return true;if((e.rival||e.boss)&&Math.hypot(e.x-P.x,e.y-P.y)<scrDiag()*4)return true;if(e.sp==='kin'&&e.life<=0)return false;const d=Math.hypot(e.x-P.x,e.y-P.y);return d<lim;});}

/* ========== ввод ========== */
const keys={};let mouse={x:0,y:0,on:false,down:false,moved:0},touchMode=false,lastInput='mouse';
addEventListener('keydown',e=>{
 if(e.target.tagName==='INPUT')return;
 keys[e.code]=true;
 if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))lastInput='keys';
 if(e.code==='KeyE'&&!setOpen){toggleEditor();e.preventDefault();}
 if(e.code==='Space'){doDash();e.preventDefault();}
 if(e.code==='KeyQ'){doZap();}
 if(e.code==='KeyR'){tryInfest();}
 if(e.code==='KeyP'||e.code==='Escape'){if(pendingMut)return;if(achOpen)toggleAch();else if(setOpen)toggleSettings();else if(editorOpen)toggleEditor();else if(started)setPause(!paused);}
 const mi=['Digit1','Digit2','Digit3','Digit4'].indexOf(e.code);if(mi>=0&&!editorOpen)setMode(MODE_KEYS[mi]);
});
addEventListener('keyup',e=>{keys[e.code]=false;});
cv.addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.on=true;if(e.pointerType==='mouse'){lastInput='mouse';touchMode=false;}});
cv.addEventListener('pointerdown',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.down=true;mouse.on=true;if(e.pointerType!=='mouse'){touchMode=true;lastInput='touch';}else lastInput='mouse';});
addEventListener('pointerup',()=>{mouse.down=false;});
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')mouse.on=false;});
function inputDir(){
 let dx=0,dy=0;
 if(keys.KeyW||keys.ArrowUp)dy-=1;if(keys.KeyS||keys.ArrowDown)dy+=1;if(keys.KeyA||keys.ArrowLeft)dx-=1;if(keys.KeyD||keys.ArrowRight)dx+=1;
 if(dx||dy){const l=Math.hypot(dx,dy);return[dx/l,dy/l,1];}
 if(lastInput==='keys')return[0,0,0];
 if((touchMode&&mouse.down)||(!touchMode&&mouse.on)){
  const wx=cam.x+(mouse.x-W/2)/cam.s,wy=cam.y+(mouse.y-H/2)/cam.s;const ddx=wx-P.x,ddy=wy-P.y,l=Math.hypot(ddx,ddy);
  const thr=clamp((l-D.R*0.6)/(D.R*2.5+20),0,1);if(l<0.01)return[0,0,0];return[ddx/l,ddy/l,thr];
 }
 return[0,0,0];
}
function doDash(){if(!started||paused||!D.dashCd||P.dashCd>0)return;P.dashT=0.35;P.dashCd=D.dashCd;}

/* ========== игрок ========== */
function updatePlayer(dt){
 calcDay();regrowTick(dt);
 if(host)hostTick(dt);
 const[dx,dy,thr]=host?[0,0,0]:inputDir();
 if(thr>0){const da=Math.atan2(dy,dx);let diff=((da-P.a+Math.PI*3)%TAU)-Math.PI;const mt=D.turn*dt;P.a+=clamp(diff,-mt,mt);}
 const fx=Math.cos(P.a),fy=Math.sin(P.a);
 let face=1;if(thr>0){const da=Math.atan2(dy,dx);face=Math.max(0.2,Math.cos(((da-P.a+Math.PI*3)%TAU)-Math.PI));}
 let tv=D.speed*thr*face*(P.starving?0.7:1);if(P.dashT>0){P.dashT-=dt;tv=Math.max(tv,D.speed)*3.2;}
 const k=Math.min(1,dt*9);P.vx+=(fx*tv-P.vx)*k;P.vy+=(fy*tv-P.vy)*k;
 const fl=flow(P.x,P.y);if(!host){P.x+=(P.vx+fl[0]*0.6)*dt;P.y+=(P.vy+fl[1]*0.6)*dt;}
 const dc=Math.hypot(P.x,P.y);if(dc>DROP_R-D.R){P.x*=(DROP_R-D.R)/dc;P.y*=(DROP_R-D.R)/dc;}
 if(P.dashCd>0)P.dashCd-=dt;if(P.inv>0)P.inv-=dt;if(P.hurt>0)P.hurt-=dt;P.lastHit+=dt;
 if(D.photo){const g=D.photo*lightAt(P.x,P.y)*dt;gain(g,true);}
 if(P.sat==null)P.sat=1;P.sat-=D.met*(0.7+0.6*Math.min(1,Math.hypot(P.vx,P.vy)/(D.speed||1)))*dt;
 if(P.sat<=0){P.sat=0;P.starving=true;deathCause='голод';P.hp-=D.hpMax*0.012*dt;P.lastHit=0;if(P.hp<=0){P.sat=0.5;playerDie();}}else P.starving=false;
 if(P.lastHit>3)P.hp=Math.min(D.hpMax,P.hp+D.hpMax*0.02*dt*(hasN('regen')?3:1));else if(hasN('regen'))P.hp=Math.min(D.hpMax,P.hp+D.hpMax*0.01*dt);
 if(P.cystCd>0)P.cystCd-=dt;if(P.zapCd>0)P.zapCd-=dt;
 if(Object.keys(P.defects).length){P.defT+=dt;if(P.defT>=240){P.defT=0;const k=Object.keys(P.defects)[0];P.defects[k]--;if(P.defects[k]<=0){delete P.defects[k];P.stats.cured++;toast('Естественный отбор вылечил дефект: <b>'+DEFECTS[k].ru+'</b>.');}else toast('Отбор работает: дефект «'+DEFECTS[k].ru+'» ослабевает.');derive();}}
 if(D.slime){P.slimeT-=dt;if(P.slimeT<=0){P.slimeT=0.12;const w=D.cw[(R_()*D.cw.length)|0];slime.push({x:w.wx,y:w.wy,t:6,r:CELL_R*rnd(0.8,1.4)});}}
 for(const s of slime)s.t-=dt;slime=slime.filter(s=>s.t>0);
 if(D.sting){P.stingCd-=dt;if(P.stingCd<=0){fireSting();}}
 P.stats.time+=dt;P.stats.sinceDeath+=dt;
 if(P.vacs){for(const v of P.vacs)v.t+=dt*(D.digest||1);P.vacs=P.vacs.filter(v=>v.t<v.dur);}
}
function gain(b,photo){
 b*=hasN('adhesion')?0.7:1;const before=P.biomass;P.biomass+=b*(photo?1:D.digest);P.sat=Math.min(1,(P.sat==null?1:P.sat)+b*D.satGain*(photo?1.6:1));
 if(!hasN('adhesion')&&P.biomass>=14){P.biomass-=14;divide();}
}
function divide(){
 P.stats.div++;P.dna+=1;const k=spawnFood(P.x-Math.cos(P.a)*12,P.y-Math.sin(P.a)*12,'kin',0);k.vx=-Math.cos(P.a)*30;k.vy=-Math.sin(P.a)*30;k.hue=P.hue;k.r=CELL_R;k.t0=P.cells[0].t;
 pop(P.x,P.y-14,'Деление! +1 ДНК','#ffd47a');
 if(P.stats.div===1)toast('Клетка поделилась, но дочь уплыла: у вас нет <b>адгезии</b>. Открой её в «Эволюции» (E).');
}
function fireSting(){
 const range=D.R+70+(hasN('nemabat')?60:0);let best=null,bd=1e9;
 for(const e of ents){const s=SP[e.sp];if(!s||s.kind==='food'||s.kind==='virus'||e.eaten||e.ally||e.sp==='kin'||e.sp==='plasmid')continue;const d=Math.hypot(e.x-P.x,e.y-P.y)-e.r;if(d<range&&d<bd){bd=d;best=e;}}
 if(!best){P.stingCd=0.3;return;}
 let src=D.cw.filter(w=>w.t==='sting'&&w.edge);if(!src.length)src=[D.cw[0]];const w=pick(src);
 shots.push({x1:w.wx,y1:w.wy,x2:best.x,y2:best.y,t:0.25});best.hp-=8;best.poison=3;best.aggro=3;
 P.stingCd=1.6/Math.max(1,D.sting*0.7)/(hasN('nemabat')?2:1);
 if(best.hp<=0)killEnt(best);
}
function hurt(amount,c){
 if(P.inv>0)return;const cellT=c&&typeof c==='object'?c.t:c;
 const mult=cellT==='armor'?0.5:1;P.hp-=amount*mult;P.hurt=0.25;P.lastHit=0;if(c&&typeof c==='object')woundCell(c,amount*mult);
 if(P.hp<=0&&hasN('cystn')&&P.cystCd<=0){P.hp=D.hpMax*0.3;P.inv=3;P.cystCd=120;toast('<b>Циста!</b> Тело свернулось в прочную оболочку и выжило. Следующий раз — через 2 минуты.');return;}
 if(P.hp<=0)playerDie();
}
let deathCause='';
function playerDie(){
 P.stats.deaths++;P.gen++;P.stats.sinceDeath=0;P.defT=0;
 const cured=[];for(const k in P.defects){P.defects[k]--;if(P.defects[k]<=0){delete P.defects[k];cured.push(DEFECTS[k].ru);P.stats.cured++;}}
 let newDef=null;if(R_()<0.25){const o=Object.keys(DEFECTS).filter(k=>!P.defects[k]);if(o.length){newDef=pick(o);P.defects[newDef]=2;}}
 derive();const lost=Math.round(P.biomass*0.3);P.biomass-=lost;
 const a=rnd(0,TAU);P.x+=Math.cos(a)*600;P.y+=Math.sin(a)*600;const dc=Math.hypot(P.x,P.y);if(dc>DROP_R*0.9){P.x*=DROP_R*0.9/dc;P.y*=DROP_R*0.9/dc;}
 P.hp=D.hpMax;P.inv=3;P.vx=P.vy=0;P.vacs=[];P.sat=Math.max(P.sat||0,0.6);
 ents=ents.filter(e=>Math.hypot(e.x-P.x,e.y-P.y)>viewD()*0.5||(SP[e.sp]&&SP[e.sp].kind==='food'));
 cam.x=P.x;cam.y=P.y;
 if(window.__deaths)window.__deaths.push(deathCause);toast('Ты погиб'+(deathCause?' ('+deathCause+')':'')+'. Род продолжает потомок — <b>поколение '+P.gen+'</b>. Потеряно '+lost+' биомассы.');
 save();
 offerMutation(newDef,cured);
}

/* ========== существа ========== */
function nearestCellDist(x,y){let bd=1e9,bw=null;for(const w of D.cw){const d=Math.hypot(w.wx-x,w.wy-y);if(d<bd){bd=d;bw=w;}}return[bd,bw];}
function discover(e){const s=SP[e.sp];if(!s||s.kind==='food'||P.seen[e.sp])return;P.seen[e.sp]=1;qtoast('Новый вид в поле зрения: <b>'+s.ru+'</b>'+(s.real?'':' (выдуманный)')+'. '+s.info);}
function onAte(e){const s=SP[e.sp];if(!s||s.kind==='food')return;if(!P.ate[e.sp]){P.ate[e.sp]=1;P.dna+=2;pop(e.x,e.y-e.r-6,'Открытие: '+s.ru+' +2 ДНК','#ffd47a');}}
function killEnt(e){
 if(e.dead||e.eaten)return;e.dead=true;const s=SP[e.sp];P.stats.kills++;ecoHit(e.sp);if(s.boss)bossKilled(e);P.killed[e.sp]=(P.killed[e.sp]||0)+1;if(e.sp==='egg')P.stats.eggs++;
 const n=Math.max(2,Math.min(10,Math.round(s.food/3)));for(let i=0;i<n;i++){const d=spawnFood(e.x+rnd(-1,1)*e.r*0.6,e.y+rnd(-1,1)*e.r*0.6,'detritus',s.food/n*0.9);d.vx=rnd(-15,15);d.vy=rnd(-15,15);}
 giveDna(e,s.dna);onAte(e);
}
function addVac(e){if(!D.cw||!D.cw.length)return;P.vacs=P.vacs||[];let bi=0,bd=1e9;for(let i=0;i<D.cw.length;i++){const w=D.cw[i];const d=Math.hypot(w.wx-e.x,w.wy-e.y);if(d<bd){bd=d;bi=i;}}
 if(P.vacs.filter(v=>v.ci===bi).length>=3)bi=(R_()*D.cw.length)|0;const s=SP[e.sp];const fv=e.sp==='detritus'?e.food:(s?s.food:1);
 P.vacs.push({ci:bi,ox:rnd(-1,1)*CELL_R*0.35,oy:rnd(-1,1)*CELL_R*0.35,sz:clamp(1.6+Math.sqrt(e.r)*0.9,2.2,CELL_R*0.5),k:e.sp,t:0,dur:clamp(3.5+fv*1.1,4.5,18)});if(P.vacs.length>45)P.vacs.shift();}
function eatEnt(e){
 if(e.eaten)return;e.eaten=0.001;e.by=null;const s=SP[e.sp];
 if(e.sp==='plasmid'){P.dna+=1;pop(e.x,e.y,'+1 ДНК','#ffd47a');return;}
 if(e.sp==='kin'){return;}
 addVac(e);
 const f=e.sp==='detritus'?e.food:s.food*(e.hp/e.maxHp*0.5+0.5);gain(f);P.stats.eaten++;
 if(s&&s.kind!=='food'){ecoHit(e.sp);P.killed[e.sp]=(P.killed[e.sp]||0)+1;if(e.sp==='egg')P.stats.eggs++;giveDna(e,s.dna);onAte(e);pop(e.x,e.y+8,'+'+f.toFixed(0)+' биомассы','#e8c860');}
}
function finishDiv(e,s){
 const type=e.div.type,r0=e.r;e.div=null;const k=type==='long'?0.95:e.sp==='amoeba'?0.72:0.6;const nr=r0*k;
 const c=Math.cos(e.a),sn=Math.sin(e.a);let ox,oy;if(type==='long'){ox=-sn*r0*0.3;oy=c*r0*0.3;}else if(e.sp==='amoeba'){ox=-sn*r0*0.75;oy=c*r0*0.75;}else{ox=c*r0*0.5;oy=sn*r0*0.5;}
 const b=spawnEnt(e.sp,e.x+ox,e.y+oy);b.a=b.wa=e.a+(type==='long'?0.25:0);b.grp=e.grp;b.r=nr;b.maxHp=s.hp*(nr/s.r[0])**1.2;b.hp=b.maxHp;b.growTo=r0;
 e.x-=ox;e.y-=oy;e.a+=(type==='long'?-0.25:0);e.wa=e.a;e.r=nr;e.maxHp=b.maxHp;e.hp=e.maxHp;e.growTo=r0;e.prevHp=e.hp;
}
function steer(e,ang,dt,turn){let diff=((ang-e.a+Math.PI*3)%TAU)-Math.PI;const m=turn*dt;e.a+=clamp(diff,-m,m);}
function updateEnts(dt){
 const pR=D.R;
 const GRP={};orgCount=0;allyCount=0;
 for(const e of ents){if(e.dead||e.eaten)continue;const s0=SP[e.sp];if(s0&&s0.kind!=='food'&&s0.kind!=='virus'&&s0.kind!=='rival'&&!s0.boss)orgCount++;if(e.ally)allyCount++;
  if(e.grp){const g=GRP[e.grp]||(GRP[e.grp]={x:0,y:0,hx:0,hy:0,n:0,alarm:0});g.x+=e.x;g.y+=e.y;g.hx+=Math.cos(e.a);g.hy+=Math.sin(e.a);g.n++;if(e.fleeT>0)g.alarm=1;}}
 if(allyCount>P.stats.maxAllies)P.stats.maxAllies=allyCount;
 for(const e of ents){
  if(e.eaten){e.eaten+=dt*3;if(e.by&&!e.by.dead){e.x+=(e.by.x-e.x)*dt*4;e.y+=(e.by.y-e.y)*dt*4;}else if(!e.by){e.x+=(P.x-e.x)*dt*5;e.y+=(P.y-e.y)*dt*5;}continue;}
  if(e.rival){rivalUpdate(e,dt);continue;}
  e.t+=dt;const s=SP[e.sp];const fl=flow(e.x,e.y);
  if(e.prevHp!=null&&e.hp<e.prevHp-0.001)e.hitT=4;e.prevHp=e.hp;if(e.hitT>0)e.hitT-=dt;
  if(e.poison>0){e.poison-=dt;e.hp-=3*dt;if(e.hp<=0){killEnt(e);continue;}}
  if(e.aggro>0)e.aggro-=dt;
  let slow=1;if(slime.length&&s&&s.kind!=='food'){for(const sl of slime){if(Math.abs(sl.x-e.x)<sl.r+e.r&&Math.abs(sl.y-e.y)<sl.r+e.r){slow=0.45;break;}}}
  if(!s){ // detritus, plasmid, kin
   e.x+=(fl[0]+e.vx)*dt+rnd(-1,1)*6*dt;e.y+=(fl[1]+e.vy)*dt+rnd(-1,1)*6*dt;e.vx*=0.97;e.vy*=0.97;e.a+=dt*0.3;
   if(e.sp==='kin'){e.life-=dt;e.a+=Math.sin(e.t)*dt;e.x+=Math.cos(e.a)*25*dt;e.y+=Math.sin(e.a)*25*dt;}
   continue;}
  if(e.inf>0){e.inf-=dt;if(e.inf<=0){e.dead=true;let nv=0;for(const o of ents)if(o.sp==='phage')nv++;if(nv<45)for(let k=0;k<3;k++){const v=spawnEnt('phage',e.x,e.y);v.vx=rnd(-25,25);v.vy=rnd(-25,25);}continue;}}
  if(s.kind==='virus'){e.x+=(fl[0]+e.vx+rnd(-1,1)*10)*dt;e.y+=(fl[1]+e.vy+rnd(-1,1)*10)*dt;e.vx*=0.95;e.vy*=0.95;e.tgT=(e.tgT||0)-dt;
   if(e.tgT<=0){e.tgT=0.6;e.tg=null;let bd=70;for(const o of ents){if((o.sp!=='coccus'&&o.sp!=='bacil')||o.inf>0||o.eaten||o.dead)continue;const d=Math.abs(o.x-e.x)+Math.abs(o.y-e.y);if(d<bd){bd=d;e.tg=o;}}}
   if(e.tg&&!e.tg.dead&&!e.tg.eaten){const o=e.tg,dx=o.x-e.x,dy=o.y-e.y,d=Math.hypot(dx,dy)||1;e.a=Math.atan2(-dy,-dx);e.x+=dx/d*s.spd*dt;e.y+=dy/d*s.spd*dt;if(d<o.r+e.r){o.inf=3;e.dead=true;}}
   e.life=(e.life||rnd(60,90))-dt;if(e.life<=0)e.dead=true;continue;}
  if(s.kind==='food'){
   const br=e.sp==='coccus'?14:8;e.x+=(fl[0]+rnd(-1,1)*br)*dt;e.y+=(fl[1]+rnd(-1,1)*br)*dt;
   if(e.sp==='bacil'){e.a+=Math.sin(e.t*3+e.seed*9)*dt*2;e.x+=Math.cos(e.a)*s.spd*dt;e.y+=Math.sin(e.a)*s.spd*dt;}
   if(D.slime&&Math.hypot(e.x-P.x,e.y-P.y)<pR+25){e.x+=(P.x-e.x)*dt*2;e.y+=(P.y-e.y)*dt*2;}
   continue;}
  const dP=Math.hypot(e.x-P.x,e.y-P.y);
  if(e.sp==='euglena'){
   if(e.ally){e.orb=(e.orb==null?rnd(0,TAU):e.orb)+dt*0.35;const rr=pR+e.r+18;const tx=P.x+Math.cos(e.orb)*rr,ty=P.y+Math.sin(e.orb)*rr;const ddx=tx-e.x,ddy=ty-e.y,dl=Math.hypot(ddx,ddy)||1;const sp2=Math.min(dl*2.5,Math.max(s.spd,D.speed*1.2));
    steer(e,Math.atan2(P.vy+ddy,P.vx+ddx),dt,4);e.x+=ddx/dl*sp2*dt;e.y+=ddy/dl*sp2*dt;e.vx=e.vy=0;gain(0.15*lightAt(e.x,e.y)*dt,true);if(e.hp<=0)killEnt(e);continue;}
   const pslow=Math.hypot(P.vx,P.vy)<D.speed*0.45;
   if(dP<pR+e.r+45&&pslow&&!(e.aggro>0)&&allyCount<maxAllies()&&P.inv<=0){e.bond=(e.bond||0)+dt;if(e.bond>=3){e.ally=true;e.bond=0;allyCount++;pop(e.x,e.y-e.r-8,'Симбионт!','#ffd47a');if(!P.hintsDone.ally){P.hintsDone.ally=1;toast('<b>Симбиоз!</b> Эвглена теперь плавает с тобой и делится биомассой на свету. Береги её от хищников.');}}}
   else if(e.bond)e.bond=Math.max(0,e.bond-dt*0.6);
  }
  if(e.conj){const c=e.conj,o=c.p;c.t-=dt;if(!o||o.dead||o.eaten||!o.conj||c.t<=0||(e.fleeT>0)){if(c.lead&&c.t<=0)lifePop(e,'Обмен генами завершён');e.conj=null;if(o&&o.conj&&o.conj.p===e)o.conj=null;e.wa=e.a+(c.lead?0.7:-0.7);e.r*=rnd(0.97,1.03);}
   else if(!c.lead){const L=o;e.a=L.a;const px=-Math.sin(L.a),py=Math.cos(L.a);e.x+=(L.x+px*L.r*0.66-e.x)*Math.min(1,dt*4);e.y+=(L.y+py*L.r*0.66-e.y)*Math.min(1,dt*4);e.vx=L.vx;e.vy=L.vy;e.spin=L.spin;continue;}}
  let spd=s.spd*slow*(DAYK<0.5&&(s.beh==='hunt'||s.beh==='rotifer')?1.25:1)*(DAYK<0.5&&s.beh==='photo'?0.4:1),wantA=null;
  // поведение
  let flee=(s.flee||(s.beh==='hunt'&&tierOf(e)<=D.pl&&D.pl>0))&&dP<e.r*5+pR*2&&tierOf(e)<=D.pl&&D.pl>0&&!(e.sp==='euglena'&&(e.bond>0||Math.hypot(P.vx,P.vy)<D.speed*0.45));
  if(flee||(e.aggro>0&&e.grp))e.fleeT=1.5;else if(e.fleeT>0)e.fleeT-=dt;
  if(!flee&&e.grp&&GRP[e.grp]&&GRP[e.grp].alarm&&dP<900)flee=true;
  if(s.beh==='hunt'||s.beh==='rotifer'){
   e.tgT-=dt;
   if(e.tgT<=0){e.tgT=0.5;e.tg=null;let bd=(e.r*7+150)*(DAYK<0.5?1.35:1);
    const pTarget=!host&&!s.preyOnly&&s.beh!=='rotifer'&&P.inv<=0&&tierOf(e)>D.pl&&dP<bd&&!(hasN('lumin')&&e.r<pR*2.5);
    if(pTarget){e.tg='P';bd=dP;}
    for(const o of ents){if(o===e||o.eaten||o.dead)continue;const os=SP[o.sp];if(!os||os.kind==='food'||os.kind==='virus'||os.kind==='rival')continue;if(s.preyOnly?o.sp!==s.preyOnly:(s.beh==='rotifer'?(o.r>e.r*0.3||o.sp==='egg'):o.r>e.r/1.4))continue;const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;e.tg=o;}}
   }
   if(e.tg==='P'){wantA=Math.atan2(P.y-e.y,P.x-e.x);spd*=1;}
   else if(e.tg&&!e.tg.dead&&!e.tg.eaten){const o=e.tg;wantA=Math.atan2(o.y-e.y,o.x-e.x);const d=Math.hypot(o.x-e.x,o.y-e.y);
    if(d<e.r+o.r){if(o.r<e.r*0.65||s.preyOnly===o.sp){o.eaten=0.001;o.by=e;e.tg=null;e.hp=Math.min(e.maxHp,e.hp+5);}else{o.hp-=(s.dmg||5)*dt;o.aggro=2;if(o.hp<=0){o.dead=true;e.tg=null;}}}}
   else e.tg=null;
   if(!e.tg){e.wa+=rnd(-1,1)*dt*2;wantA=e.wa;spd*=0.5;}
   if(s.beh==='rotifer'&&pR<16&&dP<e.r*2.6){const fx=Math.cos(e.a),fy=Math.sin(e.a);const hx=e.x+fx*e.r*0.9,hy=e.y+fy*e.r*0.9;const vx=hx-P.x,vy=hy-P.y,vl=Math.hypot(vx,vy);if(vl<e.r*1.6){P.x+=vx/vl*14*dt;P.y+=vy/vl*14*dt;}}
  }else if(s.beh==='photo'){
   if(e.t%2<dt*1.5){const L0=lightAt(e.x,e.y);let ba=e.a,bl=L0;for(let k=0;k<6;k++){const a=k*TAU/6;const L=lightAt(e.x+Math.cos(a)*200,e.y+Math.sin(a)*200);if(L>bl){bl=L;ba=a;}}e.wa=ba+rnd(-0.4,0.4);}
   wantA=e.wa;spd*=lightAt(e.x,e.y)>0.7?0.25:0.8;
  }else if(s.beh==='amoeba'){
   e.wa+=rnd(-1,1)*dt*0.6;wantA=e.wa;if(pR<e.r*0.6&&dP<e.r*2.5&&P.inv<=0)wantA=Math.atan2(P.y-e.y,P.x-e.x);
   for(const o of ents){if(o===e||o.eaten||!SP[o.sp]||o.r>e.r*0.5)continue;if(Math.abs(o.x-e.x)<e.r&&Math.abs(o.y-e.y)<e.r&&Math.hypot(o.x-e.x,o.y-e.y)<e.r*0.9){o.eaten=0.001;o.by=e;}}
  }else if(s.beh==='sessile'){
   e.x+=(e.ax-e.x)*dt;e.y+=(e.ay-e.y)*dt;e.a+=Math.sin(e.t*0.3)*dt*0.1;spd=0;
   const fx=Math.cos(e.a),fy=Math.sin(e.a),cx=e.x+fx*e.r*0.85,cy=e.y+fy*e.r*0.85;
   for(const o of ents){if(o.eaten||o===e||o.r>e.r*0.15)continue;const vx=cx-o.x,vy=cy-o.y,vl=Math.hypot(vx,vy);if(vl<e.r*0.9&&vl>1){o.x+=(vx/vl*40-vy/vl*25)*dt;o.y+=(vy/vl*40+vx/vl*25)*dt;if(vl<e.r*0.12){o.eaten=0.001;o.by=e;}}}
   if(!host&&P.inv<=0&&D.pl<tierOf(e)&&pR<e.r*0.5){const vx=cx-P.x,vy=cy-P.y,vl=Math.hypot(vx,vy),reach=e.r*1.35;if(vl<reach&&vl>0.5){const k=1-vl/reach,pull=25+75*k*k;P.x+=(vx/vl*pull-vy/vl*pull*0.55)*dt;P.y+=(vy/vl*pull+vx/vl*pull*0.55)*dt;e.suck=1;if(!P.hintsDone.stentor){P.hintsDone.stentor=1;toast('<b>Трубач затягивает тебя в воронку!</b> Плыви прочь изо всех сил или делай рывок — в его рту не выжить.');}
    if(vl<e.r*0.16+pR*0.3){deathCause='всосан трубачом';P.hp=0;hurt(D.hpMax*5,null);}}}
  }else if(s.beh==='egg'){spd=0;
  }else if(s.beh==='hydra'){
   e.x+=(e.ax-e.x)*dt;e.y+=(e.ay-e.y)*dt;e.a+=Math.sin(e.t*0.25)*dt*0.15;spd=0;
   const mx=e.x+Math.cos(e.a)*e.r*0.9,my=e.y+Math.sin(e.a)*e.r*0.9,reach=e.r*2.3;
   for(const o of ents){if(o.eaten||o===e||o.r>e.r*0.35||o.sp==='egg')continue;const vx=mx-o.x,vy=my-o.y,vl=Math.hypot(vx,vy);if(vl<reach&&vl>1){o.x+=vx/vl*20*dt;o.y+=vy/vl*20*dt;if(vl<e.r*0.2){o.eaten=0.001;o.by=e;}}}
   if(P.inv<=0&&pR<e.r*1.2){const vx=mx-P.x,vy=my-P.y,vl=Math.hypot(vx,vy);if(vl<reach+pR*0.5){deathCause='щупальца гидры';hurt(s.dmg*dt,null);P.x+=vx/vl*12*dt;P.y+=vy/vl*12*dt;}}
  }else if(s.beh==='vort'){
   const disturb=dP<pR+90||(cycE&&Math.hypot(e.x-cycE.x,e.y-cycE.y)<cycE.r*1.3)||e.hitT>3.5;
   if(disturb&&e.coil<0.5){e.coil=1;if(!e.snapT||e.t-e.snapT>4){e.snapT=e.t;lifePop(e,'Щёлк!');}}else e.coil=Math.max(0,e.coil-dt*0.35);
   const ln=e.len*(1-0.82*e.coil);e.a=e.sa+Math.sin(e.t*0.7+e.seed*7)*0.12*(1-e.coil);e.x=e.ax+Math.cos(e.a)*ln;e.y=e.ay+Math.sin(e.a)*ln;e.vx=e.vy=0;
   if(e.hp<=0)killEnt(e);continue;
  }else if(s.beh==='daphnia'){
   e.life-=dt;const hop=0.2+1.6*Math.max(0,Math.sin(e.t*2.2));spd=s.spd*hop;
   const mx=e.x+Math.cos(e.a)*e.r*0.45,my=e.y+Math.sin(e.a)*e.r*0.45;
   if(e.life>0){e.wa+=rnd(-1,1)*dt*0.6;const toP=Math.atan2(P.y-e.y,P.x-e.x);wantA=dP>900?toP:e.wa;
    for(const o of ents){if(o===e||o.eaten||o.dead||o.r>60||o.sp==='kin')continue;const vx=mx-o.x,vy=my-o.y,vl=Math.hypot(vx,vy);if(vl<620&&vl>1){o.x+=vx/vl*34*dt;o.y+=vy/vl*34*dt;if(vl<e.r*0.18){o.eaten=0.001;o.by=e;}}}
    if(P.inv<=0&&pR<45&&!inThicket(P.x,P.y)){const vx=mx-P.x,vy=my-P.y,vl=Math.hypot(vx,vy);if(vl<620){P.x+=vx/vl*26*dt;P.y+=vy/vl*26*dt;if(vl<e.r*0.2+pR){deathCause='отфильтрован дафнией';hurt(s.dmg*dt,null);}}}
   }else{wantA=Math.atan2(e.y-P.y,e.x-P.x);spd=s.spd*1.2;
    if(dP>viewD()*2.2+e.r){e.dead=true;cycE=null;if(P.stats.deaths===e.deaths0){P.stats.cycSurv++;toast('Дафния ускакала. <b>Ты пережил нашествие!</b>');}else toast('Дафния ускакала из этой части капли.');}}
  }else if(s.beh==='worm'){
   e.wa+=rnd(-1,1)*dt*1.2;wantA=e.wa+Math.sin(e.t*3)*0.4;
  }else if(s.beh==='cyclops'){
   e.life-=dt;const hop=0.25+1.5*Math.max(0,Math.sin(e.t*2.6));spd=s.spd*hop;
   const mx=e.x+Math.cos(e.a)*e.r*0.9,my=e.y+Math.sin(e.a)*e.r*0.9;
   if(e.life>0){
    if(e.rest>0){e.rest-=dt;spd*=0.3;}
    e.tgT=(e.tgT||0)-dt;if(e.tgT<=0){e.tgT=0.6;e.tg=null;let bd=900;if(P.inv<=0&&dP<650){e.tg='P';bd=dP;}for(const o of ents){if(o===e||o.eaten||o.dead||!SP[o.sp]||SP[o.sp].kind==='food'||o.r>130)continue;const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;e.tg=o;}}}
    if(e.tg==='P')wantA=Math.atan2(P.y-e.y,P.x-e.x);else if(e.tg&&!e.tg.dead&&!e.tg.eaten)wantA=Math.atan2(e.tg.y-e.y,e.tg.x-e.x);else{e.wa+=rnd(-1,1)*dt;wantA=e.wa;}
    for(const o of ents){if(o===e||o.eaten||!SP[o.sp]||o.r>130)continue;if(Math.hypot(o.x-mx,o.y-my)<o.r+e.r*0.22){o.eaten=0.001;o.by=e;e.rest=2.5;e.tg=null;}}
    if(P.inv<=0&&Math.hypot(P.x-mx,P.y-my)<pR+e.r*0.25){deathCause='съеден циклопом';hurt(s.dmg*dt,null);}
   }else{wantA=Math.atan2(e.y-P.y,e.x-P.x);spd=s.spd;
    if(dP>viewD()*2.2+e.r){e.dead=true;cycE=null;if(P.stats.deaths===e.deaths0){P.stats.cycSurv++;toast('Циклоп уплыл. <b>Ты пережил нашествие!</b>');}else toast('Циклоп уплыл из этой части капли.');}}
  }else if(s.beh==='trap'||s.beh==='drift'||s.beh==='roll'||s.beh==='glide'){
   e.wa+=rnd(-1,1)*dt*0.5;wantA=e.wa;
  }else{ // wander
   e.wa+=rnd(-1,1)*dt*1.4;wantA=e.wa;
   if(e.sp==='paramecium'&&!e.conj&&!e.div&&!e.fleeT&&R_()<dt/70){let bd=260,pp=null;for(const o of ents){if(o===e||o.sp!=='paramecium'||o.conj||o.div||o.eaten||o.dead)continue;const d=Math.hypot(o.x-e.x,o.y-e.y);if(d<bd){bd=d;pp=o;}}if(pp){e.conj={p:pp,t:8,lead:true};pp.conj={p:e,t:8,lead:false};lifePop(e,'Конъюгация');}}
   const g=e.grp&&GRP[e.grp];if(g&&g.n>1){const cx=g.x/g.n,cy=g.y/g.n,cd=Math.hypot(cx-e.x,cy-e.y)||1;const coh=cd>e.r*2.4?Math.min(2,cd/(e.r*3)):cd<e.r*1.4?-1.2:0;let sx=0,sy=0;for(const o of ents){if(o===e||o.grp!==e.grp)continue;const ox=e.x-o.x,oy=e.y-o.y,od=Math.hypot(ox,oy);if(od<e.r*1.6&&od>0.1){sx+=ox/od*(1-od/(e.r*1.6))*2.5;sy+=oy/od*(1-od/(e.r*1.6))*2.5;}}const vx=Math.cos(e.wa)*0.4+g.hx/g.n+(cx-e.x)/cd*coh+sx,vy=Math.sin(e.wa)*0.4+g.hy/g.n+(cy-e.y)/cd*coh+sy;wantA=Math.atan2(vy,vx);}
  }
  if(flee){wantA=Math.atan2(e.y-P.y,e.x-P.x);spd=s.spd*1.15*slow;}
  if(e.aggro>0&&s.flee){spd=s.spd*1.2;}
  if(cycE&&cycE!==e&&cycE.life>0&&s.spd>0&&s.beh!=='cyclops'){const dc=Math.hypot(e.x-cycE.x,e.y-cycE.y);if(dc<1100){wantA=Math.atan2(e.y-cycE.y,e.x-cycE.x);spd=s.spd*1.3*slow;}}
  if(e.sp==='paramecium'&&e.aggro>0&&dP<e.r+pR+50){e.tri=(e.tri||0)-dt;if(e.tri<=0){e.tri=2.5;const ba=Math.atan2(P.y-e.y,P.x-e.x);for(let k=0;k<8;k++){const a=ba+rnd(-0.6,0.6);shots.push({x1:e.x+Math.cos(a)*e.r*0.4,y1:e.y+Math.sin(a)*e.r*0.3,x2:e.x+Math.cos(a)*(e.r*0.4+70),y2:e.y+Math.sin(a)*(e.r*0.3+70),t:0.35,c:'tri'});}if(P.inv<=0){deathCause='трихоцисты туфельки';hurt(4,null);}lifePop(e,'Трихоцисты!');}}
  if(e===host&&hasN('puppet')){const[ix,iy,th]=inputDir();if(th>0){wantA=Math.atan2(iy,ix);spd=Math.max(spd,(s.spd||20)*1.1)*th;}else spd*=0.15;e.tg=null;e.fleeT=0;}
  if(wantA!==null)steer(e,wantA,dt,s.turn||1);
  if(Math.hypot(e.x,e.y)>DROP_R*0.97){e.wa=Math.atan2(-e.y,-e.x);}
  if(e.div)spd*=0.15;if(e.conj)spd*=0.35;
  let tvx=Math.cos(e.a)*spd,tvy=Math.sin(e.a)*spd;if((e.sp==='paramecium'||e.sp==='euglena')&&!e.conj){const wv=Math.sin(e.t*3.2+e.seed*9)*spd*0.45;tvx+=-Math.sin(e.a)*wv;tvy+=Math.cos(e.a)*wv;e.spin=(e.spin||0)+dt*(spd>5?3.2:0.6);}
  const kk=Math.min(1,dt*7);e.vx+=(tvx-e.vx)*kk;e.vy+=(tvy-e.vy)*kk;
  const fk=s.beh==='sessile'?0:1;e.x+=(e.vx+fl[0]*fk)*dt;e.y+=(e.vy+fl[1]*fk)*dt;
  if(e.r>34&&s.beh!=='hydra'&&s.beh!=='sessile'&&s.beh!=='egg'){for(const t of thickets){const dd=Math.hypot(e.x-t.x,e.y-t.y);if(dd<t.r+e.r*0.8&&dd>1){const m=t.r+e.r*0.8-dd;e.x+=(e.x-t.x)/dd*m*0.5;e.y+=(e.y-t.y)/dd*m*0.5;if(s.spd)e.wa=Math.atan2(e.y-t.y,e.x-t.x);}}}
  if(e.sp==='volvox')e.spin=(e.spin||0)+dt*0.4;
  if(e.growTo&&e.r<e.growTo){e.r=Math.min(e.growTo,e.r+dt*1.6);e.maxHp=s.hp*(e.r/s.r[0])**1.2;e.hp=Math.min(e.maxHp,e.hp+dt*2);}
  if(orgCount<orgCap()){
   if(!e.div&&!e.conj&&((e.sp==='amoeba'&&e.r>115&&R_()<dt/40)||(e.sp==='paramecium'&&e.r>=s.r[0]*0.95&&R_()<dt/80)||(e.sp==='euglena'&&e.r>=s.r[0]*0.95&&R_()<dt/70))&&e.hp>e.maxHp*0.8){e.div={t:0,dur:e.sp==='amoeba'?6:4.5,type:e.sp==='euglena'?'long':'trans'};orgCount++;lifePop(e,e.sp==='euglena'?'Эвглена делится вдоль':e.sp==='amoeba'?'Амёба делится':'Туфелька делится');}
   else if(false){const nr=e.r*0.72;e.r=nr;e.maxHp=s.hp*(nr/s.r[0])**1.2;e.hp=e.maxHp;e.growTo=rnd(110,160);const b=spawnEnt('amoeba',e.x+nr*1.7*Math.cos(e.a+1.57),e.y+nr*1.7*Math.sin(e.a+1.57));b.r=nr;b.maxHp=e.maxHp;b.hp=b.maxHp;b.growTo=rnd(110,160);orgCount++;lifePop(e,'Амёба делится');}
   else if(e.sp==='rotifer'&&e.r>=65&&R_()<dt/28){const eg=spawnEnt('egg',e.x-Math.cos(e.a)*e.r*1.3,e.y-Math.sin(e.a)*e.r*1.3);eg.t=0;orgCount++;lifePop(e,'Коловратка отложила яйцо');}
   else if(e.sp==='volvox'&&e.r>150&&R_()<dt/45){const d2=spawnEnt('volvox',e.x+rnd(-1,1)*e.r*0.3,e.y+rnd(-1,1)*e.r*0.3);d2.r=rnd(40,55);d2.maxHp=s.hp*(d2.r/s.r[0])**1.2;d2.hp=d2.maxHp;d2.growTo=rnd(150,210);orgCount++;lifePop(e,'Вольвокс выпустил дочернюю колонию');}
  }
  if(e.div){e.div.t+=dt;if(e.div.t>=e.div.dur)finishDiv(e,s);}
  if(e.sp==='egg'&&e.t>35){e.dead=true;const r2=spawnEnt('rotifer',e.x,e.y);r2.r=38;r2.maxHp=SP.rotifer.hp*(38/70)**1.2;r2.hp=r2.maxHp;r2.growTo=rnd(70,95);lifePop(e,'Из яйца вылупилась коловратка');continue;}
  if(e.hp<=0){killEnt(e);}
 }
 ents=ents.filter(e=>!(e.eaten>=1)&&!e.dead);
}
/* столкновения игрока */
function collide(dt){if(host)return;
 const pR=D.R;
 if(thickets.some(t=>Math.hypot(P.x-t.x,P.y-t.y)<t.r*1.1+pR)){let sx=0,sy=0,n=0;for(const w of D.cw){const[px,py]=filPush(w.wx,w.wy,CELL_R*0.95);if(px||py){sx+=px;sy+=py;n++;}}if(n){P.x+=sx/n;P.y+=sy/n;const vl=Math.hypot(sx,sy)||1;const dot=(P.vx*sx+P.vy*sy)/vl;if(dot<0){P.vx-=sx/vl*dot;P.vy-=sy/vl*dot;}}}
 for(const e of ents){
  if(e.eaten||e.dead)continue;const s=SP[e.sp];
  const dx=e.x-P.x,dy=e.y-P.y;const reach=e.sp==='heliozoa'?e.r*2.6:e.r;
  if(Math.abs(dx)>pR+reach+4||Math.abs(dy)>pR+reach+4)continue;
  const dP=Math.hypot(dx,dy);if(dP>pR+reach+4)continue;
  if(e.sp==='heliozoa'&&dP<pR+e.r*2.1&&pR<e.r*1.6&&P.inv<=0){P.vx*=0.85;P.vy*=0.85;deathCause='прилип к солнечнику';hurt(2.5*dt,null);}
  const[cd,cw]=nearestCellDist(e.x,e.y);const ov=CELL_R+e.r-cd;
  if(ov<=0)continue;
  if(e.sp==='kin'||e.ally||e.rival){continue;}
  if(!s||s.kind==='food'){eatEnt(e);continue;}
  // организм
  if(e.r<=pR*D.engulf&&e.sp!=='cyclops'&&tierOf(e)<=D.pl){eatEnt(e);continue;}
  const weak=tierOf(e)>D.pl?0.12:1;if(weak<1&&!P.hintsDone['tier'+tierOf(e)]&&(D.edge.spike||D.edge.mouth)){P.hintsDone['tier'+tierOf(e)]=1;toast('<b>'+SP[e.sp].ru+'</b> тебе пока не по зубам: это существо уровня '+tierOf(e)+', а твоя сила хищника — '+D.pl+'. Купи ещё атакующий орган.');}
  if(e.sp==='diatom'&&!hasN('jaws')&&P.inv<=0&&Math.hypot(P.vx,P.vy)>D.speed*0.3){deathCause='порезался о диатомею';hurt(2.5*dt,cw);}
  // атаки игрока
  let attacked=false;
  for(const w of D.cw){if(!w.edge)continue;if(w.t!=='spike'&&w.t!=='mouth')continue;const d=Math.hypot(w.wx-e.x,w.wy-e.y);if(d>CELL_R*1.6+e.r)continue;
   if(w.t==='spike'){e.hp-=D.spikeDps*dt*weak*(e.sp==='diatom'?0.4:1);if(hasN('barb'))e.poison=3;attacked=true;}
   else{const dm=D.mouthDps*dt*weak*(e.sp==='diatom'&&!hasN('jaws')?0.5:1);e.hp-=dm;gain(dm*s.food/s.hp*0.6);attacked=true;}}
  if(hasN('mastax')){let k=0;for(const w of D.cw){if(!w.edge||k>=3)continue;if(Math.hypot(w.wx-e.x,w.wy-e.y)<CELL_R*1.3+e.r){k++;const dm=2.5*dt*weak;e.hp-=dm;gain(dm*s.food/s.hp*0.4);attacked=true;}}}
  if(attacked){e.aggro=2;if(e.hp<=0){killEnt(e);continue;}}
  // урон игроку
  if(s.beh==='amoeba'&&pR<e.r*0.6){deathCause='переварен амёбой';hurt((s.edmg||7)*dt*(1-0.4*D.armorFrac),cw);P.x+=(e.x-P.x)*dt*0.8;P.y+=(e.y-P.y)*dt*0.8;continue;}
  let rotBite=false;if(s.beh==='rotifer'&&pR<e.r*0.6){const hx=e.x+Math.cos(e.a)*e.r*0.8,hy=e.y+Math.sin(e.a)*e.r*0.8;rotBite=Math.hypot(hx-P.x,hy-P.y)<pR+e.r*0.4;}
  if(s.dmg&&(s.sting||(s.beh==='hunt'&&e.tg==='P')||rotBite||(tierOf(e)>D.pl&&e.aggro>0))){deathCause='атака: '+s.ru.toLowerCase();hurt(s.dmg*dt*(tierOf(e)>D.pl?1:0.3),cw);}
  // расталкивание
  const nx=(e.x-cw.wx)/(cd||1),ny=(e.y-cw.wy)/(cd||1);const mP=D.n,mE=(e.r/10)**2;const tot=mP+mE;
  const push=Math.min(ov,6);if(s.beh!=='vort'){e.x+=nx*push*(mP/tot);e.y+=ny*push*(mP/tot);}if(s.beh!=='sessile'){}P.x-=nx*push*(mE/tot);P.y-=ny*push*(mE/tot);
 }
}

/* ========== рисование: примитивы ========== */
let PX=1;
function caOff(wx,wy){const sx=(wx-cam.x)*cam.s,sy=(wy-cam.y)*cam.s;const k=2.6/(Math.min(W,H)*0.5);return[sx*k/cam.s,sy*k/cam.s];}
function mem(path,wx,wy,ang,a,wMul,colFn){
 const lw=ST.memW*(wMul||1)*PX;
 if(ST.halo){ctx.strokeStyle=ST.halo(a);ctx.lineWidth=lw*4;path();ctx.stroke();}
 const[ox,oy]=(NOCA||!FX.ca)?[0,0]:caOff(wx,wy);
 if(ox*ox+oy*oy>(0.45*PX)**2){const c=Math.cos(-ang),s=Math.sin(-ang),lx=ox*c-oy*s,ly=ox*s+oy*c;ctx.lineWidth=lw*1.1;
  ctx.translate(lx,ly);ctx.strokeStyle=ST.caR(a);path();ctx.stroke();ctx.translate(-2*lx,-2*ly);ctx.strokeStyle=ST.caB(a);path();ctx.stroke();ctx.translate(lx,ly);}
 ctx.strokeStyle=colFn?colFn(a):ST.mem(a);ctx.lineWidth=lw;path();ctx.stroke();
}
function circ(x,y,r){ctx.beginPath();ctx.arc(x,y,Math.max(r,0.01),0,TAU);}
function ell(x,y,rx,ry,rot){ctx.beginPath();ctx.ellipse(x,y,Math.max(rx,0.01),Math.max(ry,0.01),rot||0,0,TAU);}
function blobPath(r,seed,t,amp,k){ctx.beginPath();const N=26;for(let i=0;i<=N;i++){const th=i/N*TAU;let rr=r;for(let j=1;j<=(k||3);j++)rr+=r*amp/j*Math.sin(th*(j+1)+seed*10*j+t*(0.6+j*0.3));const x=Math.cos(th)*rr,y=Math.sin(th)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
function granules(n,r,seed,t,col,size){ctx.fillStyle=col;for(let i=0;i<n;i++){const a=hash(i,seed*1e4|0)*TAU+t*0.25*(i%2?1:-1),d=Math.sqrt(hash(i+7,seed*1e4|0))*r;ctx.fillRect(Math.cos(a)*d-size/2,Math.sin(a)*d-size/2,size,size);}}
function hairsAlong(pts,len,t,col,lw,phase){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();for(let i=0;i<pts.length;i++){const[x,y,nx,ny]=pts[i];const w=Math.sin(t*8-i*0.6+(phase||0))*0.6;const ex=x+(nx+ny*w)*len,ey=y+(ny-nx*w)*len;ctx.moveTo(x,y);ctx.lineTo(ex,ey);}ctx.stroke();}
function ellipsePts(a,b,n,indent){const pts=[];for(let i=0;i<n;i++){const th=i/n*TAU;let r=1;if(indent&&Math.sin(th)>0)r-=indent*Math.exp(-((th-1.9)**2)*3);const x=Math.cos(th)*a*r,y=Math.sin(th)*b*r;const nx=Math.cos(th)*b,ny=Math.sin(th)*a,l=Math.hypot(nx,ny);pts.push([x,y,nx/l,ny/l]);}return pts;}
function polyPath(pts){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();}
function wave(x0,y0,ang,len,amp,t,col,lw,segs){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();const c=Math.cos(ang),s=Math.sin(ang);for(let i=0;i<=(segs||16);i++){const u=i/(segs||16),d=u*len,o=Math.sin(u*9-t*12)*amp*u;const x=x0+c*d-s*o,y=y0+s*d+c*o;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}

/* ========== рисование существ ========== */
const WR={paramecium:0.36,euglena:0.32,diatom:0.28,nematode:0.15,rotifer:0.45,stentor:0.42,hydra:0.3,cyclops:0.35,tardigrade:0.5,egg:0.7,didinium:0.82};
function hpBar(e){
 const f=clamp(e.hp/e.maxHp,0,1);const alpha=e.boss||e.rival?1:Math.min(1,(e.hitT||0)/1.2);if(alpha<=0.01)return;
 const hl=e.sp==='nematode'?e.r*1.5:e.r,hwid=e.r*(WR[e.sp]||1),ca=Math.abs(Math.cos(e.a)),sa=Math.abs(Math.sin(e.a));
 const vy=sa*hl+ca*hwid,hx=ca*hl+sa*hwid;const Rb=clamp(hx*0.9,18*PX,80*PX),span=0.62;
 const cx=e.x,cy=e.y+vy+9*PX-Rb;const A=Math.PI/2+span,S=span*2;
 ctx.lineCap='round';ctx.globalAlpha=alpha;
 ctx.strokeStyle=ST.dark?'rgba(255,255,255,0.18)':'rgba(40,35,25,0.22)';ctx.lineWidth=3.6*PX;ctx.beginPath();ctx.arc(cx,cy,Rb,A,A-S,true);ctx.stroke();
 const col=f>0.6?(ST.dark?'rgba(130,240,150,0.95)':'rgba(40,140,60,0.9)'):f>0.3?(ST.dark?'rgba(255,210,90,0.95)':'rgba(190,130,20,0.9)'):(ST.dark?'rgba(255,90,80,0.95)':'rgba(190,40,30,0.9)');
 if(f>0.005){ctx.strokeStyle=col;ctx.lineWidth=2.2*PX;ctx.beginPath();ctx.arc(cx,cy,Rb,A,A-S*f,true);ctx.stroke();}
 ctx.strokeStyle=ST.dark?'rgba(255,255,255,0.4)':'rgba(40,35,25,0.4)';ctx.lineWidth=PX;for(let k=1;k<4;k++){const an=A-S*k/4;ctx.beginPath();ctx.moveTo(cx+Math.cos(an)*(Rb-3*PX),cy+Math.sin(an)*(Rb-3*PX));ctx.lineTo(cx+Math.cos(an)*(Rb+3*PX),cy+Math.sin(an)*(Rb+3*PX));ctx.stroke();}
 ctx.lineCap='butt';ctx.globalAlpha=1;
 if(e.boss||e.rival){ctx.font=`600 ${12*PX}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillStyle=ST.dark?'rgba(255,230,160,0.95)':'rgba(70,45,10,0.9)';ctx.fillText(e.label||'',cx,cy+Rb+16*PX);}
}
function drawFil(f){
 const p=f.pts;const path=()=>{ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));};
 ctx.lineCap='round';ctx.lineJoin='round';
 if(ST.halo){ctx.strokeStyle=ST.halo(0.8);ctx.lineWidth=FIL_R*2+6*PX;path();ctx.stroke();}
 ctx.strokeStyle=ST.mem(0.8);ctx.lineWidth=FIL_R*2+2.2*PX;path();ctx.stroke();
 ctx.strokeStyle=ST.bg0;ctx.lineWidth=FIL_R*2;path();ctx.stroke();
 ctx.strokeStyle=ST.cyto(100,3);ctx.lineWidth=FIL_R*2;path();ctx.stroke();
 ctx.strokeStyle=ST.chlo(0.95);ctx.lineWidth=FIL_R*0.42;ctx.beginPath();let first=true;
 for(let i=0;i<p.length-1;i++){const ax=p[i][0],ay=p[i][1],bx=p[i+1][0],by=p[i+1][1],L=Math.hypot(bx-ax,by-ay)||1,nx=-(by-ay)/L,ny=(bx-ax)/L;for(let k=0;k<6;k++){const u=k/6,ph=(i*6+k)*0.85+f.seed*9;const o=Math.sin(ph)*FIL_R*0.68;const x=ax+(bx-ax)*u+nx*o,y=ay+(by-ay)*u+ny*o;if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);}}ctx.stroke();
 ctx.strokeStyle=ST.mem(0.45);ctx.lineWidth=PX;ctx.beginPath();for(let i=1;i<p.length-1;i+=1){const ax=p[i-1][0],ay=p[i-1][1],bx=p[i+1][0],by=p[i+1][1],L=Math.hypot(bx-ax,by-ay)||1,nx=-(by-ay)/L*FIL_R,ny=(bx-ax)/L*FIL_R;ctx.moveTo(p[i][0]-nx,p[i][1]-ny);ctx.lineTo(p[i][0]+nx,p[i][1]+ny);}ctx.stroke();
 ctx.fillStyle=ST.nuc(1.6);for(let i=0;i<p.length-1;i+=1){circ((p[i][0]+p[i+1][0])/2,(p[i][1]+p[i+1][1])/2,FIL_R*0.25);ctx.fill();}
 ctx.lineCap='butt';ctx.lineJoin='miter';
}
function drawSpore(s){
 const open=P.sporesOpen[s.id];
 const g2=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,160);g2.addColorStop(0,ST.dark?'rgba(190,160,110,0.14)':'rgba(100,80,40,0.28)');g2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g2;circ(s.x,s.y,160);ctx.fill();
 ctx.fillStyle=ST.dark?'rgba(210,190,150,0.35)':'rgba(90,70,40,0.45)';for(let i=0;i<40;i++){const a=hash(i,s.id+3)*TAU,d=Math.sqrt(hash(i+9,s.id))*140;ctx.fillRect(s.x+Math.cos(a)*d,s.y+Math.sin(a)*d,1.6+hash(i,7)*2.5,1.4+hash(i,8)*2);}
 ctx.save();ctx.translate(s.x,s.y);
 const r=15,pulse=0.5+0.5*Math.sin(T*2+s.seed*9);
 if(open){ctx.fillStyle=ST.cyto(40,2);for(const k of[-1,1]){const a0=k>0?0.3:Math.PI+0.3;const half=()=>{ctx.beginPath();ctx.arc(k*6,k*3,r,a0,a0+Math.PI);};half();ctx.fill();mem(half,s.x,s.y,0,0.7,1.4);}ctx.restore();return;}
 const gl=ctx.createRadialGradient(0,0,0,0,0,r*2.4);gl.addColorStop(0,`rgba(255,220,120,${0.15+0.2*pulse})`);gl.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gl;circ(0,0,r*2.4);ctx.fill();
 ctx.fillStyle=ST.dark?'rgba(200,170,110,0.25)':'rgba(150,110,40,0.5)';circ(0,0,r);ctx.fill();
 ctx.fillStyle=ST.gran(0.9);for(let i=0;i<14;i++){const a=i/14*TAU;circ(Math.cos(a)*r,Math.sin(a)*r,r*0.12);ctx.fill();}
 ctx.fillStyle=ST.nuc(1.6);circ(0,0,r*0.45);ctx.fill();
 mem(()=>circ(0,0,r),s.x,s.y,0,1,2.2);mem(()=>circ(0,0,r*0.75),s.x,s.y,0,0.6,1);
 if(s.prog>0){ctx.strokeStyle='rgba(255,210,90,0.95)';ctx.lineWidth=2*PX;ctx.beginPath();ctx.arc(0,0,r*1.7,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,s.prog/2));ctx.stroke();}
 ctx.restore();
}

const DRAW={
 coccus(e,t){const r=e.r*(e.inf>0?1+0.35*(1-e.inf/3):1);if(e.inf>0){ctx.strokeStyle=P.mode==='fluo'?'rgba(255,120,220,0.8)':ST.eye(0.6);ctx.lineWidth=PX;circ(0,0,r*2.2);ctx.stroke();}ctx.fillStyle=ST.gran(1);for(let i=0;i<e.n;i++){const a=i*2.1+e.seed*6;const d=i?r*1.7:0;circ(Math.cos(a)*d,Math.sin(a)*d,r);ctx.fill();}},
 bacil(e,t){const r=e.r*(e.inf>0?1+0.35*(1-e.inf/3):1);if(e.inf>0){ctx.strokeStyle=P.mode==='fluo'?'rgba(255,120,220,0.8)':ST.eye(0.6);ctx.lineWidth=PX;ell(0,0,r*2.6,r*1.6);ctx.stroke();}ctx.fillStyle=ST.gran(0.9);ctx.beginPath();ctx.roundRect?ctx.roundRect(-r*2,-r,r*4,r*2,r):ell(0,0,r*2,r);ctx.fill();if(ST.glow){ctx.strokeStyle=ST.mem(0.4);ctx.lineWidth=PX;ctx.stroke();}},
 noct(e,t){const r=e.r;ctx.fillStyle=ST.dark?'rgba(150,210,240,0.35)':'rgba(120,170,200,0.35)';circ(0,0,r);ctx.fill();ctx.strokeStyle=ST.dark?'rgba(180,230,255,0.7)':'rgba(70,110,140,0.6)';ctx.lineWidth=PX*0.9;ctx.stroke();ctx.fillStyle=ST.dark?'rgba(110,220,255,0.8)':'rgba(40,120,170,0.7)';circ(r*0.2,-r*0.15,r*0.3);ctx.fill();ctx.strokeStyle=ST.dark?'rgba(200,230,255,0.5)':'rgba(60,80,90,0.5)';ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(-r*1.6,Math.sin(t*8)*r*0.5,-r*2.1,0);ctx.stroke();},
 chlorella(e,t){const r=e.r;ctx.fillStyle=ST.cyto(110,1.5);circ(0,0,r);ctx.fill();ctx.fillStyle=ST.chlo(0.9);ctx.beginPath();ctx.arc(0,0,r*0.85,0.6,TAU-0.6);ctx.arc(0,0,r*0.45,TAU-0.6,0.6,true);ctx.fill();mem(()=>circ(0,0,r),e.x,e.y,e.a,0.7);},
 plasmid(e,t){const r=e.r,p=1+0.15*Math.sin(t*4);const hg=ctx.createRadialGradient(0,0,r*0.5,0,0,r*4.5);hg.addColorStop(0,`rgba(255,215,90,${0.28+0.12*Math.sin(t*3)})`);hg.addColorStop(1,'rgba(255,215,90,0)');ctx.fillStyle=hg;circ(0,0,r*4.5);ctx.fill();ctx.strokeStyle=ST.glow?'rgba(255,220,110,0.95)':'rgba(150,90,10,0.9)';ctx.lineWidth=PX*1.4;circ(0,0,r*p);ctx.stroke();circ(0,0,r*0.6*p);ctx.stroke();ctx.fillStyle=ST.glow?'rgba(255,220,110,0.5)':'rgba(190,120,20,0.4)';circ(0,0,r*0.3);ctx.fill();},
 detritus(e,t){const r=e.r;ctx.fillStyle=ST.glow?'rgba(210,180,140,0.35)':'rgba(110,85,50,0.45)';blobPath(r,e.seed,0,0.35,3);ctx.fill();ctx.fillStyle=ST.gran(0.6);granules(4,r*0.6,e.seed,0,ST.gran(0.6),r*0.3);},
 kin(e,t){BS=playerBS();const a=Math.max(0,Math.min(1,e.life/8));ctx.globalAlpha*=a;drawCellShape({bx:0,by:0,ox:-1,oy:0,t:e.t0||'basic',edge:true,core:true,seed:e.seed},t,e.hue,e.x,e.y,e.a);ctx.globalAlpha=1;},
 euglena(e,t){
  ctx.scale(1,0.62+0.38*Math.abs(Math.cos(e.spin||0)));
  const L=e.r,w=e.r*0.32*(1+0.18*Math.sin(t*1.7+e.seed*9));
  const path=()=>{ctx.beginPath();for(let i=0;i<=30;i++){const u=i/30*TAU;const x=Math.cos(u)*L,y=Math.sin(u)*w*Math.pow(Math.abs(Math.cos(u*0.5)),0.0)*(1-0.55*Math.max(0,-Math.cos(u))**2);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();};
  wave(L*0.92,0,0,L*1.1,L*0.08,t+e.seed,ST.hair(1),PX*1.1,18);
  ctx.fillStyle=ST.cyto(100,2.4);path();ctx.fill();
  for(let i=0;i<11;i++){const u=hash(i,e.seed*999|0),v=hash(i+3,e.seed*999|0);const x=(u*1.6-0.8)*L*0.85,y=(v*1.4-0.7)*w*0.6*(1-Math.abs(x/L));ctx.fillStyle=ST.chlo(0.85);ell(x,y,L*0.07,L*0.045,u*3);ctx.fill();}
  ctx.fillStyle=ST.nuc(1.2);circ(-L*0.1,0,w*0.42);ctx.fill();ctx.strokeStyle=ST.nucRim(0.8);ctx.lineWidth=PX;ctx.stroke();
  ctx.fillStyle=ST.eye(0.95);circ(L*0.72,-w*0.15,L*0.05);ctx.fill();
  ctx.fillStyle=ST.vac(1);circ(L*0.8,w*0.1,L*0.05);ctx.fill();
  mem(path,e.x,e.y,e.a,0.85);
 },
 diatom(e,t){
  const L=e.r,w=e.r*0.28;const path=()=>{ctx.beginPath();ctx.moveTo(-L,0);ctx.quadraticCurveTo(-L*0.4,-w*1.25,0,-w);ctx.quadraticCurveTo(L*0.4,-w*1.25,L,0);ctx.quadraticCurveTo(L*0.4,w*1.25,0,w);ctx.quadraticCurveTo(-L*0.4,w*1.25,-L,0);ctx.closePath();};
  ctx.fillStyle=ST.glow?'rgba(200,190,150,0.06)':'rgba(190,160,80,0.18)';path();ctx.fill();
  ctx.fillStyle=ST.glow&&P.mode==='fluo'?ST.chlo(0.7):ST.dark?'rgba(220,200,140,0.25)':'rgba(150,110,30,0.45)';ell(-L*0.35,0,L*0.3,w*0.55);ctx.fill();ell(L*0.35,0,L*0.3,w*0.55);ctx.fill();
  ctx.strokeStyle=ST.hair(0.55);ctx.lineWidth=PX*0.7;ctx.beginPath();for(let i=-14;i<=14;i++){const x=i/15*L*0.9,h=w*(1-(x/L)**2)*0.95;ctx.moveTo(x,-h);ctx.lineTo(x,h);}ctx.stroke();
  ctx.beginPath();ctx.moveTo(-L*0.85,0);ctx.lineTo(L*0.85,0);ctx.strokeStyle=ST.mem(0.6);ctx.stroke();
  mem(path,e.x,e.y,e.a,0.95,1.4);
 },
 paramecium(e,t){
  const a=e.r,b=e.r*0.36;const pts=ellipsePts(a,b,64,0.28);const path=()=>polyPath(pts);
  const sp=Math.sin(e.spin||0)*0.32;ctx.scale(1,1-Math.abs(sp));
  ctx.fillStyle=ST.cyto(45,1.6);path();ctx.fill();
  granules(40,b*0.75,e.seed,t,ST.gran(0.55),a*0.022);
  ctx.fillStyle=ST.nuc(1.4);ell(0,-b*0.1,a*0.2,b*0.38,0.2);ctx.fill();ctx.strokeStyle=ST.nucRim(0.6);ctx.lineWidth=PX;ctx.stroke();
  for(let i=0;i<5;i++){const x=(hash(i,9+e.seed*99|0)-0.5)*a*1.2,y=(hash(i,3)-0.5)*b*0.8;ctx.fillStyle=ST.vac(0.9);circ(x,y,a*0.06);ctx.fill();ctx.strokeStyle=ST.vacRim(0.7);ctx.stroke();ctx.fillStyle=ST.gran(0.5);circ(x,y,a*0.025);ctx.fill();}
  for(const cx of[-a*0.6,a*0.55]){const p=(Math.sin(t*2.2+cx)+1)/2;ctx.strokeStyle=ST.vacRim(0.9);ctx.lineWidth=PX;for(let k=0;k<6;k++){const an=k/6*TAU;ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx+Math.cos(an)*a*0.12,Math.sin(an)*a*0.12);ctx.stroke();}ctx.fillStyle=ST.vac(1);circ(cx,0,a*0.05*p+a*0.01);ctx.fill();ctx.stroke();}
  hairsAlong(pts,a*0.06,t,ST.hair(0.9),PX*0.7);
  mem(path,e.x,e.y,e.a,0.9);
 },
 didinium(e,t){
  const a=e.r,b=e.r*0.82;const path=()=>{ell(0,0,a,b);};
  ctx.fillStyle=ST.cyto(30,1.8);path();ctx.fill();granules(30,b*0.8,e.seed,t,ST.gran(0.6),a*0.03);
  ctx.strokeStyle=ST.nucRim(0.8);ctx.lineWidth=PX*2;ctx.beginPath();ctx.arc(-a*0.1,0,b*0.45,-1.8,1.8);ctx.stroke();
  for(const x of[a*0.35,-a*0.35]){const h=b*Math.sqrt(1-(x/a)**2);const pts=[];for(let i=-1;i<=1;i+=2)for(let k=0;k<7;k++)pts.push([x+(k-3)*a*0.03,i*h,0,i]);hairsAlong(pts,a*0.25,t*1.5,ST.hair(0.9),PX*0.8);}
  ctx.fillStyle=ST.cyto(30,2.2);ctx.beginPath();ctx.moveTo(a*0.95,-b*0.18);ctx.lineTo(a*1.35,0);ctx.lineTo(a*0.95,b*0.18);ctx.closePath();ctx.fill();
  mem(()=>{ctx.beginPath();ctx.moveTo(a*0.95,-b*0.18);ctx.lineTo(a*1.35,0);ctx.lineTo(a*0.95,b*0.18);},e.x,e.y,e.a,0.8);
  mem(path,e.x,e.y,e.a,0.9);
 },
 heliozoa(e,t){
  const r=e.r;ctx.strokeStyle=ST.hair(0.8);ctx.lineWidth=PX*0.8;ctx.beginPath();for(let i=0;i<34;i++){const an=i/34*TAU+e.seed;const L=r*(2.3+0.3*Math.sin(i*7+e.seed*5));ctx.moveTo(Math.cos(an)*r*0.95,Math.sin(an)*r*0.95);ctx.lineTo(Math.cos(an)*L,Math.sin(an)*L);}ctx.stroke();
  ctx.fillStyle=ST.gran(0.7);for(let i=0;i<34;i++){const an=i/34*TAU+e.seed;const d=r*(1.4+((i*13)%7)/10);circ(Math.cos(an)*d,Math.sin(an)*d,r*0.03);ctx.fill();}
  ctx.fillStyle=ST.cyto(55,1.6);circ(0,0,r);ctx.fill();
  for(let i=0;i<22;i++){const a=hash(i,e.seed*500|0)*TAU,d=Math.sqrt(hash(i+1,4))*r*0.75;ctx.strokeStyle=ST.vacRim(0.5);ctx.lineWidth=PX*0.7;circ(Math.cos(a)*d,Math.sin(a)*d,r*0.12);ctx.stroke();}
  ctx.fillStyle=ST.nuc(1.4);circ(0,0,r*0.25);ctx.fill();
  mem(()=>circ(0,0,r),e.x,e.y,e.a,0.8);
 },
 spiker(e,t){
  const r=e.r*(1+0.05*Math.sin(t*5));ctx.fillStyle=ST.spike(0.9);
  for(let i=0;i<11;i++){const an=i/11*TAU+Math.sin(t+i)*0.1;const c=Math.cos(an),s=Math.sin(an);ctx.beginPath();ctx.moveTo(c*r*0.8-s*r*0.18,s*r*0.8+c*r*0.18);ctx.quadraticCurveTo(c*r*1.5+s*r*0.2,s*r*1.5-c*r*0.2,c*r*1.75,s*r*1.75);ctx.lineTo(c*r*0.8+s*r*0.18,s*r*0.8-c*r*0.18);ctx.fill();}
  ctx.fillStyle=ST.cyto(10,2.4);blobPath(r,e.seed,t,0.08,3);ctx.fill();granules(26,r*0.7,e.seed,t,ST.gran(0.7),r*0.05);
  for(let i=0;i<3;i++){ctx.fillStyle=ST.eye(0.9);circ(r*0.55,(i-1)*r*0.28,r*0.08);ctx.fill();}
  mem(()=>blobPath(r,e.seed,t,0.08,3),e.x,e.y,e.a,0.95,1.3);
 },
 rotifer(e,t){
  const L=e.r;const body=()=>{ctx.beginPath();ctx.moveTo(L*0.65,-L*0.32);ctx.bezierCurveTo(L*0.2,-L*0.45,-L*0.45,-L*0.32,-L*0.6,-L*0.1);ctx.lineTo(-L*1.15,-L*0.04);ctx.lineTo(-L*1.15,L*0.04);ctx.lineTo(-L*0.6,L*0.1);ctx.bezierCurveTo(-L*0.45,L*0.32,L*0.2,L*0.45,L*0.65,L*0.32);ctx.closePath();};
  ctx.fillStyle=ST.cyto(38,1.7);body();ctx.fill();
  ctx.strokeStyle=ST.mem(0.6);ctx.lineWidth=PX;ctx.beginPath();ctx.moveTo(-L*1.15,-L*0.04);ctx.lineTo(-L*1.32,-L*0.12);ctx.moveTo(-L*1.15,L*0.04);ctx.lineTo(-L*1.32,L*0.12);ctx.stroke();
  for(let i=0;i<5;i++){ctx.strokeStyle=ST.mem(0.35);ctx.beginPath();ctx.moveTo(-L*0.62-i*L*0.1,-L*0.09+i*0.012*L);ctx.lineTo(-L*0.62-i*L*0.1,L*0.09-i*0.012*L);ctx.stroke();}
  ctx.fillStyle=ST.chlo(0.4);ell(-L*0.1,0,L*0.32,L*0.18);ctx.fill();granules(30,L*0.2,e.seed,t,ST.gran(0.5),L*0.02);
  const jaw=Math.sin(t*6)*0.3;ctx.strokeStyle=ST.nucRim(0.9);ctx.lineWidth=PX*1.4;ctx.beginPath();ctx.moveTo(L*0.3,0);ctx.lineTo(L*0.42,-L*0.06-jaw*L*0.05);ctx.moveTo(L*0.3,0);ctx.lineTo(L*0.42,L*0.06+jaw*L*0.05);ctx.stroke();
  for(const sy of[-1,1]){const cx=L*0.72,cy=sy*L*0.22,cr=L*0.17;ctx.fillStyle=ST.cyto(38,1.5);circ(cx,cy,cr);ctx.fill();ctx.strokeStyle=ST.hair(1);ctx.lineWidth=PX*0.8;ctx.beginPath();for(let k=0;k<16;k++){const an=k/16*TAU+t*6*sy;ctx.moveTo(cx+Math.cos(an)*cr,cy+Math.sin(an)*cr);ctx.lineTo(cx+Math.cos(an+0.4)*cr*1.45,cy+Math.sin(an+0.4)*cr*1.45);}ctx.stroke();mem(()=>circ(cx,cy,cr),e.x,e.y,e.a,0.7);}
  mem(body,e.x,e.y,e.a,0.9);
 },
 amoeba(e,t){
  const r=e.r;const path=()=>blobPath(r,e.seed,t*0.7,0.22,4);
  ctx.fillStyle=ST.cyto(40,1.2);path();ctx.fill();
  ctx.save();ctx.scale(0.86,0.86);ctx.fillStyle=ST.cyto(40,1.4);blobPath(r,e.seed,t*0.7,0.22,4);ctx.fill();ctx.restore();
  granules(90,r*0.75,e.seed,t*0.6,ST.gran(0.55),r*0.018);
  for(let i=0;i<5;i++){const x=(hash(i,e.seed*77|0)-0.5)*r,y=(hash(i,2)-0.5)*r*0.8;ctx.fillStyle=ST.vac(0.8);circ(x,y,r*0.07);ctx.fill();ctx.strokeStyle=ST.vacRim(0.7);ctx.lineWidth=PX;ctx.stroke();ctx.fillStyle=ST.chlo(0.5);circ(x,y,r*0.035);ctx.fill();}
  ctx.fillStyle=ST.nuc(1.4);ell(r*0.1,-r*0.15,r*0.14,r*0.1,0.5);ctx.fill();ctx.strokeStyle=ST.nucRim(0.8);ctx.lineWidth=PX;ctx.stroke();
  const p=(Math.sin(t*1.5)+1)/2;ctx.fillStyle=ST.vac(1);circ(-r*0.35,r*0.25,r*0.04+r*0.06*p);ctx.fill();ctx.strokeStyle=ST.vacRim(0.8);ctx.stroke();
  mem(path,e.x,e.y,e.a,0.75);
 },
 bell(e,t){
  const r=e.r;const pulse=1+0.08*Math.sin(t*2.2);
  for(let i=0;i<6;i++){const y0=(i-2.5)/2.5*r*0.7;wave(-r*0.2,y0,Math.PI,r*2.2,r*0.12,t*0.4+i,ST.hair(0.8),PX*1.2,20);ctx.fillStyle=ST.eye(0.6);for(let k=1;k<6;k++)circ(-r*0.2-k*r*0.38,y0+Math.sin(k*1.6-t*4.8+i)*r*0.12*k/6,r*0.03),ctx.fill();}
  const path=()=>{ctx.beginPath();ctx.moveTo(-r*0.2,-r*0.85*pulse);ctx.bezierCurveTo(r*0.9,-r*1.0*pulse,r*1.1,r*1.0*pulse,-r*0.2,r*0.85*pulse);ctx.quadraticCurveTo(r*0.1,0,-r*0.2,-r*0.85*pulse);ctx.closePath();};
  const glowA=ST.glow?0.5+0.5*Math.sin(t*1.3+e.seed*9):0;ctx.fillStyle=ST.glow?`rgba(120,200,255,${0.06+glowA*0.18})`:ST.cyto(200,1.5);path();ctx.fill();
  for(let i=0;i<4;i++){ctx.strokeStyle=ST.mem(0.35);ctx.lineWidth=PX;ctx.beginPath();ctx.moveTo(-r*0.1,0);ctx.quadraticCurveTo(r*0.4,(i-1.5)*r*0.4,r*0.6,(i-1.5)*r*0.5);ctx.stroke();}
  mem(path,e.x,e.y,e.a,0.8);
 },
 volvox(e,t){
  const r=e.r;ctx.fillStyle=ST.cyto(110,0.6);circ(0,0,r);ctx.fill();
  for(let i=0;i<4;i++){const a=i*1.7+e.seed*5,d=r*(0.3+0.12*i);const x=Math.cos(a)*d,y=Math.sin(a)*d,rr=r*(0.16+0.03*i);ctx.fillStyle=ST.chlo(0.35);circ(x,y,rr);ctx.fill();granules(16,rr*0.9,e.seed+i,0,ST.chlo(0.8),rr*0.12);mem(()=>circ(x,y,rr),e.x,e.y,e.a,0.5);}
  const sp=e.spin||0;ctx.fillStyle=ST.chlo(0.9);
  for(let la=-5;la<=5;la++){const phi=la/6*Math.PI/2;const cr=Math.cos(phi);const n=Math.max(4,Math.round(26*cr));for(let k=0;k<n;k++){const th=k/n*TAU+sp*(1+la*0.03);const z=Math.sin(th)*cr;const x=Math.cos(th)*cr*r,y=Math.sin(phi)*r;ctx.globalAlpha=0.35+0.65*(z>0?1:0.4);circ(x,y,r*0.022);ctx.fill();}}
  ctx.globalAlpha=1;mem(()=>circ(0,0,r),e.x,e.y,e.a,0.6,1.2);
 },
 stentor(e,t){
  const L=e.r;const sw=Math.sin(t*0.5)*0.05;const body=()=>{ctx.beginPath();ctx.moveTo(-L,-L*0.05);ctx.bezierCurveTo(-L*0.4,-L*0.1,L*0.3,-L*0.25,L*0.85,-L*0.42);ctx.quadraticCurveTo(L*1.0,0,L*0.85,L*0.42);ctx.bezierCurveTo(L*0.3,L*0.25,-L*0.4,L*0.1,-L,L*0.05);ctx.closePath();};
  ctx.rotate(sw);ctx.fillStyle=P.mode==='bright'?'hsla(195,55%,50%,0.28)':ST.cyto(195,1.8);body();ctx.fill();
  ctx.strokeStyle=P.mode==='bright'?'hsla(200,60%,35%,0.45)':ST.hair(0.4);ctx.lineWidth=PX*0.8;ctx.beginPath();for(let i=-4;i<=4;i++){ctx.moveTo(-L*0.95,i*L*0.008);ctx.bezierCurveTo(-L*0.3,i*L*0.02,L*0.3,i*L*0.05,L*0.82,i*L*0.09);}ctx.stroke();
  ctx.fillStyle=ST.nuc(1.6);for(let i=0;i<9;i++){circ(-L*0.4+i*L*0.12,Math.sin(i*1.3)*L*0.05,L*0.04);ctx.fill();}
  granules(40,L*0.18,e.seed,t,ST.gran(0.5),L*0.012);
  ctx.strokeStyle=ST.hair(1);ctx.lineWidth=PX;ctx.beginPath();for(let k=0;k<40;k++){const an=k/40*TAU;const x=L*0.88+Math.cos(an)*L*0.09,y=Math.sin(an)*L*0.42;const w=Math.sin(an*3+t*9);ctx.moveTo(x,y);ctx.lineTo(x+L*0.08+w*L*0.03,y+Math.sin(an)*L*0.05);}ctx.stroke();
  mem(()=>ell(L*0.88,0,L*0.09,L*0.42),e.x,e.y,e.a,0.7);mem(body,e.x,e.y,e.a,0.85);
 },
 chaos(e,t){DRAW.amoeba(e,t);},
 asplanchna(e,t){ctx.save();ctx.scale(1,1.35);DRAW.rotifer(e,t);ctx.restore();},
 oldhydra(e,t){DRAW.hydra(e,t);},
 rival(e,t){const keep=BS;BS={hue:e.hue,pattern:e.pat,un:{}};drawBody(e.cw,t,e.x,e.y,e.a,1);BS=keep;},
 hydra(e,t){
  const L=e.r;
  for(let i=0;i<6;i++){const a0=(i-2.5)*0.42,len=L*2.2*(0.85+0.15*Math.sin(t*0.7+i));const pts=[];for(let k=0;k<=18;k++){const u=k/18,ang=a0*(1+u*0.6)+Math.sin(t*1.2+i*1.7+u*4)*0.28*u;pts.push([L*0.9+Math.cos(ang)*len*u,Math.sin(ang)*len*u]);}
   ctx.lineCap='round';ctx.strokeStyle=ST.cyto(90,2.6);ctx.lineWidth=L*0.07;ctx.beginPath();pts.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
   ctx.strokeStyle=ST.mem(0.55);ctx.lineWidth=PX;ctx.stroke();ctx.lineCap='butt';
   ctx.fillStyle=ST.gran(0.8);for(let k=3;k<=18;k+=2){circ(pts[k][0],pts[k][1],L*0.022);ctx.fill();}}
  const body=()=>{ctx.beginPath();ctx.moveTo(-L,-L*0.1);ctx.bezierCurveTo(-L*0.4,-L*0.16,L*0.3,-L*0.32,L*0.75,-L*0.22);ctx.quadraticCurveTo(L*1.0,0,L*0.75,L*0.22);ctx.bezierCurveTo(L*0.3,L*0.32,-L*0.4,L*0.16,-L,L*0.1);ctx.closePath();};
  ctx.fillStyle=ST.cyto(90,2.2);body();ctx.fill();
  ctx.fillStyle=ST.cyto(90,2);circ(-L*0.05,L*0.3,L*0.13);ctx.fill();mem(()=>circ(-L*0.05,L*0.3,L*0.13),e.x,e.y,e.a,0.7);
  ctx.fillStyle=ST.chlo(0.35);ell(L*0.1,0,L*0.55,L*0.12);ctx.fill();granules(50,L*0.18,e.seed,t,ST.gran(0.5),L*0.015);
  mem(body,e.x,e.y,e.a,0.9,1.2);
 },
 nematode(e,t){
  const L=e.r*1.5,A=L*0.11,N=40;const top=[],bot=[];
  for(let i=0;i<=N;i++){const u=i/N,x=-L+u*2*L,ph=u*TAU*1.6-t*6+e.seed*9;const y=Math.sin(ph)*A,dy=Math.cos(ph)*A*TAU*1.6/(2*L);const w=L*0.055*(1-Math.pow(Math.abs(u*2-1),3)*0.85);const nl=Math.hypot(1,dy);top.push([x+dy/nl*w,y-w/nl]);bot.push([x-dy/nl*w,y+w/nl]);}
  const path=()=>{ctx.beginPath();top.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));for(let i=bot.length-1;i>=0;i--)ctx.lineTo(bot[i][0],bot[i][1]);ctx.closePath();};
  ctx.fillStyle=ST.cyto(40,2.2);path();ctx.fill();
  ctx.strokeStyle=ST.gran(0.5);ctx.lineWidth=L*0.025;ctx.beginPath();for(let i=4;i<=N-6;i++){const x=(top[i][0]+bot[i][0])/2,y=(top[i][1]+bot[i][1])/2;i>4?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  ctx.fillStyle=ST.nuc(1.4);const m=Math.round(N*0.55);circ((top[m][0]+bot[m][0])/2,(top[m][1]+bot[m][1])/2,L*0.04);ctx.fill();
  mem(path,e.x,e.y,e.a,0.85);
 },
 cyclops(e,t){
  const L=e.r;const row=Math.sin(t*2.6);
  for(const sy of[-1,1]){ctx.strokeStyle=ST.mem(0.8);ctx.lineWidth=PX*2.2;ctx.beginPath();ctx.moveTo(L*0.82,sy*L*0.12);const ax=L*0.95,ay=sy*L*0.55;const bx=L*0.55-row*L*0.15,by=sy*L*1.05;ctx.quadraticCurveTo(ax,ay,bx,by);ctx.stroke();
   ctx.lineWidth=PX;ctx.beginPath();for(let k=1;k<9;k++){const u=k/9;const px=(1-u)*(1-u)*L*0.82+2*u*(1-u)*ax+u*u*bx,py=(1-u)*(1-u)*sy*L*0.12+2*u*(1-u)*ay+u*u*by;ctx.moveTo(px,py);ctx.lineTo(px-L*0.05,py+sy*L*0.05);}ctx.stroke();}
  for(const sy of[-1,1]){ctx.fillStyle=ST.nuc(1.8);for(let k=0;k<9;k++){circ(-L*0.35-(k%3)*L*0.07,sy*(L*0.2+Math.floor(k/3)*L*0.06),L*0.035);ctx.fill();}}
  for(const sy of[-1,1]){ctx.strokeStyle=ST.mem(0.8);ctx.lineWidth=PX*1.4;ctx.beginPath();ctx.moveTo(-L*0.85,sy*L*0.03);ctx.lineTo(-L*1.05,sy*L*0.08);ctx.stroke();ctx.lineWidth=PX*0.8;ctx.beginPath();for(let k=0;k<4;k++){ctx.moveTo(-L*1.05,sy*L*0.08);ctx.lineTo(-L*1.25,sy*L*(0.04+k*0.04));}ctx.stroke();}
  const body=()=>{ctx.beginPath();ctx.moveTo(L*0.95,0);ctx.bezierCurveTo(L*0.9,-L*0.3,L*0.2,-L*0.34,-L*0.2,-L*0.17);ctx.lineTo(-L*0.3,-L*0.1);ctx.lineTo(-L*0.86,-L*0.04);ctx.lineTo(-L*0.86,L*0.04);ctx.lineTo(-L*0.3,L*0.1);ctx.lineTo(-L*0.2,L*0.17);ctx.bezierCurveTo(L*0.2,L*0.34,L*0.9,L*0.3,L*0.95,0);ctx.closePath();};
  ctx.fillStyle=P.mode==='bright'?'rgba(190,150,80,0.32)':ST.cyto(35,2.6);body();ctx.fill();
  ctx.strokeStyle=ST.mem(0.35);ctx.lineWidth=PX;ctx.beginPath();for(const x of[L*0.45,L*0.15,-L*0.1,-L*0.4,-L*0.6]){const h=x>-L*0.2?L*0.3*(1-Math.abs(x-L*0.3)/L):L*0.08;ctx.moveTo(x,-h);ctx.lineTo(x,h);}ctx.stroke();
  ctx.strokeStyle=ST.mem(0.6);ctx.lineWidth=PX*1.3;ctx.beginPath();for(let k=0;k<4;k++){const x=L*(0.4-k*0.14),ph=Math.sin(t*9+k*0.9)*L*0.05;ctx.moveTo(x,0);ctx.lineTo(x-L*0.06+ph,L*0.2);ctx.moveTo(x,0);ctx.lineTo(x-L*0.06+ph,-L*0.2);}ctx.stroke();
  ctx.fillStyle=ST.chlo(0.5);ell(L*0.1,0,L*0.45,L*0.06);ctx.fill();granules(60,L*0.15,e.seed,t,ST.gran(0.5),L*0.008);
  ctx.fillStyle=ST.dark?'rgba(255,60,40,0.95)':'rgba(190,20,10,0.9)';circ(L*0.8,0,L*0.055);ctx.fill();
  mem(body,e.x,e.y,e.a,1,2);
 },
 phage(e,t){
  const r=e.r;ctx.strokeStyle=ST.dark?'rgba(220,235,255,0.9)':'rgba(40,40,30,0.85)';ctx.lineWidth=Math.max(PX*0.8,r*0.18);
  ctx.beginPath();for(let k=0;k<=6;k++){const a=k/6*TAU;const x=r*0.9+Math.cos(a)*r*0.7,y=Math.sin(a)*r*0.7;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  ctx.beginPath();ctx.moveTo(r*0.2,0);ctx.lineTo(-r*1.1,0);for(const s of[-1,0,1]){ctx.moveTo(-r*1.1,0);ctx.lineTo(-r*1.7,s*r*0.8);}ctx.stroke();
  if(P.mode==='fluo'){ctx.fillStyle='rgba(255,120,220,0.6)';circ(r*0.9,0,r*0.5);ctx.fill();}
 },
 vorticella(e,t){
  const L=e.len||70,c=e.coil||0,len=L*(1-0.82*c);
  ctx.strokeStyle=ST.mem(0.7);ctx.lineWidth=PX*1.3;ctx.beginPath();
  if(c>0.05){const turns=5*c;for(let i=0;i<=50;i++){const u=i/50;const x=-len+u*len,y=Math.sin(u*turns*TAU)*e.r*0.32*c;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.globalAlpha*=0.8;}else{ctx.moveTo(-len,0);ctx.quadraticCurveTo(-len*0.5,Math.sin(t*0.8+e.seed*9)*len*0.08,0,0);}
  ctx.stroke();ctx.fillStyle=ST.gran(0.8);circ(-len,0,e.r*0.25);ctx.fill();
  const r=e.r,cup=()=>{ctx.beginPath();ctx.moveTo(0,-r*0.18);ctx.quadraticCurveTo(r*0.9,-r*1.0,r*1.35,-r*0.95);ctx.lineTo(r*1.35,r*0.95);ctx.quadraticCurveTo(r*0.9,r*1.0,0,r*0.18);ctx.closePath();};
  ctx.fillStyle=ST.cyto(55,2);cup();ctx.fill();
  ctx.strokeStyle=ST.nucRim(0.8);ctx.lineWidth=PX*1.6;ctx.beginPath();ctx.arc(r*0.75,0,r*0.5,-1.9,1.9);ctx.stroke();
  ctx.fillStyle=ST.vac(1);circ(r*0.5,r*0.35,r*0.13);ctx.fill();ctx.fillStyle=ST.gran(0.6);circ(r*0.95,-r*0.4,r*0.1);ctx.fill();
  if(c<0.3){ctx.strokeStyle=ST.hair(1);ctx.lineWidth=PX*0.8;ctx.beginPath();for(let k=0;k<12;k++){const y=-r*0.95+k/11*r*1.9,w=Math.sin(t*10+k*0.8)*r*0.12;ctx.moveTo(r*1.35,y);ctx.lineTo(r*1.65+w,y+w);}ctx.stroke();}
  mem(cup,e.x,e.y,e.a,0.85);
 },
 daphnia(e,t){
  const L=e.r;const row=Math.sin(t*2.2);
  for(const sy of[-1,1]){ctx.strokeStyle=ST.mem(0.8);ctx.lineWidth=PX*2.4;const bx=L*0.55,by=sy*L*0.18;const ex=L*0.2-row*L*0.25,ey=sy*L*0.85;ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(L*0.75,sy*L*0.6,ex,ey);ctx.stroke();
   ctx.lineWidth=PX*1.2;ctx.beginPath();for(let k=0;k<3;k++){const a=Math.atan2(ey-by,ex-bx)+(k-1)*0.35;ctx.moveTo(ex,ey);ctx.lineTo(ex+Math.cos(a)*L*0.3,ey+Math.sin(a)*L*0.3);}ctx.stroke();
   ctx.lineWidth=PX*0.7;ctx.beginPath();for(let k=0;k<10;k++){const u=k/10;const px=ex+(Math.cos(Math.atan2(ey-by,ex-bx))*L*0.3)*u,py=ey+(Math.sin(Math.atan2(ey-by,ex-bx))*L*0.3)*u;ctx.moveTo(px,py);ctx.lineTo(px-L*0.03,py+sy*L*0.05);}ctx.stroke();}
  const shell=()=>{ctx.beginPath();ctx.moveTo(L*0.62,-L*0.22);ctx.bezierCurveTo(L*0.3,-L*0.62,-L*0.6,-L*0.55,-L*0.82,-L*0.05);ctx.lineTo(-L*1.25,-L*0.02);ctx.lineTo(-L*0.82,L*0.08);ctx.bezierCurveTo(-L*0.6,L*0.55,L*0.3,L*0.55,L*0.62,L*0.2);ctx.closePath();};
  const head=()=>{ctx.beginPath();ctx.moveTo(L*0.55,-L*0.24);ctx.quadraticCurveTo(L*1.0,-L*0.2,L*0.98,0.02*L);ctx.quadraticCurveTo(L*0.95,L*0.22,L*0.55,L*0.22);ctx.closePath();};
  ctx.fillStyle=P.mode==='bright'?'rgba(200,170,110,0.2)':ST.cyto(40,1.6);shell();ctx.fill();head();ctx.fill();
  ctx.fillStyle=ST.chlo(0.55);ctx.beginPath();ctx.moveTo(L*0.6,0);ctx.bezierCurveTo(L*0.2,-L*0.1,-L*0.3,-L*0.05,-L*0.7,L*0.02);ctx.lineWidth=L*0.07;ctx.strokeStyle=ST.chlo(0.55);ctx.stroke();
  ctx.strokeStyle=ST.mem(0.55);ctx.lineWidth=PX*1.3;for(let k=0;k<5;k++){const x=L*(0.25-k*0.14),ph=Math.sin(t*12+k*1.1)*L*0.06;ctx.beginPath();ctx.moveTo(x,L*0.05);ctx.quadraticCurveTo(x-L*0.05+ph,L*0.2,x-L*0.1,L*0.32);ctx.stroke();}
  ctx.fillStyle=ST.nuc(1.6);for(let k=0;k<7;k++){circ(-L*0.15-(k%4)*L*0.1,-L*0.32+Math.floor(k/4)*L*0.09,L*0.05);ctx.fill();}
  const hb=0.8+0.2*Math.sin(t*9);ctx.fillStyle=ST.dark?'rgba(255,120,110,0.5)':'rgba(190,60,50,0.35)';ell(L*0.3,-L*0.33,L*0.08*hb,L*0.05*hb);ctx.fill();
  ctx.fillStyle=ST.dark?'rgba(30,30,40,0.95)':'rgba(25,25,30,0.9)';circ(L*0.82,-L*0.02,L*0.11);ctx.fill();ctx.fillStyle=ST.dark?'rgba(120,140,200,0.6)':'rgba(140,150,170,0.6)';for(let k=0;k<8;k++){const a=k/8*TAU;circ(L*0.82+Math.cos(a)*L*0.075,-L*0.02+Math.sin(a)*L*0.075,L*0.02);ctx.fill();}
  ctx.strokeStyle=ST.mem(0.25);ctx.lineWidth=PX;ctx.beginPath();for(let i=0;i<9;i++){const x=-L*0.7+i*L*0.15;ctx.moveTo(x,-L*0.5);ctx.lineTo(x+L*0.12,L*0.45);}ctx.stroke();
  mem(shell,e.x,e.y,e.a,0.95,2);mem(head,e.x,e.y,e.a,0.9,1.6);
 },
 egg(e,t){
  const r=e.r,pr=Math.min(1,e.t/35);const path=()=>ell(0,0,r*1.3,r*0.9);
  ctx.fillStyle=ST.cyto(45,1.6);path();ctx.fill();
  ctx.fillStyle=ST.nuc(1.3);ell(0,0,r*1.05*(0.45+0.55*pr),r*0.65*(0.45+0.55*pr));ctx.fill();
  granules(12,r*0.5*(0.5+0.5*pr),e.seed,t*0.3,ST.gran(0.6),r*0.08);
  if(pr>0.5){ctx.fillStyle=ST.gran(1);circ(r*0.55,-r*0.15,r*0.07);ctx.fill();ctx.strokeStyle=ST.hair(0.8);ctx.lineWidth=PX*0.7;ctx.beginPath();for(let k=0;k<6;k++){const an=-0.8+k*0.32;ctx.moveTo(r*0.7+Math.cos(an)*r*0.15,Math.sin(an)*r*0.3);ctx.lineTo(r*0.8+Math.cos(an+Math.sin(t*10)*0.3)*r*0.3,Math.sin(an)*r*0.45);}ctx.stroke();}
  mem(path,e.x,e.y,e.a,0.9,1.6);mem(()=>ell(0,0,r*1.15,r*0.78),e.x,e.y,e.a,0.4);
 },
 tardigrade(e,t){
  const L=e.r,w=L*0.48;const body=()=>{ctx.beginPath();for(let i=0;i<=40;i++){const u=i/40*TAU;let rr=1+0.07*Math.cos(u*8);const x=Math.cos(u)*L*rr,y=Math.sin(u)*w*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();};
  for(let i=0;i<4;i++){for(const sy of[-1,1]){const x=L*(0.55-i*0.38),ph=Math.sin(t*3+i*1.6+(sy>0?Math.PI:0));const lx=x+ph*L*0.08,ly=sy*w*1.25;ctx.fillStyle=ST.cyto(30,1.8);ell(lx,sy*w*0.95,L*0.1,w*0.32,0);ctx.fill();mem(()=>ell(lx,sy*w*0.95,L*0.1,w*0.32,0),e.x,e.y,e.a,0.7);ctx.strokeStyle=ST.mem(0.9);ctx.lineWidth=PX*1.2;ctx.beginPath();for(let c=-1;c<=1;c++){ctx.moveTo(lx,ly);ctx.lineTo(lx+c*L*0.05,ly+sy*L*0.08);}ctx.stroke();}}
  ctx.fillStyle=ST.cyto(30,2.2);body();ctx.fill();
  ctx.fillStyle=ST.chlo(0.45);ell(-L*0.1,0,L*0.5,w*0.45);ctx.fill();granules(70,w*0.7,e.seed,t,ST.gran(0.6),L*0.012);
  ctx.fillStyle=ST.gran(1);circ(L*0.82,-w*0.25,L*0.03);ctx.fill();circ(L*0.82,w*0.25,L*0.03);ctx.fill();
  ctx.strokeStyle=ST.nucRim(0.9);ctx.lineWidth=PX*1.3;ctx.beginPath();ctx.moveTo(L*0.95,0);ctx.lineTo(L*0.65,-w*0.08);ctx.moveTo(L*0.95,0);ctx.lineTo(L*0.65,w*0.08);ctx.stroke();
  mem(body,e.x,e.y,e.a,0.95,1.3);
 }
};

/* ========== рисование клеток игрока ========== */
let BS=null;function playerBS(){return{hue:P.hue,pattern:P.pattern,un:P.un};}
function cellPath(w,t,r){ctx.beginPath();const N=16;for(let i=0;i<=N;i++){const th=i/N*TAU;const rr=r*(1+0.045*Math.sin(th*3+t*1.3+w.seed*20)+0.03*Math.sin(th*5-t*0.9+w.seed*7));const x=w.bx+Math.cos(th)*rr,y=w.by+Math.sin(th)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
function drawAppendage(w,t){
 const x=w.bx+w.ox*CELL_R*0.9,y=w.by+w.oy*CELL_R*0.9,ang=Math.atan2(w.oy,w.ox);
 if(!w.edge)return;
 switch(w.t){
  case'flag':if(BS.un.flag3){wave(x,y,ang,CELL_R*3.8,CELL_R*0.3,t*2.2+w.seed*5,ST.hair(1.3),PX*1.6,26);wave(x,y,ang,CELL_R*3.8,-CELL_R*0.3,t*2.2+w.seed*5+0.5,ST.hair(0.7),PX*1.1,26);}
   else if(BS.un.flag2){wave(x,y,ang-0.25,CELL_R*3.4,CELL_R*0.32,t*1.6+w.seed*5,ST.hair(1.2),PX*1.3,22);wave(x,y,ang+0.25,CELL_R*3.4,CELL_R*0.32,t*1.6+w.seed*5+1.3,ST.hair(1.2),PX*1.3,22);}
   else wave(x,y,ang,CELL_R*3.6,CELL_R*0.35,t*1.4+w.seed*5,ST.hair(1.2),PX*1.4,22);break;
  case'cilia':{const pts=[];for(let k=-6;k<=6;k++){const a=ang+k*0.2;pts.push([w.bx+Math.cos(a)*CELL_R,w.by+Math.sin(a)*CELL_R,Math.cos(a),Math.sin(a)]);}hairsAlong(pts,CELL_R*0.55,t,ST.hair(1),PX*0.9,w.seed*9);break;}
  case'spike':{const c=Math.cos(ang),s=Math.sin(ang);ctx.fillStyle=ST.spike(1);ctx.beginPath();ctx.moveTo(x-s*CELL_R*0.42,y+c*CELL_R*0.42);ctx.lineTo(x+c*CELL_R*1.7,y+s*CELL_R*1.7);ctx.lineTo(x+s*CELL_R*0.42,y-c*CELL_R*0.42);ctx.closePath();ctx.fill();break;}
  case'pseudo':{const l=CELL_R*(0.6+0.35*Math.sin(t*1.6+w.seed*8));ctx.fillStyle=ST.cytoP(BS.hue,1.4);for(const da of[-0.5,0.4]){const a=ang+da;ell(w.bx+Math.cos(a)*(CELL_R+l*0.4),w.by+Math.sin(a)*(CELL_R+l*0.4),l*0.75,CELL_R*0.33,a);ctx.fill();ctx.strokeStyle=ST.memP(P.hue,0.7);ctx.lineWidth=PX;ctx.stroke();}break;}
  case'eye':break;
  case'mouth':{const p=0.5+0.5*Math.sin(t*3+w.seed*4);ctx.strokeStyle=ST.hair(1);ctx.lineWidth=PX;ctx.beginPath();for(let k=-3;k<=3;k++){const a=ang+k*0.18;const sx=w.bx+Math.cos(a)*CELL_R*1.3,sy=w.by+Math.sin(a)*CELL_R*1.3;ctx.moveTo(sx,sy);ctx.lineTo(w.bx+Math.cos(ang)*CELL_R*(0.6-0.2*p),w.by+Math.sin(ang)*CELL_R*(0.6-0.2*p));}ctx.stroke();break;}
  case'sting':{const c=Math.cos(ang),s=Math.sin(ang);ctx.strokeStyle=ST.hair(1);ctx.lineWidth=PX;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+c*CELL_R*0.8,y+s*CELL_R*0.8);ctx.stroke();break;}
 }
}
function drawCellShape(w,t,hue,wx,wy,wa){
 // для одиночной клетки (дочери): всё сразу
 drawAppendage(w,t);ctx.fillStyle=ST.cytoP?ST.cytoP(hue,1.6):ST.cyto(hue,1.6);cellPath(w,t,CELL_R);ctx.fill();drawInner(w,t,hue);mem(()=>cellPath(w,t,CELL_R),wx,wy,wa,0.9,1,a=>ST.memP(hue,a));
}
function drawInner(w,t,hue){
 const x=w.bx,y=w.by,r=CELL_R;
 ctx.fillStyle=ST.nuc(1.3);const nr=w.core?r*0.36:r*0.26;circ(x-w.ox*r*0.15,y-w.oy*r*0.15,nr);ctx.fill();ctx.strokeStyle=ST.nucRim(0.8);ctx.lineWidth=PX*0.8;ctx.stroke();
 ctx.fillStyle=ST.gran(0.9);circ(x-w.ox*r*0.15,y-w.oy*r*0.15,nr*0.3);ctx.fill();
 ctx.save();ctx.translate(x,y);granules(7,r*0.7,w.seed,t,ST.gran(0.55),r*0.07);ctx.restore();
 for(let i=0;i<3;i++){const a=w.seed*30+i*2.1+t*0.2,d=r*0.55;ctx.fillStyle=ST.mito(1);ell(x+Math.cos(a)*d,y+Math.sin(a)*d,r*0.13,r*0.05,a);ctx.fill();}
 switch(w.t){
  case'chloro':for(let i=0;i<5;i++){const a=w.seed*20+i*1.26+t*0.1,d=r*0.55;ctx.fillStyle=ST.chlo(1);ell(x+Math.cos(a)*d,y+Math.sin(a)*d,r*0.2,r*0.12,a+1.57);ctx.fill();}break;
  case'eye':{const ex=x+w.ox*r*0.62,ey=y+w.oy*r*0.62;ctx.fillStyle=ST.eye(1);circ(ex,ey,r*0.2);ctx.fill();ctx.fillStyle=ST.vac(1.2);circ(ex+w.ox*r*0.17,ey+w.oy*r*0.17,r*0.1);ctx.fill();break;}
  case'vacuole':{const p=(t*0.8+w.seed)%1;const vr=r*(0.15+0.4*p);ctx.fillStyle=ST.vac(1.3);circ(x+w.ox*r*0.2,y+w.oy*r*0.2,vr);ctx.fill();ctx.strokeStyle=ST.vacRim(1);ctx.lineWidth=PX;ctx.stroke();break;}
  case'sting':{ctx.strokeStyle=ST.eye(0.8);ctx.lineWidth=PX*0.8;ell(x+w.ox*r*0.3,y+w.oy*r*0.3,r*0.35,r*0.22,Math.atan2(w.oy,w.ox));ctx.stroke();ctx.beginPath();for(let k=0;k<20;k++){const a=k*0.7,d=r*0.03*k*0.5;const px=x+w.ox*r*0.3+Math.cos(a)*d,py=y+w.oy*r*0.3+Math.sin(a)*d;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();break;}
  case'digest':for(let i=0;i<4;i++){const a=w.seed*9+i*1.6+t*0.3,d=r*0.5;ctx.fillStyle=ST.vac(1);circ(x+Math.cos(a)*d,y+Math.sin(a)*d,r*0.2);ctx.fill();ctx.fillStyle=ST.stain(30,0.6);circ(x+Math.cos(a)*d,y+Math.sin(a)*d,r*0.11);ctx.fill();}break;
  case'muscle':{ctx.strokeStyle=ST.stain(350,0.5);ctx.lineWidth=PX*0.8;const c=Math.cos(Math.atan2(w.oy,w.ox)+1.57),s=Math.sin(Math.atan2(w.oy,w.ox)+1.57);const k=0.8+0.2*Math.sin(t*4);ctx.beginPath();for(let i=-4;i<=4;i++){const ox=-s*i*r*0.18*k,oy=c*i*r*0.18*k;ctx.moveTo(x+ox-c*r*0.7,y+oy-s*r*0.7);ctx.lineTo(x+ox+c*r*0.7,y+oy+s*r*0.7);}ctx.stroke();break;}
  case'nerve':{ctx.fillStyle=ST.stain(50,0.8);circ(x,y,r*0.22);ctx.fill();break;}
  case'armor':break;
 }
 if(BS.pattern==='spots'){ctx.fillStyle=ST.stain(hue,0.45);for(let i=0;i<3;i++){const a=w.seed*40+i*2.2;circ(x+Math.cos(a)*r*0.5,y+Math.sin(a)*r*0.5,r*0.14);ctx.fill();}}
 if(BS.pattern==='stripes'){ctx.strokeStyle=ST.stain(hue,0.4);ctx.lineWidth=r*0.18;ctx.beginPath();for(let k=-1;k<=1;k++){ctx.moveTo(x-r*0.7,y+k*r*0.45);ctx.lineTo(x+r*0.7,y+k*r*0.45);}ctx.stroke();}
 if(BS.pattern==='ring'){ctx.strokeStyle=ST.stain(hue,0.5);ctx.lineWidth=r*0.14;circ(x,y,r*0.72);ctx.stroke();}
}
function drawBody(cw,t,wx,wy,wa,alpha){
 ctx.globalAlpha=alpha;
 for(const w of cw)drawAppendage(w,t);
 for(const w of cw)if(w.t==='slime'){ctx.fillStyle=ST.glow?'rgba(150,255,200,0.07)':'rgba(170,220,190,0.25)';circ(w.bx,w.by,CELL_R*1.35);ctx.fill();}
 const hue=BS.hue;ctx.fillStyle=ST.cytoP(hue,1.5);for(const w of cw){cellPath(w,t,CELL_R*1.04);ctx.fill();}
 const nerves=cw.filter(w=>w.t==='nerve');if(nerves.length){ctx.strokeStyle=ST.stain(50,0.7);ctx.lineWidth=PX*1.1;ctx.beginPath();for(const nw of nerves)for(const o of cw){const d=Math.hypot(o.bx-nw.bx,o.by-nw.by);if(d>1&&d<CELL_R*2.2){ctx.moveTo(nw.bx,nw.by);ctx.quadraticCurveTo((nw.bx+o.bx)/2+Math.sin(t+d)*2,(nw.by+o.by)/2,o.bx,o.by);}}ctx.stroke();}
 for(const w of cw)drawInner(w,t,hue);
 if(BS.un===P.un&&P.vacs)for(const v of P.vacs){const w=cw[v.ci];if(!w)continue;const p=1-v.t/v.dur,x=w.bx+v.ox,y=w.by+v.oy,vr=v.sz*(0.75+0.25*p);
  ctx.fillStyle=ST.vac(1.2);circ(x,y,vr);ctx.fill();
  const col=v.k==='chlorella'||v.k==='euglena'||v.k==='volvox'?ST.chlo(0.35+0.6*p):v.k==='detritus'?(ST.dark?`rgba(210,180,130,${0.2+0.5*p})`:`rgba(110,80,40,${0.25+0.5*p})`):ST.gran(0.3+0.6*p);
  ctx.fillStyle=col;circ(x+Math.sin(t+v.ox)*vr*0.1,y,vr*0.72*Math.max(0.05,p));ctx.fill();
  if(p<0.75){ctx.fillStyle=ST.stain(30,0.35*(1-p));circ(x,y,vr*0.9);ctx.fill();}
  ctx.strokeStyle=ST.vacRim(0.9);ctx.lineWidth=PX*0.8;circ(x,y,vr);ctx.stroke();}
 for(const w of cw){mem(()=>cellPath(w,t,CELL_R*1.04),wx,wy,wa,0.85,1,a=>ST.memP(hue,a));if(w.t==='armor'){mem(()=>cellPath(w,t,CELL_R*1.2),wx,wy,wa,0.9,2.2,a=>ST.memP(hue,a));}}
 ctx.globalAlpha=1;
}

/* ========== кадр ========== */
function bg(){
 ctx.setTransform(DPR,0,0,DPR,0,0);
 const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.hypot(W,H)/2);g.addColorStop(0,ST.bg0);g.addColorStop(1,ST.bg1);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 {const sl=siltAt(cam.x,cam.y),su=surfAt(cam.x,cam.y);
  if(sl>0.01){ctx.fillStyle=P.mode==='fluo'?`rgba(40,25,10,${0.5*sl})`:ST.dark?`rgba(55,42,22,${0.45*sl})`:`rgba(105,82,45,${0.32*sl})`;ctx.fillRect(0,0,W,H);}
  if(su>0.01&&!ST.dark){ctx.fillStyle=`rgba(255,255,248,${0.14*su})`;ctx.fillRect(0,0,W,H);}}
 // световые пятна
 for(const l of lights){const sx=(l.x-cam.x)*cam.s+W/2,sy=(l.y-cam.y)*cam.s+H/2,sr=l.r*cam.s;if(sx<-sr||sy<-sr||sx>W+sr||sy>H+sr)continue;const lg=ctx.createRadialGradient(sx,sy,0,sx,sy,sr);lg.addColorStop(0,ST.light);lg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=lg;ctx.fillRect(sx-sr,sy-sr,sr*2,sr*2);}
 // край капли
 const ed=Math.hypot(cam.x,cam.y)+Math.hypot(W,H)/2/cam.s;if(ed>DROP_R*0.9){const sx=-cam.x*cam.s+W/2,sy=-cam.y*cam.s+H/2;ctx.lineWidth=60*cam.s;ctx.strokeStyle=ST.dark?'rgba(200,220,255,0.12)':'rgba(60,50,30,0.3)';ctx.beginPath();ctx.arc(sx,sy,DROP_R*cam.s+30*cam.s,0,TAU);ctx.stroke();}
}
function drawFar(){
 if(!FX.blur)return;
 const fw=far.width,fh=far.height;fctx.setTransform(1,0,0,1,0,0);fctx.clearRect(0,0,fw,fh);
 const span=viewD()*2.2,par=0.55;
 for(const o of farObj){o.a+=o.v;let x=((o.x*span-cam.x*par)%span+span)%span-span*0.3,y=((o.y*span-cam.y*par)%span+span)%span-span*0.3;
  const sx=x/span*fw*1.6,sy=y/span*fh*1.6*(fw/fh)*(fh/fw)*1.0;const sr=o.r*fw*1.2;
  fctx.save();fctx.translate(sx,sy);fctx.rotate(o.a);fctx.globalAlpha=0.9;
  fctx.fillStyle=ST.cyto(o.h,2.5);fctx.strokeStyle=ST.mem(0.6);fctx.lineWidth=Math.max(1,sr*0.08);
  fctx.beginPath();if(o.k==='rod')fctx.ellipse(0,0,sr,sr*0.3,0,0,TAU);else if(o.k==='diatom')fctx.ellipse(0,0,sr*1.2,sr*0.25,0,0,TAU);else fctx.arc(0,0,sr,0,TAU);fctx.fill();fctx.stroke();
  if(o.k==='cell'||o.k==='ring'){fctx.fillStyle=ST.nuc(2);fctx.beginPath();fctx.arc(0,0,sr*0.35,0,TAU);fctx.fill();}
  fctx.restore();}
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=true;ctx.globalAlpha=ST.dark?0.4:0.38;ctx.drawImage(far,0,0,W,H);ctx.globalAlpha=1;
}
function drawNear(){
 if(!FX.blur)return;
 const nw=near.width,nh=near.height;nctx.setTransform(1,0,0,1,0,0);nctx.clearRect(0,0,nw,nh);
 const span=viewD()*1.6,par=1.6;
 for(const o of nearObj){const x=((o.x*span-cam.x*par)%span+span)%span,y=((o.y*span-cam.y*par)%span+span)%span;const sx=x/span*nw*1.4-nw*0.2,sy=y/span*nh*1.4-nh*0.2,sr=o.r*nw;
  nctx.fillStyle=ST.dark?'rgba(200,215,240,0.10)':'rgba(60,55,40,0.12)';nctx.beginPath();nctx.arc(sx,sy,sr,0,TAU);nctx.fill();
  if(o.k==='ring'){nctx.strokeStyle=ST.dark?'rgba(220,230,255,0.15)':'rgba(40,40,30,0.18)';nctx.lineWidth=sr*0.15;nctx.stroke();}}
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(near,0,0,W,H);
}
function drawParticles(dt){
 if(!FX.parts)return;
 const hw=W/2/cam.s,hh=H/2/cam.s;
 ctx.setTransform(DPR,0,0,DPR,0,0);
 for(const p of parts){
  if(p.init){p.x=cam.x+p.x*hw;p.y=cam.y+p.y*hh;p.init=0;}
  const fl=flow(p.x,p.y);p.x+=(fl[0]+(R_()-0.5)*90*p.z)*dt;p.y+=(fl[1]+(R_()-0.5)*90*p.z)*dt;
  if(p.x<cam.x-hw)p.x+=hw*2;if(p.x>cam.x+hw)p.x-=hw*2;if(p.y<cam.y-hh)p.y+=hh*2;if(p.y>cam.y+hh)p.y-=hh*2;
  const sx=(p.x-cam.x)*cam.s+W/2,sy=(p.y-cam.y)*cam.s+H/2;const focus=Math.abs(p.z-0.6);const r=Math.max(0.6,p.r*cam.s*0.4)+focus*4;
  ctx.fillStyle=ST.part(Math.max(0.08,0.55-focus*0.9));ctx.beginPath();ctx.arc(sx,sy,r,0,TAU);ctx.fill();
 }
}
function worldTransform(){const s=cam.s*DPR;let sx=0,sy=0;if(cycE&&!paused){const d=Math.hypot(P.x-cycE.x,P.y-cycE.y);const a=Math.max(0,1-d/1600)*5*Math.max(0,Math.sin(cycE.t*2.6));sx=rnd(-a,a);sy=rnd(-a,a);}ctx.setTransform(s,0,0,s,DPR*(W/2-cam.x*cam.s+sx),DPR*(H/2-cam.y*cam.s+sy));PX=1/cam.s;}
function drawWorld(){
 worldTransform();
 const hw=W/2/cam.s+20,hh=H/2/cam.s+20;
 {const G0=160,x0=Math.floor((cam.x-hw)/G0),x1=Math.floor((cam.x+hw)/G0),y0=Math.floor((cam.y-hh)/G0),y1=Math.floor((cam.y+hh)/G0);ctx.fillStyle=ST.dark?'rgba(205,185,145,0.3)':'rgba(85,65,35,0.4)';
  if((x1-x0)*(y1-y0)<900)for(let gx=x0;gx<=x1;gx++)for(let gy=y0;gy<=y1;gy++){const sl=siltAt(gx*G0+80,gy*G0+80);if(sl<0.12)continue;const n=Math.round(14*sl);for(let i=0;i<n;i++){const hx=hash(gx*31+i,gy*17-i),hy=hash(gy*13+i*7,gx*5+i);const sz=(1.2+hash(i+gx,gy)*3)*Math.max(1,PX);ctx.fillRect(gx*G0+hx*G0,gy*G0+hy*G0,sz,sz*0.8);}}}
 drawMolds(hw,hh);
 for(const t of thickets){if(Math.abs(t.x-cam.x)>hw+t.r+40||Math.abs(t.y-cam.y)>hh+t.r+40)continue;for(const f of t.fil)drawFil(f);}
 for(const sp of spores){if(Math.abs(sp.x-cam.x)>hw+200||Math.abs(sp.y-cam.y)>hh+200)continue;drawSpore(sp);}
 for(const s of slime){ctx.fillStyle=ST.glow?`rgba(140,255,190,${0.05*s.t/6})`:`rgba(150,200,170,${0.16*s.t/6})`;circ(s.x,s.y,s.r);ctx.fill();}
 if(ST.glow)ctx.globalCompositeOperation='lighter';
 const sorted=ents.slice().sort((a,b)=>(a.r>40)-(b.r>40)||b.r-a.r);
 for(const e of sorted){
  const ext=e.sp==='oldhydra'?e.r*3.2:e.sp==='chaos'?e.r*1.4:e.sp==='vorticella'?(e.len||90)+20:e.sp==='daphnia'?e.r*1.6:e.sp==='hydra'?e.r*3.2:e.sp==='cyclops'?e.r*1.4:e.sp==='nematode'?e.r*1.6:e.sp==='heliozoa'?e.r*2.6:e.sp==='rotifer'||e.sp==='tardigrade'?e.r*1.4:e.sp==='bell'?e.r*2.5:e.sp==='euglena'?e.r*2:e.r*1.3;
  if(e.x+ext<cam.x-hw||e.x-ext>cam.x+hw||e.y+ext<cam.y-hh||e.y-ext>cam.y+hh)continue;
  if(SP[e.sp]&&!P.seen[e.sp]&&SP[e.sp].kind!=='food')discover(e);
  const f=DRAW[e.sp];if(!f)continue;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.a);
  if(e.eaten){const k=1-e.eaten;ctx.scale(k,k);ctx.globalAlpha=k;}
  if(e.r*cam.s<1.2&&SP[e.sp]&&SP[e.sp].kind==='food'){ctx.fillStyle=e.sp==='chlorella'?ST.chlo(0.8):ST.gran(0.9);ctx.fillRect(-PX,-PX,2*PX,2*PX);}
  else if(e.div&&e.div.t/e.div.dur>0.12){const p=Math.min(1,e.div.t/e.div.dur);
   if(e.div.type==='long'){for(const sg of[-1,1]){ctx.save();ctx.translate(0,sg*e.r*0.3*p);ctx.rotate(-sg*0.25*p);ctx.scale(1,1-0.35*p);f(e,T);ctx.restore();}}
   else if(e.sp==='amoeba'){for(const sg of[-1,1]){ctx.save();ctx.translate(0,sg*e.r*0.75*p);ctx.scale(1-0.28*p,1-0.28*p);f(e,T);ctx.restore();}}
   else{for(const sg of[-1,1]){ctx.save();ctx.translate(sg*e.r*0.5*p,0);ctx.scale(1-0.4*p,1);f(e,T);ctx.restore();}}}
  else f(e,T);
  if(e.conj&&e.conj.lead){const r=e.r;ctx.strokeStyle=ST.nucRim(0.8);ctx.lineWidth=PX*1.2;ctx.beginPath();for(let k=-3;k<=3;k++){const x=k*r*0.07;ctx.moveTo(x,r*0.22);ctx.lineTo(x+Math.sin(T*6+k)*r*0.02,r*0.44);}ctx.stroke();ctx.fillStyle=ST.nuc(1.6);circ(Math.sin(T*1.5)*r*0.12,r*0.33,r*0.04);ctx.fill();}
  if(e.bond>0){ctx.strokeStyle='rgba(255,210,90,0.9)';ctx.lineWidth=2*PX;ctx.beginPath();ctx.arc(0,0,e.r*1.25,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,e.bond/3));ctx.stroke();}
  if(e.infested){ctx.strokeStyle=`rgba(190,80,230,${0.5+0.3*Math.sin(T*4)})`;ctx.lineWidth=2*PX;ctx.setLineDash([2*PX,4*PX]);circ(0,0,e.r*1.08);ctx.stroke();ctx.setLineDash([]);}
  if(e.ally){ctx.strokeStyle='rgba(255,210,90,0.55)';ctx.lineWidth=1.2*PX;ctx.setLineDash([3*PX,3*PX]);circ(0,0,e.r*1.2);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();ctx.globalAlpha=1;
  if((e.hitT>0||e.boss||e.rival)&&e.maxHp>0&&SP[e.sp]&&SP[e.sp].kind!=='food')hpBar(e);
  if(tierOf(e)>0&&!e.ally&&!e.rival&&!e.eaten&&!e.dead){const tl=tierOf(e),ed=tl<=D.pl;ctx.fillStyle=ed?'rgba(120,230,140,0.85)':tl===D.pl+1?'rgba(255,200,90,0.9)':'rgba(255,90,80,0.9)';circ(e.x,e.y-e.r-7*PX,2.4*PX);ctx.fill();}
 }
 if(hasN('lumin')){const gl=ctx.createRadialGradient(P.x,P.y,D.R*0.5,P.x,P.y,D.R*2.2);const pa=0.5+0.5*Math.sin(T*2);gl.addColorStop(0,ST.dark?`rgba(120,220,255,${0.18+0.1*pa})`:`rgba(120,200,255,${0.12+0.06*pa})`);gl.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gl;circ(P.x,P.y,D.R*2.2);ctx.fill();}
 // игрок
 ctx.save();ctx.translate(P.x,P.y);ctx.rotate(P.a);
 const flick=host?0.4:P.inv>0?0.55+0.45*Math.sin(T*20):1;BS=playerBS();drawBody(D.cw,T,P.x,P.y,P.a,flick);
 if(P.cdmg)for(const w of D.cw){const d=P.cdmg[w.q+','+w.r];if(!d)continue;const k=clamp(d/(TYPES[w.t].hp*2.2*(w.t==='armor'?2:1)),0,1);ctx.strokeStyle=`rgba(255,60,50,${0.25+0.6*k})`;ctx.lineWidth=(1+2*k)*PX;ctx.beginPath();ctx.arc(w.bx,w.by,CELL_R*0.75,0,TAU*k);ctx.stroke();}
 if(P.lost&&P.lost.length)for(const L of P.lost){const[hx,hy]=hexXY(L.q,L.r);const bx=hx-D.mx,by=hy-D.my;ctx.setLineDash([3*PX,3*PX]);ctx.strokeStyle=ST.dark?'rgba(200,230,255,0.45)':'rgba(60,60,50,0.45)';ctx.lineWidth=1.2*PX;circ(bx,by,CELL_R*0.9);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(120,220,140,0.8)';ctx.lineWidth=2*PX;ctx.beginPath();ctx.arc(bx,by,CELL_R*0.9,-Math.PI/2,-Math.PI/2+TAU*(1-L.time/L.max));ctx.stroke();}
 if(P.hurt>0){ctx.strokeStyle=`rgba(255,40,40,${P.hurt*2})`;ctx.lineWidth=3*PX;circ(0,0,D.R+3);ctx.stroke();}
 ctx.restore();
 ctx.globalCompositeOperation='source-over';
 for(const z of zaps){ctx.strokeStyle=`rgba(150,220,255,${z.t*2})`;ctx.lineWidth=2.5*PX;ctx.beginPath();for(let i=0;i<=40;i++){const a=i/40*TAU,rr=z.r*(1-z.t)*1.2+rnd(-6,6);i?ctx.lineTo(z.x+Math.cos(a)*rr,z.y+Math.sin(a)*rr):ctx.moveTo(z.x+Math.cos(a)*rr,z.y+Math.sin(a)*rr);}ctx.stroke();}
 for(const s of shots){ctx.strokeStyle=s.c==='tri'?(ST.dark?`rgba(230,240,255,${s.t*3})`:`rgba(50,50,35,${s.t*2.5})`):`rgba(255,120,200,${s.t*4})`;ctx.lineWidth=1.4*PX;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.quadraticCurveTo((s.x1+s.x2)/2+8,(s.y1+s.y2)/2-8,s.x2,s.y2);ctx.stroke();}
}
function drawOverlay(){
 ctx.setTransform(DPR,0,0,DPR,0,0);
 if(DAYK<0.995){ctx.fillStyle=`rgba(4,8,32,${(1-DAYK)*(ST.dark?0.32:0.45)})`;ctx.fillRect(0,0,W,H);
  if(DAYK<0.7){ctx.save();ctx.globalCompositeOperation='lighter';const nk=(0.7-DAYK)/0.58;for(const e of ents){if(e.eaten||e.dead)continue;let gr=0,col='';if(e.sp==='noct'){gr=e.r*2.6;col='90,200,255';}else if(e.sp==='bell'){gr=e.r*1.6;col='160,120,255';}else if(e.sp==='plasmid'){gr=e.r*5;col='255,210,90';}if(!gr)continue;const sx=(e.x-cam.x)*cam.s+W/2,sy=(e.y-cam.y)*cam.s+H/2,R0=gr*cam.s;if(sx<-R0||sx>W+R0||sy<-R0||sy>H+R0)continue;const a=nk*(0.3+0.2*Math.sin(T*3+e.seed*9))*(e.sp==='noct'&&Math.hypot(e.vx||0,e.vy||0)>3?1.6:1);const g=ctx.createRadialGradient(sx,sy,0,sx,sy,R0);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.fillRect(sx-R0,sy-R0,R0*2,R0*2);}ctx.restore();}}
 if(FX.vig){const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.hypot(W,H)*0.55);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,ST.vig);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
 // цветная кайма по краю поля
 if(FX.ca){const r0=Math.min(W,H)*0.48,rg=ctx.createRadialGradient(W/2,H/2,r0,W/2,H/2,Math.hypot(W,H)*0.55);rg.addColorStop(0,'rgba(0,0,0,0)');rg.addColorStop(0.35,ST.dark?'rgba(80,40,255,0.07)':'rgba(255,60,0,0.06)');rg.addColorStop(0.7,ST.dark?'rgba(255,60,40,0.06)':'rgba(0,80,255,0.05)');rg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);}
 if(cam.trans>0){const a=Math.sin(cam.trans*Math.PI)*0.85;ctx.fillStyle=ST.bg0;ctx.globalAlpha=a;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
 // стрелки угроз (глазок) и еды (хемотаксис)
 const arrows=[];
 if(D.eyes){for(const e of ents){const s=SP[e.sp];if(!s||!s.dmg&&s.beh!=='amoeba')continue;if(s.beh==='amoeba'&&D.R>=e.r*0.6)continue;const sx=(e.x-cam.x)*cam.s+W/2,sy=(e.y-cam.y)*cam.s+H/2;if(sx>0&&sy>0&&sx<W&&sy<H)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>viewD()*(1+0.4*D.eyes)*(hasN('eye2')?1.6:1))continue;arrows.push([e.x,e.y,'#ff5040']);}
}
 for(const e of ents){if(!(e.boss||(e.rival&&e.mode==='hunt')))continue;const sx=(e.x-cam.x)*cam.s+W/2,sy=(e.y-cam.y)*cam.s+H/2;if(!(sx>0&&sy>0&&sx<W&&sy<H)&&Math.hypot(e.x-P.x,e.y-P.y)<viewD()*1.6)arrows.push([e.x,e.y,e.boss?'#ff9020':'#ff60c0']);}
 if(cycE){const sx=(cycE.x-cam.x)*cam.s+W/2,sy=(cycE.y-cam.y)*cam.s+H/2;if(!(sx>0&&sy>0&&sx<W&&sy<H))arrows.push([cycE.x,cycE.y,'#ff2020']);}
 if(hasN('magneto')){let best=null,bd=1e9;for(const s of spores){if(P.sporesOpen[s.id])continue;const d=Math.hypot(s.x-P.x,s.y-P.y);if(d<bd){bd=d;best=s;}}if(best)arrows.push([best.x,best.y,'#60d0ff']);}
 for(const[x,y,c]of arrows){const a=Math.atan2(y-P.y,x-P.x);const px=(P.x-cam.x)*cam.s+W/2,py=(P.y-cam.y)*cam.s+H/2;const rr=D.R*cam.s+26;const ax=px+Math.cos(a)*rr,ay=py+Math.sin(a)*rr;ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(ax+Math.cos(a)*9,ay+Math.sin(a)*9);ctx.lineTo(ax+Math.cos(a+2.5)*6,ay+Math.sin(a+2.5)*6);ctx.lineTo(ax+Math.cos(a-2.5)*6,ay+Math.sin(a-2.5)*6);ctx.fill();}
 // всплывающие надписи
 ctx.font='600 12px system-ui,sans-serif';ctx.textAlign='center';
 for(const p of pops){const sx=(p.x-cam.x)*cam.s+W/2,sy=(p.y-cam.y)*cam.s+H/2-(1.6-p.t)*24;ctx.globalAlpha=Math.min(1,p.t);ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillText(p.s,sx+1,sy+1);ctx.fillStyle=p.c;ctx.fillText(p.s,sx,sy);}
 ctx.globalAlpha=1;
}
function pop(x,y,s,c){pops.push({x,y,s,c,t:1.6});}

/* ========== камера и объективы ========== */
function updateCam(dt){
 const Re=Math.sqrt(D.n)*CELL_R*1.05;let want=0;for(let i=0;i<OBJ.length;i++){if(Re/OBJ[i].d>0.1)want=i+1;}want=Math.min(OBJ.length-1,want);
 if(want!==cam.obj&&cam.trans<=0){cam.trans=1;cam.next=want;}
 if(cam.trans>0){const before=cam.trans;cam.trans-=dt*1.1;if(before>0.5&&cam.trans<=0.5){cam.obj=cam.next;toast('Смена объектива: <b>×'+OBJ[cam.obj].m+'</b>. Ты вырос — теперь видно больше капли.');for(const p of parts)p.init=1,p.x=rnd(-1,1),p.y=rnd(-1,1);}if(cam.trans<0)cam.trans=0;}
 cam.s=Math.min(W,H)/OBJ[cam.obj].d;
 const k=Math.min(1,dt*4);cam.x+=(P.x+P.vx*0.25-cam.x)*k;cam.y+=(P.y+P.vy*0.25-cam.y)*k;
}

/* ========== HUD ========== */
const MODE_BTNS={};
const MODE_DESC={bright:'Классика: свет сквозь прозрачные клетки',dark:'Чёрный фон, светятся контуры и реснички',phase:'Видно органеллы, светлые ореолы',fluo:'Ядра синие, хлорофилл красный'};
MODE_KEYS.forEach((k,i)=>{const b=document.createElement('button');b.innerHTML='<b>'+(i+1)+' · '+MODES[k].ru+'</b><span>'+MODE_DESC[k]+'</span>';b.onclick=()=>setMode(k);$('modeBtns').appendChild(b);MODE_BTNS[k]=b;});
function setMode(k){P.mode=k;if(P.modesSeen)P.modesSeen[k]=1;ST=MODES[k];if(!ST.cytoP)ST.cytoP=(h,a)=>ST.cyto(h,a);for(const kk of MODE_KEYS)MODE_BTNS[kk].classList.toggle('on',kk===k);if(editorOpen)drawEditor();}
const FX_KEY='evo_stage1_fx';const FX={blur:true,ca:true,parts:true,vig:true};
try{Object.assign(FX,JSON.parse(localStorage.getItem(FX_KEY)||'{}'));}catch(e){}
const FX_RU={blur:'Размытые слои вне фокуса',ca:'Цветная кайма у краёв (хроматическая аберрация)',parts:'Броуновские частицы',vig:'Затемнение краёв поля (виньетка)'};
function renderFx(){$('fxToggles').innerHTML=Object.keys(FX_RU).map(k=>'<label class="tog"><input type="checkbox" data-fx="'+k+'" '+(FX[k]?'checked':'')+'>'+FX_RU[k]+'</label>').join('');}
renderFx();
$('fxToggles').addEventListener('change',e=>{const k=e.target.dataset.fx;if(!k)return;FX[k]=e.target.checked;try{localStorage.setItem(FX_KEY,JSON.stringify(FX));}catch(err){}});
let setOpen=false,wasPaused=false;
function toggleSettings(){if(editorOpen)return;setOpen=!setOpen;$('settings').classList.toggle('hidden',!setOpen);if(setOpen){wasPaused=paused;paused=true;$('pause').classList.add('hidden');}else paused=started?wasPaused:true;}
$('bSet').onclick=toggleSettings;$('sClose').onclick=toggleSettings;
for(const k of MODE_KEYS){const m=MODES[k];m.cytoP=k==='bright'?(h,a)=>`hsla(${h},45%,55%,${a*0.22})`:k==='phase'?(h,a)=>`hsla(${h},14%,32%,${a*0.33})`:k==='dark'?(h,a)=>`hsla(${h},45%,70%,${a*0.09})`:(h,a)=>`hsla(${h},100%,55%,${a*0.07})`;}
function niceLen(v){const c=[1,2,5,10,20,25,50,100,200,250,500,1000];let b=c[0];for(const x of c)if(x<=v)b=x;return b;}
let hudT=0;
function hud(){
 const stage=D.n===1?'Одноклеточное':D.n<6?'Колония клеток':hasN('spec')?'Многоклеточное':'Колония клеток';
 $('hTitle').textContent='Поколение '+P.gen+' · '+stage;
 $('hpBar').style.width=(P.hp/D.hpMax*100).toFixed(0)+'%';$('hpTxt').textContent=Math.ceil(P.hp)+' / '+Math.round(D.hpMax);
 if(!hasN('adhesion')){$('bmLbl').textContent='До деления';$('bmBar').style.width=(P.biomass/14*100)+'%';$('bmTxt').textContent=P.biomass.toFixed(1)+' / 14';}
 else{const c=cellCost();$('bmLbl').textContent='Биомасса (клетка = '+c+')';$('bmBar').style.width=Math.min(100,P.biomass/c*100)+'%';$('bmTxt').textContent=Math.floor(P.biomass)+'';}
 $('satBar').style.width=((P.sat==null?1:P.sat)*100).toFixed(0)+'%';$('satBar').style.background=P.sat<0.25?'#e06050':'#7fb0ff';$('satLbl').innerHTML=P.starving?'<span style="color:#ff8a7a">Голод! Тело слабеет — ешь</span>':'Сытость';
 $('cellTxt').textContent=D.n;if($('plTxt'))$('plTxt').textContent=D.pl;$('dnaTxt').textContent=P.dna;
 const dk=Object.keys(P.defects);$('defTxt').innerHTML=dk.length?'Дефект: '+dk.map(k=>DEFECTS[k].ru+' ('+DEFECTS[k].d+', ещё '+P.defects[k]+' пок.)').join(', '):'';
 $('bZap').classList.toggle('hidden',!hasN('electro'));if(hasN('electro'))$('bZap').textContent=P.zapCd>0?'Разряд '+P.zapCd.toFixed(1)+'с':'Разряд (Q)';$('tZap').classList.toggle('hidden',!hasN('electro'));
 $('bPara').classList.toggle('hidden',!hasN('parasite'));$('bPara').textContent=host?'Выйти из хозяина (R)':'Проникнуть (R)';$('bPara').classList.toggle('on',!!host);$('tPara').classList.toggle('hidden',!hasN('parasite'));$('tPara').textContent=host?'Выйти':'Внутрь'; $('bDash').classList.toggle('hidden',!D.dashCd);if(D.dashCd)$('bDash').textContent=P.dashCd>0?'Рывок '+P.dashCd.toFixed(1)+'с':'Рывок (Пробел)';
 $('bFinal').classList.toggle('hidden',D.n<GOAL_CELLS||!!P.kingdom);
 const zn=zoneName(P.x,P.y);$('obj').textContent='Объектив ×'+OBJ[cam.obj].m+' · поле ≈ '+OBJ[cam.obj].d+' мкм · '+ZONES[zn].ru+' · '+(DAYK>0.9?'☀ день':DAYK<0.3?'☾ ночь':DAYK<(P.dayDir||0)?'закат':'сумерки');
 if(!P.hintsDone['zone_'+zn]&&zn!=='open'){P.hintsDone['zone_'+zn]=1;qtoast('Зона: <b>'+ZONES[zn].ru+'</b>. '+ZONES[zn].info);}
 const target=Math.min(W,H)*0.16/cam.s;const L=niceLen(target);$('sbLine').style.width=(L*cam.s)+'px';$('sbText').textContent=L+' мкм';
 $('hint').innerHTML=currentHint();checkAch();
 $('goal').innerHTML='<b>Цель уровня:</b> вырасти до '+GOAL_CELLS+' клеток и выбрать путь: животное, растение или гриб.<div class="bar" style="margin-top:5px"><i style="background:#7fb0ff;width:'+Math.min(100,D.n/GOAL_CELLS*100)+'%"></i></div><span class="muted">Видов открыто: '+SPECIES_KEYS.filter(k=>P.seen[k]).length+' / '+SPECIES_KEYS.length+(allyCount?' · симбионтов: '+allyCount:'')+' · время '+Math.floor(P.stats.time/60)+' мин</span>'+(P.kingdom?'<br><span style="color:#9fe0a8">Выбранный путь: '+KING[P.kingdom].ru+'</span>':'');
}
function currentHint(){
 if(cycE&&cycE.life>0)return'<b>'+SP[cycE.sp].ru+' в капле!</b> Держись подальше, пока не уплывёт, или спрячься в зарослях нитчатки. Красная стрелка показывает, где она.'.replace('она.',cycE.sp==='cyclops'?'он.':'она.').replace('не уплывёт',cycE.sp==='cyclops'?'не уплывёт':'не ускачет');
 const avail=NODES.some(n=>nodeState(n)==='avail'&&P.dna>=n.cost);
 if(D.n===1&&!hasN('adhesion')&&P.stats.div===0)return'Ты беспомощная клетка: атаковать никого не можешь. Ешь мелкие точки — бактерии и хлореллу — и ищи по капле <b>золотые кольца-плазмиды</b>: это ДНК для первых улучшений.';
 if(!hasN('adhesion'))return P.dna>=3?'Хватает ДНК на <b>Адгезию</b>! Нажми «Эволюция» (E).':'Дочери уплывают. Собери 3 ДНК — исследуй каплю в поисках золотых колец-плазмид (и делись) — и открой <b>Адгезию</b>.';
 if(D.n<3)return'Открой редактор (E) и пристрой новую клетку рядом с собой — за биомассу.';
 if(D.n>=GOAL_CELLS&&!P.kingdom)return'Ты стал многоклеточным! Нажми <b>«Выйти из капли»</b>, чтобы выбрать путь.';
 if(avail)return'Хватает ДНК на новую мутацию — загляни в «Эволюцию» (E).';
 if(P.biomass>=cellCost())return'Биомассы хватает на новую клетку — нарасти её в редакторе (E).';
 if(D.n>=6&&!hasN('spec'))return'Шесть клеток — можно открыть <b>Специализацию</b>: шаг к настоящему многоклеточному.';
 if(!D.cnt.spike&&!D.cnt.mouth&&!D.cnt.sting&&D.n>=3)return'Крупную добычу целиком не проглотить. Шипы, рот или стрекательные клетки помогут охотиться.';
 if(!P.stats.maxAllies&&P.seen.euglena)return'Подплыви к зелёной эвглене медленно и задержись рядом на 3 секунды — она станет симбионтом.';
 return'1–4 — сменить метод микроскопии. Крупные хищники опасны, пока ты мельче их.';
}
let toastQ=[],toastT=0;function qtoast(h){toastQ.push(h);}
function toast(html){const d=document.createElement('div');d.className='toast panel';d.innerHTML=html;$('toasts').prepend(d);setTimeout(()=>d.remove(),6000);while($('toasts').children.length>3)$('toasts').lastChild.remove();}

/* ========== редактор ========== */
const ecv=$('ecv'),ectx=ecv.getContext('2d');let tool='basic',eHover=null;
function nodeState(n){if(P.un[n.id])return'owned';if(n.rare)return'rare';for(const r of n.req){const ok=r.split('|').some(x=>P.un[x]);if(!ok)return'locked';}if(n.minCells&&D.n<n.minCells)return'locked';return'avail';}
function unlockedTypes(){const t=['basic'];for(const n of NODES)if(n.unlock&&P.un[n.id])t.push(n.unlock);return t;}
function toggleEditor(){if(!started||pendingMut||achOpen||setOpen)return;editorOpen=!editorOpen;$('editor').classList.toggle('hidden',!editorOpen);if(editorOpen){paused=true;restoreLost();if(host)leaveHost(false,true);renderEditor();}else{paused=false;derive();save();}}
function renderEditor(){
 $('eBm').textContent=Math.floor(P.biomass);$('eDna').textContent=P.dna;
 let h='',grp='';
 for(const n of NODES){if(n.grp!==grp){grp=n.grp;h+='<div class="grp">'+grp+'</div>';}const st=nodeState(n);const can=st==='avail'&&P.dna>=n.cost;
  const req=n.req.length?'Нужно: '+n.req.map(r=>r.split('|').map(x=>NODE[x].ru).join(' или ')).join(', ')+(n.minCells?', '+n.minCells+' клеток':''):(n.minCells?'Нужно '+n.minCells+' клеток':'');
  h+='<button class="node '+(st==='owned'?'owned':(st==='locked'||st==='rare')?'locked':'')+'" data-n="'+n.id+'"><span class="c">'+(st==='owned'?'есть':n.rare?'спора':n.cost+' ДНК')+'</span><div class="n">'+n.ru+'</div><div class="d">'+n.desc+(st==='locked'&&req?'<br><i>'+req+'</i>':'')+(st==='rare'?(n.trophy?'<br><i>Только за победу над мини-боссом зоны</i>':'<br><i>Только из древней споры в иле</i>'):'')+'</div></button>';}
 $('tree').innerHTML=h;
 const types=unlockedTypes();if(!types.includes(tool)&&tool!=='erase')tool='basic';
 $('pal').innerHTML=types.map(t=>'<button data-t="'+t+'" class="'+(tool===t?'on':'')+'" title="'+TYPES[t].desc+'"><span class="sw" style="background:'+TYPES[t].col+'"></span>'+TYPES[t].ru+'</button>').join('')+'<button data-t="erase" class="'+(tool==='erase'?'on':'')+'"><span class="sw" style="background:#000"></span>Убрать клетку</button>';
 $('pats').innerHTML=[['none','Без узора'],['spots','Пятна'],['stripes','Полосы'],['ring','Кольца']].map(([k,n])=>'<button data-p="'+k+'" class="'+(P.pattern===k?'on':'')+'">'+n+'</button>').join('');
 $('hue').value=P.hue;
 const st=[['Скорость',D.speed.toFixed(0)+' мкм/с'],['Поворот',D.turn.toFixed(1)],['Здоровье',Math.round(D.hpMax)],['Размер',(D.R*2).toFixed(0)+' мкм'],['Глотает до',(D.R*2*D.engulf).toFixed(0)+' мкм'],['Фотосинтез',D.photo?'+'+D.photo.toFixed(1)+'/с на свету':'нет'],['Пищеварение','×'+D.digest.toFixed(1)],['Сытость хватает на',Math.round(1/D.met/60*10)/10+' мин без еды'],['Шипы / рты',(D.edge.spike||0)+' / '+(D.edge.mouth||0)],['Рывок',D.dashCd?'раз в '+D.dashCd.toFixed(1)+' с':'нет'],['Новая клетка',hasN('adhesion')?cellCost()+' биомассы':'нужна адгезия']];
 $('stats').innerHTML=st.map(([a,b])=>'<div class="stat"><span class="muted">'+a+'</span><span>'+b+'</span></div>').join('');
 drawEditor();
}
$('tree').addEventListener('click',e=>{const b=e.target.closest('.node');if(!b)return;const n=NODE[b.dataset.n];const st=nodeState(n);
 if(st==='owned')return;if(st==='rare'&&n.trophy){eInfo('Это трофей: его даёт только победа над мини-боссом одной из зон капли.');return;}if(st==='rare'){eInfo('Этот орган не открыть за ДНК — его хранит древняя спора. Ищи бурые пятна ила и вскрывай споры ложноножками.');return;}if(st==='locked'){eInfo('Сначала открой: '+n.req.map(r=>r.split('|').map(x=>NODE[x].ru).join(' или ')).join(', ')+(n.minCells?' и вырасти до '+n.minCells+' клеток':''));return;}
 if(P.dna<n.cost){eInfo('Не хватает ДНК: нужно '+n.cost+', есть '+P.dna+'. ДНК дают деления, плазмиды (золотые кольца), съеденные организмы и открытия новых видов.');return;}
 P.dna-=n.cost;P.un[n.id]=1;if(n.unlock)tool=n.unlock;derive();
 eInfo('Открыто: <b>'+n.ru+'</b>. '+(n.unlock?'Выбери тип «'+TYPES[n.unlock].ru+'» и поставь клетку на тело.':''));
 if(n.id==='adhesion')toast('<b>Адгезия!</b> Теперь клетки остаются вместе. Наращивай тело за биомассу.');
 renderEditor();});
$('pal').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tool=b.dataset.t;renderEditor();eInfo(tool==='erase'?'Кликни по клетке, чтобы убрать её (вернётся 3 биомассы). Ядро убрать нельзя.':TYPES[tool].ru+': '+TYPES[tool].desc+' Кликни по пустому месту рядом с телом, чтобы вырастить, или по клетке, чтобы перестроить её (3 биомассы).');});
$('pats').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;P.pattern=b.dataset.p;renderEditor();});
$('hue').addEventListener('input',()=>{P.hue=+$('hue').value;drawEditor();});
$('eClose').onclick=toggleEditor;
function eInfo(s){$('eInfo').innerHTML=s;}
let eScale=1,eOx=0,eOy=0;
function drawEditor(){
 const r=ecv.getBoundingClientRect();const w=Math.max(10,r.width),h=Math.max(10,r.height);ecv.width=w*DPR;ecv.height=h*DPR;
 const g=ectx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)/1.4);g.addColorStop(0,ST.bg0);g.addColorStop(1,ST.bg1);ectx.setTransform(DPR,0,0,DPR,0,0);ectx.fillStyle=g;ectx.fillRect(0,0,w,h);
 let ext=CELL_R*3;for(const c of P.cells){const p=hexXY(c.q,c.r);ext=Math.max(ext,Math.abs(p[0]-D.mx)+CELL_R*4,Math.abs(p[1]-D.my)+CELL_R*4);}
 eScale=Math.min(w,h)/2/ext;eOx=w/2;eOy=h/2;
 // кандидаты
 ectx.setTransform(DPR*eScale,0,0,DPR*eScale,DPR*(eOx-D.mx*eScale),DPR*(eOy-D.my*eScale));
 const set=new Set(P.cells.map(k=>k.q+','+k.r));
 if(hasN('adhesion')){ectx.lineWidth=1/eScale;for(const c of P.cells)for(const[dq,dr]of HDIR){const q=c.q+dq,rr=c.r+dr;if(set.has(q+','+rr))continue;set.add(q+','+rr);const[x,y]=hexXY(q,rr);ectx.setLineDash([3/eScale,3/eScale]);ectx.strokeStyle=ST.dark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.3)';ectx.beginPath();ectx.arc(x,y,CELL_R*0.85,0,TAU);ectx.stroke();ectx.setLineDash([]);
   if(eHover&&eHover[0]===q&&eHover[1]===rr){ectx.fillStyle=ST.dark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.1)';ectx.fill();}}}
 const cw=D.cw.map(c=>Object.assign({},c,{bx:c.bx+D.mx,by:c.by+D.my}));
 const keep=ctx,oldPX=PX;ctx=ectx;PX=1/eScale;NOCA=true;
 try{BS=playerBS();drawBody(cw,T,0,0,0,1);}finally{ctx=keep;PX=oldPX;NOCA=false;}
 if(eHover){const[q,rr]=eHover;const[x,y]=hexXY(q,rr);ectx.strokeStyle='#ffd47a';ectx.lineWidth=2/eScale;ectx.beginPath();ectx.arc(x,y,CELL_R*1.05,0,TAU);ectx.stroke();}
 // стрелка "перед"
 ectx.setTransform(DPR,0,0,DPR,0,0);ectx.fillStyle=ST.dark?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.6)';ectx.font='12px system-ui';ectx.textAlign='right';ectx.fillText('перед →',w-10,h/2-8);ectx.textAlign='left';ectx.fillText('← зад',10,h/2-8);
}
function eHex(ev){const r=ecv.getBoundingClientRect();const px=(ev.clientX-r.left-eOx)/eScale+D.mx,py=(ev.clientY-r.top-eOy)/eScale+D.my;
 const q=(SQ3/3*px-py/3)/HEX,rr=(2/3*py)/HEX;let x=q,z=rr,y=-x-z;let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z);const dx=Math.abs(rx-x),dy=Math.abs(ry-y),dz=Math.abs(rz-z);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;return[rx,rz];}
ecv.addEventListener('pointermove',ev=>{eHover=eHex(ev);drawEditor();});
ecv.addEventListener('pointerleave',()=>{eHover=null;drawEditor();});
ecv.addEventListener('click',ev=>{
 const[q,r]=eHex(ev);const idx=P.cells.findIndex(c=>c.q===q&&c.r===r);
 if(idx>=0){const c=P.cells[idx];
  if(tool==='erase'){if(idx===0){eInfo('Ядро-основатель убрать нельзя.');return;}const rest=P.cells.filter((_,i)=>i!==idx);if(!connected(rest)){eInfo('Нельзя: тело распадётся на части.');return;}P.cells=rest;P.biomass+=3;derive();renderEditor();eInfo('Клетка убрана, +3 биомассы.');return;}
  if(c.t===tool){eInfo(TYPES[c.t].ru+': '+TYPES[c.t].desc);return;}
  if(P.biomass<3){eInfo('Нужно 3 биомассы на перестройку клетки.');return;}
  P.biomass-=3;c.t=tool;derive();renderEditor();eInfo('Клетка перестроена: '+TYPES[tool].ru+'.');return;}
 if(tool==='erase')return;
 if(!hasN('adhesion')){eInfo('Чтобы наращивать клетки, нужна <b>Адгезия</b> (в древе слева). Пока можно перестроить саму клетку — кликни по ней.');return;}
 if(!HDIR.some(([dq,dr])=>P.cells.some(c=>c.q===q+dq&&c.r===r+dr))){eInfo('Новую клетку можно поставить только вплотную к телу.');return;}
 const cost=cellCost();if(P.biomass<cost){eInfo('Не хватает биомассы: нужно '+cost+', есть '+Math.floor(P.biomass)+'. Ешь!');return;}
 P.biomass-=cost;P.cells.push({q,r,t:tool});P.hp+=TYPES[tool].hp;derive();renderEditor();
 eInfo('Выросла новая клетка: '+TYPES[tool].ru+'. Теперь в теле '+D.n+' клеток.');
 if(D.n===GOAL_CELLS)toast('<b>'+GOAL_CELLS+' клеток!</b> Можно выходить из капли и выбирать путь.');
});
function connected(cells){if(!cells.length)return false;const set=new Map(cells.map(c=>[c.q+','+c.r,c]));const seen=new Set([cells[0].q+','+cells[0].r]);const st=[cells[0]];while(st.length){const c=st.pop();for(const[dq,dr]of HDIR){const k=(c.q+dq)+','+(c.r+dr);if(set.has(k)&&!seen.has(k)){seen.add(k);st.push(set.get(k));}}}return seen.size===cells.length;}

/* ========== финал ========== */
function plural(n,a,b,c){n=Math.abs(n)%100;const k=n%10;if(n>10&&n<20)return c;if(k>1&&k<5)return b;if(k===1)return a;return c;}
const KING={
 animal:{ru:'Животное',desc:'Подвижный охотник: рот, пищеварение, мышцы и нервы. Дальше: черви, рыбы, амфибии… и, может быть, разум.',score:c=>(c.mouth||0)*3+(c.digest||0)*2+(c.muscle||0)*2+(c.nerve||0)*3+(c.flag||0)+(c.cilia||0)+(c.spike||0)+(c.sting||0)*2},
 plant:{ru:'Растение',desc:'Живёт светом: хлоропласты и прочные стенки. Дальше: водоросли, мхи, леса, гиганты-деревья.',score:c=>(c.chloro||0)*4+(c.armor||0)*2},
 fungus:{ru:'Гриб',desc:'Растворяет и всасывает: ложноножки, слизь, пищеварение. Дальше: плесень, грибницы, хозяева подземного мира.',score:c=>(c.pseudo||0)*3+(c.slime||0)*3+(c.digest||0)*2+(c.armor||0)}
};
function openFinal(){
 setPause(true,true);const c=D.cnt;let tot=0;const sc={};for(const k in KING){sc[k]=KING[k].score(c)+1;tot+=sc[k];}
 $('finalBox').innerHTML='<h1>Выход из капли</h1><div class="muted">Ты прошёл путь от одной клетки до многоклеточного существа из '+D.n+' клеток за '+P.gen+' '+plural(P.gen,'поколение','поколения','поколений')+'. Куда поведёт эволюция? Шкала показывает, к чему склонно твоё тело, но выбор за тобой.</div><div class="cards">'+
 Object.keys(KING).map(k=>'<div class="card" data-k="'+k+'"><h3>'+KING[k].ru+'</h3><div class="meter"><i style="width:'+(sc[k]/tot*100).toFixed(0)+'%"></i></div><div class="small muted">Склонность тела: '+(sc[k]/tot*100).toFixed(0)+'%</div><div class="small" style="margin-top:6px">'+KING[k].desc+'</div></div>').join('')+'</div><div style="margin-top:12px"><button id="fBack">Ещё поплаваю</button></div>';
 $('final').classList.remove('hidden');
 $('fBack').onclick=()=>{$('final').classList.add('hidden');setPause(false);};
 $('finalBox').querySelectorAll('.card').forEach(el=>el.onclick=()=>chooseKingdom(el.dataset.k));
}
function genName(){const a=['Proto','Micro','Hydro','Cyto','Gloeo','Volvo','Spiro','Chloro','Myco','Rhizo','Nemato'],b=['cellus','morpha','zoon','phyta','myces','plasma','sphaera','nema','coccus'];return pick(a)+pick(b)+' '+pick(['primus','gutta','artemii','minor','mirabilis','evolvens','novus']);}
function chooseKingdom(k){
 P.kingdom=k;P.speciesName=genName();P.finishTime=P.stats.time;const run=recordRun();save();checkAch();
 const t=Math.round(P.stats.time/60);
 const prev=META.runs.slice(0,-1);let cmp='';if(prev.length){const bt=Math.min(...prev.map(r=>r.time)),bd=Math.min(...prev.map(r=>r.deaths));cmp='<div class="small" style="margin-top:8px">Сравнение с прошлыми существами: '+(run.time<bt?'<span class="best">новый рекорд времени!</span>':'лучшее время — '+fmtTime(bt))+' · '+(run.deaths<bd?'<span class="best">меньше всех смертей!</span>':'меньше всего смертей — '+bd)+'. Всего пройдено: '+META.runs.length+'.</div>';}
 $('finalBox').innerHTML='<h1>'+P.speciesName+'</h1><div class="muted">Царство: <b style="color:#9fe0a8">'+KING[k].ru+'</b></div><div style="margin-top:10px">Клеток: '+D.n+' · поколений: '+P.gen+' · съедено: '+P.stats.eaten+' · побеждено: '+P.stats.kills+' · время: '+t+' мин · видов открыто: '+run.seen+'</div><div class="small" style="margin-top:6px">Состав тела: '+compText(D.cnt)+'</div>'+cmp+'<div class="small muted" style="margin-top:10px">Уровень 1 пройден, результат сохранён. Следующий этап эволюции появится в новой версии, и твой выбор царства определит, каким он будет. А пока можно плавать дальше и расти без ограничений.</div><div style="margin-top:14px"><button class="on" id="fGo">Продолжить свободную игру</button></div>';
 $('fGo').onclick=()=>{$('final').classList.add('hidden');setPause(false);};
}
$('bFinal').onclick=openFinal;

/* ========== сохранение ========== */
function save(){if(!started)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({v:1,P:Object.assign({},P,{}),obj:cam.obj}));}catch(e){}}
function load(){try{const s=localStorage.getItem(SAVE_KEY);if(!s)return false;const d=JSON.parse(s);if(d.v!==1)return false;const np=newPlayer();P=Object.assign(np,d.P);P.stats=Object.assign(newPlayer().stats,d.P.stats||{});P.killed=P.killed||{};P.modesSeen=P.modesSeen||{};P.defects=P.defects||{};P.sporesOpen=P.sporesOpen||{};P.bossDone=P.bossDone||{};if(!P.sporeSeed)P.sporeSeed=12345;cam.obj=d.obj||0;return true;}catch(e){return false;}}
setInterval(save,15000);addEventListener('beforeunload',save);
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});


/* ========== мутация потомка ========== */
let pendingMut=null;
function freeSpots(){const set=new Set(P.cells.map(c=>c.q+','+c.r)),out=[];for(const c of P.cells)for(const[dq,dr]of HDIR){const k=(c.q+dq)+','+(c.r+dr);if(!set.has(k)){set.add(k);out.push([c.q+dq,c.r+dr]);}}return out;}
function offerMutation(nd,cured){
 cured=cured||[];const extra=(cured.length?'<div style="color:#9fe0a8;margin-top:8px">Отбор вылечил дефект: '+cured.join(', ')+'.</div>':'')+(nd?'<div style="color:#ff9a8a;margin-top:8px">Но есть и дефект: <b>'+DEFECTS[nd].ru+'</b> ('+DEFECTS[nd].d+'). Отбор вылечит его через 2 поколения или за 4 минуты жизни без смерти.</div>':'');
 const av=NODES.filter(n=>nodeState(n)==='avail');let m=null;
 if(av.length&&(R_()<0.55||!hasN('adhesion')))m={k:'node',n:pick(av)};
 else if(hasN('adhesion')){const t=pick(unlockedTypes());const sp=pick(freeSpots());if(sp)m={k:'cell',t,q:sp[0],r:sp[1]};}
 if(!m&&av.length)m={k:'node',n:pick(av)};
 if(R_()>0.2)m=null;
 if(!m){if(extra)toast(extra.replace(/<div[^>]*>/g,'').replace(/<\/div>/g,' '));return;}
 pendingMut=m;paused=true;
 const what=m.k==='node'?'<b>«'+m.n.ru+'»</b> (бесплатно, без траты ДНК).<div class="small muted" style="margin-top:6px">'+m.n.desc+'</div>':'лишняя клетка <b>«'+TYPES[m.t].ru+'»</b> (бесплатно, без траты биомассы).<div class="small muted" style="margin-top:6px">'+TYPES[m.t].desc+' Она вырастет на случайном месте тела, потом её можно перестроить в редакторе.</div>';
 $('mutBox').innerHTML='<h2>Потомок родился с мутацией</h2><div>Поколение '+P.gen+' унаследовало от предка всё тело, а вдобавок у него случайная мутация — '+what+'</div>'+extra+'<div style="display:flex;gap:8px;margin-top:14px"><button class="on" id="mYes">Принять</button><button id="mNo">Отказаться</button></div>';
 $('mutm').classList.remove('hidden');
 $('mYes').onclick=()=>{const m2=pendingMut;if(m2.k==='node'){P.un[m2.n.id]=1;}else{P.cells.push({q:m2.q,r:m2.r,t:m2.t});}P.stats.mutAcc++;derive();P.hp=D.hpMax;closeMut();toast('Мутация закрепилась в роду.');};
 $('mNo').onclick=closeMut;
}
function closeMut(){pendingMut=null;$('mutm').classList.add('hidden');paused=false;save();}

/* ========== достижения и итоги ========== */
const META_KEY='evo_stage1_meta';let META={ach:{},runs:[]};
try{const m=JSON.parse(localStorage.getItem(META_KEY)||'{}');META.ach=m.ach||{};META.runs=m.runs||[];}catch(e){}
function saveMeta(){try{localStorage.setItem(META_KEY,JSON.stringify(META));}catch(e){}}
const SPECIES_KEYS=Object.keys(SP).filter(k=>SP[k].kind!=='food'&&!SP[k].notSpecies);
const ACH=[
 {id:'div1',ru:'Первое деление',d:'Поделиться впервые',t:()=>P.stats.div>=1},
 {id:'colony',ru:'Вместе сильнее',d:'Открыть адгезию и стать колонией',t:()=>hasN('adhesion')},
 {id:'cells10',ru:'Десяток',d:'Вырастить 10 клеток',t:()=>D.n>=10},
 {id:'spec',ru:'Разделение труда',d:'Открыть специализацию клеток',t:()=>hasN('spec')},
 {id:'cells30',ru:'Многоклеточное',d:'Вырастить 30 клеток',t:()=>D.n>=30},
 {id:'k_animal',ru:'Путь зверя',d:'Выбрать царство животных',t:()=>P.kingdom==='animal'},
 {id:'k_plant',ru:'Путь света',d:'Выбрать царство растений',t:()=>P.kingdom==='plant'},
 {id:'k_fungus',ru:'Путь грибницы',d:'Выбрать царство грибов',t:()=>P.kingdom==='fungus'},
 {id:'hunter',ru:'Охотник',d:'Победить 25 организмов',t:()=>P.stats.kills>=25},
 {id:'glutton',ru:'Ненасытный',d:'Съесть 400 раз',t:()=>P.stats.eaten>=400},
 {id:'explorer',ru:'Натуралист',d:'Увидеть все виды капли',t:()=>SPECIES_KEYS.every(k=>P.seen[k])},
 {id:'egg',ru:'Яичница',d:'Съесть яйцо коловратки',t:()=>P.stats.eggs>=1},
 {id:'symb',ru:'Симбиоз',d:'Подружиться с эвгленой',t:()=>P.stats.maxAllies>=1},
 {id:'symb3',ru:'Свита',d:'Три симбионта одновременно',t:()=>P.stats.maxAllies>=3},
 {id:'survivor',ru:'Живучий',d:'Прожить 10 минут без смерти',t:()=>P.stats.sinceDeath>=600},
 {id:'amoeba',ru:'Амёбоборец',d:'Победить амёбу',t:()=>(P.killed.amoeba||0)>=1},
 {id:'tardi',ru:'Укротитель медвежонка',d:'Победить тихоходку',t:()=>(P.killed.tardigrade||0)>=1},
 {id:'mutant',ru:'Мутант',d:'Принять 3 мутации потомков',t:()=>P.stats.mutAcc>=3},
 {id:'modes',ru:'Микроскопист',d:'Посмотреть всеми 4 методами',t:()=>Object.keys(P.modesSeen||{}).length>=4},
 {id:'cyclops',ru:'Пережил нашествие',d:'Не умереть, пока в капле циклоп или дафния',t:()=>P.stats.cycSurv>=1},
 {id:'spore',ru:'Археолог',d:'Вскрыть древнюю спору',t:()=>P.stats.spores>=1},
 {id:'spores5',ru:'Хранитель древней ДНК',d:'Вскрыть 5 древних спор',t:()=>P.stats.spores>=5},
 {id:'cure',ru:'Отбор работает',d:'Избавиться от генетического дефекта',t:()=>P.stats.cured>=1},
 {id:'helix',ru:'Пропеллер',d:'Вырастить винтовой жгутик',t:()=>hasN('flag3')},
 {id:'rival',ru:'Конкуренция',d:'Победить колонию-соперника',t:()=>(P.stats.rivals||0)>=1},
 {id:'boss1',ru:'Гроза зоны',d:'Победить мини-босса',t:()=>Object.keys(P.bossDone||{}).length>=1},
 {id:'boss3',ru:'Хозяин капли',d:'Победить всех трёх мини-боссов',t:()=>Object.keys(P.bossDone||{}).length>=3},
 {id:'fast',ru:'Быстрая эволюция',d:'Пройти уровень быстрее 40 минут',t:()=>!!P.kingdom&&P.finishTime<40*60},
 {id:'deathless',ru:'Бессмертный род',d:'Пройти уровень без единой смерти',t:()=>!!P.kingdom&&P.stats.deaths===0}
];
function checkAch(){for(const a of ACH){if(META.ach[a.id])continue;let ok=false;try{ok=a.t();}catch(e){}if(ok){META.ach[a.id]=Date.now();saveMeta();qtoast('Достижение: <b>'+a.ru+'</b> — '+a.d);}}}
function fmtTime(s){s=Math.round(s);return Math.floor(s/60)+' мин '+String(s%60).padStart(2,'0')+' с';}
function recordRun(){
 const run={name:P.speciesName,kingdom:P.kingdom,cells:D.n,time:P.stats.time,deaths:P.stats.deaths,gen:P.gen,kills:P.stats.kills,eaten:P.stats.eaten,seen:Object.keys(P.seen).filter(k=>SPECIES_KEYS.includes(k)).length,allies:P.stats.maxAllies,comp:Object.assign({},D.cnt),date:Date.now()};
 META.runs.push(run);saveMeta();return run;
}
function compText(c){return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([t,n])=>TYPES[t].ru.toLowerCase()+' '+n).join(', ');}
let achOpen=false,achWasPaused=false;
function toggleAch(){if(editorOpen||setOpen)return;achOpen=!achOpen;$('achm').classList.toggle('hidden',!achOpen);if(achOpen){achWasPaused=paused;paused=true;renderAch();}else paused=started?achWasPaused:true;}
function renderAch(){
 const got=ACH.filter(a=>META.ach[a.id]).length;
 let h='<div class="grp" style="margin-top:4px">Текущее существо</div><div class="small">'+(started?('Поколение '+P.gen+' · клеток '+D.n+' · время '+fmtTime(P.stats.time)+' · смертей '+P.stats.deaths+' · побеждено '+P.stats.kills+' · съедено '+P.stats.eaten+' · симбионтов (макс.) '+P.stats.maxAllies+' · видов '+Object.keys(P.seen).filter(k=>SPECIES_KEYS.includes(k)).length+' / '+SPECIES_KEYS.length):'игра не начата')+'</div>';
 h+='<div class="grp">Мои существа (пройденные уровни)</div>';
 if(!META.runs.length)h+='<div class="small muted">Пока пусто. Дорасти до '+GOAL_CELLS+' клеток и выйди из капли — существо попадёт сюда.</div>';
 else{const bt=Math.min(...META.runs.map(r=>r.time)),bd=Math.min(...META.runs.map(r=>r.deaths)),bk=Math.max(...META.runs.map(r=>r.kills));
  h+='<div style="overflow:auto"><table class="runs"><tr><th>#</th><th>Существо</th><th>Царство</th><th>Время</th><th>Смерти</th><th>Поколений</th><th>Побеждено</th><th>Видов</th><th>Состав тела</th></tr>'+
  META.runs.map((r,i)=>'<tr><td>'+(i+1)+'</td><td><b>'+r.name+'</b></td><td>'+KING[r.kingdom].ru+'</td><td class="'+(r.time===bt?'best':'')+'">'+fmtTime(r.time)+'</td><td class="'+(r.deaths===bd?'best':'')+'">'+r.deaths+'</td><td>'+r.gen+'</td><td class="'+(r.kills===bk?'best':'')+'">'+r.kills+'</td><td>'+r.seen+'</td><td class="muted">'+compText(r.comp)+'</td></tr>').join('')+'</table></div><div class="small muted">Зелёным отмечены лучшие результаты.</div>';}
 h+='<div class="grp">Достижения: '+got+' / '+ACH.length+'</div><div class="achs">'+ACH.map(a=>'<div class="ach '+(META.ach[a.id]?'yes':'no')+'"><b>'+a.ru+'</b>'+a.d+'</div>').join('')+'</div>';
 $('achBody').innerHTML=h;
}
$('bAch').onclick=toggleAch;$('aClose').onclick=toggleAch;

/* ========== пауза, старт ========== */
function setPause(v,silent){paused=v;$('pause').classList.toggle('hidden',!v||!!silent||editorOpen);}
$('bResume').onclick=()=>setPause(false);
$('bPara').onclick=tryInfest;$('tPara').onclick=tryInfest;$('bEdit').onclick=toggleEditor;$('tEdit').onclick=toggleEditor;$('bDash').onclick=doDash;$('tDash').onclick=doDash;$('bZap').onclick=doZap;$('tZap').onclick=doZap;
function begin(fresh){
 let isNew=false;if(fresh||!load()){P=newPlayer();cam.obj=0;isNew=true;}
 started=true;derive();if(isNew)P.hp=D.hpMax;setMode(P.mode||'bright');makeSpores();initWorld();cycE=null;cycT=rnd(330,420);P.inv=Math.max(P.inv,4);
 ents=ents.filter(e=>{const s=SP[e.sp];if(!s||s.kind==='food')return true;return Math.hypot(e.x-P.x,e.y-P.y)>viewD()*1.3||(!s.dmg&&s.beh!=='amoeba');});cam.x=P.x;cam.y=P.y;cam.s=Math.min(W,H)/OBJ[cam.obj].d;
 $('start').classList.add('hidden');paused=false;
 if(fresh)toast('Ты — одна клетка в капле прудовой воды. <b>Ешь, делись, эволюционируй.</b>');
}
$('bNew').onclick=()=>{if(hasSave()&&!confirmNew())return;begin(true);};
let confirmArm=false;function confirmNew(){if(confirmArm)return true;confirmArm=true;$('bNew').textContent='Точно? Сохранение сотрётся';setTimeout(()=>{confirmArm=false;$('bNew').textContent='Новая игра';},3000);return false;}
$('bCont').onclick=()=>begin(false);
function hasSave(){try{return!!localStorage.getItem(SAVE_KEY);}catch(e){return false;}}
if(hasSave())$('bCont').classList.remove('hidden');

/* ========== главный цикл ========== */
P=newPlayer();derive();makeSpores();initWorld();
let last=performance.now();
function frame(now){
 let dt=Math.min(0.05,(now-last)/1000);last=now;
 if(!paused&&started){
  T+=dt;updatePlayer(dt);updateCellWorld();updateEnts(dt);collide(dt);updateSpores(dt);moldUpdate(dt);updateCellWorld();
  if(!cycE){cycT-=dt;if(cycT<=0){cycT=rnd(360,540);spawnCyclops();}}
  rivalT-=dt;if(rivalT<=0){rivalT=rnd(25,45);if(ents.filter(e=>e.rival).length<2&&P.cells.length>=2)spawnRival();}
  bossCheck(dt);
  for(const z of zaps)z.t-=dt;zaps=zaps.filter(z=>z.t>0);
  for(const l of lights){l.x+=l.vx*dt;l.y+=l.vy*dt;}
  for(const k in ECO)ECO[k]+=(1-ECO[k])*0.004*dt;
  for(const p of pops)p.t-=dt;pops=pops.filter(p=>p.t>0);for(const s of shots)s.t-=dt;shots=shots.filter(s=>s.t>0);
  spawnT-=dt;if(spawnT<=0){spawnT=0.3;fillWorld(false);despawn();}
 }else if(!started){T+=dt*0.5;cam.x+=dt*4;updateEnts(dt*0.5);updateCellWorld();}
 updateCam(started&&!paused?dt:0);
 bg();drawFar();drawParticles(paused?0:dt);drawWorld();drawNear();drawOverlay();
 hudT-=dt;if(hudT<=0&&started){hudT=0.15;hud();}
 toastT-=dt;if(toastT<=0&&toastQ.length){toastT=3.5;toast(toastQ.shift());}
 if(editorOpen&&(now|0)%3===0){}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__G={spawnRival:()=>spawnRival(),bossKilled:(e)=>bossKilled(e),get molds(){return molds},get thickets(){return thickets},siltAt:(x,y)=>siltAt(x,y),zoneName:(x,y)=>zoneName(x,y),spawnEnt,spawnCyclops:(k)=>spawnCyclops(k),get spores(){return spores},get cycE(){return cycE},doZap:()=>doZap(),get META(){return META},playerDie:()=>{deathCause='тест';playerDie();},get P(){return P},get D(){return D},get ents(){return ents},cam,setMode,begin,openFinal,toggleEditor};
})();
