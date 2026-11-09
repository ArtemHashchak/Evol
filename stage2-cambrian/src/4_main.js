/* ===== игрок ===== */
const SAVE='evo_stage2_v1',META_KEY='evo_stage2_meta';
function newPlayer(sym,seed){return{sym,seed,body:defaultBody(sym),un:{},st:null,x:0,y:0,z:300,a:0,vx:0,vy:0,vz:0,mv:0,pos:[],hp:1,o2:1,sat:0.85,bm:15,dna:5,dnaF:0,gen:1,off:0,eaten:{},time:0,bur:false,packOn:false,eggCd:0,bcd:0,inv:0,alive:false,zones:{},flags:{},kills:0,eggsLaid:0,hatched:0,lastNest:null,home:null,hit:0,foodCount:0,packN:0,done:false,gut:[]};}
let P=newPlayer('bilateral',1);P.st=bodyStats(P.body,P.un);
const GOAL=()=>P.sym==='radial'?24:60;
function lenMM(){return P.sym==='radial'?P.body.segs[0].r*2:P.st.L;}
function camScale(){return Math.min(W,H)/(Math.max(P.st.L*(P.sym==='radial'?2.2:1),10)*9);}
function refreshStats(){const r=P.st&&P.st.hpMax?P.hp/P.st.hpMax:1;P.st=bodyStats(P.body,P.un);P.hp=clamp(r,0.05,1)*P.st.hpMax;cam.ts=camScale();}
function findSpawn(){for(let k=0;k<400;k++){const x=-1400+rnd(-700,700),y=-1400+rnd(-700,700);if(floorH(x,y)>370&&floorType(x,y)!=='rock')return[x,y];}return[-1400,-1400];}
function placePlayer(x,y){P.x=x;P.y=y;P.z=floorH(x,y)+P.st.Req*0.7;P.vx=P.vy=P.vz=0;P.pos=initChain(P.body,P.x,P.y,P.z,P.a);cam.x=P.x;cam.y=P.y;cam.z=P.z;cam.s=cam.ts;camUpdate(P.x,P.y,P.z,1);}
/* ===== ввод ===== */
const keys={},mouse={x:0,y:0,on:false},vert={up:false,down:false};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.code]=true;if(e.code==='Space')e.preventDefault();
 if(e.repeat)return;
 if(e.code==='KeyE'){edOpen?closeEditor():openEditor();}
 else if(e.code==='KeyR')layEggs();else if(e.code==='KeyB')toggleBurrow();
 else if(e.code==='KeyP'||e.code==='Escape'){if(edOpen)closeEditor();else if(!$('start').classList.contains('hidden'))return;else setPause(!paused);}});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
cv.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.on=true;});
cv.addEventListener('mouseleave',()=>{mouse.on=false;});
cv.addEventListener('touchstart',e=>{const t=e.touches[0];mouse.x=t.clientX;mouse.y=t.clientY;mouse.on=true;e.preventDefault();},{passive:false});
cv.addEventListener('touchmove',e=>{const t=e.touches[0];mouse.x=t.clientX;mouse.y=t.clientY;e.preventDefault();},{passive:false});
cv.addEventListener('touchend',()=>{mouse.on=false;});
for(const[id,k]of[['bUp','up'],['bDown','down']]){const b=$(id);b.addEventListener('pointerdown',e=>{vert[k]=true;e.preventDefault();});for(const ev of['pointerup','pointerleave','pointercancel'])b.addEventListener(ev,()=>{vert[k]=false;});}
$('bEdit').onclick=()=>openEditor();$('bEgg').onclick=()=>layEggs();$('bBur').onclick=()=>toggleBurrow();$('bPack').onclick=()=>togglePack();$('bFinal').onclick=()=>openFinal();$('bResume').onclick=()=>setPause(false);
/* ===== сообщения ===== */
function toast(h){const d=document.createElement('div');d.className='toast panel';d.innerHTML=h;$('toasts').appendChild(d);setTimeout(()=>d.remove(),6500);while($('toasts').children.length>4)$('toasts').firstChild.remove();}
let paused=true,edOpen=false;
function setPause(v){paused=v;$('pause').classList.toggle('hidden',!v||!P.alive||!$('start').classList.contains('hidden'));}
/* ===== еда и урон ===== */
function gainFood(v,sp,silent){P.bm+=v;P.sat=Math.min(1,P.sat+v/(P.st.M*1.4+6));P.dnaF+=v*0.07;P.foodCount++;while(P.dnaF>=1){P.dnaF-=1;P.dna++;}
 if(sp&&SPEC[sp]&&!P.eaten[sp]){P.eaten[sp]=1;P.dna+=3;toast(`Новая добыча: <b>${SPEC[sp].ru}</b> <span class="muted small">(${SPEC[sp].lat})</span> · +3 ДНК<br><span class="small muted">${SPEC[sp].info}</span>`);}}
function hurtPlayer(d,src,sting){if(!P.alive||P.inv>0||P.bur)return;d*=P.st.armor;if(sting&&P.body.skel!=='none')d*=0.6;P.hp-=d;P.hit=0.35;P.lastHit=src&&src.S?src.S.ru:'';
 if(src&&src.hp!=null&&P.st.spine>0&&!sting){src.hp-=P.st.spine;src.dmgT=2;}
 if(src&&src.S&&src.S.beh==='hunt'&&!P.flags.warnHunt){P.flags.warnHunt=1;toast(`<b>${src.S.ru}</b> охотится на тебя! Убегай, закапывайся или отрасти шипы и панцирь.`);}}
function playerBite(e){const st=P.st;
 if(e.st.Req<=st.Req*st.swallow){gainFood(entVal(e),e.sp);killEnt(e,P,true);P.kills++;P.bcd=0.3;return;}
 const dmg=st.bite*(e.curl>0?0.25:1)*(e.st.armor||1)+st.sting;e.hp-=dmg;e.dmgT=2.5;P.bcd=0.65;
 if(e.st.spine>0)hurtPlayer(e.st.spine*0.8,e);
 if(e.S.sting)hurtPlayer(e.S.sting*2,e,true);
 if(e.S.curl&&R_()<0.6)e.curl=3;
 else if(e.S.fight&&e.st.Req>st.Req*0.6&&R_()<e.S.fight){if(e.S.beh==='hunt'){e.tgt=P;e.chase=0;e.full=0;}else if(e.cd<=0){e.cd=1;hurtPlayer(e.st.bite*0.6,e);}}
 else if(e.S.beh!=='drift'){e.thr=P;e.scan=1.5;}
 if(e.hp<=0){killEnt(e,P,false);P.kills++;}}
function die(){P.alive=false;P.hp=0;for(const e of ents)if(e.S.beh==='pack'){e.gone=true;P.off++;}
 setTimeout(showDeath,900);}
