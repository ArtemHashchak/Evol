/* ===== части тела ===== */
const PARTS={
 eyes:{ru:'Простые глазки',head:1,cost:4,desc:'Светочувствительные пятна: чуть разгоняют тьму глубин.'},
 cameye:{ru:'Глаза-камеры',head:1,cost:10,node:'cameye',desc:'Глаз с хрусталиком, как у позвоночных: хорошо видно в темноте.'},
 compound:{ru:'Фасеточные глаза',head:1,cost:10,node:'compound',desc:'Сотни фасеток, как у трилобита: широкий обзор, видно хищников издали.'},
 antenna:{ru:'Усики',head:1,cost:5,node:'antenna',desc:'Чувствуют вибрации воды: стрелки показывают хищников за краем экрана.'},
 jaws:{ru:'Челюсти',head:1,cost:8,node:'jaws',desc:'Сильный укус, можно глотать добычу крупнее.'},
 grab:{ru:'Хватательные клешни',head:1,cost:12,node:'grab',desc:'Как у аномалокариса: хватают и удерживают добычу, добавляя урон.'},
 proboscis:{ru:'Хоботок',head:1,single:1,cost:8,node:'proboscis',desc:'Как у опабинии: длинный хоботок с клешнёй достаёт добычу издалека.'},
 tentacle:{ru:'Щупальца',cost:6,node:'tentacle',desc:'Ловят мелочь вокруг и слегка жалят.'},
 fin:{ru:'Плавники',cost:6,node:'fin',desc:'Тяга и манёвренность в толще воды.'},
 tailfin:{ru:'Хвостовой плавник',single:1,tail:1,cost:10,node:'tailfin',desc:'Мощный мотор рыб. Ставится только на последний сегмент.'},
 leg:{ru:'Ножки-лобоподии',cost:5,node:'leg',desc:'Мягкие ножки, как у галлюцигении: ходьба по дну.'},
 jleg:{ru:'Членистые ноги',cost:9,node:'jleg',desc:'Ноги с суставами (нужен панцирь): быстрая ходьба по дну.'},
 gill:{ru:'Жабры',cost:6,node:'gill',desc:'Достают кислород из воды: можно жить на глубине.'},
 spine:{ru:'Шипы',cost:5,node:'spine',desc:'Ранят того, кто тебя кусает.'}
};
const SKELS={none:{ru:'Мягкое тело',desc:'Гибкое, плывёт волной, может закапываться.'},exo:{ru:'Панцирь',node:'exo',desc:'Хитиновый экзоскелет, как у трилобита: урон −40%, но тело жёстче и медленнее плывёт волной.'},notochord:{ru:'Хорда',node:'notochord',desc:'Упругий стержень вдоль спины, как у пикайи: сильное плавание волной. Шаг к позвоночным.'},shell:{ru:'Раковина',node:'shell',desc:'Известковая раковина над передними сегментами: урон −50%, но тяжело плыть. Шаг к моллюскам.'}};
const NODES=[
 {id:'fin',ru:'Плавники',grp:'Движение',cost:4,req:[]},
 {id:'tailfin',ru:'Хвостовой плавник',grp:'Движение',cost:9,req:['fin']},
 {id:'leg',ru:'Ножки-лобоподии',grp:'Движение',cost:4,req:[]},
 {id:'jleg',ru:'Членистые ноги',grp:'Движение',cost:9,req:['leg','exo']},
 {id:'gill',ru:'Жабры',grp:'Дыхание',cost:5,req:[]},
 {id:'biggill',ru:'Перистые жабры',grp:'Дыхание',cost:9,req:['gill'],desc:'Жабры работают в 1.7 раза лучше.'},
 {id:'cameye',ru:'Глаза-камеры',grp:'Чувства',cost:8,req:[]},
 {id:'compound',ru:'Фасеточные глаза',grp:'Чувства',cost:9,req:['exo']},
 {id:'antenna',ru:'Усики',grp:'Чувства',cost:4,req:[]},
 {id:'jaws',ru:'Челюсти',grp:'Оружие',cost:6,req:[]},
 {id:'grab',ru:'Хватательные клешни',grp:'Оружие',cost:11,req:['jaws']},
 {id:'proboscis',ru:'Хоботок',grp:'Оружие',cost:8,req:[]},
 {id:'spine',ru:'Шипы',grp:'Оружие',cost:4,req:[]},
 {id:'tentacle',ru:'Щупальца',grp:'Оружие',cost:5,req:[]},
 {id:'exo',ru:'Панцирь',grp:'Скелет',cost:10,req:[],desc:SKELS.exo.desc},
 {id:'notochord',ru:'Хорда',grp:'Скелет',cost:10,req:[],desc:SKELS.notochord.desc},
 {id:'shell',ru:'Раковина',grp:'Скелет',cost:10,req:[],desc:SKELS.shell.desc},
 {id:'brain1',ru:'Мозг I',grp:'Ум',cost:6,req:[],desc:'Нервные узлы сливаются в головной мозг: быстрее реакция (+поворот).'},
 {id:'brain2',ru:'Мозг II',grp:'Ум',cost:10,req:['brain1'],desc:'Сложное поведение: потомки могут следовать за тобой стаей.'},
 {id:'brain3',ru:'Мозг III',grp:'Ум',cost:14,req:['brain2'],desc:'Стая больше и умнее: защищает тебя и охотится вместе.'},
 {id:'clutch',ru:'Крупная кладка',grp:'Размножение',cost:6,req:[],desc:'В кладке на 2 яйца больше.'},
 {id:'care',ru:'Забота о потомстве',grp:'Размножение',cost:8,req:['clutch'],desc:'Яйца созревают вдвое быстрее, хищники их не трогают.'},
 {id:'burrow',ru:'Рытьё',grp:'Укрытие',cost:6,req:[],desc:'Закапываешься в песок или ил (B): хищники не видят, но двигаться нельзя.'}
];
for(const n of NODES){if(!n.desc)n.desc=PARTS[n.id]?PARTS[n.id].desc:'';}
const NODE=Object.fromEntries(NODES.map(n=>[n.id,n]));

