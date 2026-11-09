global.btoa=s=>Buffer.from(s,'binary').toString('base64');global.atob=s=>Buffer.from(s,'base64').toString('binary');
const E=require('../src/sim.js');E.newGame({seed:+process.argv[2]||777,cap:5300});const S=E.S;
for(let d=1;d<=+process.argv[3];d++){for(let k=0;k<E.DAY;k++)E.step();
 if(d%15)continue;
 const cs=E.cs;const herb=cs.filter(c=>c.diet<0.35).length,omni=cs.filter(c=>c.diet>=0.35&&c.diet<0.6).length,carn=cs.filter(c=>c.diet>=0.6).length;
 const sz=cs.reduce((a,c)=>a+c.g[0],0)/cs.length,soc=cs.reduce((a,c)=>a+c.g[9],0)/cs.length,pack=cs.reduce((a,c)=>a+c.kinN,0)/cs.length;
 const mods={};cs.forEach(c=>{for(let k=0;k<13;k++)if(c.m&(1<<k))mods[E.MODS[k].k]=(mods[E.MODS[k].k]||0)+1});
 console.log(`d${d} pop ${cs.length} pl ${S.playerCount} herb/omni/carn ${herb}/${omni}/${carn} size ${sz.toFixed(2)} social ${soc.toFixed(2)} kin ${pack.toFixed(1)} vis ${S.species.filter(s=>s.peak>=10).length} alive ${S.species.filter(s=>s.count>0).length}`,JSON.stringify(mods));
}