function showDeath(){
 const cause=P.lastHit?`Тебя убил(а): <b>${P.lastHit}</b>.`:P.o2<=0?'Ты задохнулся: не хватило кислорода.':P.sat<=0?'Ты умер от голода.':'Ты погиб.';
 let h=`<h2>Поколение ${P.gen} погибло</h2><div class="muted">${cause}</div>`;
 const has=P.off>0;let mut=null;
 if(has){h+=`<p>Из твоей кладки вылупляется потомок — <b>поколение ${P.gen+1}</b>. Потомков в запасе: ${P.off-1}.</p>`;if(R_()<0.2)mut=rollMutation();}
 else h+=`<p>Потомков нет — род продолжает дальний родственник с того же шельфа. Ты теряешь половину питательных веществ.</p><p class="small muted">Совет: найди сородича с ♥ и отложи яйца (R), чтобы возрождаться у кладки.</p>`;
 if(mut)h+=`<div class="seginfo"><b>Мутация!</b> ${mut.txt}<div class="small muted">Мутации редки: можно принять или отказаться.</div></div><div style="display:flex;gap:8px;margin-top:10px"><button class="on" id="mYes">Принять</button><button id="mNo">Отказаться</button></div>`;
 else h+=`<button class="on" id="mNo" style="margin-top:10px">Продолжить</button>`;
 $('mutBox').innerHTML=h;$('mutm').classList.remove('hidden');
 const go=acc=>{$('mutm').classList.add('hidden');if(acc&&mut){mut.apply(P.body);toast('Мутация закрепилась в роду');}respawn(has);};
 if($('mYes'))$('mYes').onclick=()=>go(true);$('mNo').onclick=()=>go(false);
}
function rollMutation(){const b=P.body,i=(R_()*b.segs.length)|0,sg=b.segs[i];const opts=[];
 opts.push(()=>{const k=R_()<0.6?1.12:0.9;return{txt:`сегмент ${i+1} ${k>1?'крупнее':'мельче'} на ${Math.round(Math.abs(k-1)*100)}%.`,apply:bb=>{bb.segs[i].r=clamp(bb.segs[i].r*k,0.5,b.sym==='radial'?12:5);}};});
 if(sg.parts.length)opts.push(()=>{const j=(R_()*sg.parts.length)|0,p=sg.parts[j],d=R_()<0.65?0.3:-0.3;return{txt:`${PARTS[p.t].ru.toLowerCase()} на сегменте ${i+1} ${d>0?'увеличились':'уменьшились'}.`,apply:bb=>{const q=bb.segs[i].parts[j];if(q)q.s=clamp(q.s+d,0.5,2);}};});
 opts.push(()=>{const dh=rnd(25,70)*(R_()<0.5?-1:1);return{txt:'новая окраска тела.',apply:bb=>{bb.hue=(bb.hue+dh+360)%360;}};});
 const cand=Object.keys(PARTS).filter(t=>(t==='eyes'||P.un[PARTS[t].node])&&canAdd(b,i,t));
 if(cand.length)opts.push(()=>{const t=pick(cand);return{txt:`бесплатно выросли ${PARTS[t].ru.toLowerCase()} на сегменте ${i+1}!`,apply:bb=>{if(canAdd(bb,i,t))bb.segs[i].parts.push({t,s:0.8});}};});
 return pick(opts)();}
function respawn(hasOff){
 P.gen++;if(hasOff){P.off--;}else{P.bm*=0.5;}
 refreshStats();P.hp=P.st.hpMax;P.o2=1;P.sat=0.7;P.bur=false;P.inv=3;P.lastHit='';P.alive=true;
 let x,y;if(hasOff&&P.home){x=P.home.x;y=P.home.y;}else[x,y]=findSpawn();placePlayer(x,y);
 for(const e of ents)if(e.S.beh==='hunt'&&d3(e,P)<200){e.gone=true;}
 if(P.packOn)rebuildPack();
 $('hTitle').textContent=`Поколение ${P.gen}`;save();}
/* ===== размножение, нора, стая ===== */
function layEggs(){if(!P.alive||P.bur||edOpen)return;
 if(P.eggCd>0){toast(`Организм ещё не готов к новой кладке: ${Math.ceil(P.eggCd)} с`);return;}
 const mate=ents.find(e=>e.sp==='kin'&&e.mate&&d3(e,P)<P.st.L*2.5+10);
 if(!mate){toast('Рядом нет партнёра. Ищи сородичей с <b style="color:#ff8fb8">♥</b> — розовые стрелки указывают на них.');return;}
 const cost=4+P.st.M*0.25;if(P.sat<0.3||P.bm<cost){toast(`Для кладки нужно сытость ≥ 30% и ${cost.toFixed(0)} питательных веществ`);return;}
 P.bm-=cost;P.sat-=0.2;P.eggCd=35;mate.mate=false;mate.leave=10;
 const n=3+(P.un.clutch?2:0),fz=floorH(P.x,P.y);const nest={x:P.x,y:P.y,z:fz,eggs:n,t:0,hatch:P.un.care?28:55,care:!!P.un.care,r:Math.max(0.6,P.st.Req*0.5),own:1};nests.push(nest);P.lastNest=nest;P.home={x:P.x,y:P.y};P.eggsLaid+=n;
 toast(`Отложено <b>${n}</b> яиц. Через ${nest.hatch} с вылупятся потомки — это твои запасные жизни.${nest.care?'':' Охраняй кладку: хищники едят яйца.'}`);save();}
function packMax(){return P.st.brain>=3?6:P.st.brain>=2?3:0;}
function packCount(){return ents.filter(e=>e.S.beh==='pack'&&!e.gone).length;}
function spawnPackMember(){const b=cloneBody(P.body);scaleBody(b,0.8);const a=R_()*TAU;const e=spawnEnt('pack',P.x+Math.cos(a)*P.st.L*2,P.y+Math.sin(a)*P.st.L*2,1,{body:b,un:P.un});e.z=P.z;e.pos=initChain(e.b,e.x,e.y,e.z,e.a);return e;}
function rebuildPack(){let n=packCount();while(n<packMax()&&P.off>0){spawnPackMember();P.off--;n++;}}
function togglePack(){if(packMax()===0)return;P.packOn=!P.packOn;if(P.packOn){rebuildPack();toast(packCount()?`Потомки плывут за тобой стаей (${packCount()}). Они охотятся на мелочь${P.st.brain>=3?' и защищают тебя':''}.`:'Стая включена: новые вылупившиеся потомки присоединятся к ней.');}else{for(const e of ents)if(e.S.beh==='pack'){e.gone=true;P.off++;}toast('Стая распущена: потомки вернулись к кладке как запасные жизни.');}}
function nestTick(dt){for(let i=nests.length-1;i>=0;i--){const n=nests[i];if(n.eggs>0){n.t+=dt;if(n.t>=n.hatch){let toPack=0,toOff=0;for(let k=0;k<n.eggs;k++){if(P.packOn&&packCount()<packMax()){spawnPackMember();toPack++;}else{P.off++;toOff++;}P.hatched++;P.dna++;}
   toast(`Вылупилось ${n.eggs} потомков (+${n.eggs} ДНК)${toPack?` · ${toPack} в стае`:''}${toOff?` · ${toOff} запасных жизней`:''}`);n.eggs=0;}}
  if(n.eggs<=0)nests.splice(i,1);}}
