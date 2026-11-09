const EVO=(function(){
'use strict';
const TILE=12, TW=200, TH=130, WW=TW*TILE, WH=TH*TILE;
const DAY=240, SEASON_DAYS=8, YEAR_DAYS=32;
const CELL=32, GW=Math.ceil(WW/CELL), GH=Math.ceil(WH/CELL);
const DEEP=0,SHALLOW=1,BEACH=2,GRASS=3,FOREST=4,DESERT=5,TUNDRA=6,MOUNT=7,SNOW=8;
const BIOME_NAMES=['Глубокая вода','Мелководье','Пляж','Степь','Лес','Пустыня','Тундра','Горы','Лёд и снег'];
const PLANT_CAP=[1.0,2.6,0.8,6,9,0.8,2.2,1.4,0.15];
const COVER=[0.3,0.4,0.15,0.45,1,0.25,0.35,0.75,0.2];
const GN=['size','speed','sense','armor','attack','venom','camo','fert','diet','social','intel','topt','ttol','swim','fly','dig','life','hue','aggr','fear','rot','mut','night'];
const NG=GN.length; const G={}; GN.forEach((n,i)=>G[n]=i);
const GENE_RU={size:'Размер',speed:'Скорость',sense:'Зрение и чутьё',armor:'Броня',attack:'Атака (зубы, когти)',venom:'Сила яда',camo:'Маскировка',fert:'Плодовитость',diet:'Хищность',social:'Стайность',intel:'Интеллект',topt:'Любимая температура',ttol:'Терпимость к климату',swim:'Плавание',fly:'Полёт',dig:'Рытьё',life:'Долголетие',hue:'Окраска',aggr:'Агрессия',fear:'Осторожность',rot:'Падальщичество',mut:'Изменчивость',night:'Ночное зрение'};
const MODS=[
 {k:'fins',ru:'Плавники',cost:0.1,hint:'плавание работает в полную силу'},
 {k:'wings',ru:'Крылья',cost:0.35,hint:'полёт над водой и горами (для небольших)'},
 {k:'claws',ru:'Роющие когти',cost:0.1,hint:'норы: прятаться от хищников и метеоритов'},
 {k:'shell',ru:'Панцирь',cost:0.2,hint:'броня работает в полную силу'},
 {k:'venom',ru:'Ядовитая железа',cost:0.15,hint:'укусы отравляют'},
 {k:'chroma',ru:'Хроматофоры',cost:0.1,hint:'маскировка работает в полную силу'},
 {k:'eyes',ru:'Ночные глаза',cost:0.08,hint:'видит ночью'},
 {k:'fur',ru:'Мех',cost:0.08,hint:'+10° к холодостойкости'},
 {k:'scales',ru:'Термочешуя',cost:0.08,hint:'+9° к жаростойкости'},
 {k:'horns',ru:'Рога',cost:0.1,hint:'+35% к атаке и отпору'},
 {k:'brain',ru:'Большой мозг',cost:0.3,hint:'нейросеть-мозг влияет сильнее'},
 {k:'voice',ru:'Сигнальный голос',cost:0.08,hint:'стая сражается слаженнее'},
 {k:'stomach',ru:'Кислотный желудок',cost:0.05,hint:'можно есть тухлое мясо'}
];
const MB={}; MODS.forEach((m,i)=>MB[m.k]=1<<i);
const NI=12,NH=6,NO=3,NW=NI*NH+NH*NO;
const SPEC_T=0.32;
const SPEC_GENES=[]; for(let i=0;i<NG;i++) if(i!==G.hue&&i!==G.mut) SPEC_GENES.push(i);
const DX=[],DY=[]; for(let k=0;k<8;k++){DX.push(Math.cos(k*Math.PI/4));DY.push(Math.sin(k*Math.PI/4));}
const R=Math.random;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function gauss(){let u=0;while(u===0)u=R();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2831853*R());}
function pick(a){return a[(R()*a.length)|0];}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function makeNoise(rnd){const N=256,p=new Float32Array(N*N);for(let i=0;i<p.length;i++)p[i]=rnd();return function(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const a=p[(yi&255)*N+(xi&255)],b=p[(yi&255)*N+((xi+1)&255)],c=p[((yi+1)&255)*N+(xi&255)],d=p[((yi+1)&255)*N+((xi+1)&255)];const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};}
function fbm(n,x,y,o){let s=0,a=0.5,f=1,t=0;for(let i=0;i<o;i++){s+=a*n(x*f,y*f);t+=a;a*=0.5;f*=2;}return s/t;}

const S={};
let cs=[];
const head=new Int32Array(GW*GH); let nxt=new Int32Array(8192);
const IN=new Float32Array(NI), HID=new Float32Array(NH);

function tileIdx(x,y){let tx=(x/TILE)|0,ty=(y/TILE)|0;if(tx<0)tx=0;else if(tx>=TW)tx=TW-1;if(ty<0)ty=0;else if(ty>=TH)ty=TH-1;return ty*TW+tx;}
function tempAt(x,y){const ti=tileIdx(x,y);return S.baseT[ti]+S.rowSeason[(ti/TW)|0]+S.climOff-S.dust+(S.light-0.5)*4;}

function genWorld(seed){
 const rnd=mulberry32(seed);const n1=makeNoise(rnd),n2=makeNoise(rnd);
 S.elev=new Float32Array(TW*TH);S.moist=new Float32Array(TW*TH);S.baseT=new Float32Array(TW*TH);
 const blobs=[];const nb=6+Math.floor(rnd()*4);
 for(let i=0;i<nb;i++)blobs.push({x:TW*(0.1+rnd()*0.8),y:TH*(0.12+rnd()*0.76),r:13+rnd()*24});
 for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){
  const i=y*TW+x;let b=0;
  for(const bl of blobs){const d2=((x-bl.x)**2+(y-bl.y)**2)/(bl.r*bl.r);b=Math.max(b,Math.exp(-d2));}
  const nn=fbm(n1,x/22,y/22,5);
  let e=b*0.7+nn*0.7-0.62;
  const edge=Math.min(x,y,TW-1-x,TH-1-y);if(edge<8)e-=(8-edge)*0.04;
  S.elev[i]=e;S.moist[i]=fbm(n2,x/30+50,y/30,4);
  const lat=Math.abs((y+0.5)/TH-0.5)*2;
  S.baseT[i]=30-44*lat-Math.max(0,e)*35;
 }
}
function classifyAll(){
 const Bm=S.biome;
 for(let i=0;i<TW*TH;i++){
  const e=S.elev[i]-S.seaLevel,T=S.baseT[i]+S.climOff,m=S.moist[i];let b;
  if(e<0){ if(T<-11) b=SNOW; else b=e<-0.1?DEEP:SHALLOW; }
  else if(T<-6)b=SNOW;else if(e>0.36)b=MOUNT;else if(e<0.025)b=BEACH;else if(T<3)b=TUNDRA;else if(T>17&&m<0.43)b=DESERT;else if(m>0.53)b=FOREST;else b=GRASS;
  Bm[i]=b;
 }
 S.classT=S.climOff;S.classSea=S.seaLevel;S.terrainDirty=true;
}
function computeSeason(){
 const yf=(S.day%YEAR_DAYS)/YEAR_DAYS;S.yf=yf;
 const s=Math.sin(2*Math.PI*(yf-0.125));
 for(let y=0;y<TH;y++){const amp=(y+0.5)/TH*2-1;S.rowSeason[y]=-amp*11*s;}
 S.seasonName=['весна','лето','осень','зима'][Math.floor(yf*4)];
}
function computeLight(){const ph=(S.tick%DAY)/DAY;S.light=clamp(0.5+0.65*Math.sin(2*Math.PI*(ph-0.25)),0,1);}

