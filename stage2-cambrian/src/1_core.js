/* ===== утилиты ===== */
const $=id=>document.getElementById(id);
const TAU=Math.PI*2,R_=Math.random,rnd=(a,b)=>a+R_()*(b-a),pick=a=>a[(R_()*a.length)|0],clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
function hash(a,b){let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;}
function srand(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let NSEED=1;
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const a=hash(xi*7+NSEED,yi*13-NSEED),b=hash(xi*7+7+NSEED,yi*13-NSEED),c=hash(xi*7+NSEED,yi*13+13-NSEED),d=hash(xi*7+7+NSEED,yi*13+13-NSEED);const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,o){let s=0,a=0.5,f=1,t=0;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);t+=a;a*=0.5;f*=2.03;}return s/t;}
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};

const cv=$('cv');let ctx=cv.getContext('2d');let W=1,H=1,DPR=1;
function resize(){DPR=Math.min(matchMedia('(pointer:coarse)').matches?1.5:2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';}
addEventListener('resize',resize);resize();

/* ===== мир: вертикальный разрез океана =====
   x — по горизонтали (слева шельф, справа впадина), z — высота над «нулём», поверхность на SURF */
const SURF=520,HALF=3000,T=6,GN=Math.floor(HALF*2/T)+1;
let HM=new Float32Array(GN),TY=new Uint8Array(GN),MAT=new Float32Array(GN);
const TYPES_FLOOR=['sand','mud','rock','mat'];
function genWorld(seed){
 NSEED=seed%100000;
 for(let i=0;i<GN;i++){const x=-HALF+i*T;
  let h=470-60*smooth(-2900,-2300,x);       // лагуна у берега
  h-=150*smooth(-1300,-300,x);               // спуск с шельфа
  h-=190*smooth(150,950,x);                  // обрыв во впадину
  h+=60*Math.exp(-(((x+720)/230)**2));       // риф на склоне
  h+=40*Math.exp(-(((x-1700)/160)**2));      // подводный холм во впадине
  h+=420*smooth(2550,2960,x);                // дальняя стена
  h+=46*(fbm(x/420,3.1,3)-0.5)*2+9*(fbm(x/55,7.7,2)-0.5)*2;
  HM[i]=clamp(h,30,SURF-14);}
 for(let i=0;i<GN;i++){const x=-HALF+i*T,h=HM[i];const sl=Math.abs(HM[Math.min(GN-1,i+1)]-HM[Math.max(0,i-1)])/(T*2);
  let t=0;if(sl>0.55)t=2;else if(h<175)t=1;else if(h>330&&fbm(x/170,2.2,2)>0.5)t=3;TY[i]=t;MAT[i]=t===3?0.6+0.4*R_():0;}
}
function gIdx(x){return clamp(Math.round((x+HALF)/T),0,GN-1);}
function floorH(x){const f=clamp((x+HALF)/T,0,GN-1.001),i=Math.floor(f),u=f-i;return HM[i]+(HM[i+1]-HM[i])*u;}
function floorType(x){return TYPES_FLOOR[TY[gIdx(x)]];}
function o2At(z){return clamp(0.12+0.88*Math.pow(clamp(z/SURF,0,1),0.9),0,1);}
function zoneAt(x){const h=floorH(x);return h>330?'shelf':h>175?'slope':'deep';}
const ZONES={shelf:{ru:'Солнечный шельф',info:'Мелководье: много света и кислорода, водорослевые маты — пастбище для травоядных.'},slope:{ru:'Склон с рифами',info:'Рифы из археоциат и губок, трилобиты; хищники охотятся у кромки.'},deep:{ru:'Тёмная впадина',info:'Мало света и кислорода — без жабр долго не продержаться. Зато много падали и древних хищников.'}};

/* ===== камера: вид сбоку ===== */
const cam={x:0,z:300,s:6,ts:6};
function proj(x,y,z){return[(x-cam.x)*cam.s+W/2,(cam.z-z)*cam.s+H/2];}
function camUpdate(tx,ty,tz,dt){cam.s+=(cam.ts-cam.s)*Math.min(1,dt*2);cam.x+=(tx-cam.x)*Math.min(1,dt*3.5);let wz=tz+H*0.06/cam.s;cam.z+=(wz-cam.z)*Math.min(1,dt*3);
 const top=SURF-H*0.32/cam.s;if(cam.z>top)cam.z=top;}
function screenToWorld(sx,sy){return[cam.x+(sx-W/2)/cam.s,cam.z-(sy-H/2)/cam.s];}
const sxW=x=>(x-cam.x)*cam.s+W/2,syW=z=>(cam.z-z)*cam.s+H/2;

/* ===== вода и свет ===== */
let T_=0;
function waterRGB(z){const t=clamp(z/SURF,0,1),q=t*t;return[lerp(6,46,q),lerp(22,118,q),lerp(38,138,q)];}
const rgb=(c,a)=>a==null?`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`:`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
function drawWater(){
 ctx.setTransform(DPR,0,0,DPR,0,0);
 const zt=cam.z+H/2/cam.s,zb=cam.z-H/2/cam.s;const g=ctx.createLinearGradient(0,0,0,H);
 for(let k=0;k<=6;k++){const z=lerp(zt,zb,k/6);g.addColorStop(k/6,z>SURF?'rgb(150,205,215)':rgb(waterRGB(z)));}
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const sy=syW(SURF);
 if(sy>-40){// поверхность снизу: окно Снелла и рябь
  const g2=ctx.createLinearGradient(0,sy-60,0,sy+30);g2.addColorStop(0,'rgba(210,240,240,0.9)');g2.addColorStop(0.7,'rgba(160,215,220,0.6)');g2.addColorStop(1,'rgba(120,190,200,0)');ctx.fillStyle=g2;ctx.fillRect(0,0,W,sy+30);
  ctx.strokeStyle='rgba(235,255,255,0.55)';ctx.lineWidth=1.5;ctx.beginPath();for(let x=0;x<=W;x+=6){const wx=cam.x+(x-W/2)/cam.s;const y=sy+Math.sin(wx*0.08+T_*1.6)*2.2+Math.sin(wx*0.031-T_*0.9)*3;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.10)';for(let k=0;k<26;k++){const wx=Math.floor(cam.x/40)*40+(k-13)*40;const x=sxW(wx+Math.sin(T_*0.7+k)*12);ctx.beginPath();ctx.ellipse(x,sy+5+hash(k,Math.floor(cam.x/40))*8,18+12*hash(k,3),2.5,0,0,TAU);ctx.fill();}
 }
}
function drawRays(){
 ctx.setTransform(DPR,0,0,DPR,0,0);const sy=syW(SURF);const dep=clamp(1-cam.z/SURF,0,1);const a0=0.12*(1-dep*0.85);if(a0<0.01)return;
 ctx.save();ctx.globalCompositeOperation='lighter';
 const base=Math.floor((cam.x*0.6)/90);
 for(let k=-9;k<=9;k++){const id=base+k,h=hash(id,17);if(h<0.35)continue;const wx=id*90+Math.sin(T_*0.25+id)*25;const x=W/2+(wx-cam.x*0.6)*cam.s*0.6;const w=(16+40*hash(id,5))*cam.s*0.25+10;const len=Math.min(H*1.2,(260+300*hash(id,9))*cam.s*0.35);const a=a0*(0.4+0.6*h)*(0.65+0.35*Math.sin(T_*0.5+id*1.7));
  const y0=Math.max(-20,sy);const g=ctx.createLinearGradient(0,y0,0,y0+len);g.addColorStop(0,`rgba(190,235,240,${a})`);g.addColorStop(1,'rgba(190,235,240,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-w*0.5,y0);ctx.lineTo(x+w*0.5,y0);ctx.lineTo(x+w*0.5+len*0.28+w,y0+len);ctx.lineTo(x-w*0.5+len*0.28-w*0.2,y0+len);ctx.closePath();ctx.fill();}
 ctx.restore();
}
/* дальние планы: силуэты рифов в дымке */
function drawParallax(){
 ctx.setTransform(DPR,0,0,DPR,0,0);
 for(const[k,off,lift,al]of[[0.35,733,70,0.55],[0.62,1999,28,0.7]]){
  const pts=[];for(let sx=-8;sx<=W+8;sx+=6){const lx=cam.x+(sx-W/2)/(cam.s*k);let lz=floorH(lx*0.8+off)+lift;lz+=34*Math.max(0,fbm(lx/40,k*9,2)-0.55)*(lz>200?1:0.3);lz+=18*Math.max(0,Math.sin(lx*0.09)*fbm(lx/90,k,2)-0.2);pts.push([sx,H/2+(cam.z-lz)*cam.s*k]);}
  const zc=cam.z-60;const c=waterRGB(zc);const f=[c[0]*0.75+4,c[1]*0.8+6,c[2]*0.85+8];
  const g=ctx.createLinearGradient(0,Math.min(...pts.map(p=>p[1])),0,H);g.addColorStop(0,rgb(f,al*0.8));g.addColorStop(1,rgb([f[0]*0.6,f[1]*0.6,f[2]*0.6],al));
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-8,H+5);for(const p of pts)ctx.lineTo(p[0],p[1]);ctx.lineTo(W+8,H+5);ctx.closePath();ctx.fill();}
}
/* ===== дно ===== */
const FCOL={sand:[186,166,120],mud:[92,80,62],rock:[112,108,100],mat:[118,130,82]};
function floorColAt(x){const i=gIdx(x),t=TYPES_FLOOR[TY[i]];let c=FCOL[t];if(t==='mat'){const m=MAT[i];c=[lerp(186,92,m),lerp(166,120,m),lerp(120,62,m)];}return c;}
function lightAt(z){return 0.4+0.6*Math.pow(clamp(z/SURF,0,1),1.4);}
function colAvg(x){let r=0,g=0,b=0;for(let k=-3;k<=3;k++){const c=floorColAt(x+k*9);r+=c[0];g+=c[1];b+=c[2];}return[r/7,g/7,b/7];}
let FT=[];
function floorSamples(){const step=4,s=cam.s;FT=[];for(let sx=-step;sx<=W+step*2;sx+=step){const x=cam.x+(sx-W/2)/s,h=floorH(x);FT.push([sx,syW(h),x,h]);}}
function drawFloorBack(){// дальняя полоса дна, уходящая в дымку
 ctx.setTransform(DPR,0,0,DPR,0,0);floorSamples();const band=Math.max(10,22*cam.s),CH=12;
 ctx.lineCap='butt';ctx.lineJoin='round';const NB=11,lw=band/NB+1;
 for(let i=0;i<FT.length-1;i+=CH){const seg=FT.slice(i,Math.min(FT.length,i+CH+1));const m=seg[seg.length>>1];const c=colAvg(m[2]),L=lightAt(m[3]),wc=waterRGB(m[3]+30);const fc=[lerp(wc[0],c[0]*L,0.75),lerp(wc[1],c[1]*L,0.75),lerp(wc[2],c[2]*L,0.75)];
  for(let k=0;k<NB;k++){const u=k/NB;ctx.strokeStyle=rgb([lerp(fc[0],wc[0],u),lerp(fc[1],wc[1],u),lerp(fc[2],wc[2],u)],(1-u)*0.95);ctx.lineWidth=lw;ctx.beginPath();seg.forEach((q,j)=>j?ctx.lineTo(q[0],q[1]-k*band/NB-lw*0.5):ctx.moveTo(q[0],q[1]-k*band/NB-lw*0.5));ctx.stroke();}}
}
function drawFloorFront(){// ближнее дно под линией: текстура, каустика, рябь песка
 ctx.setTransform(DPR,0,0,DPR,0,0);const s=cam.s,step=4,CH=12;const top=FT.map(q=>[q[0],q[1],q[2]]);
 let ymin=1e9,cr=0,cg=0,cb=0;for(const q of FT)ymin=Math.min(ymin,q[1]);const mid=FT[FT.length>>1];const c0=colAvg(mid[2]),L0=lightAt(mid[3]);
 const g=ctx.createLinearGradient(0,ymin,0,Math.max(ymin+80,H));g.addColorStop(0,rgb([c0[0]*L0,c0[1]*L0,c0[2]*L0]));g.addColorStop(0.4,rgb([c0[0]*L0*0.68,c0[1]*L0*0.68,c0[2]*L0*0.7]));g.addColorStop(1,rgb([c0[0]*L0*0.3,c0[1]*L0*0.3,c0[2]*L0*0.34]));
 ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(FT[0][0],H+2);for(const q of FT)ctx.lineTo(q[0],q[1]);ctx.lineTo(FT[FT.length-1][0],H+2);ctx.closePath();ctx.fill();
 // тон грунта у кромки: широкие мазки вдоль линии дна, без «ступенек»
 ctx.save();ctx.beginPath();ctx.moveTo(FT[0][0],H+2);for(const q of FT)ctx.lineTo(q[0],q[1]);ctx.lineTo(FT[FT.length-1][0],H+2);ctx.closePath();ctx.clip();ctx.lineCap='butt';ctx.lineJoin='round';
 for(const[w,al]of[[Math.max(30,s*10),0.35],[Math.max(12,s*3.5),0.5]])for(let i=0;i<FT.length-1;i+=CH){const seg=FT.slice(i,Math.min(FT.length,i+CH+1));const m=seg[seg.length>>1];const c=colAvg(m[2]),L=lightAt(m[3]);ctx.strokeStyle=rgb([c[0]*L,c[1]*L,c[2]*L],al);ctx.lineWidth=w;ctx.beginPath();seg.forEach((q,k)=>k?ctx.lineTo(q[0],q[1]+w*0.35):ctx.moveTo(q[0],q[1]+w*0.35));ctx.stroke();}
 ctx.restore();
 // светлая кромка
 ctx.strokeStyle='rgba(255,240,200,0.18)';ctx.lineWidth=Math.max(1,s*0.35);ctx.beginPath();top.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
 // каустика на мелководье
 const cz=floorH(cam.x);if(cz>230){ctx.save();ctx.globalCompositeOperation='lighter';const k=clamp((cz-230)/240,0,1)*0.13;
  for(let i=0;i<top.length;i+=2){const[sx,y,x]=top[i];const v=Math.sin(x*0.21+T_*1.3)+Math.sin(x*0.13-T_*1.7)+Math.sin(x*0.37+T_*0.6);if(v<1)continue;const a=k*(v-1)*lightAt(floorH(x));ctx.fillStyle=`rgba(255,250,210,${a})`;ctx.beginPath();ctx.ellipse(sx,y+s*2+Math.sin(x)*s,s*2.4,s*0.8,0,0,TAU);ctx.fill();}
  ctx.restore();}
 // зерно, камешки, рябь
 if(s>1.6){const cell=Math.max(1.2,6/s*1.6);const x0=Math.floor((cam.x-W/2/s)/cell),x1=Math.ceil((cam.x+W/2/s)/cell);
  for(let q=x0;q<=x1;q++){const wx=q*cell;const t=floorType(wx);const fy=syW(floorH(wx));if(fy>H)continue;const n=t==='rock'?1:2;
   for(let k=0;k<n;k++){const h1=hash(q,k+NSEED),h2=hash(k+5,q);const d=Math.pow(h2,1.6)*Math.min(H-fy,s*40);const sx=sxW(wx+h1*cell),sy=fy+d+1;const rr=Math.max(0.6,s*(t==='rock'?0.9:0.22)*(0.5+h1)*(1+d/(s*40)));
    ctx.fillStyle=t==='mud'?`rgba(30,22,14,${0.25})`:t==='rock'?'rgba(60,58,54,0.5)':(h1>0.5?'rgba(255,245,215,0.22)':'rgba(70,55,35,0.25)');ctx.beginPath();ctx.ellipse(sx,sy,rr*1.4,rr*0.7,0,0,TAU);ctx.fill();}
   if((t==='sand'||t==='mat')&&hash(q,99)<0.25&&s>3){const sx=sxW(wx),sy=fy+s*(3+hash(q,7)*14);ctx.strokeStyle='rgba(255,240,200,0.13)';ctx.lineWidth=Math.max(0.8,s*0.25);ctx.beginPath();ctx.moveTo(sx-s*3,sy);ctx.quadraticCurveTo(sx,sy-s*1.1,sx+s*3,sy);ctx.stroke();}}}
 // водорослевые маты — бархатный зелёный ковёр
 ctx.lineCap='round';for(let i=0;i<top.length;i+=1){const[sx,y,x]=top[i];const gi=gIdx(x);if(TY[gi]!==3||MAT[gi]<0.08)continue;const m=MAT[gi],L=lightAt(floorH(x));const n=Math.ceil(m*3);for(let k=0;k<n;k++){const h=hash(gi,k),hl=s*(0.8+1.6*h)*m;ctx.strokeStyle=`rgba(${(70+40*h)*L|0},${(120+50*h)*L|0},${(50+20*h)*L|0},0.85)`;ctx.lineWidth=Math.max(1,s*0.45);const bx=sx+h*step;ctx.beginPath();ctx.moveTo(bx,y+s*0.3);ctx.lineTo(bx+Math.sin(T_*1.5+x*0.3)*hl*0.3,y-hl);ctx.stroke();}}
}
/* ===== декор: рифы, губки, строматолиты, водоросли ===== */
let decor=[];
function genDecor(seed){
 const r=srand(seed+99);decor=[];
 const put=(k,x,o)=>decor.push(Object.assign({k,x,s:1,seed:r(),l:r()<0.62?-1:r()<0.82?0:1},o));
 for(let x=-HALF+60;x<HALF-80;x+=4){const h=floorH(x);const reef=Math.exp(-(((x+720)/330)**2));
  if(h>230&&h<450&&r()<0.01+0.09*reef){put(r()<0.55?'archaeo':'sponge',x,{s:5+r()*13});}
  if(h>360&&r()<0.007)put('strom',x,{s:12+r()*22});
  if(h>250&&r()<0.012)put('alga',x,{s:8+r()*18});
  if(r()<0.01)put(r()<0.5?'rock':'shell',x,{s:2+r()*8});
  if(h<200&&r()<0.012)put('sponge',x,{s:8+r()*16,deep:1});
  if(h<220&&r()<0.014)put('tubes',x,{s:4+r()*8});
  if(h<200&&r()<0.006)put('glow',x,{s:3+r()*5});}
 for(const d of decor){if(d.l===1)d.s*=1.25;d.z=floorH(d.x);}
 decor.sort((a,b)=>a.l-b.l);
}
function drawDecor(d){
 const s=cam.s;const lay=d.l;const ox=lay===-1?d.seed*3:0;const fz=d.z+(lay===-1?2+d.seed*3:lay===1?-5-d.seed*8:0);
 const p=proj(d.x+ox,0,fz);const S=d.s*s*(lay===-1?0.75:1);if(p[0]<-S*3||p[0]>W+S*3||p[1]<-S*4||p[1]>H+S*4)return;
 const L=lightAt(d.z)*(lay===1?0.55:1),fog=lay===-1?0.45:0;const wc=waterRGB(d.z+20);
 const col=(r,g,b,a)=>`rgba(${lerp(r*L,wc[0],fog)|0},${lerp(g*L,wc[1],fog)|0},${lerp(b*L,wc[2],fog)|0},${a==null?1:a})`;
 const sway=Math.sin(T_*1.2+d.seed*20);
 if(d.k==='archaeo'){
  const w=S*0.5,hg=S*1.5;ctx.fillStyle=col(150,120,90);ctx.fillRect(p[0]-w*0.12,p[1]-hg*0.25,w*0.24,hg*0.25);
  const g=ctx.createLinearGradient(p[0]-w,0,p[0]+w,0);g.addColorStop(0,col(120,95,70));g.addColorStop(0.4,col(215,185,145));g.addColorStop(1,col(110,85,60));ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(p[0]-w*0.25,p[1]-hg*0.22);ctx.quadraticCurveTo(p[0]-w*1.05,p[1]-hg*0.6,p[0]-w,p[1]-hg);ctx.lineTo(p[0]+w,p[1]-hg);ctx.quadraticCurveTo(p[0]+w*1.05,p[1]-hg*0.6,p[0]+w*0.25,p[1]-hg*0.22);ctx.closePath();ctx.fill();
  ctx.fillStyle=col(60,45,35,0.45);for(let q=0;q<10;q++){const u=hash(q,d.seed*999|0),v=hash(q+9,d.seed*777|0);const yy=p[1]-hg*(0.3+0.65*v),ww=w*(0.3+0.65*v);ctx.beginPath();ctx.arc(p[0]+(u-0.5)*ww*1.7,yy,Math.max(0.5,S*0.04),0,TAU);ctx.fill();}
  ctx.fillStyle=col(70,50,40);ctx.beginPath();ctx.ellipse(p[0],p[1]-hg,w,w*0.18,0,0,TAU);ctx.fill();ctx.strokeStyle=col(235,215,180,0.9);ctx.lineWidth=Math.max(0.8,S*0.05);ctx.stroke();
 }else if(d.k==='sponge'){
  const n=1+((d.seed*3.5)|0);for(let q=0;q<n;q++){const ox2=(q-(n-1)/2)*S*0.42,hg=S*(1.3+0.7*hash(q,d.seed*50|0)),w=S*0.22,lean=(q-(n-1)/2)*0.15*S;
   const base=d.deep?[140,120,150]:[170+40*d.seed,120+30*d.seed,70];const g=ctx.createLinearGradient(p[0]+ox2-w,0,p[0]+ox2+w,0);g.addColorStop(0,col(base[0]*0.6,base[1]*0.6,base[2]*0.6));g.addColorStop(0.45,col(...base));g.addColorStop(1,col(base[0]*0.5,base[1]*0.5,base[2]*0.5));ctx.fillStyle=g;
   ctx.beginPath();ctx.moveTo(p[0]+ox2-w*0.8,p[1]);ctx.bezierCurveTo(p[0]+ox2-w*1.3,p[1]-hg*0.5,p[0]+ox2-w+lean,p[1]-hg*0.8,p[0]+ox2-w*0.85+lean,p[1]-hg);ctx.lineTo(p[0]+ox2+w*0.85+lean,p[1]-hg);ctx.bezierCurveTo(p[0]+ox2+w+lean,p[1]-hg*0.8,p[0]+ox2+w*1.3,p[1]-hg*0.5,p[0]+ox2+w*0.8,p[1]);ctx.closePath();ctx.fill();
   ctx.fillStyle=col(25,18,12,0.8);ctx.beginPath();ctx.ellipse(p[0]+ox2+lean,p[1]-hg,w*0.8,w*0.22,0,0,TAU);ctx.fill();
   ctx.strokeStyle=col(255,240,210,0.18);ctx.lineWidth=Math.max(0.5,S*0.025);for(let z=1;z<6;z++){const yy=p[1]-hg*z/6;ctx.beginPath();ctx.moveTo(p[0]+ox2-w*0.9+lean*z/6,yy);ctx.lineTo(p[0]+ox2+w*0.9+lean*z/6,yy);ctx.stroke();}}
 }else if(d.k==='strom'){
  const g=ctx.createLinearGradient(0,p[1]-S*0.8,0,p[1]);g.addColorStop(0,col(150,150,105));g.addColorStop(1,col(95,85,65));ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(p[0]-S,p[1]);ctx.bezierCurveTo(p[0]-S,p[1]-S*0.9,p[0]+S,p[1]-S*0.9,p[0]+S,p[1]);ctx.closePath();ctx.fill();
  ctx.strokeStyle=col(60,55,40,0.5);ctx.lineWidth=Math.max(0.6,S*0.025);for(let q=1;q<6;q++){const k=1-q*0.15;ctx.beginPath();ctx.moveTo(p[0]-S*k,p[1]);ctx.bezierCurveTo(p[0]-S*k,p[1]-S*0.9*k,p[0]+S*k,p[1]-S*0.9*k,p[0]+S*k,p[1]);ctx.stroke();}
  ctx.fillStyle=col(70,120,55,0.6);ctx.beginPath();ctx.ellipse(p[0],p[1]-S*0.66,S*0.55,S*0.1,0,0,TAU);ctx.fill();
 }else if(d.k==='alga'){
  ctx.lineCap='round';const n=3+((d.seed*4)|0);for(let q=0;q<n;q++){const hg=S*(0.8+0.6*hash(q,d.seed*40|0)),bx=p[0]+(q-n/2)*S*0.12;ctx.strokeStyle=col(90+30*hash(q,2),120+30*d.seed,60,0.85);ctx.lineWidth=Math.max(0.8,S*0.06);ctx.beginPath();ctx.moveTo(bx,p[1]);for(let k=1;k<=8;k++){const u=k/8;ctx.lineTo(bx+Math.sin(T_*1.4+q+u*3)*S*0.18*u+sway*S*0.2*u,p[1]-hg*u);}ctx.stroke();}
 }else if(d.k==='rock'){const g=ctx.createLinearGradient(0,p[1]-S*0.7,0,p[1]);g.addColorStop(0,col(140,135,125));g.addColorStop(1,col(70,66,60));ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(p[0],p[1]-S*0.2,S*0.8,S*0.45,d.seed*0.4-0.2,Math.PI,TAU);ctx.lineTo(p[0]+S*0.8,p[1]);ctx.closePath();ctx.fill();}
 else if(d.k==='tubes'){const n=3+((d.seed*5)|0);for(let q=0;q<n;q++){const bx=p[0]+(q-n/2)*S*0.35,hg=S*(1+1.2*hash(q,d.seed*70|0));ctx.strokeStyle=col(200,190,170,0.9);ctx.lineWidth=Math.max(1,S*0.16);ctx.beginPath();ctx.moveTo(bx,p[1]);ctx.quadraticCurveTo(bx+S*0.1,p[1]-hg*0.5,bx+sway*S*0.08,p[1]-hg);ctx.stroke();const out=0.5+0.5*Math.sin(T_*1.3+q*2+d.seed*9);if(out>0.3){ctx.strokeStyle=`rgba(255,${150+60*q%100},120,${0.75*out})`;ctx.lineWidth=Math.max(0.6,S*0.05);for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(bx+sway*S*0.08,p[1]-hg);ctx.lineTo(bx+sway*S*0.08+k*S*0.12*out,p[1]-hg-S*0.35*out);ctx.stroke();}}}}
 else if(d.k==='glow'){const a=0.5+0.5*Math.sin(T_*0.8+d.seed*20);const g=ctx.createRadialGradient(p[0],p[1]-S*0.6,0,p[0],p[1]-S*0.6,S*2.2);g.addColorStop(0,`rgba(110,255,220,${0.35*a})`);g.addColorStop(1,'rgba(110,255,220,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p[0],p[1]-S*0.6,S*2.2,0,TAU);ctx.fill();ctx.fillStyle=`rgba(170,255,235,${0.6+0.4*a})`;for(let q=0;q<5;q++){ctx.beginPath();ctx.arc(p[0]+(hash(q,d.seed*90|0)-0.5)*S,p[1]-S*(0.2+0.9*hash(q+4,2)),Math.max(0.8,S*0.1),0,TAU);ctx.fill();}}
 else{ctx.fillStyle=col(230,220,195,0.9);ctx.beginPath();ctx.ellipse(p[0],p[1]-S*0.12,S*0.4,S*0.22,0,Math.PI,TAU);ctx.fill();ctx.strokeStyle=col(140,120,90,0.6);ctx.lineWidth=Math.max(0.5,S*0.04);for(let q=-2;q<=2;q++){ctx.beginPath();ctx.moveTo(p[0],p[1]-S*0.05);ctx.lineTo(p[0]+q*S*0.15,p[1]-S*0.3);ctx.stroke();}}
}
/* ===== морской снег, боке, тьма ===== */
const snow=[];for(let i=0;i<170;i++)snow.push({x:R_(),y:R_(),z:rnd(0.3,1.4),s:rnd(0.5,1.6),ph:R_()*9});
const bokeh=[];for(let i=0;i<9;i++)bokeh.push({x:R_(),y:R_(),r:rnd(14,40),v:rnd(0.004,0.012)});
function drawSnow(dt){ctx.setTransform(DPR,0,0,DPR,0,0);const L=0.4+0.6*lightAt(cam.z);
 for(const p of snow){p.y+=dt*0.008*p.z;p.x+=Math.sin(T_*0.3+p.ph)*dt*0.002;if(p.y>1)p.y-=1;const px=((p.x*W-cam.x*cam.s*0.25*p.z)%W+W)%W,py=((p.y*H+cam.z*cam.s*0.25*p.z)%H+H)%H;ctx.fillStyle=`rgba(225,240,240,${0.2*p.z*L})`;ctx.beginPath();ctx.arc(px,py,p.s*p.z,0,TAU);ctx.fill();}
 for(const b of bokeh){b.y+=dt*b.v;if(b.y>1.1)b.y=-0.1;const px=((b.x*W-cam.x*cam.s*1.6)%(W+120)+W+120)%(W+120)-60,py=(((b.y*H+cam.z*cam.s*1.6)%(H+120))+H+120)%(H+120)-60;const g=ctx.createRadialGradient(px,py,0,px,py,b.r);g.addColorStop(0,`rgba(230,245,240,${0.07*L})`);g.addColorStop(1,'rgba(230,245,240,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,b.r,0,TAU);ctx.fill();}}
function drawDark(px,py,depthZ,eyeQ){ctx.setTransform(DPR,0,0,DPR,0,0);const dark=clamp((1-depthZ/SURF)*0.62-0.1,0,0.55)*(1-0.55*eyeQ);
 const g=ctx.createRadialGradient(px,py,Math.min(W,H)*0.14,px,py,Math.max(W,H)*0.72);g.addColorStop(0,`rgba(1,6,14,${dark*0.2})`);g.addColorStop(1,`rgba(1,6,14,${Math.min(0.75,dark+0.18)})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
