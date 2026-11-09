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
/* ===== цепочка сегментов (плоскость x–z) ===== */
function initChain(b,x,y,z,a){const pos=[];let cx=x,cz=z;for(let i=0;i<b.segs.length;i++){pos.push({x:cx,y:0,z:cz});const r1=b.segs[i].r,r2=b.segs[i+1]?b.segs[i+1].r:r1;cx-=Math.cos(a)*(r1+r2)*0.8;cz-=Math.sin(a)*(r1+r2)*0.8;}return pos;}
function updateChain(b,pos,hx,hy,hz){
 if(pos.length!==b.segs.length){const a=pos.length>1?Math.atan2(pos[0].z-pos[1].z,pos[0].x-pos[1].x):0;const np=initChain(b,hx,0,hz,a);pos.length=0;for(const p of np)pos.push(p);}
 pos[0].x=hx;pos[0].y=0;pos[0].z=hz;
 for(let i=1;i<pos.length;i++){const p=pos[i],q=pos[i-1];const L=(b.segs[i].r+b.segs[i-1].r)*0.8;let dx=p.x-q.x,dz=p.z-q.z;const d=Math.hypot(dx,dz)||1;p.x=q.x+dx/d*L;p.z=q.z+dz/d*L;p.y=0;const fh=floorH(p.x)+b.segs[i].r*0.6;if(p.z<fh)p.z=fh;}
}
/* ===== рисование тела в профиль ===== */
function segFrames(pos,heading){
 const fr=[];for(let i=0;i<pos.length;i++){let fx,fz;if(pos.length===1){fx=Math.cos(heading);fz=Math.sin(heading);}else if(i===0){fx=pos[0].x-pos[1].x;fz=pos[0].z-pos[1].z;}else{fx=pos[i-1].x-pos[i].x;fz=pos[i-1].z-pos[i].z;}
  const l=Math.hypot(fx,fz)||1;fx/=l;fz/=l;let nx=-fz,nz=fx;if(fx<0){nx=fz;nz=-fx;}fr.push({fx,fz,nx,nz});}
 // сглаживаем нормаль у головы/хвоста, чтобы спина не «переворачивалась»
 return fr;
}
function drawBody(b,pos,o){
 o=o||{};const t=o.t!=null?o.t:T_,s=cam.s,hue=o.hue!=null?o.hue:b.hue,alpha=o.alpha==null?1:o.alpha;
 const L=o.light!=null?o.light:lightAt(pos[0].z);
 ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.lineJoin='round';
 if(b.sym==='radial'){drawRadial(b,pos[0],o,hue,L,t);ctx.restore();return;}
 const n=pos.length,fr=segFrames(pos,o.heading||0),mv=o.moving||0;
 const Wp=(i,a,bb)=>{const p=pos[i],f=fr[i];return{x:p.x+f.fx*a+f.nx*bb,z:p.z+f.fz*a+f.nz*bb};};
 const Q=(i,a,bb)=>{const w=Wp(i,a,bb);return proj(w.x,0,w.z);};
 const sat=b.skel==='exo'?32:45,lum=b.skel==='exo'?44:52;
 const C=(dl,a,ds)=>`hsla(${hue},${sat+(ds||0)}%,${clamp(lum*L*dl,3,92)|0}%,${a})`;
 const dark=(a)=>`hsla(${hue},${sat}%,${clamp(lum*L*0.42,3,60)|0}%,${a})`;
 const soft=b.skel==='none'||b.skel==='notochord';
 // --- придатки дальней стороны (темнее, за телом)
 const appendages=(far)=>{const dl=far?0.55:1,shift=far?0.25:0;
  for(let i=0;i<n;i++){const sg=b.segs[i],r=sg.r;for(const pt of sg.parts){const tp=pt.t;
   if(tp==='leg'||tp==='jleg'){const ph=Math.sin(t*9+i*1.25+(far?Math.PI:0))*mv;const base=Wp(i,shift*r,-0.55*r);const f=fr[i];const fl=floorH(base.x)+0.15;
     const tip={x:base.x+f.fx*ph*r*0.9+f.fx*r*0.2,z:Math.max(fl,base.z-r*(1.1+1.5*pt.s)+Math.max(0,-ph)*r*0.3)};
     const a=proj(base.x,0,base.z),e=proj(tip.x,0,tip.z);
     if(tp==='jleg'){const kn=proj((base.x+tip.x)/2+f.fx*r*0.55,0,(base.z+tip.z)/2+r*0.45);ctx.strokeStyle=C(0.8*dl,0.97);ctx.lineWidth=Math.max(1,r*s*0.2*pt.s);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(kn[0],kn[1]);ctx.lineTo(e[0],e[1]);ctx.stroke();ctx.fillStyle=dark(0.9);ctx.beginPath();ctx.arc(kn[0],kn[1],Math.max(0.8,r*s*0.12),0,TAU);ctx.fill();}
     else{ctx.strokeStyle=C(0.95*dl,0.92);ctx.lineWidth=Math.max(1.2,r*s*0.38*pt.s);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo((a[0]+e[0])/2+(a[0]-e[0])*0.2,(a[1]+e[1])/2,e[0],e[1]);ctx.stroke();ctx.fillStyle=dark(0.8);ctx.beginPath();ctx.arc(e[0],e[1],Math.max(0.8,r*s*0.12),0,TAU);ctx.fill();}}
   else if(tp==='fin'){const fl=Math.sin(t*7+i*0.7+(far?0.6:0))*(0.35+mv*0.8);const a0=Q(i,(0.55+shift)*r,-0.15*r),tip=Q(i,(-0.7+fl*0.3+shift)*r,-r*(0.75+1.3*pt.s)*(0.8+0.25*fl)),e0=Q(i,(-0.75+shift)*r,-0.2*r);
     ctx.fillStyle=far?C(0.6,0.55):C(1.1,0.55);ctx.strokeStyle=dark(0.6);ctx.lineWidth=Math.max(0.6,s*0.1);ctx.beginPath();ctx.moveTo(a0[0],a0[1]);ctx.quadraticCurveTo(tip[0]+(a0[0]-e0[0])*0.3,tip[1],e0[0],e0[1]);ctx.closePath();ctx.fill();ctx.stroke();
     ctx.strokeStyle=`hsla(${hue},30%,${clamp(80*L*dl,5,95)|0}%,0.25)`;for(let q=1;q<4;q++){const m=Q(i,(0.4-q*0.35+shift)*r,-0.2*r);ctx.beginPath();ctx.moveTo(m[0],m[1]);ctx.lineTo(lerp(m[0],tip[0],0.85),lerp(m[1],tip[1],0.85));ctx.stroke();}}
   else if(tp==='gill'){ctx.strokeStyle=`rgba(${(215*L*dl+20)|0},${(80*L*dl)|0},${(85*L*dl)|0},0.85)`;ctx.lineWidth=Math.max(0.6,s*0.09*pt.s+0.3);ctx.beginPath();for(let q=0;q<6;q++){const a0=Q(i,(0.4-q*0.16+shift)*r,-0.55*r);const w=Math.sin(t*4+q*0.8+i)*0.25;const e=Q(i,(0.1-q*0.2+shift+w*0.4)*r,-r*(1+0.8*pt.s));ctx.moveTo(a0[0],a0[1]);ctx.quadraticCurveTo(a0[0]+(e[0]-a0[0])*0.2,(a0[1]+e[1])/2,e[0],e[1]);}ctx.stroke();}
   else if(tp==='spine'){const a0=Q(i,(shift*0.6)*r,0.6*r),e=Q(i,(-0.45*pt.s+shift*0.6)*r,r*(1.1+1.5*pt.s));ctx.strokeStyle=far?dark(0.75):`hsla(${hue},25%,${clamp(70*L,8,92)|0}%,0.95)`;ctx.lineWidth=Math.max(1,r*s*0.16);ctx.beginPath();ctx.moveTo(a0[0],a0[1]);ctx.lineTo(e[0],e[1]);ctx.stroke();}
   else if(tp==='tentacle'){ctx.strokeStyle=C(0.9*dl,0.8);ctx.lineWidth=Math.max(0.8,r*s*0.14);ctx.beginPath();const a0=Q(i,(0.3+shift)*r,-0.5*r);ctx.moveTo(a0[0],a0[1]);const Lt=r*(2+2.5*pt.s);for(let q=1;q<=9;q++){const u=q/9;const w=Wp(i,(0.3+shift)*r-u*Lt*0.35+Math.sin(t*2.5+q*0.8+i+(far?1:0))*r*0.4*u,-0.5*r-u*Lt);const e=proj(w.x,0,Math.max(floorH(w.x)+0.2,w.z));ctx.lineTo(e[0],e[1]);}ctx.stroke();}
  }}
  // головные парные: усики и клешни
  const h=b.segs[0],r=h.r;for(const pt of h.parts){
   if(pt.t==='antenna'){ctx.strokeStyle=far?dark(0.7):C(0.6,0.95);ctx.lineWidth=Math.max(0.6,r*s*0.07);ctx.beginPath();const a0=Q(0,0.8*r,(0.35+(far?0.08:0))*r);ctx.moveTo(a0[0],a0[1]);const La=r*(3+3*pt.s);for(let q=1;q<=7;q++){const u=q/7;const e=Q(0,0.8*r+La*u*(far?0.85:1),(0.35+(far?0.15:0))*r+La*u*0.35-La*u*u*0.25+Math.sin(t*4+q+(far?2:0))*r*0.25*u);ctx.lineTo(e[0],e[1]);}ctx.stroke();}
   else if(pt.t==='grab'){const curl=0.55+0.45*Math.sin(t*1.8+(far?0.7:0));ctx.strokeStyle=far?dark(0.85):`hsla(${(hue+15)%360},45%,${clamp(42*L,5,80)|0}%,0.97)`;ctx.lineWidth=Math.max(1,r*s*0.24*pt.s);const La=r*(2.4+2.2*pt.s);const pts=[];let ang=0.15,cx=0.8*r+(far?0.15*r:0),cz=-0.25*r;pts.push([cx,cz]);for(let q=1;q<=8;q++){ang+=curl*0.38;cx+=Math.cos(ang)*La/8;cz-=Math.sin(ang)*La/8;pts.push([cx,cz]);}
     ctx.beginPath();pts.forEach((p,k)=>{const e=Q(0,p[0],p[1]);k?ctx.lineTo(e[0],e[1]):ctx.moveTo(e[0],e[1]);});ctx.stroke();ctx.lineWidth=Math.max(0.6,r*s*0.07);ctx.beginPath();for(let k=2;k<pts.length;k++){const p=pts[k],e=Q(0,p[0],p[1]),e2=Q(0,p[0]-r*0.15,p[1]-r*0.45);ctx.moveTo(e[0],e[1]);ctx.lineTo(e2[0],e2[1]);}ctx.stroke();}
  }
 };
 appendages(true);
 // хвостовой плавник
 for(const pt of b.segs[n-1].parts)if(pt.t==='tailfin'){const r=b.segs[n-1].r,fl=Math.sin(t*6.5)*(0.25+mv*0.9);const base=Q(n-1,-0.5*r,0),l=r*(1.5+2.2*pt.s);const up=Q(n-1,-l,l*(0.75+0.25*fl)),dn=Q(n-1,-l*0.92,-l*(0.6-0.25*fl)),mid=Q(n-1,-l*0.62,0.05*l*fl);
  const g=ctx.createLinearGradient(base[0],base[1],mid[0],mid[1]);g.addColorStop(0,C(1,0.85));g.addColorStop(1,C(1.15,0.35));ctx.fillStyle=g;ctx.strokeStyle=dark(0.7);ctx.lineWidth=Math.max(0.7,s*0.12);ctx.beginPath();ctx.moveTo(base[0],base[1]);ctx.quadraticCurveTo((base[0]+up[0])/2,(base[1]+up[1])/2-(up[1]-base[1])*0.1,up[0],up[1]);ctx.quadraticCurveTo(mid[0],mid[1],dn[0],dn[1]);ctx.quadraticCurveTo((base[0]+dn[0])/2,(base[1]+dn[1])/2,base[0],base[1]);ctx.fill();ctx.stroke();
  ctx.strokeStyle=C(0.6,0.25);ctx.lineWidth=Math.max(0.5,s*0.06);for(let q=1;q<6;q++){const u=q/6;ctx.beginPath();ctx.moveTo(base[0],base[1]);ctx.lineTo(lerp(up[0],dn[0],u)+(mid[0]-lerp(up[0],dn[0],u))*0.15,lerp(up[1],dn[1],u));ctx.stroke();}}
 // туловище
 const sp=pos.map(p=>proj(p.x,0,p.z));let y0=1e9,y1=-1e9;for(let i=0;i<n;i++){const r=b.segs[i].r*s;y0=Math.min(y0,sp[i][1]-r);y1=Math.max(y1,sp[i][1]+r);}
 const gb=ctx.createLinearGradient(0,y0,0,y1);gb.addColorStop(0,C(1.4,soft?0.85:0.98,8));gb.addColorStop(0.45,C(1,soft?0.8:0.97));gb.addColorStop(1,C(0.45,soft?0.85:0.98));
 const ang=i=>Math.atan2(-fr[i].fz,fr[i].fx);
 ctx.fillStyle=gb;for(let i=n-1;i>=0;i--){const r=b.segs[i].r*s;ctx.beginPath();ctx.ellipse(sp[i][0],sp[i][1],r*1.06,r*0.9,ang(i),0,TAU);ctx.fill();}
 // складки между сегментами и спинной блик
 ctx.strokeStyle=dark(soft?0.35:0.6);ctx.lineWidth=Math.max(0.6,s*0.1);for(let i=1;i<n;i++){const r=b.segs[i].r;const a0=Q(i,0.72*r,0.82*r),m=Q(i,0.88*r,0),e0=Q(i,0.72*r,-0.8*r);ctx.beginPath();ctx.moveTo(a0[0],a0[1]);ctx.quadraticCurveTo(m[0],m[1],e0[0],e0[1]);ctx.stroke();}
 ctx.strokeStyle=`hsla(${hue},40%,${clamp(85*L,10,96)|0}%,${soft?0.35:0.55})`;ctx.lineWidth=Math.max(0.8,b.segs[0].r*s*0.12);ctx.beginPath();for(let i=0;i<n;i++){const e=Q(i,0,0.72*b.segs[i].r);i?ctx.lineTo(e[0],e[1]):ctx.moveTo(e[0],e[1]);}ctx.stroke();
 if(b.skel==='exo'){ctx.strokeStyle=`hsla(${hue},30%,${clamp(78*L,8,95)|0}%,0.5)`;ctx.lineWidth=Math.max(0.8,s*0.16);for(let i=0;i<n;i++){const r=b.segs[i].r;const a0=Q(i,0.6*r,0.55*r),m=Q(i,0,0.92*r),e0=Q(i,-0.6*r,0.55*r);ctx.beginPath();ctx.moveTo(a0[0],a0[1]);ctx.quadraticCurveTo(m[0],m[1],e0[0],e0[1]);ctx.stroke();}
  const r=b.segs[0].r;ctx.fillStyle=C(1.15,0.9);ctx.beginPath();const a0=Q(0,1.1*r,0.1*r),m=Q(0,0.3*r,1.25*r),e0=Q(0,-1.0*r,0.6*r),gs=Q(0,-1.4*r,-0.4*r);ctx.moveTo(a0[0],a0[1]);ctx.quadraticCurveTo(m[0],m[1],e0[0],e0[1]);ctx.lineTo(gs[0],gs[1]);ctx.lineTo(Q(0,-0.6*r,0.1*r)[0],Q(0,-0.6*r,0.1*r)[1]);ctx.closePath();ctx.fill();ctx.strokeStyle=dark(0.7);ctx.lineWidth=Math.max(0.7,s*0.1);ctx.stroke();}
 // внутренние органы
 if(soft||o.xray){const ia=soft?1:0.7;
  ctx.strokeStyle=`rgba(${(110*L)|0},${(70*L)|0},${(40*L)|0},${0.45*ia})`;ctx.lineWidth=Math.max(1,b.segs[0].r*s*0.28);ctx.beginPath();for(let i=0;i<n;i++){const e=Q(i,0,-0.12*b.segs[i].r);i?ctx.lineTo(e[0],e[1]):ctx.moveTo(e[0],e[1]);}ctx.stroke();
  if(o.gut)for(const g of o.gut){const fi=g.p*(n-1),i0=Math.floor(fi),i1=Math.min(n-1,i0+1),u=fi-i0;const a=Q(i0,0,-0.12*b.segs[i0].r),c=Q(i1,0,-0.12*b.segs[i1].r);ctx.fillStyle=g.c;ctx.beginPath();ctx.arc(lerp(a[0],c[0],u),lerp(a[1],c[1],u),Math.max(1,b.segs[i0].r*s*0.2*(1-g.p*0.5)),0,TAU);ctx.fill();}
  const chord=b.skel==='notochord',nb=chord?0.55:-0.55;
  ctx.strokeStyle=`rgba(255,${(215*L+20)|0},${(120*L)|0},${0.6*ia})`;ctx.lineWidth=Math.max(0.6,s*0.1);ctx.beginPath();for(let i=0;i<n;i++){const e=Q(i,0,nb*b.segs[i].r);i?ctx.lineTo(e[0],e[1]):ctx.moveTo(e[0],e[1]);}ctx.stroke();
  if(!chord){ctx.fillStyle=`rgba(255,${(220*L+20)|0},${(120*L)|0},${0.7*ia})`;for(let i=1;i<n;i++){const e=Q(i,0,nb*b.segs[i].r);ctx.beginPath();ctx.arc(e[0],e[1],Math.max(0.8,b.segs[i].r*s*0.08),0,TAU);ctx.fill();}}
  const br=Q(0,0.25*b.segs[0].r,0.25*b.segs[0].r);ctx.fillStyle=`rgba(255,${(215*L+30)|0},${(140*L+20)|0},${0.75*ia})`;ctx.beginPath();ctx.arc(br[0],br[1],Math.max(1,b.segs[0].r*s*(0.16+0.07*(o.brain||0))),0,TAU);ctx.fill();
  if(chord){ctx.strokeStyle=`rgba(235,245,255,${0.7*ia*L+0.1})`;ctx.lineWidth=Math.max(1,b.segs[0].r*s*0.13);ctx.beginPath();for(let i=0;i<n;i++){const e=Q(i,i===0?0.4*b.segs[0].r:0,0.3*b.segs[i].r);i?ctx.lineTo(e[0],e[1]):ctx.moveTo(e[0],e[1]);}ctx.stroke();
   ctx.strokeStyle=`rgba(255,255,255,${0.16*L})`;ctx.lineWidth=Math.max(0.5,s*0.07);for(let i=1;i<n;i++){const r=b.segs[i].r;const a0=Q(i,-0.1*r,0.75*r),m=Q(i,0.3*r,0),e0=Q(i,-0.1*r,-0.75*r);ctx.beginPath();ctx.moveTo(a0[0],a0[1]);ctx.lineTo(m[0],m[1]);ctx.lineTo(e0[0],e0[1]);ctx.stroke();}}
  if(n>1){const hb=0.75+0.25*Math.max(0,Math.sin(t*7));const e=Q(1,0.2*b.segs[1].r,chord?-0.45*b.segs[1].r:0.35*b.segs[1].r);ctx.fillStyle=`rgba(${(220*L+20)|0},40,50,${0.7*ia})`;ctx.beginPath();ctx.arc(e[0],e[1],Math.max(1,b.segs[1].r*s*0.2*hb),0,TAU);ctx.fill();}
 }
 // раковина
 if(b.skel==='shell'){const k=Math.min(3,n);const rr=b.segs[0].r;const a0=Q(0,1.0*rr,0.25*rr),e0=Q(k-1,-1.0*b.segs[k-1].r,0.25*b.segs[k-1].r);let L2=0;for(let i=0;i<k;i++)L2+=b.segs[i].r*1.6;const ap=Q(Math.floor((k-1)/2),-0.2*rr,rr*0.6+L2*0.7);
  const g=ctx.createLinearGradient(ap[0],ap[1],(a0[0]+e0[0])/2,(a0[1]+e0[1])/2);g.addColorStop(0,`hsla(${(hue+40)%360},35%,${clamp(80*L,10,92)|0}%,0.97)`);g.addColorStop(1,`hsla(${(hue+30)%360},35%,${clamp(48*L,6,80)|0}%,0.97)`);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(a0[0],a0[1]);ctx.quadraticCurveTo(a0[0]+(ap[0]-a0[0])*0.3,ap[1],ap[0],ap[1]);ctx.quadraticCurveTo(e0[0]+(ap[0]-e0[0])*0.1,ap[1]+(e0[1]-ap[1])*0.2,e0[0],e0[1]);ctx.closePath();ctx.fill();ctx.strokeStyle=dark(0.8);ctx.lineWidth=Math.max(1,s*0.15);ctx.stroke();
  ctx.strokeStyle=`hsla(${(hue+30)%360},25%,${clamp(30*L,4,60)|0}%,0.4)`;ctx.lineWidth=Math.max(0.6,s*0.08);for(let q=1;q<5;q++){const u=q/5;ctx.beginPath();ctx.moveTo(lerp(a0[0],ap[0],u),lerp(a0[1],ap[1],u*0.9));ctx.quadraticCurveTo(ap[0],ap[1]+(a0[1]-ap[1])*u*0.4,lerp(e0[0],ap[0],u),lerp(e0[1],ap[1],u*0.9));ctx.stroke();}}
 appendages(false);
 // голова
 const h=b.segs[0],r=h.r;
 for(const pt of h.parts){const tp=pt.t;
  if(tp==='eyes'){const e=Q(0,0.5*r,0.3*r),er=Math.max(1,r*s*0.16*(0.7+0.3*pt.s));ctx.fillStyle='rgba(30,12,10,0.95)';ctx.beginPath();ctx.arc(e[0],e[1],er,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.arc(e[0]-er*0.3,e[1]-er*0.3,er*0.35,0,TAU);ctx.fill();}
  else if(tp==='cameye'){const e=Q(0,0.45*r,0.3*r),er=Math.max(1.5,r*s*0.3*(0.7+0.3*pt.s));ctx.fillStyle='rgba(230,235,225,0.97)';ctx.beginPath();ctx.arc(e[0],e[1],er,0,TAU);ctx.fill();const f=fr[0];ctx.fillStyle='rgba(60,45,20,0.95)';ctx.beginPath();ctx.arc(e[0]+f.fx*er*0.25,e[1]-f.fz*er*0.25,er*0.62,0,TAU);ctx.fill();ctx.fillStyle='rgba(5,5,10,0.97)';ctx.beginPath();ctx.arc(e[0]+f.fx*er*0.3,e[1]-f.fz*er*0.3,er*0.36,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(e[0]-er*0.2,e[1]-er*0.35,er*0.18,0,TAU);ctx.fill();}
  else if(tp==='compound'){const e=Q(0,0.35*r,0.48*r),er=Math.max(1.5,r*s*0.36*(0.7+0.3*pt.s));const g=ctx.createRadialGradient(e[0]-er*0.3,e[1]-er*0.3,er*0.1,e[0],e[1],er);g.addColorStop(0,'rgba(120,110,70,0.97)');g.addColorStop(1,'rgba(25,20,12,0.97)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(e[0],e[1],er,er*0.8,ang(0),0,TAU);ctx.fill();ctx.fillStyle='rgba(220,210,160,0.35)';for(let q=0;q<9;q++){ctx.beginPath();ctx.arc(e[0]+Math.cos(q*2.4)*er*0.55*Math.sqrt(q/9),e[1]+Math.sin(q*2.4)*er*0.45*Math.sqrt(q/9),Math.max(0.4,er*0.1),0,TAU);ctx.fill();}}
  else if(tp==='jaws'){const op=0.25+0.25*Math.sin(t*5);for(const sd of[1,-1]){const a0=Q(0,0.8*r,sd*0.18*r),m=Q(0,(1.25+0.3*pt.s)*r,sd*(0.25+op)*r),e=Q(0,(1.5+0.6*pt.s)*r,sd*op*0.4*r-sd*0.1*r);ctx.strokeStyle=dark(1);ctx.lineWidth=Math.max(1,r*s*0.2);ctx.beginPath();ctx.moveTo(a0[0],a0[1]);ctx.quadraticCurveTo(m[0],m[1],e[0],e[1]);ctx.stroke();ctx.fillStyle='rgba(240,230,200,0.85)';for(let q=1;q<4;q++){const u=q/4;const tx=lerp(a0[0],e[0],u),ty=lerp(a0[1],e[1],u);ctx.beginPath();ctx.arc(tx,ty+sd*r*s*0.08,Math.max(0.5,r*s*0.05),0,TAU);ctx.fill();}}}
  else if(tp==='proboscis'){const La=r*(3+3*pt.s)*(0.85+0.15*Math.sin(t*1.7));ctx.strokeStyle=C(0.95,0.95);ctx.lineWidth=Math.max(1,r*s*0.22);ctx.beginPath();const a0=Q(0,0.85*r,-0.25*r);ctx.moveTo(a0[0],a0[1]);let last=a0,prev=a0;for(let q=1;q<=8;q++){const u=q/8;const e=Q(0,0.85*r+La*u,-0.25*r-La*0.25*Math.sin(u*2.4)+Math.sin(t*2+q*0.7)*r*0.2*u);ctx.lineTo(e[0],e[1]);prev=last;last=e;}ctx.stroke();
   const dx=last[0]-prev[0],dy=last[1]-prev[1],dl=Math.hypot(dx,dy)||1;ctx.strokeStyle=dark(1);ctx.lineWidth=Math.max(0.8,r*s*0.1);const cl=0.3+0.25*Math.sin(t*3);for(const sd of[-1,1]){ctx.beginPath();ctx.moveTo(last[0],last[1]);ctx.quadraticCurveTo(last[0]+dx/dl*r*s*0.4-sd*dy/dl*r*s*cl,last[1]+dy/dl*r*s*0.4+sd*dx/dl*r*s*cl,last[0]+dx/dl*r*s*0.7,last[1]+dy/dl*r*s*0.7);ctx.stroke();}}
 }
 ctx.restore();
}
function drawRadial(b,p,o,hue,L,t){
 const s=cam.s,bell=b.segs[0],R=bell.r*s,pl=Math.sin(t*(o.moving?5:2.4));const c=proj(p.x,0,p.z);const cc=countParts(b);
 const w=R*(1-0.12*pl),hg=R*(0.85+0.12*pl);
 const ntent=Math.round(6+(cc.tentacle||0)*3);ctx.lineWidth=Math.max(0.6,s*0.14);
 for(let k=0;k<ntent;k++){const u=(k+0.5)/ntent,x0=c[0]-w+u*2*w;ctx.strokeStyle=`hsla(${hue},55%,${clamp(72*L,8,92)|0}%,${0.35+0.25*Math.sin(k)})`;ctx.beginPath();ctx.moveTo(x0,c[1]);const Lt=bell.r*(2.6+0.8*(cc.tentacle||0))*s*(0.8+0.3*hash(k,3));for(let q=1;q<=10;q++){const v=q/10;ctx.lineTo(x0+Math.sin(t*1.4+k+v*4)*R*0.25*v+(o.moving?v*v*R*0.1:0),c[1]+Lt*v);}ctx.stroke();}
 // ротовые лопасти
 ctx.strokeStyle=`hsla(${(hue+320)%360},50%,${clamp(65*L,8,90)|0}%,0.55)`;ctx.lineWidth=Math.max(1,R*0.08);for(let k=-1;k<=1;k+=2){ctx.beginPath();ctx.moveTo(c[0]+k*R*0.08,c[1]);for(let q=1;q<=6;q++){const v=q/6;ctx.lineTo(c[0]+k*R*0.1+Math.sin(t*1.2+q+k)*R*0.18,c[1]+R*1.4*v);}ctx.stroke();}
 if(cc.spine){ctx.fillStyle='rgba(255,240,210,0.65)';for(let k=0;k<12;k++){const u=k/11;ctx.beginPath();ctx.arc(c[0]-w+u*2*w,c[1]+R*0.04,Math.max(0.8,R*0.04),0,TAU);ctx.fill();}}
 const g=ctx.createLinearGradient(0,c[1]-hg,0,c[1]);g.addColorStop(0,`hsla(${hue},55%,${clamp(80*L,10,95)|0}%,0.42)`);g.addColorStop(1,`hsla(${hue},55%,${clamp(55*L,6,85)|0}%,0.22)`);ctx.fillStyle=g;
 ctx.beginPath();ctx.moveTo(c[0]-w,c[1]);ctx.bezierCurveTo(c[0]-w,c[1]-hg*1.25,c[0]+w,c[1]-hg*1.25,c[0]+w,c[1]);ctx.quadraticCurveTo(c[0],c[1]-hg*0.35,c[0]-w,c[1]);ctx.fill();
 ctx.strokeStyle=`hsla(${hue},50%,${clamp(90*L,10,98)|0}%,0.7)`;ctx.lineWidth=Math.max(0.8,R*0.04);ctx.beginPath();ctx.moveTo(c[0]-w,c[1]);ctx.bezierCurveTo(c[0]-w,c[1]-hg*1.25,c[0]+w,c[1]-hg*1.25,c[0]+w,c[1]);ctx.stroke();
 ctx.strokeStyle=`hsla(${(hue+300)%360},60%,${clamp(62*L,6,90)|0}%,0.55)`;ctx.lineWidth=Math.max(0.8,R*0.05);for(let k=0;k<4;k++){const x=c[0]+(k-1.5)*w*0.36;ctx.beginPath();ctx.ellipse(x,c[1]-hg*0.45,w*0.12,hg*0.16,0,0,TAU);ctx.stroke();}
 if(cc.eyes||cc.cameye){ctx.fillStyle='rgba(70,35,20,0.9)';for(const sd of[-1,1]){ctx.beginPath();ctx.arc(c[0]+sd*w*0.97,c[1]-R*0.05,Math.max(1,R*0.05),0,TAU);ctx.fill();}}
}
function drawShadow(x,y,z,r){const fz=floorH(x);const h=z-fz;if(h>220)return;const p=proj(x,0,fz);const k=clamp(1-h/220,0,1);ctx.fillStyle=`rgba(0,8,14,${0.3*k*lightAt(fz)})`;ctx.beginPath();ctx.ellipse(p[0],p[1]+cam.s*0.5,r*cam.s*(1.2+h*0.01),r*cam.s*0.28,0,0,TAU);ctx.fill();}