function defaultBody(sym){
 if(sym==='radial')return{sym:'radial',hue:190,skel:'none',segs:[{r:3.2,parts:[{t:'tentacle',s:1},{t:'eyes',s:1}]}]};
 return{sym:'bilateral',hue:20,skel:'none',segs:[{r:1.5,parts:[{t:'eyes',s:1}]},{r:1.4,parts:[]},{r:1.3,parts:[]},{r:1.1,parts:[]}]};
}
function cloneBody(b){return JSON.parse(JSON.stringify(b));}
function countParts(b){const c={};for(const s of b.segs)for(const p of s.parts)c[p.t]=(c[p.t]||0)+p.s*(PARTS[p.t].single?1:2);return c;}
function bodyStats(b,un){
 const segs=b.segs,n=segs.length;let M=0,L=0;for(let i=0;i<n;i++){M+=segs[i].r**3;L+=segs[i].r*2*0.82;}
 const c=countParts(b);const Req=Math.cbrt(M);const radial=b.sym==='radial';
 let und=b.skel==='none'?0.45*Math.sqrt(n):b.skel==='notochord'?0.9*Math.sqrt(n):b.skel==='exo'?0.15*Math.sqrt(n):0.1;
 if(radial)und=1.2;
 const thr=1+und+(c.fin||0)*0.7+(c.tailfin||0)*2.6+(c.tentacle||0)*0.05;
 const crawl=(c.leg||0)*0.55+(c.jleg||0)*1.1;
 const shellPen=b.skel==='shell'?0.7:1;
 const st={n,M,L:radial?segs[0].r*2:L,Req,c,radial};
 st.speed=11*Math.pow(thr,0.7)*Math.pow(Req,0.55)*shellPen*(radial?0.75:1);
 st.crawl=crawl>0?9*Math.pow(1+crawl,0.65)*Math.pow(Req,0.55):0;
 st.turn=(radial?1.6:2.6)*(1+0.12*(c.fin||0)+(un.brain1?0.25:0))/Math.pow(Req,0.22);
 let hp=0;for(const s of segs)hp+=8*s.r*s.r+4;st.hpMax=hp*(radial?1.5:1);
 st.armor=b.skel==='exo'?0.6:b.skel==='shell'?0.5:1;
 st.gill=(c.gill||0)*(un.biggill?1.7:1);
 st.eyeQ=clamp(((c.eyes||0)*0.12+(c.cameye||0)*0.35+(c.compound||0)*0.3),0,1);
 st.bite=(2+(c.jaws||0)*4+(c.grab||0)*3)*Math.sqrt(Req);
 st.swallow=(c.jaws?0.55:0.32)*(radial?1.2:1);
 st.reach=(c.proboscis?Req*2.2+segs[0].r*2:0);
 st.spine=(c.spine||0)*2.5;st.sting=(c.tentacle||0)*(radial?1.4:0.6);
 st.antenna=(c.antenna||0)>0;
 st.met=0.006*Math.pow(M,0.12);st.o2use=0.012*Math.pow(M,0.1);
 st.brain=un.brain3?3:un.brain2?2:un.brain1?1:0;
 return st;
}
/* ===== цепочка сегментов ===== */
function initChain(b,x,y,z,a){const pos=[];let cx=x,cy=y;for(let i=0;i<b.segs.length;i++){pos.push({x:cx,y:cy,z});const r1=b.segs[i].r,r2=b.segs[i+1]?b.segs[i+1].r:r1;cx-=Math.cos(a)*(r1+r2)*0.8;cy-=Math.sin(a)*(r1+r2)*0.8;}return pos;}
function updateChain(b,pos,hx,hy,hz){
 if(pos.length!==b.segs.length){const a=pos.length>1?Math.atan2(pos[0].y-pos[1].y,pos[0].x-pos[1].x):0;const np=initChain(b,hx,hy,hz,a);pos.length=0;for(const p of np)pos.push(p);}
 pos[0].x=hx;pos[0].y=hy;pos[0].z=hz;
 for(let i=1;i<pos.length;i++){const p=pos[i],q=pos[i-1];const L=(b.segs[i].r+b.segs[i-1].r)*0.8;let dx=p.x-q.x,dy=p.y-q.y,dz=p.z-q.z;const d=Math.hypot(dx,dy,dz)||1;p.x=q.x+dx/d*L;p.y=q.y+dy/d*L;p.z=q.z+dz/d*L;const fh=floorH(p.x,p.y)+b.segs[i].r*0.7;if(p.z<fh)p.z=fh;}
}
/* ===== рисование тела ===== */
function segFrames(pos,heading){
 const fr=[];for(let i=0;i<pos.length;i++){let fx,fy,fz;if(i===0){if(pos.length>1){fx=pos[0].x-pos[1].x;fy=pos[0].y-pos[1].y;fz=pos[0].z-pos[1].z;}else{fx=Math.cos(heading);fy=Math.sin(heading);fz=0;}}else{fx=pos[i-1].x-pos[i].x;fy=pos[i-1].y-pos[i].y;fz=pos[i-1].z-pos[i].z;}const l=Math.hypot(fx,fy,fz)||1;fx/=l;fy/=l;fz/=l;const sl=Math.hypot(fx,fy)||1;fr.push({fx,fy,fz,sx:-fy/sl,sy:fx/sl});}
 return fr;
}
function drawBody(b,pos,o){
 o=o||{};const t=o.t||T_,s=cam.s,hue=o.hue!=null?o.hue:b.hue,alpha=o.alpha==null?1:o.alpha;
 const fr=segFrames(pos,o.heading||0);const P=(x,y,z)=>proj(x,y,z);
 const depth=clamp(1-pos[0].z/SURF,0,1);const lightK=1-0.35*depth;
 ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.lineJoin='round';
 const bodyFill=(a)=>`hsla(${hue},${b.skel==='exo'?40:55}%,${(52*lightK)|0}%,${a})`,edge=(a)=>`hsla(${hue},50%,${(26*lightK)|0}%,${a})`;
 if(b.sym==='radial'){drawRadial(b,pos[0],o,hue,lightK,t);ctx.restore();return;}
 const n=pos.length,moving=o.moving||0;
 // ноги
 for(let i=0;i<n;i++){const sg=b.segs[i];for(const pt of sg.parts){if(pt.t!=='leg'&&pt.t!=='jleg')continue;const p=pos[i],f=fr[i];const fl=floorH(p.x,p.y);for(const sd of[-1,1]){const ph=Math.sin(t*9+i*1.3+(sd>0?Math.PI:0))*moving;const bx=p.x+f.sx*sd*sg.r*0.7,by=p.y+f.sy*sd*sg.r*0.7;const ex=bx+f.sx*sd*sg.r*1.6*pt.s+f.fx*ph*sg.r,ey=by+f.sy*sd*sg.r*1.6*pt.s+f.fy*ph*sg.r;const ez=Math.max(fl,p.z-sg.r*2.2*pt.s);const a=P(bx,by,p.z),m=P((bx+ex)/2,(by+ey)/2,p.z+sg.r*0.4),e=P(ex,ey,ez);
   ctx.strokeStyle=pt.t==='jleg'?`hsla(${hue},35%,${(30*lightK)|0}%,0.95)`:bodyFill(0.85);ctx.lineWidth=Math.max(1,sg.r*s*(pt.t==='jleg'?0.22:0.35)*pt.s);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(m[0],m[1]);ctx.lineTo(e[0],e[1]);ctx.stroke();if(pt.t==='jleg'){ctx.fillStyle=edge(0.9);ctx.beginPath();ctx.arc(m[0],m[1],Math.max(1,sg.r*s*0.14),0,TAU);ctx.fill();}}}}
 // боковые придатки: плавники, жабры, шипы, щупальца
 for(let i=0;i<n;i++){const sg=b.segs[i],p=pos[i],f=fr[i];for(const pt of sg.parts){const tp=pt.t;if(tp==='fin'){for(const sd of[-1,1]){const fl=Math.sin(t*7+i)*0.5*(0.3+moving);const a=P(p.x+f.sx*sd*sg.r*0.6+f.fx*sg.r*0.5,p.y+f.sy*sd*sg.r*0.6+f.fy*sg.r*0.5,p.z),c=P(p.x+f.sx*sd*sg.r*(1+1.8*pt.s)-f.fx*sg.r*0.8,p.y+f.sy*sd*sg.r*(1+1.8*pt.s)-f.fy*sg.r*0.8,p.z+fl*sg.r*1.5),d=P(p.x+f.sx*sd*sg.r*0.6-f.fx*sg.r*0.9,p.y+f.sy*sd*sg.r*0.6-f.fy*sg.r*0.9,p.z);ctx.fillStyle=`hsla(${hue},45%,${(60*lightK)|0}%,0.55)`;ctx.strokeStyle=edge(0.7);ctx.lineWidth=Math.max(0.7,s*0.12);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(c[0],c[1],d[0],d[1]);ctx.closePath();ctx.fill();ctx.stroke();}}
   else if(tp==='gill'){for(const sd of[-1,1]){const a=P(p.x+f.sx*sd*sg.r*0.85,p.y+f.sy*sd*sg.r*0.85,p.z);ctx.strokeStyle=`rgba(220,70,80,${0.85*lightK})`;ctx.lineWidth=Math.max(0.7,s*0.1);ctx.beginPath();for(let q=0;q<5;q++){const w=Math.sin(t*5+q+i)*0.2;const e=P(p.x+f.sx*sd*sg.r*(1+0.9*pt.s)-f.fx*sg.r*(q-2)*0.3,p.y+f.sy*sd*sg.r*(1+0.9*pt.s)-f.fy*sg.r*(q-2)*0.3,p.z+w*sg.r);ctx.moveTo(a[0],a[1]);ctx.lineTo(e[0],e[1]);}ctx.stroke();}}
   else if(tp==='spine'){for(const sd of[-1,1]){const a=P(p.x+f.sx*sd*sg.r*0.7,p.y+f.sy*sd*sg.r*0.7,p.z+sg.r*0.5),e=P(p.x+f.sx*sd*sg.r*(1.2+1.4*pt.s),p.y+f.sy*sd*sg.r*(1.2+1.4*pt.s),p.z+sg.r*(1+1.4*pt.s));ctx.strokeStyle=edge(0.95);ctx.lineWidth=Math.max(1,sg.r*s*0.18);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(e[0],e[1]);ctx.stroke();}}
   else if(tp==='tentacle'){for(const sd of[-1,1]){ctx.strokeStyle=bodyFill(0.8);ctx.lineWidth=Math.max(0.8,sg.r*s*0.16);ctx.beginPath();const a=P(p.x+f.sx*sd*sg.r*0.6+f.fx*sg.r*0.6,p.y+f.sy*sd*sg.r*0.6+f.fy*sg.r*0.6,p.z);ctx.moveTo(a[0],a[1]);for(let q=1;q<=8;q++){const u=q/8,w=Math.sin(t*3+q*0.9+sd+i)*sg.r*0.6*u;const e=P(p.x+f.sx*sd*sg.r*(0.6+1.2*u*pt.s)+f.fx*sg.r*(0.6+2.4*u*pt.s),p.y+f.sy*sd*sg.r*(0.6+1.2*u*pt.s)+f.fy*sg.r*(0.6+2.4*u*pt.s),p.z-u*sg.r*0.6+w);ctx.lineTo(e[0],e[1]);}ctx.stroke();}}
   else if(tp==='tailfin'&&i===n-1){const a=P(p.x,p.y,p.z+sg.r*0.2),fl=Math.sin(t*6)*0.6*(0.3+moving);const l=sg.r*(1.4+2.2*pt.s);const c1=P(p.x-f.fx*l+f.sx*l*0.55*fl,p.y-f.fy*l+f.sy*l*0.55*fl,p.z+l*0.5),c2=P(p.x-f.fx*l-f.sx*l*0.1*fl,p.y-f.fy*l-f.sy*l*0.1*fl,p.z-l*0.5);ctx.fillStyle=`hsla(${hue},45%,${(58*lightK)|0}%,0.6)`;ctx.strokeStyle=edge(0.8);ctx.lineWidth=Math.max(0.8,s*0.14);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(c1[0],c1[1]);ctx.quadraticCurveTo((c1[0]+c2[0])/2+(a[0]-c1[0])*0.25,(c1[1]+c2[1])/2,c2[0],c2[1]);ctx.closePath();ctx.fill();ctx.stroke();}
 }}
 // сегменты (от хвоста к голове)
 const sp=pos.map(p=>P(p.x,p.y,p.z));
 for(let i=n-1;i>=0;i--){const r=b.segs[i].r*s;const[x,y]=sp[i];
  ctx.fillStyle=bodyFill(b.skel==='exo'?0.85:0.55);ctx.beginPath();ctx.ellipse(x,y,r*1.05,r*0.92,0,0,TAU);ctx.fill();
  ctx.strokeStyle=edge(0.9);ctx.lineWidth=Math.max(0.8,r*0.09);ctx.stroke();
  if(b.skel==='exo'){ctx.strokeStyle=`hsla(${hue},35%,${(70*lightK)|0}%,0.6)`;ctx.lineWidth=Math.max(0.8,r*0.12);ctx.beginPath();ctx.ellipse(x,y-r*0.15,r*0.8,r*0.55,0,Math.PI*1.1,Math.PI*1.9);ctx.stroke();}
 }
 // внутренние органы (просвечивают)
 if(b.skel!=='exo'&&b.skel!=='shell'||o.xray){
  ctx.strokeStyle=`rgba(90,55,30,${0.55*lightK})`;ctx.lineWidth=Math.max(1,b.segs[0].r*s*0.3);ctx.beginPath();for(let i=0;i<n;i++)i?ctx.lineTo(sp[i][0],sp[i][1]+b.segs[i].r*s*0.12):ctx.moveTo(sp[i][0],sp[i][1]+b.segs[i].r*s*0.12);ctx.stroke();
  if(o.gut)for(const g of o.gut){const fi=g.p*(n-1),i0=Math.floor(fi),i1=Math.min(n-1,i0+1),u=fi-i0;const x=lerp(sp[i0][0],sp[i1][0],u),y=lerp(sp[i0][1],sp[i1][1],u)+b.segs[i0].r*s*0.12;ctx.fillStyle=g.c;ctx.beginPath();ctx.arc(x,y,Math.max(1,b.segs[i0].r*s*0.22*(1-g.p*0.5)),0,TAU);ctx.fill();}
  ctx.strokeStyle=`rgba(255,220,110,${0.7*lightK})`;ctx.lineWidth=Math.max(0.7,s*0.12);ctx.beginPath();for(let i=0;i<n;i++){const y=sp[i][1]-b.segs[i].r*s*0.35;i?ctx.lineTo(sp[i][0],y):ctx.moveTo(sp[i][0],y);}ctx.stroke();
  ctx.fillStyle=`rgba(255,225,120,${0.85*lightK})`;for(let i=0;i<n;i++){ctx.beginPath();ctx.arc(sp[i][0],sp[i][1]-b.segs[i].r*s*0.35,Math.max(1,b.segs[i].r*s*(i===0?0.2+0.05*(o.brain||0):0.09)),0,TAU);ctx.fill();}
  if(b.skel==='notochord'){ctx.strokeStyle=`rgba(240,245,255,${0.8*lightK})`;ctx.lineWidth=Math.max(1,s*0.25);ctx.beginPath();for(let i=0;i<n;i++){const y=sp[i][1]-b.segs[i].r*s*0.05;i?ctx.lineTo(sp[i][0],y):ctx.moveTo(sp[i][0],y);}ctx.stroke();for(let i=0;i<n;i++){ctx.strokeStyle=`rgba(255,255,255,${0.25*lightK})`;ctx.lineWidth=Math.max(0.6,s*0.08);const r=b.segs[i].r*s;ctx.beginPath();ctx.moveTo(sp[i][0]-r*0.3,sp[i][1]-r*0.7);ctx.lineTo(sp[i][0]+r*0.2,sp[i][1]);ctx.lineTo(sp[i][0]-r*0.3,sp[i][1]+r*0.7);ctx.stroke();}}
  if(n>1){const hb=0.75+0.25*Math.max(0,Math.sin(t*7));ctx.fillStyle=`rgba(220,40,50,${0.75*lightK})`;ctx.beginPath();ctx.arc(sp[1][0],sp[1][1]+b.segs[1].r*s*0.05,Math.max(1,b.segs[1].r*s*0.22*hb),0,TAU);ctx.fill();}
 }
 if(b.skel==='shell'){const k=Math.min(3,n);let cx=0,cy=0;for(let i=0;i<k;i++){cx+=sp[i][0];cy+=sp[i][1];}cx/=k;cy/=k;const rr=Math.max(...b.segs.slice(0,k).map(q=>q.r))*s*1.6+k*b.segs[0].r*s*0.5;const ang=Math.atan2(sp[0][1]-sp[k-1][1],sp[0][0]-sp[k-1][0]);
  ctx.fillStyle=`hsla(${(hue+30)%360},40%,${(62*lightK)|0}%,0.92)`;ctx.beginPath();ctx.ellipse(cx,cy-rr*0.25,rr,rr*0.62,ang,Math.PI,TAU);ctx.ellipse(cx,cy-rr*0.25,rr,rr*0.3,ang,0,Math.PI);ctx.fill();ctx.strokeStyle=edge(0.9);ctx.lineWidth=Math.max(1,rr*0.06);ctx.stroke();
  ctx.strokeStyle=`hsla(${(hue+30)%360},30%,${(35*lightK)|0}%,0.5)`;ctx.lineWidth=Math.max(0.8,rr*0.03);for(let q=1;q<4;q++){ctx.beginPath();ctx.ellipse(cx,cy-rr*0.25,rr*(1-q*0.22),rr*0.62*(1-q*0.22),ang,Math.PI,TAU);ctx.stroke();}}
 // голова
 const h=b.segs[0],hp=pos[0],f=fr[0],hr=h.r;
 const hs=P(hp.x+f.fx,hp.y+f.fy,hp.z+f.fz);let hdx=hs[0]-sp[0][0],hdy=hs[1]-sp[0][1];const hl=Math.hypot(hdx,hdy)||1;hdx/=hl;hdy/=hl;
 for(const pt of h.parts){const tp=pt.t;
  if(tp==='eyes'||tp==='cameye'||tp==='compound'){const er=hr*(tp==='eyes'?0.18:tp==='cameye'?0.32:0.38)*(0.7+0.3*pt.s);for(const sd of[-1,1]){const e=P(hp.x+f.fx*hr*0.55+f.sx*sd*hr*0.5,hp.y+f.fy*hr*0.55+f.sy*sd*hr*0.5,hp.z+hr*0.45);ctx.fillStyle=tp==='eyes'?'rgba(40,20,20,0.9)':tp==='compound'?'rgba(30,30,25,0.95)':'rgba(240,245,240,0.95)';ctx.beginPath();ctx.arc(e[0],e[1],Math.max(1,er*s),0,TAU);ctx.fill();if(tp==='cameye'){ctx.fillStyle='rgba(10,10,20,0.95)';ctx.beginPath();ctx.arc(e[0]+hdx*er*s*0.3,e[1]+hdy*er*s*0.3,Math.max(0.8,er*s*0.55),0,TAU);ctx.fill();}if(tp==='compound'){ctx.fillStyle='rgba(200,190,140,0.5)';for(let q=0;q<5;q++){ctx.beginPath();ctx.arc(e[0]+Math.cos(q*1.3)*er*s*0.5,e[1]+Math.sin(q*1.3)*er*s*0.5,Math.max(0.5,er*s*0.15),0,TAU);ctx.fill();}}}}
  else if(tp==='antenna'){for(const sd of[-1,1]){ctx.strokeStyle=edge(0.9);ctx.lineWidth=Math.max(0.6,hr*s*0.08);ctx.beginPath();const a=P(hp.x+f.fx*hr*0.8+f.sx*sd*hr*0.3,hp.y+f.fy*hr*0.8+f.sy*sd*hr*0.3,hp.z+hr*0.3);ctx.moveTo(a[0],a[1]);const L=hr*(3+3*pt.s);for(let q=1;q<=6;q++){const u=q/6,w=Math.sin(t*4+q+sd)*hr*0.3*u;const e=P(hp.x+f.fx*(hr*0.8+L*u)+f.sx*sd*(hr*0.3+L*0.5*u)+w,hp.y+f.fy*(hr*0.8+L*u)+f.sy*sd*(hr*0.3+L*0.5*u),hp.z+hr*0.3+L*0.15*u);ctx.lineTo(e[0],e[1]);}ctx.stroke();}}
  else if(tp==='jaws'){const op=0.3+0.3*Math.sin(t*6);for(const sd of[-1,1]){const a=P(hp.x+f.fx*hr*0.8+f.sx*sd*hr*0.35,hp.y+f.fy*hr*0.8+f.sy*sd*hr*0.35,hp.z),e=P(hp.x+f.fx*hr*(1.4+0.6*pt.s)+f.sx*sd*hr*op,hp.y+f.fy*hr*(1.4+0.6*pt.s)+f.sy*sd*hr*op,hp.z);ctx.strokeStyle=edge(1);ctx.lineWidth=Math.max(1,hr*s*0.22);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo((a[0]+e[0])/2+sd*hdy*hr*s*0.3,(a[1]+e[1])/2-sd*hdx*hr*s*0.3,e[0],e[1]);ctx.stroke();}}
  else if(tp==='grab'){for(const sd of[-1,1]){const curl=0.6+0.4*Math.sin(t*2+sd);ctx.strokeStyle=`hsla(${(hue+20)%360},45%,${(40*lightK)|0}%,0.95)`;ctx.lineWidth=Math.max(1,hr*s*0.26*pt.s);ctx.beginPath();const a=P(hp.x+f.fx*hr*0.7+f.sx*sd*hr*0.4,hp.y+f.fy*hr*0.7+f.sy*sd*hr*0.4,hp.z-hr*0.1);ctx.moveTo(a[0],a[1]);const L=hr*(2.5+2*pt.s);const pts=[];for(let q=1;q<=6;q++){const u=q/6,ang=u*curl*2.2;const e=P(hp.x+f.fx*(hr*0.7+L*Math.sin(ang+0.3)*0.9)+f.sx*sd*hr*0.4,hp.y+f.fy*(hr*0.7+L*Math.sin(ang+0.3)*0.9)+f.sy*sd*hr*0.4,hp.z-hr*0.1-L*(1-Math.cos(ang))*0.5);ctx.lineTo(e[0],e[1]);pts.push(e);}ctx.stroke();ctx.lineWidth=Math.max(0.6,hr*s*0.07);ctx.beginPath();for(const e of pts){ctx.moveTo(e[0],e[1]);ctx.lineTo(e[0]-hdx*hr*s*0.35,e[1]+hr*s*0.3);}ctx.stroke();}}
  else if(tp==='proboscis'){const L=hr*(3+3*pt.s)*(0.85+0.15*Math.sin(t*2));const a=P(hp.x+f.fx*hr*0.8,hp.y+f.fy*hr*0.8,hp.z-hr*0.2),m=P(hp.x+f.fx*(hr*0.8+L*0.6),hp.y+f.fy*(hr*0.8+L*0.6),hp.z-hr*0.2-L*0.25),e=P(hp.x+f.fx*(hr*0.8+L),hp.y+f.fy*(hr*0.8+L),hp.z-hr*0.2-L*0.3);ctx.strokeStyle=bodyFill(0.95);ctx.lineWidth=Math.max(1,hr*s*0.22);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(m[0],m[1]-hr*s*0.3,e[0],e[1]);ctx.stroke();ctx.strokeStyle=edge(1);ctx.lineWidth=Math.max(0.8,hr*s*0.12);for(const sd of[-1,1]){ctx.beginPath();ctx.moveTo(e[0],e[1]);ctx.lineTo(e[0]+hdx*hr*s*0.6+sd*hdy*hr*s*0.3,e[1]+hdy*hr*s*0.6-sd*hdx*hr*s*0.3);ctx.stroke();}}
 }
 ctx.restore();
}
function drawRadial(b,p,o,hue,lightK,t){
 const s=cam.s,bell=b.segs[0],r=bell.r*s,pulse=1+0.12*Math.sin(t*(o.moving?5:2.5));const c=proj(p.x,p.y,p.z);const cc=countParts(b);
 const ntent=Math.round(6+(cc.tentacle||0)*4);ctx.strokeStyle=`hsla(${hue},60%,${(70*lightK)|0}%,0.55)`;ctx.lineWidth=Math.max(0.7,s*0.18);
 for(let k=0;k<ntent;k++){const a=k/ntent*TAU;ctx.beginPath();let px=p.x+Math.cos(a)*bell.r*0.9,py=p.y+Math.sin(a)*bell.r*0.9,pz=p.z;let q=proj(px,py,pz);ctx.moveTo(q[0],q[1]);const L=bell.r*(2.5+2*(cc.tentacle||0)*0.3);for(let i=1;i<=8;i++){const u=i/8;q=proj(px+Math.sin(t*1.5+k+i*0.6)*bell.r*0.25*u,py+Math.cos(t*1.3+k+i*0.5)*bell.r*0.25*u,pz-L*u);ctx.lineTo(q[0],q[1]);}ctx.stroke();}
 if(cc.spine){ctx.fillStyle='rgba(255,240,200,0.7)';for(let k=0;k<ntent;k++){const a=k/ntent*TAU;const q=proj(p.x+Math.cos(a)*bell.r*0.95,p.y+Math.sin(a)*bell.r*0.95,p.z-bell.r*0.8);ctx.beginPath();ctx.arc(q[0],q[1],Math.max(0.8,s*0.25),0,TAU);ctx.fill();}}
 ctx.fillStyle=`hsla(${hue},55%,${(66*lightK)|0}%,0.32)`;ctx.beginPath();ctx.ellipse(c[0],c[1],r*pulse,r*0.5*pulse,0,0,TAU);ctx.fill();
 ctx.beginPath();ctx.ellipse(c[0],c[1],r*pulse,r*1.05*pulse,0,Math.PI,TAU);ctx.fill();ctx.strokeStyle=`hsla(${hue},55%,${(80*lightK)|0}%,0.8)`;ctx.lineWidth=Math.max(0.8,r*0.05);ctx.stroke();
 ctx.beginPath();ctx.ellipse(c[0],c[1],r*pulse,r*0.5*pulse,0,0,TAU);ctx.stroke();
 ctx.strokeStyle=`hsla(${(hue+300)%360},60%,${(60*lightK)|0}%,0.6)`;ctx.lineWidth=Math.max(0.8,r*0.06);for(let k=0;k<4;k++){const a=k/4*TAU+0.4;ctx.beginPath();ctx.arc(c[0]+Math.cos(a)*r*0.4,c[1]-r*0.35+Math.sin(a)*r*0.2,r*0.15,0,Math.PI*1.5);ctx.stroke();}
 if(cc.eyes||cc.cameye){ctx.fillStyle='rgba(60,30,20,0.9)';for(let k=0;k<8;k++){const a=k/8*TAU;ctx.beginPath();ctx.arc(c[0]+Math.cos(a)*r*pulse,c[1]+Math.sin(a)*r*0.5*pulse,Math.max(1,r*0.06),0,TAU);ctx.fill();}}
 ctx.fillStyle=`hsla(${hue},40%,${(40*lightK)|0}%,0.6)`;ctx.beginPath();ctx.ellipse(c[0],c[1]+r*0.15,r*0.18,r*0.45,0,0,TAU);ctx.fill();
}
function drawShadow(x,y,z,r){const fz=floorH(x,y);const p=proj(x,y,fz);const k=clamp(1-(z-fz)/400,0.15,1);ctx.fillStyle=`rgba(0,10,20,${0.28*k})`;ctx.beginPath();ctx.ellipse(p[0],p[1],r*cam.s*1.2*(1.3-k*0.3),r*cam.s*0.6*(1.3-k*0.3),0,0,TAU);ctx.fill();}