function passable(c,ti){
 const b=S.biome[ti];
 if(c.flyE>0.3)return true;
 if(b===DEEP)return c.swimE>0.45;
 if(b===SHALLOW)return true;
 return c.swimE<0.9;
}
function pheno(c){
 const g=c.g,m=c.m;
 c.size=0.6+g[0]*1.8;c.B=c.size*c.size;c.r=1.5+c.size*1.6;
 c.armorE=g[3]*((m&MB.shell)?1:0.35);
 c.atk=(0.1+g[4])*((m&MB.horns)?1.35:1);
 c.venomE=(m&MB.venom)?g[5]:0;
 c.camoE=g[6]*((m&MB.chroma)?1:0.35);
 c.diet=g[8];c.social=g[9];
 c.intelE=g[10]*((m&MB.brain)?1:0.4);
 c.swimE=(m&MB.fins)?0.35+0.65*g[13]:0.3*g[13];
 c.flyE=(m&MB.wings)?g[14]*clamp(2.3-c.size,0,1):0;
 c.digE=(m&MB.claws)?g[15]:0;
 c.nightE=(m&MB.eyes)?g[22]:0;
 c.rotE=g[20]*((m&MB.stomach)?1:0.3);
 c.aggr=g[18];c.fear=g[19];
 const tOpt=-8+g[11]*42,tTol=3+g[12]*14;
 c.tLo=tOpt-tTol-((m&MB.fur)?10:0);c.tHi=tOpt+tTol+((m&MB.scales)?9:0);
 c.sense=20+g[2]*80;
 c.maxSpd=(0.35+0.95*g[1])*(1.25-0.2*c.size)*(1-0.35*c.armorE)*(c.flyE>0.3?1.25:1);
 c.maxE=50*c.B;c.maxHp=10*c.B*(1+c.armorE*1.5);
 c.power=c.atk*c.size;c.def=c.armorE*c.size*1.2+0.05;
 c.life=DAY*(6+g[16]*30);c.mature=DAY*1.2;
 c.plantEff=clamp((1-c.diet)*1.4,0,1);c.meatEff=clamp(c.diet*1.45-0.08,0,1);
 c.packMax=1+Math.floor(c.social*16);
 let mc=0;for(let i=0;i<MODS.length;i++)if(m&(1<<i))mc+=MODS[i].cost;
 c.meta=0.0065*Math.pow(c.B,0.8)*(1+0.5*g[2]+1.5*c.intelE+0.5*c.armorE+0.3*g[4]+0.3*c.venomE+0.2*c.camoE+0.25*g[16]+0.15*g[1]+mc+0.6*c.flyE);
 c.litter=1+Math.floor(g[7]*3.99);
}
function newCreature(g,w,m,sp,x,y){
 const c={id:S.nextId++,x,y,vx:0,vy:0,g,w,m,sp,age:0,gen:0,kills:0,cool:0,hidden:0,hideCool:0,poison:0,sick:0,imm:false,dead:false,
  target:null,mate:null,threat:null,dx:0,dy:0,spdF:0.3,wa:R()*6.283,packB:1,kinN:0,stress:0,state:'',ti:0,nnAgg:0,cause:''};
 pheno(c);c.energy=c.maxE*0.6;c.hp=c.maxHp;c.ti=tileIdx(x,y);c.age=(R()*c.mature)|0;return c;
}
function baseBrain(){
 const w=new Float32Array(NW);
 for(let i=0;i<NW;i++)w[i]=gauss()*0.15;
 for(let j=0;j<6;j++)w[j*NI+3+j]+=1.5;
 const o=NI*NH;
 w[o+0]+=0.8;w[o+2]-=1.2;w[o+4]+=1.0;
 w[o+NH+1]+=0.8;w[o+NH+3]-=1.2;w[o+NH+5]+=1.0;
 return w;
}
function speciesGenome(diet,T){
 const g=new Float32Array(NG);
 g[G.size]=0.15+R()*0.2;g[G.speed]=diet>0.5?0.5+R()*0.15:0.3+R()*0.2;g[G.sense]=diet>0.5?0.5+R()*0.15:0.25+R()*0.15;g[G.armor]=0.1+R()*0.2;
 g[G.attack]=diet>0.5?0.4+R()*0.15:0.1+R()*0.2;g[G.venom]=0.3+R()*0.3;g[G.camo]=0.2+R()*0.3;g[G.fert]=0.35+R()*0.3;
 g[G.diet]=diet;g[G.social]=0.03+R()*0.1;g[G.intel]=0.15+R()*0.15;g[G.topt]=clamp((T+8)/42,0,1);g[G.ttol]=0.4+R()*0.2;
 g[G.swim]=0.2+R()*0.2;g[G.fly]=0.2+R()*0.3;g[G.dig]=0.2+R()*0.3;g[G.life]=0.3+R()*0.2;g[G.hue]=R();g[G.aggr]=0.3+R()*0.2;
 g[G.fear]=0.4+R()*0.2;g[G.rot]=0.2+R()*0.3;g[G.mut]=0.3+R()*0.2;g[G.night]=0.2+R()*0.3;
 return g;
}
const ROOTS=['зав','лип','рон','тек','вар','мир','дрок','сал','гун','бер','ксил','тор','фан','лум','ска','вен','ор','кри','зен','мол','дар','пет','гал','рух','нок','бри','шен','квар'];
function makeName(c){
 const g=c.g,m=c.m,pre=[];
 if(m&MB.wings)pre.push('Птеро');if((m&MB.fins)&&c.swimE>0.6)pre.push('Ихтио');if(m&MB.shell)pre.push('Панцеро');if(m&MB.venom)pre.push('Токси');
 if(m&MB.horns)pre.push('Кера');if(m&MB.fur)pre.push('Мохно');if(m&MB.brain)pre.push('Мудро');if(m&MB.claws)pre.push('Норо');
 if(g[G.size]>0.7)pre.push('Мега');if(g[G.size]<0.1)pre.push('Микро');if(g[G.speed]>0.75)pre.push('Тахи');if(g[G.social]>0.6)pre.push('Стае');
 const suf=c.diet<0.3?['ник','ица','ус','ель','ка']:c.diet<0.6?['ид','он','аль','ит']:['дон','завр','кс','рог'];
 let n=(pre.length&&R()<0.8?pick(pre):'')+pick(ROOTS)+(R()<0.5?pick(ROOTS):'')+pick(suf);
 return n.charAt(0).toUpperCase()+n.slice(1);
}
const DESC={size:['крупнее','мельче'],speed:['быстрее','медленнее'],sense:['зорче','подслеповатее'],armor:['бронированнее','мягкотелее'],attack:['зубастее','безобиднее'],venom:['ядовитее','менее ядовит'],camo:['незаметнее','заметнее'],fert:['плодовитее','реже размножается'],diet:['хищнее','травояднее'],social:['стайнее','одиночнее'],intel:['умнее','проще умом'],topt:['теплолюбивее','холодолюбивее'],ttol:['выносливее к климату','капризнее к климату'],swim:['лучше плавает','хуже плавает'],fly:['лучше летает','хуже летает'],dig:['лучше роет','хуже роет'],life:['живёт дольше','живёт меньше'],aggr:['агрессивнее','миролюбивее'],fear:['осторожнее','смелее'],rot:['ест падаль охотнее','брезгливее'],night:['лучше видит ночью','хуже видит ночью']};
function describeDiff(g,m,ref,refM){
 const d=[];for(const i of SPEC_GENES)d.push([i,g[i]-ref[i]]);
 d.sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
 const out=[];
 for(let k=0;k<2;k++){const [i,v]=d[k];if(Math.abs(v)<0.05)break;out.push(DESC[GN[i]][v>0?0:1]);}
 for(let i=0;i<MODS.length;i++){const b=1<<i;if((m&b)&&!(refM&b))out.push('+ '+MODS[i].ru.toLowerCase());else if(!(m&b)&&(refM&b))out.push('утратил: '+MODS[i].ru.toLowerCase());}
 return out.join(', ');
}
function newSpecies(founder,parent){
 const id=S.species.length;
 if(parent){founder.g[G.hue]=(founder.g[G.hue]+(R()<0.5?-1:1)*(0.07+R()*0.12)+1)%1;}
 const sp={id,parent:parent?parent.id:-1,born:S.day,died:-1,player:parent?parent.player:false,ref:Float32Array.from(founder.g),refM:founder.m,
  count:0,peak:0,hist:[],hue:founder.g[G.hue]*360,name:makeName(founder),announced:false,root:parent?parent.root:id,
  desc:parent?describeDiff(founder.g,founder.m,parent.ref,parent.refM):'',diet:founder.g[G.diet],_mc:null};
 sp.col='hsl('+sp.hue.toFixed(0)+',70%,'+(sp.player?'60%':'52%')+')';
 S.species.push(sp);founder.sp=id;return sp;
}
function geneDist(g,ref){let s=0;for(const i of SPEC_GENES){const d=g[i]-ref[i];s+=d*d;}return Math.sqrt(s);}
function popcount(x){let n=0;while(x){x&=x-1;n++;}return n;}

