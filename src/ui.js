(function(){
'use strict';
const E=EVO,S=E.S,G=E.G;
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d'),view=$('view');
const terr=document.createElement('canvas');terr.width=E.TW;terr.height=E.TH;
const tctx=terr.getContext('2d');const img=tctx.createImageData(E.TW,E.TH);
const BC=[[24,50,88],[40,90,135],[214,198,150],[150,168,88],[58,108,56],[212,182,112],[148,160,150],[118,108,98],[232,238,245]];
let W=0,H=0,dpr=1,cam={x:0,y:0,z:1};
let speed=1,running=false,frame=0,selC=null,selSp=-1,mySp=0,follow=false,lostShown=false,wonShown=false;
let simDays=0,simT0=performance.now(),dps=0;
const SAVE_KEY='evo_save_v1';

function resize(){const r=view.getBoundingClientRect();dpr=window.devicePixelRatio||1;W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
function fit(){cam.z=Math.min(W/E.WW,H/E.WH);cam.x=(E.WW-W/cam.z)/2;cam.y=(E.WH-H/cam.z)/2;}
window.addEventListener('resize',()=>{resize();});

function drawTerrain(){
 const d=img.data,B=S.biome,P=S.plant,M=S.meat,cap=E.PLANT_CAP;
 for(let i=0;i<B.length;i++){
  const b=B[i],c=BC[b];let r=c[0],g=c[1],bl=c[2];
  const f=Math.min(1,P[i]/(cap[b]||1));
  if(b>=2&&b!==8){r*=1.05-0.3*f;g*=0.9+0.12*f;bl*=1.0-0.25*f;}
  else if(b<=1){g+=f*10;}
  if(M[i]>1.5){r=Math.min(255,r+35);g*=0.9;}
  const o=i*4;d[o]=r;d[o+1]=g;d[o+2]=bl;d[o+3]=255;
 }
 tctx.putImageData(img,0,0);
}
function render(){
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b0d12';ctx.fillRect(0,0,cv.width,cv.height);
 const z=cam.z*dpr;ctx.setTransform(z,0,0,z,-cam.x*z,-cam.y*z);
 ctx.imageSmoothingEnabled=false;ctx.drawImage(terr,0,0,E.WW,E.WH);
 const x0=cam.x-10,y0=cam.y-10,x1=cam.x+W/cam.z+10,y1=cam.y+H/cam.z+10;
 const minR=1.3/cam.z,detail=cam.z>2.4,lw=1/cam.z;
 const cs=E.cs,sp=S.species;
 for(let i=0;i<cs.length;i++){
  const c=cs[i];if(c.x<x0||c.x>x1||c.y<y0||c.y>y1)continue;
  const s=sp[c.sp];const r=Math.max(c.r,minR);
  if(c.hidden>0){ctx.fillStyle='rgba(40,30,20,.8)';ctx.fillRect(c.x-r*0.6,c.y-r*0.6,r*1.2,r*1.2);continue;}
  ctx.fillStyle=s.col;
  if(cam.z>1.3){ctx.beginPath();ctx.arc(c.x,c.y,r,0,6.2832);ctx.fill();}else ctx.fillRect(c.x-r,c.y-r,r*2,r*2);
  if(s.player&&cam.z>0.6){ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=lw*1.4;if(cam.z>1.3){ctx.beginPath();ctx.arc(c.x,c.y,r+lw,0,6.2832);ctx.stroke();}else ctx.strokeRect(c.x-r-lw,c.y-r-lw,r*2+lw*2,r*2+lw*2);}
  if(c.sp===selSp){ctx.strokeStyle='#ffe070';ctx.lineWidth=lw*1.5;ctx.beginPath();ctx.arc(c.x,c.y,r+2*lw+1,0,6.2832);ctx.stroke();}
  if(detail)drawDetail(c,r,lw);
 }
 if(selC&&!selC.dead){
  ctx.strokeStyle='#fff';ctx.lineWidth=lw*2;ctx.beginPath();ctx.arc(selC.x,selC.y,selC.r+6*lw+2,0,6.2832);ctx.stroke();
  ctx.beginPath();ctx.arc(selC.x,selC.y,selC.sense,0,6.2832);ctx.strokeStyle='rgba(255,255,255,.18)';ctx.stroke();
  const t=selC.target||selC.threat;if(t&&!t.dead){ctx.strokeStyle=selC.target?'rgba(255,90,90,.8)':'rgba(255,220,90,.8)';ctx.beginPath();ctx.moveTo(selC.x,selC.y);ctx.lineTo(t.x,t.y);ctx.stroke();}
 }
 for(const f of S.fx){if(f.t==='meteor'){const a=1-f.age/180;ctx.strokeStyle='rgba(255,140,40,'+a+')';ctx.lineWidth=lw*3;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(0.3+f.age/120),0,6.2832);ctx.stroke();ctx.fillStyle='rgba(255,120,30,'+(a*0.25)+')';ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,6.2832);ctx.fill();}}
 ctx.setTransform(1,0,0,1,0,0);
 const dark=(1-S.light)*0.45+Math.min(0.25,S.dust*0.03);
 if(dark>0.01){ctx.fillStyle='rgba(8,12,35,'+dark.toFixed(3)+')';ctx.fillRect(0,0,cv.width,cv.height);}
}
function drawDetail(c,r,lw){
 const m=c.m,MB=E.MB;const a=Math.atan2(c.vy,c.vx),ca=Math.cos(a),sa=Math.sin(a);
 ctx.lineWidth=lw*1.2;ctx.strokeStyle='rgba(20,20,25,.9)';
 if(m&MB.shell){ctx.beginPath();ctx.arc(c.x,c.y,r*0.75,0,6.2832);ctx.stroke();}
 if(m&MB.horns){ctx.beginPath();for(const s of[-0.5,0.5]){const b=a+s;ctx.moveTo(c.x+Math.cos(b)*r,c.y+Math.sin(b)*r);ctx.lineTo(c.x+Math.cos(a+s*0.6)*r*1.8,c.y+Math.sin(a+s*0.6)*r*1.8);}ctx.stroke();}
 if(m&MB.wings){ctx.strokeStyle='rgba(235,235,255,.8)';ctx.beginPath();ctx.moveTo(c.x-sa*r*2.2,c.y+ca*r*2.2);ctx.lineTo(c.x+sa*r*2.2,c.y-ca*r*2.2);ctx.stroke();}
 if(m&MB.fins){ctx.strokeStyle='rgba(120,200,255,.9)';ctx.beginPath();ctx.moveTo(c.x-ca*r,c.y-sa*r);ctx.lineTo(c.x-ca*r*1.9-sa*r*0.6,c.y-sa*r*1.9+ca*r*0.6);ctx.moveTo(c.x-ca*r,c.y-sa*r);ctx.lineTo(c.x-ca*r*1.9+sa*r*0.6,c.y-sa*r*1.9-ca*r*0.6);ctx.stroke();}
 if(c.g[G.attack]>0.6){ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(c.x+ca*r*0.8-lw,c.y+sa*r*0.8-lw,lw*2,lw*2);}
 if(c.sick>0){ctx.fillStyle='rgba(160,255,80,.9)';ctx.fillRect(c.x-lw,c.y-r-3*lw,lw*2,lw*2);}
}

/* input */
let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,moved:false};cv.setPointerCapture(e.pointerId);cv.classList.add('drag');});
cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;if(drag.moved){cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;follow=false;}});
cv.addEventListener('pointerup',e=>{cv.classList.remove('drag');if(drag&&!drag.moved)pickAt(e);drag=null;});
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;const wx=cam.x+mx/cam.z,wy=cam.y+my/cam.z;
 const nz=Math.max(Math.min(W/E.WW,H/E.WH)*0.8,Math.min(8,cam.z*Math.exp(-e.deltaY*0.0015)));cam.z=nz;cam.x=wx-mx/nz;cam.y=wy-my/nz;},{passive:false});