function toggleBurrow(){if(!P.alive||edOpen)return;if(P.bur){P.bur=false;return;}
 if(!P.un.burrow){toast('Чтобы закапываться, открой «Рытьё» в древе эволюции');return;}
 const ft=floorType(P.x,P.y);if(ft!=='sand'&&ft!=='mud'){toast('Закопаться можно только в песок или ил');return;}
 if(P.z-floorH(P.x,P.y)>P.st.Req*2.5){toast('Опустись ко дну, чтобы закопаться');return;}
 if(P.body.skel==='shell'||P.sym==='radial'){toast('С таким телом закопаться не выйдет');return;}
 P.bur=true;P.vx=P.vy=P.vz=0;for(const e of ents)if(e.tgt===P){e.tgt=null;e.full=2;}toast('Ты зарылся в грунт: хищники тебя не видят');}
/* ===== обновление игрока ===== */
function playerUpdate(dt){
 const st=P.st;P.time+=dt;P.eggCd-=dt;P.bcd-=dt;P.inv-=dt;P.hit-=dt;
 const fz=floorH(P.x,P.y),minZ=fz+st.Req*0.55;
 let dx=0,dy=0;const kW=keys.KeyW||keys.ArrowUp,kS=keys.KeyS||keys.ArrowDown,kA=keys.KeyA||keys.ArrowLeft,kD=keys.KeyD||keys.ArrowRight;
 if(kW){dx-=1;dy-=1;}if(kS){dx+=1;dy+=1;}if(kD){dx+=1;dy-=1;}if(kA){dx-=1;dy+=1;}
 if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;}
 else if(mouse.on&&!edOpen){const[wx,wy]=screenToWorld(mouse.x,mouse.y,P.z);let ex=wx-P.x,ey=wy-P.y;const d=Math.hypot(ex,ey),dead=Math.max(1.5,st.L*0.45);if(d>dead){const k=Math.min(1,(d-dead)/(st.L*2.5+4));dx=ex/d*k;dy=ey/d*k;}}
 const vin=((keys.Space||vert.up)?1:0)-((keys.ShiftLeft||keys.ShiftRight||vert.down)?1:0);
 if(P.bur){if(dx||dy||vin)P.bur=false;else{P.z+=(fz-st.Req*0.1-P.z)*Math.min(1,dt*3);P.mv=0;}}
 if(!P.bur){
  const near=P.z-minZ<st.Req*1.6;let spd=near&&st.crawl>st.speed?st.crawl:st.speed;
  if(P.o2<0.15)spd*=0.6;if(P.sat<0.08)spd*=0.8;
  if(P.sym==='radial')spd*=0.45+0.75*Math.max(0,Math.sin(P.time*5));
  const k=Math.min(1,dt*(P.sym==='radial'?2.5:4.5));
  P.vx+=(dx*spd-P.vx)*k;P.vy+=(dy*spd-P.vy)*k;
  const sink=(P.body.skel==='exo'||P.body.skel==='shell')?-4:-0.7;
  P.vz+=((vin?vin*Math.max(6,spd*0.7):sink)-P.vz)*k;
  P.x=clamp(P.x+P.vx*dt,-HALF*0.95,HALF*0.95);P.y=clamp(P.y+P.vy*dt,-HALF*0.95,HALF*0.95);P.z+=P.vz*dt;
  const mz=floorH(P.x,P.y)+st.Req*0.55;if(P.z<mz){P.z=mz;if(P.vz<0)P.vz=0;}if(P.z>SURF-3){P.z=SURF-3;if(P.vz>0)P.vz=0;}
  const sp2=Math.hypot(P.vx,P.vy);if(sp2>0.6){const da=angD(Math.atan2(P.vy,P.vx),P.a);P.a+=clamp(da,-st.turn*dt*1.7,st.turn*dt*1.7);}
  P.mv=clamp(Math.hypot(P.vx,P.vy,P.vz)/(st.speed||1),0,1.2);
 }
 if(P.body.sym!=='radial'&&(P.body.skel==='none'||P.body.skel==='notochord')&&P.mv>0.05){const w=Math.sin(P.time*8)*P.body.segs[0].r*0.25*P.mv;updateChain(P.body,P.pos,P.x-Math.sin(P.a)*w,P.y+Math.cos(P.a)*w,P.z);}else updateChain(P.body,P.pos,P.x,P.y,P.z);
 // кислород
 const skin=0.75/(1+st.M/60),absorb=o2At(P.z)*(skin+Math.min(1.5,st.gill*0.17));
 const need=(P.bur?0.15:0.28+0.22*P.mv)+0.05*Math.log2(1+st.M/10);
 P.o2=clamp(P.o2+(absorb-need)*0.12*dt,0,1);if(P.o2<=0){P.hp-=dt*st.hpMax*0.05;P.lastHit='';}
 if(P.o2<0.3&&!P.flags.o2warn){P.flags.o2warn=1;toast(P.st.gill?'Кислород на исходе — поднимись выше, к свету.':'Кислород на исходе! Поднимись к поверхности. Чтобы жить глубже и расти крупнее, отрасти <b>жабры</b>.');}
 // сытость
 P.sat=Math.max(0,P.sat-dt*st.met*(1+0.6*P.mv));if(P.sat<=0){P.hp-=dt*st.hpMax*0.03;P.lastHit='';}
 if(P.sat>0.3&&P.o2>0.3)P.hp=Math.min(st.hpMax,P.hp+dt*st.hpMax*0.02);
 // еда
 if(!P.bur){const h=P.pos[0],hr=P.body.segs[0].r,fx=Math.cos(P.a),fy=Math.sin(P.a);const rad=P.sym==='radial';
  const mx=h.x+(rad?0:fx*hr*0.8),my=h.y+(rad?0:fy*hr*0.8),mz=h.z-(rad?hr*0.6:0);
  const pr=hr*1.2+1.5+(st.c.tentacle?st.Req*0.7:0)+(rad?st.Req*0.8:0);
  for(const f of foods){if(f.dead)continue;if(Math.abs(f.x-mx)<pr&&Math.abs(f.y-my)<pr&&Math.abs(f.z-mz)<pr){f.dead=1;gainFood(f.val);}}
  if(P.bcd<=0){
   let best=null,bd=1e9;
   for(const e of ents){if(e.S.kin||e.gone||(e.hid&&e.S.beh==='ambush'))continue;const r=(rad?st.Req*1.5:hr*1.25+st.reach)+e.st.Req*0.9+1;const q=e.pos[0];const dd=Math.min(Math.hypot(e.x-mx,e.y-my,e.z-mz),Math.hypot(q.x-mx,q.y-my,q.z-mz));if(dd<r&&dd<bd){bd=dd;best=e;}}
   if(best)playerBite(best);
   else for(const c of carr){if(Math.hypot(c.x-mx,c.y-my,c.z-mz)<hr*1.3+c.r+1.5){const ch=Math.min(c.val,2+st.bite*1.5+st.M*0.15);c.val-=ch;gainFood(ch,c.sp);P.bcd=0.45;break;}}
  }
  if(P.z-fz<st.Req*2){const k=gIdx(P.x,P.y);if(TY[k]===3&&MAT[k]>0.15){const e=Math.min(MAT[k]-0.1,dt*0.35);MAT[k]-=e;P.bm+=e*3;P.sat=Math.min(1,P.sat+e*3/(st.M*1.4+6));P.dnaF+=e*0.2;}}
 }
 // зоны
 const zn=zoneAt(P.x,P.y);if(!P.zones[zn]){P.zones[zn]=1;if(Object.keys(P.zones).length>1){P.dna+=2;toast(`Новая зона: <b>${ZONES[zn].ru}</b> (+2 ДНК)<br><span class="small muted">${ZONES[zn].info}</span>`);}}
 if(P.hp<=0)die();
}
function matTick(dt){for(let q=0;q<40;q++){const k=(R_()*GN*GN)|0;if(TY[k]===3&&MAT[k]<1)MAT[k]=Math.min(1,MAT[k]+0.02);}}
/* ===== редактор ===== */
let edSel=0,edPts=[],edSize=[0,0];
const RADIAL_OK=['tentacle','eyes','cameye','spine','gill'];
function bodyCost(b){const k=b.sym==='radial'?0.45:4;let c=0,M=0;for(const s of b.segs){c+=k*s.r**3;M+=s.r**3;for(const p of s.parts)c+=PARTS[p.t].cost*p.s*(PARTS[p.t].single||b.sym==='radial'?1:1.6);}if(b.skel!=='none')c+=M*1.2;return c;}
function unlocked(t){return t==='eyes'||!!P.un[PARTS[t].node];}
function canAdd(b,i,t){const P_=PARTS[t],sg=b.segs[i];if(!sg)return false;if(sg.parts.length>=4||sg.parts.some(p=>p.t===t))return false;
 if(b.sym==='radial')return RADIAL_OK.includes(t);
 if(P_.head&&i!==0)return false;if(P_.tail&&i!==b.segs.length-1)return false;if(P_.single&&b.segs.some(s=>s.parts.some(p=>p.t===t)))return false;
 if(t==='jleg'&&b.skel!=='exo')return false;return true;}
