/* ===== утилиты ===== */
const $=id=>document.getElementById(id);
const TAU=Math.PI*2,R_=Math.random,rnd=(a,b)=>a+R_()*(b-a),pick=a=>a[(R_()*a.length)|0],clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
function hash(a,b){let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;}
function srand(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let NSEED=1;
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const a=hash(xi*7+NSEED,yi*13-NSEED),b=hash(xi*7+7+NSEED,yi*13-NSEED),c=hash(xi*7+NSEED,yi*13+13-NSEED),d=hash(xi*7+7+NSEED,yi*13+13-NSEED);const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,o){let s=0,a=0.5,f=1,t=0;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);t+=a;a*=0.5;f*=2.03;}return s/t;}

const cv=$('cv');let ctx=cv.getContext('2d');let W=1,H=1,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';}
addEventListener('resize',resize);resize();

/* ===== мир ===== */
const SURF=520,HALF=2500,T=20,GN=Math.floor(HALF*2/T)+1;
let HM=new Float32Array(GN*GN),TY=new Uint8Array(GN*GN),MAT=new Float32Array(GN*GN);
const TYPES_FLOOR=['sand','mud','rock','mat'];
function genWorld(seed){
 NSEED=seed%100000;
 for(let j=0;j<GN;j++)for(let i=0;i<GN;i++){
  const x=-HALF+i*T,y=-HALF+j*T;
  let h=230+170*(fbm(x/900+3,y/900-2,4)-0.5)*2;
  h+=180*Math.exp(-(((x+1400)**2+(y+1400)**2)/(1400*1400)));
  h-=210*Math.exp(-(((x-1250)**2+(y-1050)**2)/(1100*1100)));
  h+=46*(fbm(x/140,y/140,2)-0.5);
  const edge=Math.max(Math.abs(x),Math.abs(y));if(edge>HALF-300)h-= (edge-(HALF-300))*0.35;
  h=clamp(h,14,465);HM[j*GN+i]=h;
 }
 for(let j=0;j<GN;j++)for(let i=0;i<GN;i++){
  const k=j*GN+i,h=HM[k];const x=-HALF+i*T,y=-HALF+j*T;
  const sl=Math.abs(HM[Math.min(GN*GN-1,k+1)]-h)+Math.abs(HM[Math.min(GN*GN-1,k+GN)]-h);
  let t=0;if(h<175)t=1;else if(sl>13)t=2;else if(h>335&&fbm(x/260,y/260,2)>0.52)t=3;
  TY[k]=t;MAT[k]=t===3?1:0;
 }
}
function gIdx(x,y){const i=clamp(Math.round((x+HALF)/T),0,GN-1),j=clamp(Math.round((y+HALF)/T),0,GN-1);return j*GN+i;}
function floorH(x,y){const fx=clamp((x+HALF)/T,0,GN-1.001),fy=clamp((y+HALF)/T,0,GN-1.001);const i=Math.floor(fx),j=Math.floor(fy),u=fx-i,v=fy-j;const k=j*GN+i;const a=HM[k],b=HM[k+1],c=HM[k+GN],d=HM[k+GN+1];return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function floorType(x,y){return TYPES_FLOOR[TY[gIdx(x,y)]];}
function o2At(z){return clamp(0.12+0.88*Math.pow(clamp(z/SURF,0,1),0.9),0,1);}
function zoneAt(x,y){const h=floorH(x,y);return h>335?'shelf':h>175?'slope':'deep';}
const ZONES={shelf:{ru:'Солнечный шельф',info:'Мелководье: много света и кислорода, водорослевые маты — пастбище для травоядных.'},slope:{ru:'Склон с рифами',info:'Рифы из археоциат и губок, трилобиты, хищники охотятся у кромки.'},deep:{ru:'Тёмная впадина',info:'Мало света и кислорода — без жабр долго не продержаться. Зато много падали и древних хищников.'}};

/* ===== камера и проекция ===== */
const cam={x:0,y:0,z:300,s:6,ts:6,u:0,v:0};
const C30=0.866;
function proj(x,y,z){return[((x-y)*C30-cam.u)*cam.s+W/2,((x+y)*0.5-z-cam.v)*cam.s+H/2];}
function camUpdate(tx,ty,tz,dt){cam.x+=(tx-cam.x)*Math.min(1,dt*4);cam.y+=(ty-cam.y)*Math.min(1,dt*4);cam.z+=(tz-cam.z)*Math.min(1,dt*4);cam.s+=(cam.ts-cam.s)*Math.min(1,dt*2);cam.u=(cam.x-cam.y)*C30;cam.v=(cam.x+cam.y)*0.5-cam.z;}
function screenToWorld(sx,sy,z){const u=(sx-W/2)/cam.s+cam.u,v=(sy-H/2)/cam.s+cam.v;const s=2*(v+z),d=u/C30;return[(s+d)/2,(s-d)/2];}

/* ===== отрисовка дна ===== */
const FCOL={sand:[196,178,128],mud:[96,84,64],rock:[128,124,116],mat:[92,126,70]};
let T_=0;
function shadeCol(c,f,depth){const fog=clamp(1-depth/SURF,0,1);const wr=18,wg=58,wb=88;const k=0.35+0.65*fog;return`rgb(${(c[0]*f*k+wr*(1-k))|0},${(c[1]*f*k+wg*(1-k))|0},${(c[2]*f*k+wb*(1-k))|0})`;}
function drawFloor(){
 const px=T*cam.s;const step=Math.max(1,Math.floor(10/px)+ (px<4?1:0));
 const ci=Math.round((cam.x+HALF)/T),cj=Math.round((cam.y+HALF)/T);
 const span=Math.ceil((Math.hypot(W,H)/cam.s)/T*0.75)+4;
 const i0=clamp(ci-span,0,GN-2),i1=clamp(ci+span,0,GN-2),j0=clamp(cj-span,0,GN-2),j1=clamp(cj+span,0,GN-2);
 ctx.setTransform(DPR,0,0,DPR,0,0);
 for(let s=i0+j0;s<=i1+j1;s+=step){
  for(let i=Math.max(i0,s-j1);i<=Math.min(i1,s-j0);i+=step){
   const j=s-i;if(j<j0||j>j1||(j-j0)%step)continue;
   const i2=Math.min(GN-1,i+step),j2=Math.min(GN-1,j+step);
   const x0=-HALF+i*T,y0=-HALF+j*T,x1=-HALF+i2*T,y1=-HALF+j2*T;
   const h00=HM[j*GN+i],h10=HM[j*GN+i2],h01=HM[j2*GN+i],h11=HM[j2*GN+i2];
   const a=proj(x0,y0,h00),b=proj(x1,y0,h10),c=proj(x1,y1,h11),d=proj(x0,y1,h01);
   if((a[0]<-px*step*2&&b[0]<-px*step*2&&c[0]<-px*step*2)||(a[0]>W+px*step*2&&d[0]>W+px*step*2&&c[0]>W+px*step*2))continue;
   if(c[1]<-px*2||a[1]>H+px*4)continue;
   const nx=(h00-h10+h01-h11)*0.5,ny=(h00-h01+h10-h11)*0.5;const lit=clamp(0.82+(nx*0.6+ny*0.25)/(T*step)*1.4,0.45,1.25);
   const k=j*GN+i,ty=TYPES_FLOOR[TY[k]],hm=(h00+h11)*0.5;
   let col=FCOL[ty];if(ty==='mat'){const m=MAT[k];col=[lerp(196,92,m),lerp(178,126,m),lerp(128,70,m)];}
   let f=lit;if(hm>250){const cz=Math.sin(x0*0.045+T_*1.1)+Math.sin(y0*0.052-T_*1.4)+Math.sin((x0+y0)*0.03+T_*0.7);f+=clamp(cz,0,3)*0.05*((hm-250)/215);}
   ctx.fillStyle=shadeCol(col,f,SURF-hm);
   ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.closePath();ctx.fill();
   if(step===1&&px>26){const n=ty==='mud'?3:ty==='rock'?2:4;ctx.fillStyle=ty==='rock'?'rgba(40,40,40,0.25)':'rgba(255,255,255,0.12)';for(let q=0;q<n;q++){const u=hash(i*3+q,j),v=hash(j*5+q,i+3);const p=proj(x0+u*T,y0+v*T,hm);ctx.fillRect(p[0],p[1],Math.max(1,px*0.05),Math.max(1,px*0.04));}}
  }
 }
}
/* ===== декор: рифы, губки, строматолиты ===== */
let decor=[];
function genDecor(seed){
 const r=srand(seed+99);decor=[];
 for(let c=0;c<26;c++){let x,y,h,ok=false;for(let k=0;k<60;k++){x=(r()-0.5)*HALF*1.8;y=(r()-0.5)*HALF*1.8;h=floorH(x,y);if(h>240&&h<430){ok=true;break;}}if(!ok)continue;
  const n=8+((r()*14)|0);for(let q=0;q<n;q++){const a=r()*TAU,d=r()*140;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;decor.push({k:r()<0.6?'archaeo':'sponge',x:px,y:py,s:6+r()*16,seed:r(),hue:r()});}}
 for(let c=0;c<14;c++){let x,y,ok=false;for(let k=0;k<60;k++){x=(r()-0.5)*HALF*1.8;y=(r()-0.5)*HALF*1.8;if(floorH(x,y)>370){ok=true;break;}}if(!ok)continue;const n=3+((r()*5)|0);for(let q=0;q<n;q++)decor.push({k:'strom',x:x+(r()-0.5)*120,y:y+(r()-0.5)*120,s:14+r()*26,seed:r()});}
 for(let c=0;c<120;c++){const x=(r()-0.5)*HALF*1.9,y=(r()-0.5)*HALF*1.9;decor.push({k:r()<0.5?'rock':'shell',x,y,s:3+r()*12,seed:r()});}
 for(const d of decor)d.z=floorH(d.x,d.y);
}
function drawDecor(d){
 const p=proj(d.x,d.y,d.z),s=cam.s,S=d.s*s;if(p[0]<-S*3||p[0]>W+S*3||p[1]<-S*4||p[1]>H+S*2)return;
 const fog=clamp(1-(SURF-d.z)/SURF,0,1),k=0.4+0.6*fog;
 if(d.k==='archaeo'){
  const w=S*0.55,hgt=S*1.4;ctx.fillStyle=`rgba(${(200*k+20)|0},${(170*k+40)|0},${(130*k+60)|0},0.95)`;ctx.beginPath();ctx.moveTo(p[0]-w*0.45,p[1]);ctx.lineTo(p[0]-w,p[1]-hgt);ctx.lineTo(p[0]+w,p[1]-hgt);ctx.lineTo(p[0]+w*0.45,p[1]);ctx.closePath();ctx.fill();
  ctx.strokeStyle=`rgba(80,60,40,${0.5*k})`;ctx.lineWidth=Math.max(0.6,S*0.04);for(let q=1;q<4;q++){const yy=p[1]-hgt*q/4,ww=w*(0.45+0.55*q/4);ctx.beginPath();ctx.moveTo(p[0]-ww,yy);ctx.lineTo(p[0]+ww,yy);ctx.stroke();}
  ctx.fillStyle=`rgba(40,30,25,${0.6*k})`;ctx.beginPath();ctx.ellipse(p[0],p[1]-hgt,w,w*0.38,0,0,TAU);ctx.fill();ctx.strokeStyle=`rgba(230,210,170,${0.8*k})`;ctx.lineWidth=Math.max(0.8,S*0.05);ctx.stroke();
  ctx.fillStyle=`rgba(60,45,30,${0.35*k})`;for(let q=0;q<6;q++){ctx.beginPath();ctx.arc(p[0]+(hash(q,d.seed*99|0)-0.5)*w*1.2,p[1]-hgt*(0.2+0.6*hash(q+3,7)),S*0.05,0,TAU);ctx.fill();}
 }else if(d.k==='sponge'){
  const n=2+((d.seed*3)|0);for(let q=0;q<n;q++){const ox=(q-(n-1)/2)*S*0.45,hg=S*(1+0.6*hash(q,d.seed*50|0)),w=S*0.22;const col=`hsla(${(20+d.hue*40)|0},45%,${(30+28*k)|0}%,0.95)`;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(p[0]+ox-w,p[1]);ctx.quadraticCurveTo(p[0]+ox-w*1.3,p[1]-hg*0.6,p[0]+ox-w*0.9,p[1]-hg);ctx.lineTo(p[0]+ox+w*0.9,p[1]-hg);ctx.quadraticCurveTo(p[0]+ox+w*1.3,p[1]-hg*0.6,p[0]+ox+w,p[1]);ctx.fill();
   ctx.fillStyle='rgba(20,15,10,0.55)';ctx.beginPath();ctx.ellipse(p[0]+ox,p[1]-hg,w*0.85,w*0.32,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(0,0,0,0.18)';for(let z=0;z<5;z++){ctx.beginPath();ctx.arc(p[0]+ox+(hash(z,q)-0.5)*w*1.4,p[1]-hg*hash(z+2,q+1),S*0.035,0,TAU);ctx.fill();}}
 }else if(d.k==='strom'){
  ctx.fillStyle=`rgba(${(150*k+30)|0},${(140*k+40)|0},${(110*k+50)|0},0.95)`;ctx.beginPath();ctx.ellipse(p[0],p[1]-S*0.25,S*0.9,S*0.5,0,Math.PI,TAU);ctx.lineTo(p[0]+S*0.9,p[1]);ctx.ellipse(p[0],p[1],S*0.9,S*0.32,0,0,Math.PI);ctx.fill();
  ctx.strokeStyle=`rgba(70,60,45,${0.45*k})`;ctx.lineWidth=Math.max(0.6,S*0.03);for(let q=1;q<4;q++){ctx.beginPath();ctx.ellipse(p[0],p[1]-S*0.25+q*S*0.08,S*0.9*(1-q*0.12),S*0.45*(1-q*0.15),0,Math.PI,TAU);ctx.stroke();}
  ctx.fillStyle=`rgba(80,140,70,${0.5*k})`;ctx.beginPath();ctx.ellipse(p[0],p[1]-S*0.7,S*0.5,S*0.16,0,0,TAU);ctx.fill();
 }else if(d.k==='rock'){ctx.fillStyle=`rgba(${(110*k+20)|0},${(105*k+30)|0},${(100*k+40)|0},0.95)`;ctx.beginPath();ctx.ellipse(p[0],p[1]-S*0.2,S*0.6,S*0.35,d.seed,0,TAU);ctx.fill();}
 else{ctx.strokeStyle=`rgba(${(220*k+20)|0},${(210*k+30)|0},${(190*k+40)|0},0.8)`;ctx.lineWidth=Math.max(0.6,S*0.08);ctx.beginPath();ctx.arc(p[0],p[1],S*0.3,Math.PI,TAU);ctx.stroke();}
}
/* ===== вода: снег, лучи, тьма ===== */
const snow=[];for(let i=0;i<140;i++)snow.push({x:R_(),y:R_(),z:rnd(0.3,1.3),s:rnd(0.5,1.6)});
function drawSnow(dt){ctx.setTransform(DPR,0,0,DPR,0,0);for(const p of snow){p.y+=dt*0.01*p.z;p.x+=Math.sin(T_*0.3+p.s*9)*dt*0.003;if(p.y>1)p.y-=1;if(p.x<0)p.x+=1;if(p.x>1)p.x-=1;const px=((p.x*W-cam.u*cam.s*0.2*p.z)%W+W)%W,py=((p.y*H-cam.v*cam.s*0.2*p.z)%H+H)%H;ctx.fillStyle=`rgba(220,240,255,${0.18*p.z})`;ctx.beginPath();ctx.arc(px,py,p.s*p.z,0,TAU);ctx.fill();}}
function drawRays(depthZ){const a=clamp(depthZ/SURF,0,1)*0.09;if(a<0.01)return;ctx.setTransform(DPR,0,0,DPR,0,0);for(let i=0;i<5;i++){const x=((i*0.23+T_*0.006)%1.2-0.1)*W;const g=ctx.createLinearGradient(x,0,x-W*0.25,H);g.addColorStop(0,`rgba(200,240,255,${a})`);g.addColorStop(1,'rgba(200,240,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-30,0);ctx.lineTo(x+40,0);ctx.lineTo(x-W*0.25+80,H);ctx.lineTo(x-W*0.25-40,H);ctx.fill();}}
function drawDark(px,py,depthZ,eyeQ){const dark=clamp((1-depthZ/SURF)*0.75-0.08,0,0.78)*(1-0.55*eyeQ);if(dark<0.02)return;ctx.setTransform(DPR,0,0,DPR,0,0);const g=ctx.createRadialGradient(px,py,Math.min(W,H)*0.12,px,py,Math.max(W,H)*0.7);g.addColorStop(0,`rgba(2,8,16,${dark*0.25})`);g.addColorStop(1,`rgba(2,8,16,${dark})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