function pickAt(e){
 const r=cv.getBoundingClientRect();const wx=cam.x+(e.clientX-r.left)/cam.z,wy=cam.y+(e.clientY-r.top)/cam.z;
 let best=null,bd=1e9;
 for(const c of E.cs){const d=Math.sqrt((c.x-wx)**2+(c.y-wy)**2)-c.r;if(d<bd&&d<12/cam.z){bd=d;best=c;}}
 selC=best;if(best){selSp=best.sp;if(S.species[best.sp].player)mySp=best.sp;}
 updatePanels();
}
document.addEventListener('keydown',e=>{
 if(e.target.tagName==='INPUT')return;
 if(e.code==='Space'){e.preventDefault();setSpeed(speed===0?1:0);}
 const k=['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6'].indexOf(e.code);if(k>=0)setSpeed([0,1,3,10,30,100][k]);
 if(e.code==='KeyF'&&selC)follow=!follow;
});
function setSpeed(s){speed=s;document.querySelectorAll('#speeds button').forEach(b=>b.classList.toggle('on',+b.dataset.s===s));}
$('speeds').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setSpeed(+b.dataset.s);});

/* toasts */
function toast(text,cls){const d=document.createElement('div');d.className='toast '+(cls||'');d.textContent=text;$('toasts').prepend(d);setTimeout(()=>d.remove(),7000);while($('toasts').children.length>4)$('toasts').lastChild.remove();}
S.onLog=(text,type)=>{
 if(type==='cat')toast(text);else if(type==='epoch')toast(text,'epoch');else if(type==='win'||type==='mine')toast(text,'good');else if(type==='mineBad'||type==='war')toast(text,'bad');
 logDirty=true;
};
let logDirty=true;