function normBody(b){const n=b.segs.length;for(let i=0;i<n-1;i++){const s=b.segs[i];for(let j=s.parts.length-1;j>=0;j--)if(PARTS[s.parts[j].t].tail){const p=s.parts.splice(j,1)[0];if(!b.segs[n-1].parts.some(q=>q.t===p.t))b.segs[n-1].parts.push(p);}}
 if(b.skel!=='exo')for(const s of b.segs)s.parts=s.parts.filter(p=>p.t!=='jleg');}
function edMsg(t){$('eInfo').innerHTML=t;}
function tryEdit(fn){const nb=cloneBody(P.body);if(fn(nb)===false)return false;normBody(nb);const d=bodyCost(nb)-bodyCost(P.body);
 if(d>0&&d>P.bm+1e-6){edMsg(`<span style="color:#ff9a8a">Не хватает питательных веществ: нужно ${d.toFixed(1)}, есть ${P.bm.toFixed(1)}. Ешь больше!</span>`);renderEditor(true);return false;}
 P.bm-=d>0?d:d*0.5;P.body=nb;P.flags.edit=1;refreshStats();renderEditor();edMsg(d>0?`Потрачено ${d.toFixed(1)} питательных веществ`:d<0?`Возвращено ${(-d*0.5).toFixed(1)}`:'');return true;}