function mutate(g,w,m){
 const sig=0.008+g[G.mut]*0.05;
 for(let i=0;i<NG;i++)if(R()<0.35)g[i]+=gauss()*sig;
 g[G.hue]=g[G.hue]-Math.floor(g[G.hue]);
 for(let i=0;i<NG;i++)if(i!==G.hue)g[i]=clamp(g[i],0,1);
 for(let i=0;i<NW;i++)if(R()<0.08)w[i]+=gauss()*sig*4;
 let macro=null;
 if(R()<0.004*(0.5+g[G.mut])){
  const r=R();
  if(r<0.6){const k=(R()*MODS.length)|0;if(!(m&(1<<k))){m|=1<<k;macro={t:'gain',k};}}
  else if(r<0.8){const own=[];for(let k=0;k<MODS.length;k++)if(m&(1<<k))own.push(k);if(own.length){const k=pick(own);m&=~(1<<k);macro={t:'lose',k};}}
  else{let i=(R()*NG)|0;if(i===G.hue)i=G.size;const dl=(R()<0.5?-1:1)*(0.2+R()*0.2);g[i]=clamp(g[i]+dl,0,1);macro={t:'gene',i,up:dl>0};}
 }
 return [m,macro];
}
function makeChild(a,b){
 let g,w,m;
 if(b){
  g=new Float32Array(NG);w=new Float32Array(NW);
  for(let i=0;i<NG;i++){const r=R();g[i]=r<0.35?a.g[i]:r<0.7?b.g[i]:(a.g[i]+b.g[i])*0.5;}
  if(Math.abs(a.g[G.hue]-b.g[G.hue])>0.5)g[G.hue]=a.g[G.hue];
  for(let i=0;i<NW;i++){const r=R();w[i]=r<0.4?a.w[i]:r<0.8?b.w[i]:(a.w[i]+b.w[i])*0.5;}
  m=(a.m&b.m)|((a.m^b.m)&(R()<0.5?a.m:b.m));
 }else{g=Float32Array.from(a.g);w=Float32Array.from(a.w);m=a.m;}
 const res=mutate(g,w,m);m=res[0];
 const x=clamp(a.x+(R()-0.5)*6,2,WW-2),y=clamp(a.y+(R()-0.5)*6,2,WH-2);
 const c=newCreature(g,w,m,a.sp,x,y);c.age=0;c.gen=a.gen+1;
 if(!passable(c,c.ti)){c.x=a.x;c.y=a.y;c.ti=a.ti;}
 const sp=S.species[a.sp];
 const d=geneDist(g,sp.ref)+popcount(m^sp.refM)*0.15;
 if(d>SPEC_T)newSpecies(c,sp);
 else{const ref=sp.ref;for(let i=0;i<NG;i++)ref[i]+=(g[i]-ref[i])*0.02;}
 if(res[1]){
  c.macro=res[1];S.macros++;
  const csp=S.species[c.sp];
  if(csp.player&&res[1].t==='gain'&&S.day-S.lastMacroLog>=3){S.lastMacroLog=S.day;log('Мутация в твоей линии: у особи вида «'+csp.name+'» появились '+MODS[res[1].k].ru.toLowerCase()+'. Если признак полезен, он распространится.','mut');}
 }
 return c;
}
function reproduce(c){
 let mate=c.mate;if(mate&&(mate.dead||mate.sp!==c.sp))mate=null;
 const n=c.litter;let share=c.energy*0.6;c.energy-=share;
 if(mate){const ms=mate.energy*0.15;mate.energy-=ms;share+=ms;mate.cool=Math.max(mate.cool,(DAY*0.3)|0);}
 c.cool=(DAY*(0.6+(1-c.g[G.fert])*1.2))|0;
 for(let k=0;k<n;k++){const ch=makeChild(c,mate);ch.energy=Math.min(ch.maxE*0.8,share/n*0.9);if(ch.energy<1)continue;S.born.push(ch);S.births++;}
}
function addMeat(ti,amt){const m=S.meat[ti];S.rot[ti]=m+amt>0?S.rot[ti]*m/(m+amt):0;S.meat[ti]=m+amt;}
function die(c,cause){
 if(c.dead)return;c.dead=true;c.cause=cause;
 addMeat(c.ti,c.B*2.2*(0.4+Math.max(0,c.energy)/c.maxE));
 S.deathCause[cause]=(S.deathCause[cause]||0)+1;
}
function foodVal(c,ti){
 const b=S.biome[ti];let v=0;
 if(c.plantEff>0.05&&(b>SHALLOW||c.swimE>0.4))v+=S.plant[ti]*c.plantEff;
 if(c.meatEff>0.05)v+=S.meat[ti]*c.meatEff*2.5;
 return v;
}
function think(c){
 const L=S.light,lf=0.4+0.6*L,vis=lf+(1-lf)*c.nightE;
 const sense=c.sense*vis,s2=sense*sense;
 const cx=(c.x/CELL)|0,cy=(c.y/CELL)|0,rad=Math.min(3,Math.ceil(sense/CELL));let visits=0;
 let threat=null,td2=1e12,prey=null,pd2=1e12,kinN=0,kx=0,ky=0,mate=null,checks=0;
 const myPow=c.power*c.packB,hunger=1-c.energy/c.maxE;
 const wantMeat=c.diet>0.35&&hunger>0.32;
 const x0=Math.max(0,cx-rad),x1=Math.min(GW-1,cx+rad),y0=Math.max(0,cy-rad),y1=Math.min(GH-1,cy+rad);
 const Bm=S.biome;
 outer:for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){
  for(let j=head[gy*GW+gx];j!==-1;j=nxt[j]){
   if(++visits>140)break outer;const o=cs[j];if(o===c||o.dead||o.hidden>0)continue;
   const dx=o.x-c.x,dy=o.y-c.y,d2=dx*dx+dy*dy;if(d2>s2)continue;
   const cam=1-o.camoE*COVER[Bm[o.ti]]*0.75;if(d2>s2*cam*cam)continue;
   if(++checks>70)break outer;
   const same=o.sp===c.sp;
   if(same){
    if(c.sick>0&&!o.imm&&o.sick<=0&&d2<100&&R()<0.04)o.sick=DAY*2;
    if(!mate&&d2<900&&o.age>o.mature&&o.energy>o.maxE*0.5&&o.cool<=0)mate=o;
    if(c.social>0.2){kinN++;kx+=dx;ky+=dy;continue;}
   }
   const oPow=o.power*o.packB;
   if((o.diet>0.35||o.aggr>0.62)&&!(same&&o.social>0.2)){
    const danger=oPow-(myPow*(1.3-c.fear)+c.def*0.8);
    if(danger>0&&d2<td2){td2=d2;threat=o;}
   }
   const war=(!same&&c.aggr>0.62&&hunger<0.7)||(same&&c.social<0.2&&c.aggr>0.45&&hunger>0.45&&d2<400),cannibal=same&&hunger>0.65&&c.diet>0.3;
   if((wantMeat&&(!same||cannibal))||war){
    const str=myPow*(1.1-0.3*c.fear)-(o.def*0.7+oPow*0.6);
    if(str>0&&d2<pd2){pd2=d2;prey=o;}
   }
  }
 }
 c.kinN=kinN;c.packB=1+Math.min(kinN,c.packMax)*0.22*c.social*((c.m&MB.voice)?1.7:1);
 c.mate=mate;c.target=prey;c.threat=threat;
 const sd=clamp(c.sense*0.4,14,40),here=foodVal(c,c.ti);
 let fx=0,fy=0;
 for(let k=0;k<8;k++){
  const tx=c.x+DX[k]*sd,ty=c.y+DY[k]*sd;let v;
  if(tx<0||ty<0||tx>=WW||ty>=WH)v=-3;else{const ti=tileIdx(tx,ty);v=passable(c,ti)?foodVal(c,ti)-here*0.5:-3;}
  fx+=DX[k]*v;fy+=DY[k]*v;
 }
 const T=tempAt(c.x,c.y);
 c.stress=T<c.tLo?c.tLo-T:T>c.tHi?T-c.tHi:0;
 let tdir=0;
 if(c.stress>0){const mid=(c.tLo+c.tHi)*0.5;const tu=tempAt(c.x,Math.max(0,c.y-50)),tdn=tempAt(c.x,Math.min(WH-1,c.y+50));tdir=Math.abs(tu-mid)<Math.abs(tdn-mid)?-1:1;}
 let ax=0,ay=0,spd=0.35+hunger*0.5,state=hunger>0.45?'ищет еду':'пасётся';
 c.wa+=(R()-0.5)*0.6;ax+=Math.cos(c.wa)*0.4;ay+=Math.sin(c.wa)*0.4;
 const fl=Math.hypot(fx,fy);
 if(fl>0.001){const w=0.4+hunger*2.2;ax+=fx/fl*w;ay+=fy/fl*w;}
 let kl=0;
 if(kinN>0){kl=Math.hypot(kx,ky)+0.001;const w=c.social*1.6*(kl/kinN>12?1:-0.4);ax+=kx/kl*w;ay+=ky/kl*w;if(kinN>=2)state='в стае ('+(kinN+1)+')';}
 if(c.stress>0){ay+=tdir*Math.min(3,c.stress*0.25);state=T<c.tLo?'мёрзнет, ищет тепло':'перегрев, ищет прохладу';}
 if(mate&&c.energy>0.65*c.maxE&&c.age>c.mature&&c.cool<=0){const md=Math.sqrt((mate.x-c.x)**2+(mate.y-c.y)**2)+0.001;ax+=(mate.x-c.x)/md*1.2;ay+=(mate.y-c.y)/md*1.2;state='ищет пару';}
 let pdx=0,pdy=0,tdx=0,tdy=0;
 if(prey){const pd=Math.sqrt(pd2)+0.001;pdx=(prey.x-c.x)/pd;pdy=(prey.y-c.y)/pd;const w=1.5+hunger*2+c.aggr;ax+=pdx*w;ay+=pdy*w;spd=c.diet>0.4?1.18:1;state=(prey.sp===c.sp)?'каннибализм':wantMeat?'охотится':'воюет';}
 if(threat){const td=Math.sqrt(td2)+0.001;tdx=(threat.x-c.x)/td;tdy=(threat.y-c.y)/td;const w=1.5+c.fear*3;ax-=tdx*w;ay-=tdy*w;spd=1;state='убегает';
  const b=Bm[c.ti];
  if(c.digE>0.35&&c.hideCool<=0&&b>SHALLOW&&b!==MOUNT&&b!==SNOW){c.hidden=(60+c.digE*140)|0;c.hideCool=(DAY*0.6)|0;state='прячется в норе';}
 }
 if(c.intelE>0.02){
  IN[0]=1;IN[1]=c.energy/c.maxE;IN[2]=c.hp/c.maxHp;IN[3]=fl>0.001?fx/fl:0;IN[4]=fl>0.001?fy/fl:0;
  IN[5]=tdx;IN[6]=tdy;IN[7]=pdx;IN[8]=pdy;IN[9]=kinN?kx/kl:0;IN[10]=kinN?ky/kl:0;IN[11]=tdir;
  const w=c.w;
  for(let j=0;j<NH;j++){let s=0;const o=j*NI;for(let i=0;i<NI;i++)s+=IN[i]*w[o+i];HID[j]=s/(1+Math.abs(s));}
  const ob=NI*NH;let o0=0,o1=0,o2=0;
  for(let j=0;j<NH;j++){o0+=HID[j]*w[ob+j];o1+=HID[j]*w[ob+NH+j];o2+=HID[j]*w[ob+2*NH+j];}
  o0=o0/(1+Math.abs(o0));o1=o1/(1+Math.abs(o1));o2=o2/(1+Math.abs(o2));
  const k=c.intelE*3;ax+=o0*k;ay+=o1*k;c.nnAgg=o2*c.intelE;
 }
 const al=Math.hypot(ax,ay);if(al>0.001){c.dx=ax/al;c.dy=ay/al;}
 c.spdF=Math.min(1.3,spd);c.state=state;
}
function move(c){
 let ms=c.maxSpd*c.spdF;const b=S.biome[c.ti];
 if(c.flyE<=0.3){
  if(b<=SHALLOW)ms*=0.3+0.7*c.swimE;
  else{if(c.swimE>0.6)ms*=1.6-c.swimE;if(b===MOUNT)ms*=c.digE>0.5?0.8:0.55;else if(b===SNOW)ms*=0.7;else if(b===FOREST)ms*=0.88;}
 }
 if(c.sick>0)ms*=0.6;if(c.hp<c.maxHp*0.3)ms*=0.7;
 c.vx+=(c.dx*ms-c.vx)*0.25;c.vy+=(c.dy*ms-c.vy)*0.25;
 let nx=c.x+c.vx,ny=c.y+c.vy;
 if(nx<2||nx>WW-2){c.vx=-c.vx;nx=c.x;c.wa=Math.PI-c.wa;}
 if(ny<2||ny>WH-2){c.vy=-c.vy;ny=c.y;c.wa=-c.wa;}
 const nti=tileIdx(nx,ny);
 if(nti!==c.ti&&!passable(c,nti)){c.vx*=-0.3;c.vy*=-0.3;c.wa+=2+R();return;}
 c.x=nx;c.y=ny;c.ti=nti;
 c.energy-=0.006*c.B*(c.vx*c.vx+c.vy*c.vy)*(c.flyE>0.3?1.6:1)*(c.spdF>1?2:1);
}
function eat(c){
 if(c.energy>=c.maxE*0.98)return;
 const ti=c.ti,b=S.biome[ti];
 if(c.plantEff>0.05&&(b>SHALLOW||c.swimE>0.4)){const p=S.plant[ti];if(p>0.02){const bite=Math.min(p,0.035*Math.pow(c.B,0.75));S.plant[ti]=p-bite;c.energy+=bite*c.plantEff*10;}}
 if(c.meatEff>0.05){const mt=S.meat[ti];if(mt>0.01){const bite=Math.min(mt,0.08*Math.pow(c.B,0.75));S.meat[ti]=mt-bite;const bad=Math.max(0,S.rot[ti]-0.4)*(1-c.rotE);c.energy+=bite*c.meatEff*16*(1-bad);c.poison+=bite*bad*0.6;}}
 if(c.energy>c.maxE)c.energy=c.maxE;
}
function combat(c){
 const t=c.target;if(!t||t.dead||t.hidden>0)return;
 const dx=t.x-c.x,dy=t.y-c.y,reach=c.r+t.r+1.5;
 if(dx*dx+dy*dy>reach*reach)return;
 c.state=t.sp===c.sp?'каннибализм':'сражается';
 t.hp-=c.power*c.packB*0.22/(1+t.def*t.packB*1.6);c.energy-=0.01*c.B;
 if(c.venomE>0)t.poison+=c.venomE*0.04;
 if(t.power>0.15&&t.fear<0.7)c.hp-=t.power*t.packB*0.12/(1+c.def*1.6);
 if(t.hp<=0){die(t,'убит');c.kills++;c.target=null;if(t.sp!==c.sp){const k=c.sp+':'+t.sp;S.killPairs[k]=(S.killPairs[k]||0)+1;}}
 if(c.hp<=0)die(c,'погиб в бою');
}
function update(c){
 c.age++;if(c.cool>0)c.cool--;if(c.hideCool>0)c.hideCool--;
 if(c.hidden>0){c.hidden--;c.energy-=c.meta*0.5;c.state='прячется в норе';if(c.energy<=0)die(c,'голод');return;}
 if((c.id+S.tick)%3===0)think(c);
 move(c);eat(c);combat(c);if(c.dead)return;
 c.energy-=c.meta;
 if(c.stress>0){c.hp-=c.stress*0.004;c.energy-=c.stress*0.001*c.B;}
 if(c.poison>0){c.hp-=c.poison*0.05;c.poison*=0.985;if(c.poison<0.001)c.poison=0;}
 if(c.sick>0){c.sick--;c.hp-=0.012*c.B;if(c.sick===0)c.imm=true;}
 const b=S.biome[c.ti];
 if(c.flyE<=0.3){if(b===DEEP&&c.swimE<0.45)c.hp-=0.06*c.B;else if(b>SHALLOW&&c.swimE>=0.9)c.hp-=0.03*c.B;}
 if(c.energy>c.maxE*0.35&&c.hp<c.maxHp)c.hp=Math.min(c.maxHp,c.hp+0.006*c.B);
 if(c.hp<=0){die(c,c.sick>0?'болезнь':c.poison>0.05?'яд':c.stress>0?'климат':'раны');return;}
 if(c.energy<=0){die(c,'голод');return;}
 if(c.age>c.life&&R()<0.01){die(c,'старость');return;}
 if(c.age>c.mature&&c.cool<=0&&c.energy>0.72*c.maxE&&cs.length+S.born.length<S.cap)reproduce(c);
}
function updatePlants(){
 const P=S.plant,M=S.meat,Rt=S.rot,Bm=S.biome,bt=S.baseT,off=S.climOff-S.dust,gm=S.growMul/(1+S.dust*0.15);
 for(let y=0;y<TH;y++){const rs=S.rowSeason[y]+off;
  for(let x=0;x<TW;x++){const i=y*TW+x;const cap=PLANT_CAP[Bm[i]];let f=(bt[i]+rs-18)/24;f=1-f*f;if(f<0)f=0;
   let p=P[i];if(p<cap)p+=0.009*f*gm*(p+0.25)*(1-p/cap);else p-=(p-cap)*0.02;P[i]=p;
   const m=M[i];if(m>0){const nm=m*0.995;Rt[i]+=0.004;if(nm<0.01||Rt[i]>=1){M[i]=0;Rt[i]=0;}else M[i]=nm;}
  }}
}
function buildGrid(){
 head.fill(-1);if(nxt.length<cs.length)nxt=new Int32Array(cs.length*2);
 for(let i=0;i<cs.length;i++){const c=cs[i];let gx=(c.x/CELL)|0,gy=(c.y/CELL)|0;if(gx>=GW)gx=GW-1;if(gy>=GH)gy=GH-1;const k=gy*GW+gx;nxt[i]=head[k];head[k]=i;}
}
function countSpecies(){
 for(const sp of S.species)sp.count=0;
 let pc=0;
 for(const c of cs){const sp=S.species[c.sp];sp.count++;if(sp.player)pc++;}
 S.playerCount=pc;S.alive=cs.length;
 for(const sp of S.species){if(sp.count>sp.peak)sp.peak=sp.count;
  if(!sp.announced&&sp.count>=10){sp.announced=true;if(sp.parent>=0){const p=S.species[sp.parent];
   log((sp.player?'Твоя линия: ':'')+'появился новый вид «'+sp.name+'» (от «'+p.name+'»)'+(sp.desc?': '+sp.desc:''),sp.player?'mine':'spec');if(sp.player)S.ep+=3;}}}
}
function log(text,type){S.log.push({d:S.day,text,type:type||'info'});if(S.log.length>300)S.log.splice(0,S.log.length-300);if(S.onLog)S.onLog(text,type);}
function landPoint(tries){for(let k=0;k<(tries||200);k++){const x=2+R()*(WW-4),y=2+R()*(WH-4);const b=S.biome[tileIdx(x,y)];if(b>SHALLOW&&b!==SNOW&&b!==MOUNT)return[x,y];}return[WW/2,WH/2];}
function meteor(){
 const[x,y]=landPoint();const r=(6+R()*9)*TILE;let killed=0;
 for(const c of cs){if(c.dead)continue;const d2=(c.x-x)**2+(c.y-y)**2;if(d2<r*r){if((c.digE>0.4||c.hidden>0)&&R()<0.65)continue;if(c.flyE>0.5&&R()<0.3)continue;die(c,'метеорит');killed++;}}
 const tr=r/TILE,tx=x/TILE,ty=y/TILE;
 for(let yy=Math.max(0,Math.floor(ty-tr*1.6));yy<=Math.min(TH-1,Math.ceil(ty+tr*1.6));yy++)for(let xx=Math.max(0,Math.floor(tx-tr*1.6));xx<=Math.min(TW-1,Math.ceil(tx+tr*1.6));xx++){
  const d=Math.hypot(xx-tx,yy-ty);const i=yy*TW+xx;if(d<tr*1.6)S.plant[i]=0;if(d<tr*0.35)S.elev[i]=Math.min(S.elev[i],S.seaLevel-0.05);}
 S.dust+=5;classifyAll();S.fx.push({t:'meteor',x,y,r,age:0});
 log('Падение метеорита! Погибло особей: '+killed+'. Пыль в небе охлаждает планету.','cat');
}
function plague(){
 let best=null;for(const sp of S.species)if(sp.count>=40&&(!best||sp.count>best.count))best=sp;
 if(!best)return;let n=0;for(const c of cs)if(c.sp===best.id&&!c.imm&&R()<0.08){c.sick=DAY*2;n++;}
 log('Эпидемия поразила вид «'+best.name+'» (заражено '+n+'). Болезнь передаётся сородичам при контакте.','cat');
}
function changeEpoch(){
 const E=[{k:'normal',name:'Умеренная эпоха',t:0,sea:0},{k:'warm',name:'Тёплая эпоха',t:5,sea:0.05},{k:'ice',name:'Ледниковый период',t:-9,sea:-0.07},{k:'hot',name:'Великое потепление',t:9,sea:0.09}];
 let e;do{e=R()<0.12?E[3]:pick(E.slice(0,3));}while(e.k===S.epoch.k);
 S.epoch=e;
 const txt={normal:'Климат возвращается к умеренному.',warm:'Теплеет, море наступает на сушу.',ice:'Наступает ледниковый период: море отступает, открываются сухопутные мосты между островами, моря у полюсов замерзают.',hot:'Великое потепление! Тропики раскаляются, острова уходят под воду.'};
 log('Новая эпоха: '+e.name+'. '+txt[e.k],'epoch');
}
function daily(){
 S.day++;computeSeason();
 for(const sp of S.species)sp._mc=null;
 for(const c of cs){const sp=S.species[c.sp];if(!sp._mc)sp._mc=new Int32Array(MODS.length);if(c.m)for(let k=0;k<MODS.length;k++)if(c.m&(1<<k))sp._mc[k]++;}
 for(const sp of S.species){
  if(sp.count>0){let rm=0;for(let k=0;k<MODS.length;k++)if(sp._mc&&sp._mc[k]*2>sp.count)rm|=1<<k;sp.refM=rm;
   sp.hist.push([S.day,sp.count]);if(sp.hist.length>500)sp.hist=sp.hist.filter((_,i)=>i%2===0);}
  else if(sp.died<0){sp.died=S.day;if(sp.peak>=10){sp.hist.push([S.day,0]);log((sp.player?'Твоя линия: ':'')+'вымер вид «'+sp.name+'» (максимум был '+sp.peak+' особей)',sp.player?'mineBad':'ext');}}
 }
 S.histTotal.push([S.day,cs.length]);S.histPlayer.push([S.day,S.playerCount]);
 if(S.histTotal.length>500){S.histTotal=S.histTotal.filter((_,i)=>i%2===0);S.histPlayer=S.histPlayer.filter((_,i)=>i%2===0);}
 S.ep+=Math.sqrt(S.playerCount)*0.25;
 let wars=0;
 const pairs=Object.entries(S.killPairs).sort((a,b)=>b[1]-a[1]);
 for(const[k,v]of pairs){if(v<15||wars>=2)break;const[a,b]=k.split(':').map(Number);const A=S.species[a],B=S.species[b];if(!A.announced||!B.announced)continue;
  const mine=A.player||B.player;if((S.warLog[k]||-99)>S.day-(mine?4:12))continue;S.warLog[k]=S.day;
  if(A.diet<0.35){log('Война видов: «'+A.name+'» за день уничтожили '+v+' особей «'+B.name+'»',(A.player||B.player)?'war':'warAI');wars++;}
  else if(v>=30){log('Бойня: хищники «'+A.name+'» за день добыли '+v+' особей «'+B.name+'»',(A.player||B.player)?'war':'warAI');wars++;}}
 S.killPairs={};
 if(S.growUntil&&S.day>=S.growUntil){S.growMul=1;S.growUntil=0;}
 if(S.day>=S.nextEvent){S.nextEvent=S.day+14+R()*26;const r=R();
  if(r<0.28)meteor();else if(r<0.52)plague();
  else if(r<0.76){S.growMul=0.35;S.growUntil=S.day+SEASON_DAYS;log('Засуха: растения почти перестали расти на '+SEASON_DAYS+' дней.','cat');}
  else{S.growMul=1.7;S.growUntil=S.day+SEASON_DAYS;log('Благодатный сезон: растения растут втрое быстрее обычного.','good');}}
 if(S.day>=S.nextEpoch){changeEpoch();S.nextEpoch=S.day+YEAR_DAYS*(3+R()*4);}
 S.climOff+=clamp(S.epoch.t-S.climOff,-0.12,0.12);
 S.seaLevel+=clamp(S.epoch.sea-S.seaLevel,-0.001,0.001);
 S.dust*=0.95;if(S.dust<0.05)S.dust=0;
 if(Math.abs(S.climOff-S.classT)>0.6||Math.abs(S.seaLevel-S.classSea)>0.005)classifyAll();
 if(!S.lost&&S.playerCount===0){S.lost=true;log('Твоя эволюционная линия полностью вымерла на '+(S.day/YEAR_DAYS+1|0)+'-й год.','mineBad');}
 const share=cs.length?S.playerCount/cs.length:0;
 if(share>0.5)S.domDays++;else S.domDays=0;
 if(!S.won&&S.domDays>=YEAR_DAYS){S.won=true;log('Твоя линия доминирует на планете целый год! Победа. Можно продолжать эволюцию.','win');}
}
function step(){
 S.tick++;computeLight();
 if(S.tick%DAY===0)daily();
 if(S.tick%4===0)updatePlants();
 S.born.length=0;
 const n=cs.length;
 for(let i=0;i<n;i++){const c=cs[i];if(!c.dead)update(c);}
 let j=0;for(let i=0;i<n;i++){const c=cs[i];if(!c.dead)cs[j++]=c;}cs.length=j;
 for(const b of S.born)if(cs.length<S.cap)cs.push(b);
 buildGrid();
 if(S.tick%10===0)countSpecies();
 for(const f of S.fx)f.age++;S.fx=S.fx.filter(f=>f.age<180);
}
function spawnSpecies(diet,player,n){
 const[x,y]=landPoint();const T=tempAt(x,y)+0;
 const g0=speciesGenome(diet,T);const w0=baseBrain();
 const founder=newCreature(g0,w0,0,0,x,y);
 const sp=newSpecies(founder,null);sp.player=player;sp.col='hsl('+sp.hue.toFixed(0)+',70%,'+(player?'60%':'52%')+')';
 sp.announced=true;
 let placed=0,tries=0;
 while(placed<n&&tries<n*30){tries++;
  const px=clamp(x+gauss()*90,3,WW-3),py=clamp(y+gauss()*90,3,WH-3);
  const g=Float32Array.from(g0);for(let i=0;i<NG;i++)if(i!==G.hue)g[i]=clamp(g[i]+gauss()*0.03,0,1);
  const w=Float32Array.from(w0);for(let i=0;i<NW;i++)w[i]+=gauss()*0.05;
  const c=newCreature(g,w,0,sp.id,px,py);if(!passable(c,c.ti))continue;cs.push(c);placed++;}
 return sp;
}
function newGame(o){
 o=o||{};
 S.seed=(o.seed!=null?o.seed:(R()*1e9))|0;S.cap=o.cap||5300;S.tick=0;S.day=0;S.nextId=1;
 S.seaLevel=0;S.climOff=0;S.dust=0;S.light=1;S.growMul=1;S.growUntil=0;
 S.epoch={k:'normal',name:'Умеренная эпоха',t:0,sea:0};S.nextEpoch=YEAR_DAYS*(3+R()*3);S.nextEvent=16+R()*20;
 S.species=[];S.log=[];S.histTotal=[];S.histPlayer=[];S.ep=15;S.lost=false;S.won=false;S.domDays=0;S.fx=[];S.killPairs={};S.warLog={};
 S.births=0;S.macros=0;S.deathCause={};S.lastMacroLog=-1;S.born=[];S.playerCount=0;S.alive=0;
 S.rowSeason=new Float32Array(TH);S.biome=new Uint8Array(TW*TH);S.plant=new Float32Array(TW*TH);S.meat=new Float32Array(TW*TH);S.rot=new Float32Array(TW*TH);
 genWorld(S.seed);classifyAll();computeSeason();computeLight();
 for(let i=0;i<TW*TH;i++)S.plant[i]=PLANT_CAP[S.biome[i]]*0.6;
 cs=[];
 const nAI=o.ai||7;const pd=o.playerDiet!=null?o.playerDiet:0.15;
 const pool=[0.05,0.1,0.15,0.2,0.5,0.8,0.12,0.55,0.85,0.08,0.25,0.75];
 spawnSpecies(pd,true,170);
 for(let i=0;i<nAI;i++)spawnSpecies(pool[i%pool.length]+(R()-0.5)*0.06,false,pool[i%pool.length]>0.6?120:150);
 buildGrid();countSpecies();
 log('Мир сотворён. На островах живут '+(nAI+1)+' примитивных вида, и все сражаются со всеми. Твой вид: «'+S.species[0].name+'».','epoch');
}
function nudgeGene(spId,gi,dir){
 const cost=5;if(S.ep<cost)return false;let n=0;
 for(const c of cs)if(c.sp===spId){c.g[gi]=gi===G.hue?((c.g[gi]+dir*0.05)+1)%1:clamp(c.g[gi]+dir*0.06,0,1);pheno(c);c.hp=Math.min(c.hp,c.maxHp);c.energy=Math.min(c.energy,c.maxE);n++;}
 if(!n)return false;const sp=S.species[spId];sp.ref[gi]=clamp(sp.ref[gi]+dir*0.06,0,1);S.ep-=cost;return true;
}
function moduleCost(k){return 40;}
function grantModule(spId,k){
 const cost=moduleCost(k);if(S.ep<cost)return false;let n=0;
 for(const c of cs)if(c.sp===spId){c.m|=1<<k;pheno(c);n++;}
 if(!n)return false;S.species[spId].refM|=1<<k;S.ep-=cost;
 log('Ты направил эволюцию: у вида «'+S.species[spId].name+'» появились '+MODS[k].ru.toLowerCase()+'.','mine');return true;
}
function removeModule(spId,k){
 const cost=10;if(S.ep<cost)return false;let n=0;
 for(const c of cs)if(c.sp===spId){c.m&=~(1<<k);pheno(c);c.hp=Math.min(c.hp,c.maxHp);n++;}
 if(!n)return false;S.species[spId].refM&=~(1<<k);S.ep-=cost;return true;
}
function speciesStats(spId){
 const avg=new Float32Array(NG),mc=new Int32Array(MODS.length);let n=0,gen=0,kills=0;
 for(const c of cs)if(c.sp===spId){n++;for(let i=0;i<NG;i++)avg[i]+=c.g[i];for(let k=0;k<MODS.length;k++)if(c.m&(1<<k))mc[k]++;gen+=c.gen;kills+=c.kills;}
 if(n)for(let i=0;i<NG;i++)avg[i]/=n;
 return{n,avg,mc,gen:n?gen/n:0,kills};
}
function toB64(a){const u=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);}
function fromB64(s,T){const b=atob(s);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new T(u.buffer);}
const PF=16;
function serialize(){
 const n=cs.length,F=new Float32Array(n*PF),Gq=new Uint16Array(n*NG),Wq=new Int16Array(n*NW);
 cs.forEach((c,k)=>{F.set([c.x,c.y,c.vx,c.vy,c.energy,c.hp,c.age,c.sp,c.m,c.gen,c.kills,c.cool,c.poison,c.sick,c.imm?1:0,c.hidden],k*PF);
  for(let i=0;i<NG;i++)Gq[k*NG+i]=Math.round(clamp(c.g[i],0,1)*65535);
  for(let i=0;i<NW;i++)Wq[k*NW+i]=Math.round(clamp(c.w[i],-16,16)*2000);});
 const st={};for(const k of['seed','cap','tick','day','nextId','seaLevel','climOff','dust','growMul','growUntil','epoch','nextEpoch','nextEvent','log','histTotal','histPlayer','ep','lost','won','domDays','births','macros','deathCause','lastMacroLog'])st[k]=S[k];
 st.species=S.species.map(sp=>Object.assign({},sp,{ref:Array.from(sp.ref,v=>+v.toFixed(3)),_mc:null,hist:sp.peak>=8?sp.hist:[]}));
 return JSON.stringify({v:2,st,elev:toB64(S.elev),plant:toB64(S.plant),meat:toB64(S.meat),rot:toB64(S.rot),F:toB64(F),G:toB64(Gq),W:toB64(Wq)});
}
function deserialize(str){
 const d=JSON.parse(str);if(d.v!==2)throw new Error('неизвестный формат сохранения');
 Object.assign(S,d.st);S.fx=[];S.killPairs={};S.warLog={};S.born=[];
 S.rowSeason=new Float32Array(TH);S.biome=new Uint8Array(TW*TH);
 genWorld(S.seed);S.elev=fromB64(d.elev,Float32Array);S.plant=fromB64(d.plant,Float32Array);S.meat=fromB64(d.meat,Float32Array);S.rot=fromB64(d.rot,Float32Array);
 S.species=d.st.species.map(sp=>Object.assign(sp,{ref:Float32Array.from(sp.ref)}));
 classifyAll();computeSeason();computeLight();
 const F=fromB64(d.F,Float32Array),Gq=fromB64(d.G,Uint16Array),Wq=fromB64(d.W,Int16Array);const n=F.length/PF;cs=[];
 for(let k=0;k<n;k++){const o=k*PF;
  const g=new Float32Array(NG),w=new Float32Array(NW);for(let i=0;i<NG;i++)g[i]=Gq[k*NG+i]/65535;for(let i=0;i<NW;i++)w[i]=Wq[k*NW+i]/2000;
  const c=newCreature(g,w,F[o+8]|0,F[o+7]|0,F[o],F[o+1]);
  c.vx=F[o+2];c.vy=F[o+3];c.energy=F[o+4];c.hp=F[o+5];c.age=F[o+6];c.gen=F[o+9];c.kills=F[o+10];c.cool=F[o+11];c.poison=F[o+12];c.sick=F[o+13];c.imm=F[o+14]>0;c.hidden=F[o+15];
  cs.push(c);}
 buildGrid();countSpecies();
}
return{S,get cs(){return cs},newGame,step,serialize,deserialize,pheno,tempAt,tileIdx,nudgeGene,grantModule,removeModule,moduleCost,speciesStats,
 GN,G,NG,GENE_RU,MODS,MB,BIOME_NAMES,PLANT_CAP,TILE,TW,TH,WW,WH,DAY,YEAR_DAYS,SEASON_DAYS,DEEP,SHALLOW,SNOW};
})();
if(typeof module!=='undefined')module.exports=EVO;
