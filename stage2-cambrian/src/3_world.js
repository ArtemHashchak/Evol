/* ===== обитатели кембрия ===== */
function mkBody(sym,rs,hue,skel,fn){const b={sym,hue,skel:skel||'none',segs:rs.map(r=>({r,parts:[]}))};if(fn)fn(b.segs);return b;}
function addP(s,t,sz){s.parts.push({t,s:sz||1});}
function scaleBody(b,k){for(const s of b.segs)s.r*=k;}
const SPEC=Object.assign({
 ostracod:{ru:'Остракода',lat:'Ostracoda',beh:'school',zones:{shelf:5,slope:3,deep:2},rel:[0.15,0.45],sc:[0.5,2.2],custom:'ostracod',hueVar:20,valK:1.3,
  info:'Крошечный рачок в двустворчатой раковинке. Плавает стайками — лёгкая добыча.',body:()=>mkBody('bilateral',[0.75,0.6],40,'exo')},
 trilobite:{ru:'Трилобит',lat:'Trilobita',beh:'graze',zones:{shelf:4,slope:5,deep:1.5},rel:[0.3,1.6],sc:[0.4,4],curl:1,hueVar:15,fight:0.3,
  info:'Членистоногое в хитиновом панцире с фасеточными глазами. Пасётся на дне, при опасности сворачивается.',
  body:()=>mkBody('bilateral',[1.6,1.5,1.4,1.3,1.2,1.0,0.8],34,'exo',s=>{addP(s[0],'compound');addP(s[0],'antenna',0.7);for(let i=1;i<6;i++)addP(s[i],'jleg',0.8);})},
 hallucigenia:{ru:'Галлюцигения',lat:'Hallucigenia',beh:'graze',zones:{shelf:2,slope:3,deep:0.5},rel:[0.3,1.1],sc:[0.4,2.5],hueVar:20,
  info:'Странный червячок на ножках с двумя рядами шипов на спине. Безобиден, но кусать больно.',
  body:()=>mkBody('bilateral',[0.75,0.7,0.7,0.7,0.65,0.6,0.5],330,'none',s=>{for(let i=1;i<7;i++){addP(s[i],'leg',0.9);addP(s[i],'spine',1.2);}})},
 polychaete:{ru:'Многощетинковый червь',lat:'Polychaeta',beh:'graze',scav:1,zones:{shelf:2,slope:2,deep:3},rel:[0.3,1.3],sc:[0.5,3],hueVar:25,
  info:'Кольчатый червь с щетинистыми «вёслами» на каждом сегменте. Падальщик.',
  body:()=>mkBody('bilateral',[0.9,0.85,0.85,0.8,0.8,0.75,0.7,0.65,0.6,0.55,0.5],12,'none',s=>{addP(s[0],'eyes');for(let i=1;i<11;i++)addP(s[i],'fin',0.4);})},
 pikaia:{ru:'Пикайя',lat:'Pikaia',beh:'school',zones:{shelf:3,slope:3,deep:1},rel:[0.3,1.2],sc:[0.5,3],hueVar:15,
  info:'Плоский червеобразный зверёк с хордой вдоль спины — один из первых хордовых, дальний предок рыб и человека.',
  body:()=>mkBody('bilateral',[0.8,0.9,0.9,0.85,0.8,0.7,0.6,0.5],205,'notochord',s=>{addP(s[0],'eyes',0.8);addP(s[7],'tailfin',0.8);})},
 opabinia:{ru:'Опабиния',lat:'Opabinia',beh:'hunt',zones:{shelf:2,slope:2,deep:1.5},rel:[0.9,1.6],sc:[0.5,3.5],hueVar:15,fight:1,
  info:'Пятиглазый хищник с длинным хоботком-клешнёй. Охотится на мелочь.',
  body:()=>mkBody('bilateral',[1.3,1.45,1.45,1.4,1.3,1.15,1.0,0.8],12,'none',s=>{addP(s[0],'compound',0.9);addP(s[0],'proboscis');for(let i=1;i<7;i++)addP(s[i],'fin',0.8);addP(s[7],'tailfin');})},
 anomalocaris:{ru:'Аномалокарис',lat:'Anomalocaris',beh:'hunt',apex:1,zones:{shelf:1,slope:1.5,deep:1.5},rel:[1.4,2.6],sc:[0.35,5],hueVar:12,fight:1,
  info:'Высший хищник кембрия: до метра длиной, хватательные клешни, огромные фасеточные глаза, плавает волнами лопастей.',
  body:()=>mkBody('bilateral',[2.1,2.4,2.45,2.4,2.3,2.1,1.9,1.7,1.5,1.3,1.1],352,'none',s=>{addP(s[0],'compound',1.2);addP(s[0],'grab',1.2);for(let i=1;i<10;i++)addP(s[i],'fin',1.1);addP(s[10],'tailfin',1.2);})},
 reaper:{ru:'Кольчатый жнец',lat:'Annulomessor (вымышл.)',beh:'hunt',zones:{shelf:0.5,slope:1,deep:1.8},rel:[1.2,2.2],sc:[0.5,4],hueVar:10,fight:1,fic:1,
  info:'Вымышленный хищный червь глубин: челюсти, шипы на каждом кольце и глаза-камеры для темноты.',
  body:()=>mkBody('bilateral',[1.3,1.25,1.2,1.2,1.15,1.1,1.05,1,0.95,0.9,0.85,0.8,0.7,0.6],282,'none',s=>{addP(s[0],'cameye',1.1);addP(s[0],'jaws',1.3);for(let i=1;i<14;i++)addP(s[i],'spine',0.7);for(let i=2;i<13;i+=2)addP(s[i],'fin',0.6);})},
 jelly:{ru:'Медуза',lat:'Medusozoa',beh:'drift',sting:1,zones:{shelf:2,slope:2,deep:1.5},rel:[0.4,1.8],sc:[0.4,3.5],hueVar:40,
  info:'Колокол и жгучие щупальца. Дрейфует; прикосновение обжигает.',body:()=>mkBody('radial',[2.6],300,'none',s=>{addP(s[0],'tentacle',1.5);})},
 ctenophore:{ru:'Гребневик',lat:'Ctenophora',beh:'drift',sting:0.3,eatsSmall:1,zones:{shelf:1.5,slope:1.5,deep:2},rel:[0.3,1.3],sc:[0.4,3],custom:'cteno',hueVar:0,
  info:'Прозрачный «огурчик» с восемью рядами ресничек, переливающихся радугой. Ловит мелкую живность.',body:()=>mkBody('radial',[1.8],180,'none')},
 glass:{ru:'Стеклокол',lat:'Vitrispina (вымышл.)',beh:'drift',sting:1.6,zones:{shelf:0,slope:0.6,deep:2.2},rel:[0.5,1.5],sc:[0.4,3],custom:'glass',fic:1,
  info:'Вымышленный дрейфующий организм из кремнёвых игл: почти невидим в темноте и больно колется.',body:()=>mkBody('radial',[1.6],190,'none')},
 priapulid:{ru:'Приапулида',lat:'Priapulida',beh:'ambush',zones:{shelf:1,slope:2,deep:2},rel:[0.8,1.6],sc:[0.5,3.5],custom:'priap',fight:1,
  info:'Червь-засадчик: прячется в иле, выставив венчик шипов, и молниеносно хватает того, кто проплывает рядом.',
  body:()=>mkBody('bilateral',[1.2,1.1,1,0.95,0.85],25,'none',s=>{addP(s[0],'jaws',1.2);addP(s[0],'spine',1);})}
},{
 wiwaxia:{ru:'Виваксия',lat:'Wiwaxia',beh:'graze',zones:{reef:4},sample:'reef',rel:[0.3,1.0],sc:[0.5,2.5],custom:'wiwaxia',hueVar:15,
  info:'Пасущийся «слизень» в кольчуге из чешуек и с двумя рядами длинных шипов. Живёт только на рифах.',body:()=>mkBody('bilateral',[1.1,1.3,1.35,1.3,1.1],28,'none',s=>{for(let i=1;i<4;i++)addP(s[i],'spine',1.4);})},
 marrella:{ru:'Маррелла',lat:'Marrella',beh:'school',zones:{currents:5,slope:0.3},sample:'currents',rel:[0.2,0.6],sc:[0.4,2],hueVar:20,
  info:'«Кружевной краб»: крошечное членистоногое с длинными загнутыми назад шипами на голове. Держится в течениях у подводной горы.',body:()=>mkBody('bilateral',[0.9,0.6,0.55,0.5,0.45,0.4],190,'exo',s=>{addP(s[0],'antenna',1.4);addP(s[0],'spine',2);for(let i=1;i<6;i++)addP(s[i],'jleg',0.6);})},
 vetulicola:{ru:'Ветуликолия',lat:'Vetulicola',beh:'school',zones:{currents:3,deep:0.3},sample:'currents',rel:[0.4,1.3],sc:[0.5,3],hueVar:12,
  info:'Загадочное животное из двух половин: раздутая передняя часть с жаберными щелями и мускулистый хвост из сегментов.',body:()=>mkBody('bilateral',[1.7,1.85,1.7,0.8,0.75,0.65,0.55,0.45],40,'none',s=>{addP(s[1],'gill',0.8);addP(s[7],'tailfin',1.1);})},
 slug:{ru:'Зелёный слизень',lat:'Viridolimax (вымышл.)',beh:'graze',zones:{lagoon:5},sample:'lagoon',fic:1,rel:[0.3,1],sc:[0.4,2.5],hueVar:15,
  info:'Вымышленный пастух лагуны: в его коже живут водоросли, поэтому он зелёный. Медленный и беззащитный.',body:()=>mkBody('bilateral',[1.2,1.35,1.3,1.1,0.8],110,'none',s=>{addP(s[0],'eyes',0.7);addP(s[0],'antenna',0.6);})},
 sulfur:{ru:'Серный ползун',lat:'Sulfurirepens (вымышл.)',beh:'graze',zones:{seeps:5},sample:'seeps',fic:1,glow:1,rel:[0.3,1.2],sc:[0.5,3],hueVar:10,
  info:'Вымышленный бледный червь холодных сипов: ест бактериальные маты и слабо светится.',body:()=>mkBody('bilateral',[0.9,0.95,0.95,0.9,0.85,0.8,0.7,0.6,0.5],45,'none',s=>{for(let i=1;i<8;i++)addP(s[i],'leg',0.6);})},
 haikou:{ru:'Хайкоуихтис',lat:'Haikouichthys',beh:'school',zones:{slope:1.5,deep:1.5,reef:0.5},rel:[0.4,1.2],sc:[0.5,3],hueVar:15,
  info:'Одна из первых «рыб»: хорда, зачатки позвонков, спинной плавник и глаза. Родственник предков позвоночных.',body:()=>mkBody('bilateral',[0.9,1,1,0.95,0.85,0.75,0.6,0.5,0.4],210,'notochord',s=>{addP(s[0],'cameye',0.8);addP(s[2],'fin',0.6);addP(s[8],'tailfin',1);})}
});
const ZW={ostracod:{lagoon:4,shelf:5,reef:3,slope:3,deep:2,currents:3,seeps:1},trilobite:{lagoon:2,shelf:4,reef:4,slope:4,deep:1.5,currents:1,seeps:1},hallucigenia:{lagoon:1,shelf:2,reef:3,slope:2,deep:0.5,currents:1},polychaete:{lagoon:1,shelf:2,reef:2,slope:2,deep:3,seeps:2},pikaia:{lagoon:1,shelf:3,reef:2,slope:3,deep:1,currents:2},opabinia:{lagoon:0.2,shelf:2,reef:2,slope:2,deep:1.5,currents:1.5,seeps:1},anomalocaris:{shelf:1,reef:1.5,slope:1.5,deep:1.5,currents:2,seeps:1},reaper:{shelf:0.5,reef:0.5,slope:1,deep:1.8,seeps:2},jelly:{lagoon:1,shelf:2,reef:1.5,slope:2,deep:1.5,currents:3,seeps:0.5},ctenophore:{lagoon:0.5,shelf:1.5,reef:1,slope:1.5,deep:2,currents:2,seeps:1.5},glass:{slope:0.6,deep:2.2,seeps:2},priapulid:{lagoon:0.5,shelf:1,reef:1,slope:2,deep:2,seeps:2}};
for(const k in ZW)SPEC[k].zones=ZW[k];
for(const k in SPEC){const S=SPEC[k];S.id=k;S.baseL=bodyStats(S.body(),{}).L;}
const ents=[],foods=[],nests=[],carr=[];let spawnInView=false;
let entId=1;
function spawnEnt(sp,x,y,sc,o){
 o=o||{};const S=sp==='kin'||sp==='pack'?{id:sp,ru:sp==='kin'?'Сородич':'Потомок',beh:sp,zones:{},kin:1}:SPEC[sp];
 const b=o.body?cloneBody(o.body):S.body();if(!o.body){scaleBody(b,sc);if(S.hueVar)b.hue=(b.hue+rnd(-S.hueVar,S.hueVar)+360)%360;}
 const st=bodyStats(b,o.un||{});const fz=floorH(x,y);let z;
 if(S.beh==='graze'||S.beh==='ambush'||S.beh==='kin'||S.beh==='pack')z=fz+st.Req*0.6;
 else if(S.beh==='drift')z=fz+rnd(25,Math.max(30,SURF-fz-20));else z=fz+rnd(6,Math.min(120,Math.max(8,SURF-fz-10)));
 const e={id:entId++,sp,S,b,st,x,y,z:Math.min(z,SURF-4),a:R_()*TAU,hp:st.hpMax,t:R_()*10,state:'idle',tgt:null,cd:0,scan:R_()*0.4,curl:0,mv:0,dmgT:0,hid:S.beh==='ambush',full:0,wx:x,wy:y,wz:z,gone:false};
 e.pos=initChain(b,e.x,e.y,e.z,e.a);ents.push(e);return e;
}
function entVal(e){return e.st.M*1.1*(e.S.valK||1)+0.5;}
function angD(a,b){let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;}
function d3(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}
function headR(e){return e.b.segs[0].r;}
/* ===== еда ===== */
function addPlankton(x,y,z){foods.push({k:'pl',x,y,z,val:0.35,ph:R_()*TAU,hue:R_()<0.5?100:60});}
function addCarrion(x,y,z,val,r,sp){carr.push({x,y,z,val,val0:val,r,t:0,sp,seed:R_()});}
/* ===== поведение ===== */
function canSee(e,tg,range){if(tg===P){if(!P.alive||P.bur)return false;const dark=clamp(1-P.z/SURF,0,1);range*=1-0.4*dark;if(zoneAt(P.x)==='reef'&&P.z-floorH(P.x)<30)range*=0.5;}else if(tg.hid)return false;return Math.hypot(tg.x-e.x,tg.y-e.y)<range&&Math.abs(tg.z-e.z)<range*0.7;}
function threatTo(e){
 let best=null,bd=1e9;const R=e.st.L*4+50;
 if(P.alive&&!P.bur&&P.st.Req>e.st.Req*1.15&&!e.S.kin){const d=d3(e,P);if(d<R&&d<bd){bd=d;best=P;}}
 for(const o of ents){if(o===e||o.S.beh!=='hunt'||o.full>0||o.st.Req<e.st.Req*1.2)continue;const d=d3(e,o);if(d<R&&d<bd){bd=d;best=o;}}
 return best;
}
function preyFor(e){
 let best=null,bd=1e9;const R=e.st.L*(e.st.eyeQ>0.2?5:3)+60;
 if(P.alive&&P.st.Req<e.st.Req*0.95&&canSee(e,P,R)){const d=d3(e,P)*0.85;if(d<bd){bd=d;best=P;}}
 for(const o of ents){if(o===e||o.sp===e.sp||o.hid||o.st.Req>e.st.Req*0.8||o.S.beh==='drift')continue;const d=d3(e,o);if(d<R&&d<bd){bd=d;best=o;}}
 for(const n of nests){if(n.care||!n.eggs)continue;const d=Math.hypot(n.x-e.x,n.y-e.y);if(d<R*0.6&&d<bd&&e.st.Req<P.st.Req*3){bd=d;best=n;}}
 return best;
}
function steer(e,dt,tx,ty,tz,spd){
 const st=e.st,dx=tx-e.x,dz=tz-e.z,dist=Math.hypot(dx,dz);if(dist<0.5)spd=0;
 const da=angD(Math.atan2(dz,dx),e.a);e.a+=clamp(da,-st.turn*dt*1.3,st.turn*dt*1.3);
 const f=Math.max(0.25,Math.cos(Math.min(Math.abs(da),1.5)));const v=Math.min(spd*f,dist*3+0.5);
 e.x+=Math.cos(e.a)*v*dt;e.z+=Math.sin(e.a)*v*dt;e.y=0;
 e.mv+=(clamp(spd/(st.speed||1),0,1.2)-e.mv)*Math.min(1,dt*3);
}
function entUpdate(e,dt){
 const S=e.S,st=e.st;e.t+=dt;e.cd-=dt;e.scan-=dt;e.curl=Math.max(0,e.curl-dt);e.dmgT-=dt;e.full=Math.max(0,e.full-dt);
 const fz=floorH(e.x,e.y),floorZ=fz+st.Req*0.55;
 const crawler=S.beh==='graze'||S.beh==='kin';
 const cspd=crawler?Math.max(st.crawl,st.speed*0.55):st.speed;
 let tx=e.wx,ty=e.wy,tz=e.wz,spd=cspd*0.35;
 const newWander=(rad,zf)=>{const a=R_()*TAU,d=rnd(rad*0.3,rad);e.wx=clamp(e.x+Math.cos(a)*d,-HALF*0.92,HALF*0.92);e.wy=0;e.wz=zf(e.wx,e.wy);};
 if(Math.hypot(e.wx-e.x,e.wy-e.y)<st.L+3||e.t%17<dt)newWander(st.L*8+60,crawler?(x,y)=>floorH(x,y)+st.Req*0.55:(x,y)=>{const f=floorH(x,y);return f+rnd(8,Math.min(160,SURF-f-10));});
 if(e.curl>0){e.mv*=0.9;updateChain(e.b,e.pos,e.x,e.y,e.z);return;}
 if(S.beh==='graze'||S.beh==='school'){
  if(e.scan<=0){e.scan=0.3+R_()*0.2;e.thr=threatTo(e);}
  if(e.thr&&!e.thr.gone&&(e.thr!==P||P.alive)){const th=e.thr,dx=e.x-th.x,dy=e.y-th.y,d=Math.hypot(dx,dy)||1;tx=e.x+dx/d*80;ty=e.y+dy/d*80;tz=crawler?floorZ:clamp(e.z+(e.z-th.z)*0.5,fz+4,SURF-6);spd=cspd*1.05;e.state='flee';
   if(S.curl&&d<th.st.L*0.8+st.L&&R_()<dt*1.5){e.curl=3;}}
  else{e.state='idle';if(S.beh==='school'&&e.lead&&!e.lead.gone&&e.lead!==e){tx=e.lead.x+e.ox;ty=e.lead.y+e.oy;tz=e.lead.z+e.oz;spd=Math.min(cspd,e.lead.st.speed*0.4+Math.hypot(tx-e.x,tz-e.z)*0.6);}
   if(S.scav){let bc=null,bd=st.L*6+50;for(const c of carr){const d=Math.hypot(c.x-e.x,c.y-e.y);if(d<bd){bd=d;bc=c;}}if(bc){tx=bc.x;ty=bc.y;tz=floorZ;spd=cspd*0.6;if(bd<st.L*0.6+bc.r){bc.val-=dt*st.M*0.4;}}}}
  if(crawler)tz=floorZ;
 }else if(S.beh==='hunt'){
  if(e.scan<=0&&e.full<=0){e.scan=0.35+R_()*0.2;const p=preyFor(e);if(p&&(!e.tgt||e.state!=='chase'))e.chase=0;e.tgt=p;}
  const tg=e.tgt;
  if(tg&&e.full<=0&&!(tg.gone)&&(tg!==P||(P.alive&&!P.bur))&&!(tg.eggs===0)){
   e.state='chase';e.chase=(e.chase||0)+dt;tx=tg.x;ty=tg.y;tz=tg.z!=null?tg.z:floorH(tg.x,tg.y);spd=st.speed*(e.chase<6?1:0.6);
   const hp=e.pos[0],reach=headR(e)*1.3+st.reach+(tg.st?tg.st.Req*0.8:2)+1.5;const dd=Math.hypot(tg.x-hp.x,tg.y-hp.y,(tz)-hp.z);
   if(dd<reach&&e.cd<=0){e.cd=0.9;
    if(tg===P)hurtPlayer(st.bite*1.1*(P.st.Req<=st.Req*st.swallow?2.2:1),e);
    else if(tg.eggs!=null){tg.eggs=Math.max(0,tg.eggs-1);if(tg===P.lastNest||tg.own)toast('Хищник разоряет твою кладку!');e.full=6;}
    else{tg.hp-=st.bite*(tg.curl>0?0.3:1)*(tg.st.armor||1);tg.dmgT=2;if(tg.st.spine)e.hp-=tg.st.spine;if(tg.hp<=0||tg.st.Req<=st.Req*st.swallow){killEnt(tg,null,tg.st.Req<=st.Req*st.swallow);e.full=12+R_()*10;e.tgt=null;}else if(tg.S.curl)tg.curl=3;}}
   if(e.chase>14){e.tgt=null;e.full=4;}
  }else{e.state='idle';spd=st.speed*0.3;}
 }else if(S.beh==='drift'){
  spd=st.speed*0.25*(0.4+0.6*Math.max(0,Math.sin(e.t*2.5)));
  if(S.eatsSmall){for(const f of foods){if(Math.abs(f.x-e.x)<st.Req*2&&Math.abs(f.y-e.y)<st.Req*2){f.dead=1;}}}
 }else if(S.beh==='ambush'){
  tz=fz-st.Req*0.2;spd=0;
  if(e.hid){if(P.alive&&!P.bur&&d3(e,P)<st.L*1.6+P.st.Req&&P.st.Req<st.Req*2.2){e.hid=false;e.state='strike';e.cd=0;e.stt=1.2;}}
  else{e.stt-=dt;if(e.state==='strike'&&e.cd<=0&&P.alive&&d3(e,P)<st.L*1.4+P.st.Req*1.2){e.cd=1;hurtPlayer(st.bite*1.3,e);}if(e.stt<=0){e.hid=true;e.state='idle';}}
  e.z=fz;e.pos.forEach((p,i)=>{p.x=e.x;p.y=e.y;p.z=fz+(e.hid?0:st.L*0.15*(i))});e.mv=0;return;
 }else if(S.beh==='kin'){
  const d=Math.hypot(P.x-e.x,P.y-e.y);if(e.mate&&P.alive&&d<P.st.L*10&&d>P.st.L*1.5){tx=P.x;ty=P.y;spd=cspd*0.5;}tz=floorZ;
  if(e.leave>0){e.leave-=dt;if(e.leave<=0){e.gone=true;}}
 }else if(S.beh==='pack'){
  const k=ents.filter(o=>o.S.beh==='pack').indexOf(e);const off=P.st.L*(1.3+0.6*(k%3));
  tx=P.x-Math.cos(P.a)*off;ty=0;tz=clamp(P.z-Math.sin(P.a)*off+((k%3)-1)*P.st.L*0.7,floorH(tx)+st.Req,SURF-4);const d=Math.hypot(tx-e.x,tz-e.z);spd=Math.min(st.speed*1.15,d*1.5+2);
  if(e.scan<=0){e.scan=0.4;e.tgt=null;let bd=P.st.L*4+40;for(const o of ents){if(o.S.kin||o.hid||o.gone)continue;let ok=false;if(P.st.brain>=3&&o.S.beh==='hunt'&&o.tgt===P&&o.st.Req<st.Req*2.5)ok=true;else if(o.st.Req<st.Req*0.8&&o.S.beh!=='drift')ok=true;if(!ok)continue;const dd=d3(o,e);if(dd<bd){bd=dd;e.tgt=o;}}}
  if(e.tgt&&!e.tgt.gone){const tg=e.tgt;tx=tg.x;ty=tg.y;tz=tg.z;spd=st.speed;const dd=d3(e.pos[0],tg);if(dd<headR(e)*1.3+tg.st.Req*0.8+1.5&&e.cd<=0){e.cd=0.8;tg.hp-=st.bite*(tg.st.armor||1);tg.dmgT=2;if(tg.hp<=0||tg.st.Req<=st.Req*st.swallow){const v=entVal(tg);killEnt(tg,null,true);gainFood(v*0.35,null,true);}}}
  if(e.hp<e.st.hpMax)e.hp=Math.min(e.st.hpMax,e.hp+dt*0.5);
 }
 steer(e,dt,tx,ty,tz,spd);
 const cu=curAt(e.x,e.z);if(cu&&!(crawler&&e.z-fz<st.Req*2))e.x+=cu*dt*(S.beh==='drift'?1:0.55);
 const f2=floorH(e.x,e.y)+st.Req*0.45;if(e.z<f2)e.z=f2;if(e.z>SURF-3)e.z=SURF-3;
 e.x=clamp(e.x,-HALF*0.95,HALF*0.95);e.y=clamp(e.y,-HALF*0.95,HALF*0.95);
 if(e.b.sym!=='radial'&&(e.b.skel==='none'||e.b.skel==='notochord')&&e.mv>0.05){const w=Math.sin(e.t*8)*headR(e)*0.25*e.mv;updateChain(e.b,e.pos,e.x-Math.sin(e.a)*w,e.y+Math.cos(e.a)*w,e.z);}else updateChain(e.b,e.pos,e.x,e.y,e.z);
 // жжение
 if(S.sting&&P.alive&&!P.bur){const r=st.Req*(S.custom?1.4:2.2)+P.st.Req*0.8;if(d3(e,P)<r||(e.b.sym==='radial'&&Math.hypot(e.x-P.x,e.y-P.y)<r*0.8&&P.z<e.z&&P.z>e.z-st.Req*4)){if(e.cd<=0){e.cd=0.7;hurtPlayer(S.sting*(1.5+st.Req*0.9),e,true);}}}
 if(e.hp<=0)killEnt(e,null,false);
}
function killEnt(e,by,eaten){if(e.gone)return;e.gone=true;if(e.S.beh==='pack')toast('Член стаи погиб');if(!eaten&&!e.S.kin)addCarrion(e.x,e.y,e.z,entVal(e),e.st.Req,e.sp);}
/* ===== спавн вокруг игрока ===== */
function viewR(){return Math.hypot(W,H)/cam.s*0.55;}
function pickSpecies(zone){let tot=0;for(const k in SPEC)tot+=SPEC[k].zones[zone]||0;let r=R_()*tot;for(const k in SPEC){r-=SPEC[k].zones[zone]||0;if(r<=0)return k;}return 'ostracod';}
function sizeFor(S){const PL=P.st.L;return clamp(PL*rnd(S.rel[0],S.rel[1])/S.baseL,S.sc[0],S.sc[1]);}
function popTick(dt){
 const vr=viewR(),ACT=Math.max(220,vr*1.35);
 for(let i=ents.length-1;i>=0;i--){const e=ents[i];if(e.gone){ents.splice(i,1);continue;}if(e.S.beh!=='pack'&&Math.hypot(e.x-P.x,e.y-P.y)>ACT*1.7){ents.splice(i,1);}}
 const want=80+Math.min(30,P.st.L*0.4);let n=ents.filter(e=>!e.S.kin).length;let guard=0;
 while(n<want&&guard++<(spawnInView?40:6)){
  const a=R_()*TAU,d=spawnInView?rnd(0,ACT):rnd(vr*1.02,ACT);const x=clamp(P.x+(Math.cos(a)<0?-1:1)*d,-HALF*0.9,HALF*0.9),y=0;
  let sp=pickSpecies(zoneAt(x,y));if(SPEC[sp].beh==='hunt'){let tries=0;while(SPEC[sp].beh==='hunt'&&tries++<8)sp=pickSpecies(zoneAt(x,y));if(SPEC[sp].beh==='hunt')continue;}const S=SPEC[sp];
  if(S.beh==='school'){const sc=sizeFor(S),k=4+((R_()*6)|0);const lead=spawnEnt(sp,x,y,sc);lead.lead=lead;for(let q=1;q<k;q++){const e=spawnEnt(sp,x+rnd(-15,15),0,sc*rnd(0.85,1.1));e.lead=lead;e.ox=rnd(-1,1)*lead.st.L*2.5;e.oy=rnd(-1,1)*lead.st.L*2.5;e.oz=rnd(-1,1)*lead.st.L;e.z=lead.z+e.oz;e.pos=initChain(e.b,e.x,e.y,e.z,e.a);}n+=k;}
  else{spawnEnt(sp,x,y,sizeFor(S));n++;}
 }
 // хищники распределены равномерно: в любой зоне рядом держится примерно одинаковое их число
 const pz=zoneAt(P.x);const hunters=ents.filter(e=>e.S.beh==='hunt'&&!e.gone).length,wantH=pz==='lagoon'?1:4+Math.min(4,Math.floor(P.st.L/15))+(pz==='deep'||pz==='seeps'?1:0);
 if(hunters<wantH&&R_()<dt*1.2){const sd=R_()<0.5?-1:1,d=rnd(vr*1.05,ACT);const x=clamp(P.x+sd*d,-HALF*0.9,HALF*0.9);const zn=zoneAt(x);const hs=Object.keys(SPEC).filter(k=>SPEC[k].beh==='hunt');let tot=0;for(const k of hs)tot+=SPEC[k].zones[zn]||0;let r=R_()*tot,sp=hs[0];for(const k of hs){r-=SPEC[k].zones[zn]||0;if(r<=0){sp=k;break;}}spawnEnt(sp,x,0,sizeFor(SPEC[sp]));}
 // сородичи
 const kin=ents.filter(e=>e.sp==='kin');if(kin.length<3&&R_()<dt*0.5){const a=R_()*TAU,d=rnd(vr*1.05,vr*1.6);const x=clamp(P.x+(Math.cos(a)<0?-1:1)*d,-HALF*0.9,HALF*0.9),y=0;if(ZONES[zoneAt(x)].nest){const b=cloneBody(P.body);scaleBody(b,rnd(0.85,1.05));const e=spawnEnt('kin',x,y,1,{body:b,un:P.un});e.mate=true;}}
 // планктон
 for(let i=foods.length-1;i>=0;i--){const f=foods[i];const cu=curAt(f.x,f.z);if(cu)f.x+=cu*dt;if(f.dead||Math.hypot(f.x-P.x,f.y-P.y)>ACT*1.5)foods.splice(i,1);}
 const wf=pz==='currents'?260:pz==='lagoon'?140:110;let g2=0;while(foods.length<wf&&g2++<16){const a=R_()*TAU,d=rnd(foods.length<wf*0.5?20:vr*0.9,ACT);const x=P.x+Math.cos(a)*d,y=0;const fz=floorH(x);const zz=clamp(P.z+rnd(-90,90)*Math.max(1,vr/120),fz+3,SURF-4);if(R_()<0.25+0.75*(zz/SURF))addPlankton(x,y,zz);}
 for(let i=carr.length-1;i>=0;i--){const c=carr[i];c.t+=dt;const fz=floorH(c.x,c.y)+c.r*0.4;if(c.z>fz)c.z=Math.max(fz,c.z-dt*12);if(c.val<=0.3||c.t>120||Math.hypot(c.x-P.x,c.y-P.y)>ACT*2)carr.splice(i,1);}
}
/* ===== отрисовка особых существ ===== */
function drawEnt(e){
 const S=e.S,st=e.st,s=cam.s;const fz=floorH(e.x,e.y);
 if(e.z-fz>st.Req*1.5&&!e.hid)drawShadow(e.x,e.y,e.z,st.Req*1.1);
 if(S.custom==='ostracod'){const p=proj(e.x,e.y,e.z),r=st.Req*s*1.1;ctx.save();ctx.translate(p[0],p[1]);const fl=Math.cos(e.a)<0?-1:1;ctx.scale(fl,1);ctx.rotate(-Math.atan2(Math.sin(e.a),Math.abs(Math.cos(e.a))));ctx.strokeStyle=`hsla(${e.b.hue},40%,70%,0.8)`;ctx.lineWidth=Math.max(0.6,r*0.08);for(const sd of[-1,1]){ctx.beginPath();ctx.moveTo(r*0.8,sd*r*0.1);ctx.quadraticCurveTo(r*1.4,sd*r*0.6,r*1.6+Math.sin(e.t*12)*r*0.2,sd*r*(0.9));ctx.stroke();}ctx.fillStyle=`hsla(${e.b.hue},45%,62%,0.85)`;ctx.beginPath();ctx.ellipse(0,0,r,r*0.68,0,0,TAU);ctx.fill();ctx.strokeStyle=`hsla(${e.b.hue},40%,30%,0.9)`;ctx.stroke();ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(0,-r*0.2,r,0);ctx.stroke();ctx.fillStyle='rgba(30,20,20,0.9)';ctx.beginPath();ctx.arc(r*0.55,-r*0.15,Math.max(0.8,r*0.13),0,TAU);ctx.fill();ctx.restore();}
 else if(S.custom==='cteno'){const p=proj(e.x,e.y,e.z),r=st.Req*s;ctx.fillStyle='rgba(200,230,255,0.13)';ctx.strokeStyle='rgba(220,240,255,0.45)';ctx.lineWidth=Math.max(0.6,r*0.04);ctx.beginPath();ctx.ellipse(p[0],p[1],r*0.75,r*1.15,0,0,TAU);ctx.fill();ctx.stroke();for(let k=0;k<8;k++){const ox=Math.sin(k/8*TAU)*r*0.68;if(Math.cos(k/8*TAU)<-0.2)continue;for(let q=0;q<9;q++){const yy=-r*0.95+q*r*0.24,wx=ox*Math.sqrt(Math.max(0,1-(yy/(r*1.15))**2));const hu=(T_*200+q*40+k*45)%360;ctx.fillStyle=`hsla(${hu},90%,65%,${0.55*(0.5+0.5*Math.sin(T_*9-q*0.8+k))})`;ctx.fillRect(p[0]+wx-r*0.04,p[1]+yy,Math.max(1,r*0.08),Math.max(1,r*0.09));}}ctx.fillStyle='rgba(255,180,120,0.35)';ctx.beginPath();ctx.ellipse(p[0],p[1],r*0.15,r*0.5,0,0,TAU);ctx.fill();}
 else if(S.custom==='glass'){const p=proj(e.x,e.y,e.z),r=st.Req*s;const dk=clamp(1-e.z/SURF,0,1);ctx.strokeStyle=`rgba(210,240,255,${0.65-0.3*dk})`;ctx.lineWidth=Math.max(0.6,r*0.05);ctx.beginPath();for(let k=0;k<16;k++){const a=k/16*TAU+e.t*0.3,l=r*(1.1+0.6*hash(k,e.id));ctx.moveTo(p[0]+Math.cos(a)*r*0.4,p[1]+Math.sin(a)*r*0.3);ctx.lineTo(p[0]+Math.cos(a)*l,p[1]+Math.sin(a)*l*0.75);}ctx.stroke();ctx.fillStyle=`rgba(190,230,255,${0.16})`;ctx.beginPath();ctx.arc(p[0],p[1],r*0.5,0,TAU);ctx.fill();ctx.fillStyle=`rgba(120,255,220,${0.5+0.4*Math.sin(e.t*3)})`;ctx.beginPath();ctx.arc(p[0],p[1],Math.max(1,r*0.12),0,TAU);ctx.fill();}
 else if(S.custom==='priap'){const p=proj(e.x,e.y,fz),r=st.Req*s;if(e.hid){ctx.fillStyle='rgba(60,50,35,0.45)';ctx.beginPath();ctx.ellipse(p[0],p[1],r*1.2,r*0.55,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(230,200,150,0.7)';for(let k=0;k<10;k++){const a=k/10*TAU;ctx.beginPath();ctx.arc(p[0]+Math.cos(a)*r*0.55,p[1]+Math.sin(a)*r*0.25,Math.max(0.6,r*0.07),0,TAU);ctx.fill();}}
  else{const hgt=st.L*0.9*s*Math.min(1,(1.2-e.stt)*5);ctx.strokeStyle=`hsla(25,45%,52%,0.95)`;ctx.lineCap='round';ctx.lineWidth=r*1.3;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[0]+Math.sin(e.t*9)*r*0.3,p[1]-hgt);ctx.stroke();ctx.strokeStyle='rgba(90,50,30,0.5)';ctx.lineWidth=Math.max(0.6,r*0.08);for(let q=1;q<6;q++){const yy=p[1]-hgt*q/6;ctx.beginPath();ctx.moveTo(p[0]-r*0.6,yy);ctx.lineTo(p[0]+r*0.6,yy);ctx.stroke();}ctx.fillStyle='rgba(240,220,170,0.9)';for(let k=0;k<12;k++){const a=k/12*TAU;ctx.beginPath();ctx.arc(p[0]+Math.cos(a)*r*0.75,p[1]-hgt+Math.sin(a)*r*0.3,Math.max(0.6,r*0.09),0,TAU);ctx.fill();}}}
 else if(S.custom==='wiwaxia'){const p=proj(e.x,e.y,e.z),r=st.Req*s*1.25;const fl=Math.cos(e.a)<0?-1:1;ctx.save();ctx.translate(p[0],p[1]+r*0.3);ctx.scale(fl,1);const L=lightAt(e.z);
   ctx.strokeStyle=`hsla(${e.b.hue},35%,${70*L|0}%,0.95)`;ctx.lineWidth=Math.max(1,r*0.09);for(let k=0;k<7;k++){const u=k/6-0.5;const sw=Math.sin(e.t*1.5+k)*0.05;ctx.beginPath();ctx.moveTo(u*r*1.4,-r*0.55);ctx.lineTo(u*r*1.6-r*0.35+sw*r,-r*(1.45+0.25*Math.cos(u*3)));ctx.stroke();}
   const g=ctx.createLinearGradient(0,-r*0.7,0,r*0.1);g.addColorStop(0,`hsla(${e.b.hue},45%,${62*L|0}%,1)`);g.addColorStop(1,`hsla(${e.b.hue},40%,${28*L|0}%,1)`);ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,r*1.15,r*0.62,0,Math.PI,TAU);ctx.closePath();ctx.fill();
   ctx.strokeStyle=`hsla(${e.b.hue},40%,${80*L|0}%,0.35)`;ctx.lineWidth=Math.max(0.5,r*0.04);for(let q=0;q<5;q++){ctx.beginPath();ctx.ellipse(0,0,r*(0.3+q*0.18),r*(0.16+q*0.1),0,Math.PI*1.05,Math.PI*1.95);ctx.stroke();}
   ctx.fillStyle=`hsla(${e.b.hue},30%,${25*L|0}%,0.9)`;ctx.fillRect(-r*1.05,-r*0.05,r*2.1,r*0.12);ctx.restore();}
 else if(e.curl>0&&S.curl){const p=proj(e.x,e.y,e.z),r=st.Req*s*1.25;ctx.fillStyle=`hsla(${e.b.hue},40%,48%,0.95)`;ctx.beginPath();ctx.ellipse(p[0],p[1],r,r*0.8,0,0,TAU);ctx.fill();ctx.strokeStyle=`hsla(${e.b.hue},40%,25%,0.9)`;ctx.lineWidth=Math.max(0.8,r*0.07);ctx.stroke();for(let q=1;q<5;q++){ctx.beginPath();ctx.arc(p[0],p[1]+r*0.9,r*(0.4+q*0.2),Math.PI*1.2,Math.PI*1.8);ctx.stroke();}}
 else drawBody(e.b,e.pos,{moving:e.mv,heading:e.a,brain:e.S.kin?P.st.brain:0});
 if(S.glow){ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<e.pos.length;i++){const q=proj(e.pos[i].x,0,e.pos[i].z);const a=0.25+0.2*Math.sin(e.t*3+i);ctx.fillStyle=`rgba(140,255,210,${a})`;ctx.beginPath();ctx.arc(q[0],q[1],Math.max(1.5,e.b.segs[i].r*s*0.35),0,TAU);ctx.fill();}ctx.restore();}
 if(e.S.kin){const p=proj(e.pos[0].x,e.pos[0].y,e.pos[0].z);const r=st.Req*s;if(e.sp==='kin'&&e.mate){ctx.fillStyle=`rgba(255,120,170,${0.6+0.3*Math.sin(T_*4)})`;heart(p[0],p[1]-r*2.6-6,Math.max(5,r*0.6));}else if(e.sp==='pack'){ctx.strokeStyle='rgba(120,220,255,0.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p[0],p[1]-r*2.2-5,3,0,TAU);ctx.stroke();}}
 if(e.dmgT>0&&e.hp>0){const p=proj(e.x,e.y,e.z),r=Math.max(8,st.Req*s*1.6),k=clamp(e.hp/e.st.hpMax,0,1);ctx.lineWidth=2.5;ctx.lineCap='round';ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.arc(p[0],p[1]-r*0.3,r,Math.PI*0.2,Math.PI*0.8);ctx.stroke();ctx.strokeStyle=`hsla(${k*110},80%,58%,0.9)`;ctx.beginPath();ctx.arc(p[0],p[1]-r*0.3,r,Math.PI*0.8-Math.PI*0.6*k,Math.PI*0.8);ctx.stroke();}
}
function heart(x,y,r){ctx.beginPath();ctx.moveTo(x,y+r*0.6);ctx.bezierCurveTo(x-r*1.2,y-r*0.2,x-r*0.5,y-r*1.1,x,y-r*0.4);ctx.bezierCurveTo(x+r*0.5,y-r*1.1,x+r*1.2,y-r*0.2,x,y+r*0.6);ctx.fill();}
function drawFood(f){const p=proj(f.x,f.y,f.z);if(p[0]<-10||p[0]>W+10||p[1]<-10||p[1]>H+10)return;const r=Math.max(1.2,0.55*cam.s);ctx.fillStyle=`hsla(${f.hue},60%,70%,0.75)`;ctx.beginPath();ctx.arc(p[0]+Math.sin(T_*2+f.ph)*r*0.5,p[1],r,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.arc(p[0]+Math.sin(T_*2+f.ph)*r*0.5-r*0.3,p[1]-r*0.3,r*0.35,0,TAU);ctx.fill();}
function drawCarrion(c){const p=proj(c.x,c.y,c.z),r=Math.max(2,c.r*cam.s*1.2*clamp(c.val/(c.val0||c.val),0.4,1));ctx.fillStyle='rgba(150,110,90,0.85)';ctx.beginPath();ctx.ellipse(p[0],p[1],r,r*0.55,c.seed*3,0,TAU);ctx.fill();ctx.fillStyle='rgba(90,60,50,0.6)';for(let k=0;k<4;k++){ctx.beginPath();ctx.arc(p[0]+(hash(k,c.seed*99|0)-0.5)*r,p[1]+(hash(k+5,3)-0.5)*r*0.5,r*0.18,0,TAU);ctx.fill();}}
function drawNest(n){const p=proj(n.x,n.y,n.z),r=Math.max(3,n.r*cam.s);ctx.fillStyle='rgba(60,50,35,0.35)';ctx.beginPath();ctx.ellipse(p[0],p[1],r*2,r,0,0,TAU);ctx.fill();for(let k=0;k<n.eggs;k++){const a=k/Math.max(1,n.eggs)*TAU,x=p[0]+Math.cos(a)*r*0.9,y=p[1]+Math.sin(a)*r*0.45;ctx.fillStyle=`rgba(240,235,200,0.85)`;ctx.beginPath();ctx.arc(x,y,r*0.42,0,TAU);ctx.fill();ctx.fillStyle=`hsla(${P.body.hue},60%,50%,${0.3+0.5*n.t/n.hatch})`;ctx.beginPath();ctx.arc(x,y,r*0.2*(0.4+0.6*n.t/n.hatch),0,TAU);ctx.fill();}
 if(n.eggs){ctx.lineWidth=2;ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.beginPath();ctx.arc(p[0],p[1]-r*1.6,r*0.6,0,TAU);ctx.stroke();ctx.strokeStyle='rgba(255,230,140,0.85)';ctx.beginPath();ctx.arc(p[0],p[1]-r*1.6,r*0.6,-Math.PI/2,-Math.PI/2+TAU*n.t/n.hatch);ctx.stroke();}}
