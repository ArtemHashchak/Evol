global.btoa=s=>Buffer.from(s,'binary').toString('base64');global.atob=s=>Buffer.from(s,'base64').toString('binary');
const E=require('../src/sim.js');
E.newGame({seed:12345,cap:5300});
const S=E.S;
let land=0;const bc=new Array(9).fill(0);for(let i=0;i<S.biome.length;i++){bc[S.biome[i]]++;}
console.log('biomes',bc.map((n,i)=>E.BIOME_NAMES[i]+':'+n).join(' '));
let t0=Date.now();
for(let d=1;d<=Number(process.argv[2]||60);d++){
  for(let k=0;k<E.DAY;k++)E.step();
  if(d%5===0){
    const live=S.species.filter(s=>s.count>0);
    const vis=S.species.filter(s=>s.peak>=10).length;
    const top=live.sort((a,b)=>b.count-a.count).slice(0,5).map(s=>`${s.name}(${s.count},d${s.diet.toFixed(2)}${s.player?'*':''})`).join(' ');
    console.log(`day ${d} pop ${E.cs.length} player ${S.playerCount} live ${live.length} total ${S.species.length} vis ${vis} | ${top} | ${((Date.now()-t0)/(d*E.DAY)).toFixed(2)}ms/tick`);
  }
}
console.log(S.deathCause);
console.log(S.log.slice(-25).map(l=>l.d+': '+l.text).join('\n'));
const avg=E.speciesStats(S.species.filter(s=>s.count>0).sort((a,b)=>b.count-a.count)[0].id);
console.log(E.GN.map((n,i)=>n+'='+avg.avg[i].toFixed(2)).join(' '));
const ser=E.serialize();console.log('save size',(ser.length/1e6).toFixed(2),'MB');
E.deserialize(ser);console.log('reload pop',E.cs.length);for(let k=0;k<500;k++)E.step();console.log('after',E.cs.length);
