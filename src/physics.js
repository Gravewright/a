// AGPL-3.0-only. Adapted from Dice So Nice PhysicsWorker/ThrowEngine:
// contact materials, fixed-step simulation, sleep detection and buffered replay.
// Foundry APIs, presets, theme systems and external sound assets are excluded.
import * as C from 'cannon-es';
import {geometryData,orient,normal} from './geometry.js';
export function simulate(dice,width=24,height=15,seed=1) {
  let state=seed>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const world=new C.World({gravity:new C.Vec3(0,-35,0),allowSleep:true});
  world.broadphase=new C.NaiveBroadphase();world.solver.iterations=14;
  const material=new C.Material('dice'),floor=new C.Material('desk'),barrier=new C.Material('barrier');
  for(const [a,b,friction,restitution] of [[floor,material,.01,.5],[barrier,material,0,.95],[material,material,.01,.7]]) world.addContactMaterial(new C.ContactMaterial(a,b,{friction,restitution}));
  function plane(position,rotation,mat) {const b=new C.Body({mass:0,material:mat,shape:new C.Plane()});b.position.set(...position);b.quaternion.setFromEuler(...rotation);world.addBody(b);}
  plane([0,0,0],[-Math.PI/2,0,0],floor);
  plane([-width/2,0,0],[0,Math.PI/2,0],barrier);plane([width/2,0,0],[0,-Math.PI/2,0],barrier);
  plane([0,0,-height/2],[0,0,0],barrier);plane([0,0,height/2],[0,Math.PI,0],barrier);
  const impacts=[],bodies=dice.map((die,i)=>{
    const data=orient(geometryData(die.sides));
    const shape=new C.ConvexPolyhedron({vertices:data.vertices.map(v=>new C.Vec3(...v)),faces:data.faces});
    const body=new C.Body({mass:1,shape,material,linearDamping:.16,angularDamping:.2,allowSleep:true,sleepSpeedLimit:.3,sleepTimeLimit:.35});
    const direction=i%2?1:-1;
    body.position.set(direction*(width/2-2-random()*2),3+Math.floor(i/6)*2.2,(random()-.5)*(height-4));
    body.velocity.set(-direction*(8+random()*9),random()*3,(random()-.5)*9);
    body.angularVelocity.set((random()-.5)*25,(random()-.5)*25,(random()-.5)*25);
    body.quaternion.setFromEuler(random()*6.28,random()*6.28,random()*6.28);
    body.addEventListener('collide',e=>{const speed=Math.abs(e.contact.getImpactVelocityAlongNormal());if(speed>2 && impacts.length<80) impacts.push([world.stepnumber,speed]);});
    world.addBody(body);return {body,data};
  });
  const frames=[];
  for(let step=0;step<360;step++) {
    world.step(1/60);
    frames.push(bodies.flatMap(({body:b})=>[b.position.x,b.position.y,b.position.z,b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w]));
    if(step>60 && bodies.every(({body:b})=>b.sleepState===C.Body.SLEEPING))break;
  }
  const landing=bodies.map(({body,data})=>{
    let best=-Infinity,index=0;
    data.faces.forEach((face,i)=>{
      if(data.values[i]==null)return;
      const n=new C.Vec3(...normal(data.vertices,face));body.quaternion.vmult(n,n);
      const score=data.sides===4?-n.y:n.y;
      if(score>best){best=score;index=i;}
    });return index;
  });
  return {frames,landing,impacts};
}