function openEditor(){if(!P.alive||$('start').classList.contains('hidden')===false)return;edOpen=true;$('editor').classList.remove('hidden');edSel=Math.min(edSel,P.body.segs.length-1);renderEditor();edMsg('Нажми на сегмент, чтобы выбрать его. Изменения тела стоят питательных веществ, новые органы в древе — ДНК.');}
function closeEditor(){edOpen=false;$('editor').classList.add('hidden');refreshStats();save();}
$('eClose').onclick=closeEditor;
function renderEditor(keepMsg){
 $('eBm').textContent=P.bm.toFixed(1);$('eDna').textContent=P.dna;
 // древо
 let h='',grp='';for(const n of NODES){if(n.grp!==grp){grp=n.grp;h+=`<div class="grp">${grp}</div>`;}const own=!!P.un[n.id],ok=n.req.every(r=>P.un[r]);
  h+=`<button class="node ${own?'owned':ok?'':'locked'}" data-n="${n.id}"><span class="n">${n.ru}</span><span class="c">${own?'✓':n.cost+' ДНК'}</span><div class="d">${n.desc}${!ok&&!own?'<br>Нужно: '+n.req.filter(r=>!P.un[r]).map(r=>NODE[r].ru).join(', '):''}</div></button>`;}
 $('tree').innerHTML=h;for(const b of $('tree').querySelectorAll('.node'))b.onclick=()=>buyNode(b.dataset.n);
 // сегмент
 const b=P.body,i=edSel,sg=b.segs[i],n=b.segs.length,rad=b.sym==='radial';
 let s=`<div style="display:flex;justify-content:space-between;align-items:center"><b>${rad?'Колокол':'Сегмент '+(i+1)+(i===0?' (голова)':i===n-1?' (хвост)':'')}</b><span class="small muted">${rad?'':'всего '+n}</span></div>`;
 s+=`<div class="prow" style="grid-template-columns:70px 1fr 50px"><span>Размер</span><input type="range" id="segR" min="${rad?1.5:0.5}" max="${rad?12:5}" step="0.1" value="${sg.r}"><span id="segRv">${sg.r.toFixed(1)}</span></div>`;
 for(let j=0;j<sg.parts.length;j++){const p=sg.parts[j],D=PARTS[p.t];const fixed=rad||D.head||D.tail;s+=`<div class="prow"><span title="${D.desc}">${D.ru}</span><input type="range" min="0.5" max="2" step="0.1" value="${p.s}" data-ps="${j}"><button data-mv="${j}" data-d="-1" ${fixed||i===0?'disabled':''} title="на сегмент ближе к голове">◀</button><button data-mv="${j}" data-d="1" ${fixed||i===n-1?'disabled':''} title="на сегмент ближе к хвосту">▶</button><button data-rm="${j}" title="убрать">✕</button></div>`;}
 if(!sg.parts.length)s+='<div class="small muted">Нет частей — добавь справа.</div>';
 if(!rad)s+=`<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><button id="segAdd" ${n>=14?'disabled':''}>+ сегмент после</button><button id="segDel" ${n<=2||i===0?'disabled':''}>− удалить сегмент</button></div>`;
 $('segBox').innerHTML=s;
 const sr=$('segR');sr.oninput=()=>{$('segRv').textContent=(+sr.value).toFixed(1);const nb=cloneBody(b);nb.segs[i].r=+sr.value;const d=bodyCost(nb)-bodyCost(b);edMsg(d>0?`Стоимость: ${d.toFixed(1)} (есть ${P.bm.toFixed(1)})`:`Возврат: ${(-d*0.5).toFixed(1)}`);};
 sr.onchange=()=>tryEdit(nb=>{nb.segs[i].r=+sr.value;});
 for(const el of $('segBox').querySelectorAll('[data-ps]'))el.onchange=()=>tryEdit(nb=>{nb.segs[i].parts[+el.dataset.ps].s=+el.value;});
 for(const el of $('segBox').querySelectorAll('[data-rm]'))el.onclick=()=>tryEdit(nb=>{nb.segs[i].parts.splice(+el.dataset.rm,1);});
 for(const el of $('segBox').querySelectorAll('[data-mv]'))el.onclick=()=>{const j=+el.dataset.mv,d=+el.dataset.d;const t=sg.parts[j].t;if(!canAdd(b,i+d,t)){edMsg('Туда нельзя: на сегменте уже есть такая часть или нет места');return;}if(tryEdit(nb=>{const p=nb.segs[i].parts.splice(j,1)[0];nb.segs[i+d].parts.push(p);})){edSel=i+d;renderEditor();}};
 if($('segAdd'))$('segAdd').onclick=()=>{if(tryEdit(nb=>{nb.segs.splice(i+1,0,{r:Math.max(0.5,+(sg.r*0.95).toFixed(1)),parts:[]});})){edSel=i+1;renderEditor();}};
 if($('segDel'))$('segDel').onclick=()=>{if(tryEdit(nb=>{nb.segs.splice(i,1);})){edSel=Math.max(0,i-1);renderEditor();}};
 // палитра
 let pl='';for(const t in PARTS){if(rad&&!RADIAL_OK.includes(t))continue;const D=PARTS[t],un=unlocked(t),ca=un&&canAdd(b,i,t);pl+=`<button data-pt="${t}" ${ca?'':'disabled'} title="${D.desc}">${D.ru}<span class="small muted"> · ${D.cost}</span>${un?'':' 🔒'}</button>`;}
 $('pal').innerHTML=pl;for(const el of $('pal').querySelectorAll('[data-pt]')){const t=el.dataset.pt;el.onmouseenter=()=>edMsg(`<b>${PARTS[t].ru}</b>: ${PARTS[t].desc}${!unlocked(t)?' <span class="muted">(открой в древе)</span>':PARTS[t].head&&!rad?' <span class="muted">(только на голову)</span>':PARTS[t].tail?' <span class="muted">(только на хвост)</span>':''}`);el.onclick=()=>tryEdit(nb=>{nb.segs[i].parts.push({t,s:1});});}
 // скелет
 let sk='';for(const k in SKELS){const own=k==='none'||P.un[k];if(rad&&k!=='none')continue;sk+=`<button data-sk="${k}" class="${b.skel===k?'on':''}" ${own?'':'disabled'} title="${SKELS[k].desc}">${SKELS[k].ru}${own?'':' 🔒'}</button>`;}
 $('skel').innerHTML=sk;for(const el of $('skel').querySelectorAll('[data-sk]')){el.onmouseenter=()=>edMsg(`<b>${SKELS[el.dataset.sk].ru}</b>: ${SKELS[el.dataset.sk].desc}`);el.onclick=()=>{if(b.skel!==el.dataset.sk)tryEdit(nb=>{nb.skel=el.dataset.sk;});};}
 const hu=$('hue');hu.value=b.hue;hu.oninput=()=>{P.body.hue=+hu.value;};
 // характеристики
 const st=P.st;const rows=[[rad?'Диаметр колокола':'Длина',lenMM().toFixed(1)+' мм / цель '+GOAL()],['Сегментов',n],['Масса',st.M.toFixed(1)],['Здоровье',st.hpMax.toFixed(0)],['Плавание',st.speed.toFixed(1)],['Ходьба по дну',st.crawl?st.crawl.toFixed(1):'—'],['Броня',st.armor<1?'−'+Math.round((1-st.armor)*100)+'% урона':'нет'],['Жабры',st.gill?st.gill.toFixed(1):'нет (дыхание кожей)'],['Зрение в темноте',Math.round(st.eyeQ*100)+'%'],['Укус',st.bite.toFixed(1)],['Глотает добычу до',Math.round(st.swallow*100)+'% своего размера'],['Шипы / яд',(st.spine?st.spine.toFixed(1):'—')+' / '+(st.sting?st.sting.toFixed(1):'—')],['Мозг',['нервные узлы','мозг I','мозг II','мозг III'][st.brain]]];
 $('stats').innerHTML=rows.map(r=>`<div class="stat"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
}
function buyNode(id){const n=NODE[id];if(P.un[id])return;if(!n.req.every(r=>P.un[r])){edMsg('Сначала открой: '+n.req.filter(r=>!P.un[r]).map(r=>NODE[r].ru).join(', '));return;}if(P.dna<n.cost){edMsg(`<span style="color:#ff9a8a">Нужно ${n.cost} ДНК, есть ${P.dna}. ДНК дают новые виды добычи, новые зоны, еда и вылупившиеся потомки.</span>`);return;}
 P.dna-=n.cost;P.un[id]=1;refreshStats();renderEditor();edMsg(`Открыто: <b>${n.ru}</b>. ${PARTS[id]?'Теперь эту часть можно добавить на тело (справа).':SKELS[id]?'Выбери этот скелет в разделе «Скелет».':''}`);
 if(id==='brain2')toast('Мозг II: теперь потомки могут плыть за тобой <b>стаей</b> (кнопка «Стая»)');}
$('ecv').addEventListener('click',e=>{const r=$('ecv').getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let bi=-1,bd=1e9;edPts.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-y)-p[2];if(d<bd){bd=d;bi=i;}});if(bi>=0&&bd<40){edSel=bi;renderEditor();}});
function drawEd(){
 const c=$('ecv'),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;if(edSize[0]!==w||edSize[1]!==h){edSize=[w,h];c.width=w*DPR;c.height=h*DPR;}
 const ec=c.getContext('2d');const sv=[ctx,W,H,cam.s,cam.u,cam.v];ctx=ec;W=w;H=h;
 const b=P.body,n=b.segs.length,a=-Math.PI/4,z=1000;const pos=[];let x=0,y=0;
 for(let i=0;i<n;i++){pos.push({x,y,z});const r1=b.segs[i].r,r2=b.segs[i+1]?b.segs[i+1].r:r1;x-=Math.cos(a)*(r1+r2)*0.8;y-=Math.sin(a)*(r1+r2)*0.8;}
 const L=b.sym==='radial'?b.segs[0].r*4.2:P.st.L+b.segs[0].r*4.5;cam.s=Math.min(w/(L*1.05),h/(L*0.75));
 const mx=(pos[0].x+pos[n-1].x)/2+Math.cos(a)*b.segs[0].r*1.2,my=(pos[0].y+pos[n-1].y)/2+Math.sin(a)*b.segs[0].r*1.2;cam.u=(mx-my)*C30;cam.v=(mx+my)*0.5-z+(b.sym==='radial'?b.segs[0].r*1.2:0);
 ctx.setTransform(DPR,0,0,DPR,0,0);const g=ctx.createRadialGradient(w/2,h/2,10,w/2,h/2,Math.max(w,h)*0.7);g.addColorStop(0,'#0f3346');g.addColorStop(1,'#061722');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='rgba(120,180,220,0.06)';ctx.lineWidth=1;for(let q=0;q<w;q+=24){ctx.beginPath();ctx.moveTo(q,0);ctx.lineTo(q,h);ctx.stroke();}for(let q=0;q<h;q+=24){ctx.beginPath();ctx.moveTo(0,q);ctx.lineTo(w,q);ctx.stroke();}
 drawBody(b,pos,{t:T_,moving:0.35,heading:a,xray:true,brain:P.st.brain,gut:P.gut});
 edPts=pos.map((p,i)=>{const q=proj(p.x,p.y,p.z);return[q[0],q[1],b.segs[i].r*cam.s];});
 const sp=edPts[edSel];if(sp){ctx.strokeStyle='rgba(255,220,120,0.9)';ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(sp[0],sp[1],sp[2]*1.35+4,sp[2]*1.2+4,0,0,TAU);ctx.stroke();ctx.setLineDash([]);}
 ctx.fillStyle='rgba(200,220,235,0.6)';ctx.font='11px system-ui';if(b.sym!=='radial')edPts.forEach((p,i)=>ctx.fillText(i+1,p[0]-3,p[1]+p[2]*1.2+14));
 ctx.fillText(b.sym==='radial'?'вид сверху-сбоку':'голова →',w-70,h-10);
 [ctx,W,H,cam.s,cam.u,cam.v]=sv;
}
/* ===== финал ===== */
const PATHS=[
 {id:'vert',ru:'Позвоночные',req:()=>P.sym!=='radial'&&P.body.skel==='notochord',need:'Хорда',desc:'Хорда станет позвоночником, жаберные дуги — челюстями. Потомки — бесчелюстные рыбы, затем акулы, кистепёрые и, через 150 млн лет, первые четвероногие. Это линия человека.'},
 {id:'arth',ru:'Членистоногие',req:()=>P.body.skel==='exo'&&(P.st.c.jleg||0)>0,need:'Панцирь и членистые ноги',desc:'Хитиновый панцирь и суставчатые ноги: ракообразные, морские скорпионы, пауки и насекомые — самые многочисленные животные Земли. Первыми выйдут на сушу.'},
 {id:'moll',ru:'Моллюски',req:()=>P.body.skel==='shell',need:'Раковина',desc:'Раковина и мускулистая нога: улитки, двустворки и головоногие — от наутилуса до осьминога, самого умного беспозвоночного.'},
 {id:'ann',ru:'Кольчатые черви',req:()=>P.sym!=='radial'&&P.body.skel==='none'&&P.body.segs.length>=8,need:'Мягкое тело, 8+ сегментов',desc:'Гибкое тело из колец: многощетинковые черви, пиявки и дождевые черви, которые однажды будут рыхлить почву всех континентов.'},
 {id:'cnid',ru:'Книдарии',req:()=>P.sym==='radial',need:'Радиальная симметрия',desc:'Медузы, кораллы и актинии. Без мозга, но на 500 млн лет: твои потомки построят Большой Барьерный риф.'}];
function openFinal(){if(lenMM()<GOAL())return;paused=true;let h=`<h2>Выбор пути</h2><div class="muted">Твой вид вырос до ${lenMM().toFixed(0)} мм. Пора выбрать, во что разовьются потомки. Доступны пути, которым соответствует твоё тело; остальные можно открыть, изменив тело в редакторе.</div><div class="cards">`;
 for(const p of PATHS){const ok=p.req();h+=`<div class="card" data-p="${p.id}" style="${ok?'':'opacity:.45;cursor:default'}"><h3>${p.ru}</h3><div class="small muted">${p.desc}</div><div class="small" style="margin-top:6px;color:${ok?'#7fd09f':'#ff9a8a'}">${ok?'✓ подходит':'Нужно: '+p.need}</div></div>`;}
 h+=`</div><div style="margin-top:12px"><button id="fBack">Вернуться в океан</button></div>`;$('finalBox').innerHTML=h;$('final').classList.remove('hidden');
 $('fBack').onclick=()=>{$('final').classList.add('hidden');paused=false;};
 for(const el of $('finalBox').querySelectorAll('[data-p]'))el.onclick=()=>{const p=PATHS.find(q=>q.id===el.dataset.p);if(p.req())finish(p);};}
function finish(p){P.done=true;P.path=p.id;const run={path:p.id,pathRu:p.ru,len:+lenMM().toFixed(1),gen:P.gen,time:Math.round(P.time),species:Object.keys(P.eaten).length,eggs:P.eggsLaid,kills:P.kills,body:P.body,date:Date.now()};
 let meta={runs:[]};try{meta=JSON.parse(localStorage.getItem(META_KEY))||meta;}catch(e){}meta.runs.push(run);try{localStorage.setItem(META_KEY,JSON.stringify(meta));}catch(e){}save();
 const mm=Math.floor(P.time/60);let h=`<h2>Этап пройден: ${p.ru}</h2><div class="muted">${p.desc}</div>
 <div class="seginfo" style="margin-top:10px"><div class="stat"><span>Длина</span><b>${lenMM().toFixed(1)} мм</b></div><div class="stat"><span>Время</span><b>${mm} мин</b></div><div class="stat"><span>Поколений</span><b>${P.gen}</b></div><div class="stat"><span>Видов в рационе</span><b>${Object.keys(P.eaten).length} / ${Object.keys(SPEC).length}</b></div><div class="stat"><span>Отложено яиц</span><b>${P.eggsLaid}</b></div><div class="stat"><span>Убито</span><b>${P.kills}</b></div></div>`;
 if(meta.runs.length>1){h+=`<div class="grp">Прошлые забеги</div>`+meta.runs.slice(-6,-1).reverse().map(r=>`<div class="stat"><span>${r.pathRu}</span><b>${r.len} мм · ${Math.round(r.time/60)} мин · ${r.gen} пок.</b></div>`).join('');}
 h+=`<div class="small muted" style="margin-top:10px">Следующий этап (в разработке): ${p.id==='vert'?'девонские реки и выход на сушу':p.id==='arth'?'первые наземные экосистемы силура':p.id==='moll'?'эпоха головоногих: охота в ордовикском море':p.id==='ann'?'жизнь в почве первых лесов':'строительство рифа'}.</div>
 <div style="display:flex;gap:8px;margin-top:12px"><button class="on" id="fNew">Новая игра</button><button id="fStay">Плавать дальше</button></div>`;
 $('finalBox').innerHTML=h;$('fNew').onclick=()=>{localStorage.removeItem(SAVE);location.reload();};$('fStay').onclick=()=>{$('final').classList.add('hidden');paused=false;};}
/* ===== сохранение ===== */
function save(){if(!P.alive&&!P.done)return;try{const o={};for(const k of['sym','seed','body','un','x','y','z','a','hp','o2','sat','bm','dna','dnaF','gen','off','eaten','time','zones','flags','kills','eggsLaid','hatched','packOn','foodCount','home','done','path'])o[k]=P[k];o.packN=packCount();o.nests=nests.filter(n=>n.own&&n.eggs>0);localStorage.setItem(SAVE,JSON.stringify({v:1,P:o}));}catch(e){}}
function loadSave(){try{const d=JSON.parse(localStorage.getItem(SAVE));return d&&d.v===1?d:null;}catch(e){return null;}}
/* ===== HUD ===== */
let hudT=0;
function hud(dt){hudT-=dt;if(hudT>0)return;hudT=0.12;const st=P.st;
 $('hpTxt').textContent=`${Math.max(0,P.hp).toFixed(0)} / ${st.hpMax.toFixed(0)}`;$('hpBar').style.width=clamp(P.hp/st.hpMax,0,1)*100+'%';
 $('o2Txt').textContent=Math.round(P.o2*100)+'%';$('o2Bar').style.width=P.o2*100+'%';$('o2Bar').style.background=P.o2<0.25?'#ff7a6a':'#6fd0ff';
 $('satBar').style.width=P.sat*100+'%';$('satBar').style.background=P.sat<0.2?'#ff9a6a':'#7fa0ff';
 $('bmTxt').textContent=P.bm.toFixed(1);$('dnaTxt').textContent=P.dna;$('lenTxt').textContent=`${P.sym==='radial'?'⌀':'длина'} ${lenMM().toFixed(1)} / ${GOAL()} мм`;
 $('offTxt').textContent=`Потомков: ${P.off}`;$('packTxt').textContent=packMax()?`Стая: ${packCount()}/${packMax()}`:'';
 $('bEgg').classList.toggle('hidden',!ents.some(e=>e.sp==='kin'&&e.mate)&&!P.eggsLaid);$('bBur').classList.toggle('hidden',!P.un.burrow);$('bBur').classList.toggle('on',P.bur);
 $('bPack').classList.toggle('hidden',!packMax());$('bPack').classList.toggle('on',P.packOn);$('bPack').textContent=`Стая: ${P.packOn?'вкл':'выкл'}`;
 $('bFinal').classList.toggle('hidden',lenMM()<GOAL()||P.done);
 const zn=zoneAt(P.x,P.y),dep=((SURF-P.z)/10).toFixed(0);$('info').innerHTML=`<b>${ZONES[zn].ru}</b> · глубина ${dep} м · ${floorTypeRu()}${P.bur?' · <b>закопан</b>':''}`;
 const G=[[P.foodCount>=5,'Поешь: планктон, мелкие рачки, водорослевые маты'],[P.flags.edit,'Открой «Эволюцию» (E) и измени тело'],[P.eggsLaid>0,'Найди сородича ♥ и отложи яйца (R)'],[P.st.gill>0&&P.zones.deep,'Отрасти жабры и спустись в Тёмную впадину'],[lenMM()>=GOAL(),`Вырасти до ${GOAL()} мм (${lenMM().toFixed(1)})`],[P.done,'Выбери путь развития']];
 const nx=G.findIndex(g=>!g[0]);$('goal').innerHTML=`<div class="t" style="font-weight:600;margin-bottom:4px">Цели этапа</div>`+G.map((g,i)=>`<div style="color:${g[0]?'#7fd09f':i===nx?'#ffe08a':'#8aa0b0'}">${g[0]?'✓':i===nx?'▸':'·'} ${g[1]}</div>`).join('')+`<div class="meter"><i style="width:${clamp(lenMM()/GOAL(),0,1)*100}%"></i></div><div class="small muted">Видов в рационе: ${Object.keys(P.eaten).length}/${Object.keys(SPEC).length} · Время: ${Math.floor(P.time/60)} мин</div>`;
 hints();}
function floorTypeRu(){return{sand:'песок',mud:'ил',rock:'скалы',mat:'водорослевый мат'}[floorType(P.x,P.y)];}
const HINTS=[[()=>P.time<14,'Плыви за курсором мыши или WASD. Пробел — вверх, Shift — вниз. Ешь светящийся планктон и тех, кто меньше тебя.'],[()=>P.time<40&&P.bm>=8&&!P.flags.edit,'Накопились питательные вещества — нажми <b>E</b>: добавь сегмент или увеличь тело.'],[()=>ents.some(e=>e.sp==='kin'&&e.mate&&d3(e,P)<P.st.L*6+30)&&!P.eggsLaid,'Рядом сородич с ♥. Подплыви вплотную и нажми <b>R</b>, чтобы отложить яйца: потомки — это запасные жизни.'],[()=>P.o2<0.35,'Кислорода мало: поднимись выше (Пробел). Жабры позволяют дышать глубже.'],[()=>lenMM()>=GOAL()&&!P.done,'Ты достаточно вырос — нажми «Завершить этап», чтобы выбрать путь развития.']];
function hints(){const h=HINTS.find(q=>q[0]());$('hint').style.display=h?'':'none';if(h)$('hint').innerHTML=h[1];}
/* ===== отрисовка ===== */
function drawArrows(){const list=[];
 for(const e of ents){if(e.gone)continue;if(e.sp==='kin'&&e.mate)list.push([e,'rgba(255,140,190,0.9)']);else if(P.st.antenna&&e.S.beh==='hunt'&&e.tgt===P)list.push([e,'rgba(255,90,80,0.95)']);}
 for(const n of nests)if(n.own&&n.eggs)list.push([n,'rgba(255,230,140,0.9)']);
 for(const[o,c]of list){const p=proj(o.x,o.y,o.z);if(p[0]>20&&p[0]<W-20&&p[1]>20&&p[1]<H-20)continue;const a=Math.atan2(p[1]-H/2,p[0]-W/2);const r=Math.min(W,H)*0.44;const x=W/2+Math.cos(a)*Math.min(r*1.4,W/2-24),y=H/2+Math.sin(a)*Math.min(r,H/2-24);ctx.fillStyle=c;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-6,-7);ctx.lineTo(-3,0);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.restore();}}
function render(dt){
 ctx.setTransform(DPR,0,0,DPR,0,0);const dk=clamp(cam.z/SURF,0,1);
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,`rgb(${(10+30*dk)|0},${(40+70*dk)|0},${(60+70*dk)|0})`);g.addColorStop(1,`rgb(${(3+12*dk)|0},${(14+40*dk)|0},${(24+50*dk)|0})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 drawFloor();ctx.setTransform(DPR,0,0,DPR,0,0);
 const vr=viewR()*1.3,list=[];
 for(const d of decor)if(Math.abs(d.x-cam.x)<vr&&Math.abs(d.y-cam.y)<vr)list.push([d.x+d.y,0,d]);
 for(const n of nests)list.push([n.x+n.y,1,n]);for(const c of carr)list.push([c.x+c.y,2,c]);
 for(const e of ents)if(!e.gone&&Math.abs(e.x-cam.x)<vr&&Math.abs(e.y-cam.y)<vr)list.push([e.x+e.y,3,e]);
 if(P.alive)list.push([P.x+P.y,4,P]);
 list.sort((a,b)=>a[0]-b[0]);
 for(const f of foods)drawFood(f);
 for(const[,k,o]of list){if(k===0)drawDecor(o);else if(k===1)drawNest(o);else if(k===2)drawCarrion(o);else if(k===3)drawEnt(o);else drawPlayer();}
 drawSnow(dt);drawRays(cam.z);const pp=proj(P.x,P.y,P.z);drawDark(pp[0],pp[1],cam.z,P.st.eyeQ);drawArrows();
 if(P.hit>0){ctx.fillStyle=`rgba(200,30,30,${P.hit*0.5})`;ctx.fillRect(0,0,W,H);}
 if(P.o2<0.25&&P.alive){const v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(10,20,60,${(0.25-P.o2)*2.4})`);ctx.fillStyle=v;ctx.fillRect(0,0,W,H);}
}
P.gut=[];
function drawPlayer(){const fz=floorH(P.x,P.y);if(P.bur){const p=proj(P.x,P.y,fz);const r=P.st.Req*cam.s;ctx.fillStyle='rgba(90,75,50,0.6)';ctx.beginPath();ctx.ellipse(p[0],p[1],r*2.2,r*0.9,0,0,TAU);ctx.fill();ctx.globalAlpha=0.35;drawBody(P.body,P.pos,{moving:0,heading:P.a,brain:P.st.brain});ctx.globalAlpha=1;const h=proj(P.pos[0].x,P.pos[0].y,fz+P.body.segs[0].r*0.6);ctx.fillStyle='rgba(20,15,10,0.9)';for(const sd of[-1,1]){ctx.beginPath();ctx.arc(h[0]+sd*r*0.35,h[1],Math.max(1.2,r*0.12),0,TAU);ctx.fill();}return;}
 if(P.z-fz>P.st.Req*1.2)drawShadow(P.x,P.y,P.z,P.st.Req*1.1);
 const a=P.inv>0?0.5+0.4*Math.sin(T_*20):1;drawBody(P.body,P.pos,{moving:P.mv,heading:P.a,alpha:a,brain:P.st.brain,gut:P.gut});}
function gutTick(dt){if(P.foodCount>(P.lastFC||0)){P.lastFC=P.foodCount;if(P.gut.length<6)P.gut.push({p:0,c:`rgba(${(120+R_()*60)|0},${(140+R_()*60)|0},60,0.75)`});}for(const g of P.gut)g.p+=dt*0.08;P.gut=P.gut.filter(g=>g.p<1);}
/* ===== старт ===== */
let selSym='bilateral';
for(const id of['symB','symR'])$(id).onclick=()=>{selSym=$(id).dataset.sym;$('symB').classList.toggle('on',selSym==='bilateral');$('symR').classList.toggle('on',selSym==='radial');$('symB').style.borderColor=selSym==='bilateral'?'#5a9ad0':'';$('symR').style.borderColor=selSym==='radial'?'#5a9ad0':'';};
$('symB').style.borderColor='#5a9ad0';
function lvl1(){try{const m=JSON.parse(localStorage.getItem('evo_stage1_meta'));const r=m&&m.runs&&m.runs.length?m.runs[m.runs.length-1]:null;if(!r)return'';const kn={animal:'животные',plant:'растения',fungi:'грибы',fungus:'грибы'}[r.kingdom]||r.kingdom;return r.kingdom==='animal'?`Уровень 1 пройден: «${r.name||'твой вид'}» выбрал путь животных — продолжаем его историю.`:`На уровне 1 твой вид выбрал царство «${kn}». Пока второй этап есть только для животных — играем ветку животного.`;}catch(e){return'';}}
$('lvl1info').textContent=lvl1();
const sv0=loadSave();if(sv0&&sv0.P&&!sv0.P.done)$('bCont').classList.remove('hidden');
function begin(sym,data){
 const seed=data?data.P.seed:(Math.random()*1e6)|0;genWorld(seed);genDecor(seed);P=newPlayer(sym,seed);
 if(data){Object.assign(P,data.P);P.gut=[];}
 P.st=null;refreshStats();if(!data)P.hp=P.st.hpMax;P.alive=true;P.inv=2;
 if(data){placePlayer(data.P.x,data.P.y);P.z=data.P.z;for(const n of data.nests||[])nests.push(n);}
 else{const[x,y]=findSpawn();placePlayer(x,y);toast('<b>Кембрий, 520 млн лет назад.</b> Ты — крошечный донный червячок. Расти, размножайся и стань кем-то большим.');}
 ents.length=0;foods.length=0;carr.length=0;if(P.packOn)for(let k=0;k<(data&&data.P.packN||0);k++)spawnPackMember();
 for(let k=0;k<20;k++)popTick(0.1);for(let k=0;k<60;k++)addPlankton(P.x+rnd(-60,60),P.y+rnd(-60,60),clamp(P.z+rnd(-25,30),floorH(P.x,P.y)+3,SURF-4));
 $('hTitle').textContent=`Поколение ${P.gen}`;$('start').classList.add('hidden');paused=false;save();}
$('bNew').onclick=()=>begin(selSym,null);$('bCont').onclick=()=>begin(sv0.P.sym,sv0);
/* ===== цикл ===== */
let last=performance.now(),saveT=0;
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;
 if(!paused&&!edOpen&&P.alive){T_+=dt;playerUpdate(dt);for(let i=0;i<ents.length;i++)if(!ents[i].gone)entUpdate(ents[i],dt);popTick(dt);nestTick(dt);matTick(dt);gutTick(dt);saveT+=dt;if(saveT>8){saveT=0;save();}}
 else T_+=dt*0.5;
 cam.ts=camScale();camUpdate(P.x,P.y,P.z,dt);render(dt);if(edOpen)drawEd();hud(dt);
 requestAnimationFrame(frame);}
genWorld(7);genDecor(7);P.st=bodyStats(P.body,P.un);placePlayer(-1400,-1400);
requestAnimationFrame(frame);
window.__G={get P(){return P;},ents,foods,nests,carr,SPEC,begin,openEditor,closeEditor,tryEdit,buyNode,cam,openFinal,layEggs};