/* panels */
const fmtDay=d=>'год '+(Math.floor(d/E.YEAR_DAYS)+1)+', день '+(d%E.YEAR_DAYS+1);
const dietName=d=>d<0.35?'травоядный':d<0.6?'всеядный':'хищник';
function hud(){
 const T=E.tempAt(E.WW/2,E.WH/2);
 $('hud').innerHTML='<b>'+fmtDay(S.day)+'</b> · '+S.seasonName+' (север) · '+(S.light>0.35?'день':'ночь')+' · <b>'+S.epoch.name+'</b><br>'+
  'Особей: <b>'+E.cs.length+'</b> · видов живо: <b>'+S.species.filter(s=>s.count>0).length+'</b> · твоя линия: <b style="color:#9fe0a8">'+S.playerCount+'</b> ('+(E.cs.length?Math.round(S.playerCount/E.cs.length*100):0)+'%) · экватор '+T.toFixed(0)+'°C'+
  (S.growMul<1?' · <span style="color:#f0c060">засуха</span>':S.growMul>1?' · <span style="color:#9fe0a8">благодать</span>':'')+(S.dust>0.5?' · <span style="color:#f0a060">пыльная зима</span>':'');
 $('simspeed').textContent=speed===0?'пауза':dps.toFixed(1)+' дн/сек';
}
const GROUPS=[['Тело',['size','speed','life','fert','hue']],['Оружие и защита',['attack','armor','venom','camo']],['Чувства и ум',['sense','night','intel']],['Поведение',['diet','social','aggr','fear','rot']],['Среда',['topt','ttol','swim','fly','dig']],['Наследственность',['mut']]];
const GATE={venom:'venom',armor:'shell',camo:'chroma',night:'eyes',intel:'brain',swim:'fins',fly:'wings',dig:'claws',rot:'stomach'};
function playerSpecies(){return S.species.filter(s=>s.player&&s.count>0).sort((a,b)=>b.count-a.count);}
function renderMine(){
 const list=playerSpecies();
 $('ep').textContent='очки эволюции: '+Math.floor(S.ep);
 if(!list.length){$('mine').innerHTML='<span style="color:#ff8a8a">Твоя линия вымерла.</span> <span class="muted">Можно наблюдать дальше или сотворить новый мир.</span>';return;}
 if(!list.find(s=>s.id===mySp))mySp=list[0].id;
 const sp=S.species[mySp],st=E.speciesStats(mySp);
 let h='<div class="row" style="margin-bottom:6px">';
 if(list.length>1){h+='<select id="mySel" style="background:#0f1218;color:#fff;border:1px solid #2f3646;border-radius:6px;padding:3px;max-width:100%">'+list.map(s=>'<option value="'+s.id+'"'+(s.id===mySp?' selected':'')+'>'+s.name+' ('+s.count+')</option>').join('')+'</select>';}
 h+='</div><div><span class="dot" style="background:'+sp.col+'"></span><b>'+sp.name+'</b> · '+st.n+' особей · '+dietName(st.avg[G.diet])+' · поколение ≈'+st.gen.toFixed(0)+'</div>';
 h+='<div class="muted small">В твоей линии '+list.length+' '+plural(list.length,'вид','вида','видов')+'. Мутация признака: 5 очков, новый орган: '+E.moduleCost(0)+'. Очки копятся от численности линии и новых видов.</div>';
 h+='<div class="genes" id="genes">';
 for(const[gname,keys]of GROUPS){h+='<div class="grp">'+gname+'</div>';
  for(const k of keys){const gi=G[k],v=st.avg[gi];let warn='';
   if(GATE[k]){const mk=E.MODS.findIndex(m=>m.k===GATE[k]);if(st.mc[mk]*2<st.n)warn=' <span class="warn" title="без органа «'+E.MODS[mk].ru+'» признак работает слабо">⚠</span>';}
   const bar=k==='hue'?'<div class="bar"><i style="width:100%;background:hsl('+(v*360).toFixed(0)+',70%,55%)"></i></div>':'<div class="bar"><i style="width:'+(v*100).toFixed(0)+'%"></i></div>';
   h+='<div>'+E.GENE_RU[k]+warn+'</div>'+bar+'<button data-g="'+gi+'" data-d="-1" '+(S.ep<5?'disabled':'')+'>−</button><button data-g="'+gi+'" data-d="1" '+(S.ep<5?'disabled':'')+'>+</button>';}}
 h+='</div><div class="grp muted small" style="margin-top:8px;text-transform:uppercase;letter-spacing:.06em">Органы</div><div class="mods">';
 E.MODS.forEach((m,k)=>{const share=st.n?st.mc[k]/st.n:0;const has=share>=0.5;
  h+='<div title="'+m.hint+'">'+m.ru+' <span class="muted small">'+(share>0?Math.round(share*100)+'%':'')+'</span></div>'+
  (has?'<button data-rm="'+k+'" '+(S.ep<10?'disabled':'')+'>убрать (10)</button>':'<button data-mod="'+k+'" '+(S.ep<E.moduleCost(k)?'disabled':'')+'>вырастить</button>');});
 h+='</div>';
 $('mine').innerHTML=h;
 const sel=$('mySel');if(sel)sel.onchange=()=>{mySp=+sel.value;selSp=mySp;renderMine();};
}
function plural(n,a,b,c){n=Math.abs(n)%100;const n1=n%10;if(n>10&&n<20)return c;if(n1>1&&n1<5)return b;if(n1===1)return a;return c;}
$('mine').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.g){if(E.nudgeGene(mySp,+b.dataset.g,+b.dataset.d))renderMine();}
 else if(b.dataset.mod){if(E.grantModule(mySp,+b.dataset.mod))renderMine();}
 else if(b.dataset.rm){if(E.removeModule(mySp,+b.dataset.rm))renderMine();}
});
function renderSpecies(){
 const live=S.species.filter(s=>s.count>=3||(s.player&&s.count>0)).sort((a,b)=>b.count-a.count).slice(0,14);
 $('splist').innerHTML='<tr class="muted small"><td>вид</td><td>особей</td><td>питание</td><td>возраст</td></tr>'+live.map(s=>'<tr class="sp'+(s.id===selSp?' sel':'')+'" data-id="'+s.id+'"><td><span class="dot" style="background:'+s.col+'"></span>'+(s.player?'★ ':'')+s.name+'</td><td>'+s.count+'</td><td class="muted">'+dietName(S.species[s.id].ref[G.diet])+'</td><td class="muted">'+(S.day-s.born)+' дн</td></tr>').join('');
}
$('splist').addEventListener('click',e=>{const tr=e.target.closest('tr.sp');if(!tr)return;const id=+tr.dataset.id;selSp=selSp===id?-1:id;if(S.species[id].player){mySp=id;renderMine();}renderSpecies();});

function renderGraph(){
 const c=$('graph'),w=c.clientWidth;c.width=w*dpr;const h=150;c.height=h*dpr;const g=c.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
 g.fillStyle='#10131a';g.fillRect(0,0,w,h);
 const ht=S.histTotal;if(ht.length<2){g.fillStyle='#6d7689';g.fillText('Данные появятся через пару дней',10,20);return;}
 const d0=Math.max(0,S.day-200),d1=Math.max(S.day,d0+5);
 let ymax=1;for(const[d,v]of ht)if(d>=d0&&v>ymax)ymax=v;
 const X=d=>8+(d-d0)/(d1-d0)*(w-16),Y=v=>h-14-v/ymax*(h-24);
 g.strokeStyle='#222836';g.lineWidth=1;for(let k=0;k<=4;k++){const y=Y(ymax*k/4);g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
 g.fillStyle='#6d7689';g.font='10px system-ui';g.fillText(ymax,4,10);g.fillText('день '+d0,4,h-3);g.fillText('день '+S.day,w-50,h-3);
 const line=(arr,col,lw)=>{g.strokeStyle=col;g.lineWidth=lw;g.beginPath();let st=false;for(const[d,v]of arr){if(d<d0)continue;if(!st){g.moveTo(X(d),Y(v));st=true;}else g.lineTo(X(d),Y(v));}g.stroke();};
 line(ht,'#5b6476',1.5);
 const top=S.species.filter(s=>s.count>0&&!s.player).sort((a,b)=>b.count-a.count).slice(0,6);
 for(const s of top)line(s.hist,s.col,1.3);
 for(const s of S.species.filter(s=>s.player&&s.count>0).sort((a,b)=>b.count-a.count).slice(0,3))line(s.hist,s.col,1.2);
 line(S.histPlayer,'#ffffff',2.2);
}
let treeRows=[];
function renderTree(){
 const c=$('tree'),w=c.clientWidth;
 let vis=S.species.filter(s=>s.peak>=10||s.parent<0);
 if(vis.length>160){const keep=new Set(vis.filter(s=>s.parent<0||s.count>0).map(s=>s.id));vis.sort((a,b)=>b.peak-a.peak);vis=vis.filter((s,i)=>i<160||keep.has(s.id));}
 const visSet=new Set(vis.map(s=>s.id));
 const vParent=s=>{let p=s.parent;while(p>=0&&!visSet.has(p))p=S.species[p].parent;return p;};
 const kids={};const roots=[];
 for(const s of vis){const p=vParent(s);if(p<0)roots.push(s);else(kids[p]=kids[p]||[]).push(s);}
 treeRows=[];const rowOf={};
 const dfs=s=>{rowOf[s.id]=treeRows.length;treeRows.push(s);(kids[s.id]||[]).sort((a,b)=>a.born-b.born).forEach(dfs);};
 roots.sort((a,b)=>(b.player-a.player)||a.id-b.id).forEach(dfs);
 const rh=treeRows.length>80?5:8,h=Math.max(120,treeRows.length*rh+20);
 c.style.height=h+'px';c.width=w*dpr;c.height=h*dpr;const g=c.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
 g.fillStyle='#10131a';g.fillRect(0,0,w,h);
 const now=Math.max(S.day,1),X=d=>10+d/now*(w-20),Y=r=>10+r*rh;
 for(const s of treeRows){const r=rowOf[s.id],y=Y(r),end=s.died>=0?s.died:S.day;
  const p=vParent(s);
  g.globalAlpha=s.count>0?1:0.4;
  if(p>=0){g.strokeStyle=s.col;g.lineWidth=1;g.beginPath();g.moveTo(X(s.born),Y(rowOf[p]));g.lineTo(X(s.born),y);g.stroke();}
  g.strokeStyle=s.col;g.lineWidth=s.count>0?Math.min(rh-1,1+Math.log10(s.count+1)*1.6):1.2;
  g.beginPath();g.moveTo(X(s.born),y);g.lineTo(Math.max(X(end),X(s.born)+1.5),y);g.stroke();
  if(s.player){g.fillStyle='#fff';g.fillRect(X(s.born)-1.5,y-1.5,3,3);}
  if(s.id===selSp){g.strokeStyle='#ffe070';g.lineWidth=1;g.strokeRect(X(s.born)-3,y-rh/2,X(end)-X(s.born)+6,rh);}
 }
 g.globalAlpha=1;
 c.onclick=e=>{const r=c.getBoundingClientRect();const row=Math.round((e.clientY-r.top-10)/rh);const s=treeRows[row];if(s){selSp=s.id;if(s.player&&s.count>0){mySp=s.id;renderMine();}renderSpecies();showSpeciesInfo(s);}};
}
function showSpeciesInfo(s){
 const p=s.parent>=0?S.species[s.parent]:null;
 toast('«'+s.name+'»'+(s.player?' (твоя линия)':'')+': '+(s.count>0?s.count+' особей':'вымер на '+s.died+'-й день')+(p?'. Предок: «'+p.name+'»'+(s.desc?' ('+s.desc+')':''):'. Изначальный вид')+'. Пик: '+s.peak+'.','epoch');
}
function renderLog(){
 if(!logDirty)return;logDirty=false;
 $('log').innerHTML=S.log.slice(-90).reverse().map(l=>'<div class="t-'+l.type+'"><span class="d">д'+l.d+'</span>'+esc(l.text)+'</div>').join('');
}
function esc(t){return t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function bar(v,col){return'<div class="bar" style="width:110px;display:inline-block;vertical-align:middle"><i style="width:'+Math.max(0,Math.min(100,v*100)).toFixed(0)+'%;background:'+(col||'#5a8fd8')+'"></i></div>';}
let lastDead=null;
function renderInsp(){
 const el=$('insp');
 if(!selC){el.innerHTML=lastDead?'<span class="muted">Выбранное существо погибло: '+lastDead+'.</span>':'<span class="muted">Кликни по существу на карте.</span>';return;}
 const c=selC,s=S.species[c.sp];
 const T=E.tempAt(c.x,c.y);
 const mods=E.MODS.filter((m,k)=>c.m&(1<<k)).map(m=>'<span class="chip" title="'+m.hint+'">'+m.ru+'</span>').join('')||'<span class="muted small">нет</span>';
 const tr=[['Размер',c.g[G.size]],['Скорость',c.maxSpd/1.6],['Зрение',c.g[G.sense]],['Броня',c.armorE],['Атака',c.atk/1.5],['Яд',c.venomE],['Маскировка',c.camoE],['Хищность',c.diet],['Стайность',c.social],['Интеллект',c.intelE],['Плавание',c.swimE],['Полёт',c.flyE],['Рытьё',c.digE]];
 el.innerHTML='<div><span class="dot" style="background:'+s.col+'"></span><b>'+s.name+'</b>'+(s.player?' <span style="color:#9fe0a8">★ твоя линия</span>':'')+'</div>'+
 '<div class="muted small">особь #'+c.id+' · поколение '+c.gen+' · возраст '+(c.age/E.DAY).toFixed(1)+' из ~'+(c.life/E.DAY).toFixed(0)+' дн · убийств: '+c.kills+'</div>'+
 '<div style="margin:4px 0">Сейчас: <b>'+(c.state||'—')+'</b>'+(c.sick>0?' · <span style="color:#a0ff60">болен</span>':'')+(c.poison>0.05?' · <span style="color:#c6a6ff">отравлен</span>':'')+'</div>'+
 '<table><tr><td>Энергия</td><td>'+bar(c.energy/c.maxE,'#e0b040')+'</td></tr><tr><td>Здоровье</td><td>'+bar(c.hp/c.maxHp,'#5fbf6a')+'</td></tr>'+
 tr.map(([n,v])=>'<tr><td>'+n+'</td><td>'+bar(v)+'</td></tr>').join('')+'</table>'+
 '<div class="small" style="margin-top:4px">Комфорт: '+c.tLo.toFixed(0)+'…'+c.tHi.toFixed(0)+'°C, здесь '+T.toFixed(0)+'°C · '+E.BIOME_NAMES[S.biome[c.ti]]+'</div>'+
 '<div class="small" style="margin-top:4px">Органы: '+mods+'</div>'+
 '<div class="row" style="margin-top:6px"><button id="bFollow" class="'+(follow?'on':'')+'">'+(follow?'Не следить':'Следить (F)')+'</button></div>';
 $('bFollow').onclick=()=>{follow=!follow;renderInsp();};
}
function updatePanels(){renderMine();renderSpecies();renderGraph();renderTree();renderLog();renderInsp();
 $('worldinfo').textContent='Зерно '+S.seed+' · родилось '+S.births+' · крупных мутаций '+S.macros+' · всего видов за историю '+S.species.length;}

/* loop */
function loop(){
 if(running&&speed>0){
  const t0=performance.now(),budget=speed>=100?70:speed>=30?45:speed>=10?30:16;let n=0;const d0=S.day;
  while(n<speed&&performance.now()-t0<budget){E.step();n++;}
  simDays+=n/E.DAY;
 }
 const now=performance.now();if(now-simT0>1000){dps=simDays/((now-simT0)/1000);simDays=0;simT0=now;}
 if(selC&&selC.dead){lastDead=selC.cause||'неизвестно';selC=null;follow=false;renderInsp();}
 if(follow&&selC){cam.x+=(selC.x-W/2/cam.z-cam.x)*0.2;cam.y+=(selC.y-H/2/cam.z-cam.y)*0.2;}
 if(frame%12===0||S.terrainDirty){drawTerrain();S.terrainDirty=false;}
 if(speed<100||frame%3===0||!running)render();
 if(frame%6===0)hud();
 if(frame%30===0&&running){updatePanels();checkEnd();}
 else if(frame%6===0&&selC)renderInsp();
 frame++;requestAnimationFrame(loop);
}
function checkEnd(){
 if(S.lost&&!lostShown){lostShown=true;setSpeed(0);$('o2t').textContent='Твоя линия вымерла';$('o2d').textContent='Это случилось на '+(Math.floor(S.day/E.YEAR_DAYS)+1)+'-й год. Мир продолжает жить без тебя: можно понаблюдать, кто победил, или начать заново.';$('over2').classList.remove('hidden');}
 if(S.won&&!wonShown){wonShown=true;}
}

/* start / save */
let pickedDiet=0.12;
$('dietPick').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;pickedDiet=+b.dataset.d;document.querySelectorAll('#dietPick button').forEach(x=>x.classList.toggle('on',x===b));});
$('cap').oninput=()=>$('capV').textContent=$('cap').value;$('ai').oninput=()=>$('aiV').textContent=$('ai').value;
$('seed').value=Math.floor(Math.random()*1e6);
function hasSave(){try{return!!localStorage.getItem(SAVE_KEY);}catch(e){return false;}}
function openStart(canClose){$('overlay').classList.remove('hidden');$('bCont').classList.toggle('hidden',!hasSave());$('bClose').classList.toggle('hidden',!canClose);$('seed').value=Math.floor(Math.random()*1e6);}
function afterLoad(){running=true;lostShown=S.lost;wonShown=S.won;selC=null;selSp=-1;follow=false;lastDead=null;logDirty=true;const l=playerSpecies();mySp=l.length?l[0].id:0;fit();drawTerrain();updatePanels();$('overlay').classList.add('hidden');$('over2').classList.add('hidden');setSpeed(1);}
$('bStart').onclick=()=>{E.newGame({seed:+$('seed').value||1,cap:+$('cap').value,ai:+$('ai').value,playerDiet:pickedDiet});afterLoad();};
$('bClose').onclick=()=>$('overlay').classList.add('hidden');
$('bNew').onclick=()=>{setSpeed(0);openStart(true);};
$('bNew2').onclick=()=>{$('over2').classList.add('hidden');openStart(false);};
$('bWatch').onclick=()=>{$('over2').classList.add('hidden');setSpeed(1);};
function loadStr(str){try{E.deserialize(str);afterLoad();toast('Мир загружен: '+fmtDay(S.day),'good');}catch(e){toast('Не удалось загрузить сохранение: '+e.message,'bad');}}
$('bCont').onclick=()=>{try{loadStr(localStorage.getItem(SAVE_KEY));}catch(e){toast('Сохранение недоступно','bad');}};
$('bSave').onclick=()=>{try{localStorage.setItem(SAVE_KEY,E.serialize());toast('Мир сохранён в браузере ('+fmtDay(S.day)+')','good');}catch(e){toast('Браузер не дал сохранить (мало места или запрет). Используй «Скачать файл».','bad');}};
$('bLoad').onclick=()=>{if(!hasSave()){toast('Сохранений в браузере нет','bad');return;}loadStr(localStorage.getItem(SAVE_KEY));};
$('bDown').onclick=()=>{let txt;try{txt=E.serialize();}catch(e){toast('Ошибка сохранения','bad');return;}
 try{navigator.clipboard.writeText(txt).then(()=>toast('Сохранение скопировано. Вставь его в текстовый файл и сохрани как .json, потом его можно открыть кнопкой «Открыть файл».','good'),()=>toast('Браузер не дал скопировать. Используй «Сохранить».','bad'));}catch(e){toast('Браузер не дал скопировать. Используй «Сохранить».','bad');}};
$('bUp').onclick=()=>$('fileIn').click();
$('fileIn').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>loadStr(r.result);r.readAsText(f);e.target.value='';};

resize();
E.newGame({seed:1,cap:1000,ai:4});fit();drawTerrain();
openStart(false);
requestAnimationFrame(loop);
})();
