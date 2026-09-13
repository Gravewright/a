// AGPL-3.0-only. Geometry adapter for the Dice So Nice shape definitions.
import {DICE_SHAPE} from './vendor/shapes.js';
export const SUPPORTED = [2,3,4,6,8,10,12,14,16,20,24,30,100];
export function geometryData(sides) {
  const type = sides === 3 ? 6 : sides;
  if (type === 2) {
    const vertices = [], faces = [];
    for (const y of [-0.16,0.16]) for(let i=0;i<16;i++) vertices.push([Math.cos(i*Math.PI/8),y,Math.sin(i*Math.PI/8)]);
    faces.push(Array.from({length:16},(_,i)=>i),Array.from({length:16},(_,i)=>31-i));
    for(let i=0;i<16;i++) faces.push([i,(i+1)%16,(i+1)%16+16,i+16]);
    return {vertices,faces,values:[1,2,...Array(16).fill(null)],sides};
  }
  const shape = DICE_SHAPE['d'+type];
  if(!shape) throw new Error('Unsupported physical die: '+sides);
  const radius = Math.max(...shape.vertices.map(v=>Math.hypot(...v)));
  return {vertices:shape.vertices.map(v=>v.map(n=>n/radius)),faces:shape.faces.map(f=>shape.skipLastFaceIndex?f.slice(0,-1):[...f]),values:shape.faceValues.map(v=>sides===3?(v-1)%3+1:v),sides};
}
export function normal(vertices,face) {
  const [a,b,c]=face.map(i=>vertices[i]);
  const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const len=Math.hypot(...n);return n.map(x=>x/len);
}
export function orient(data) {
  data.faces=data.faces.map(f=>{
    const n=normal(data.vertices,f), c=f.reduce((a,i)=>a.map((x,j)=>x+data.vertices[i][j]/f.length),[0,0,0]);
    return n.reduce((a,x,i)=>a+x*c[i],0)<0?[...f].reverse():f;
  });
  return data;
}
// As in DSN's forced-result pass, the server result changes visual face mapping,
// never the roll. Keep every face value, choosing the permutation before replay.
export function faceLabels(data,landing,wanted,labels) {
  const values=labels ? [...labels] : [...data.values];
  const source=values.findIndex(v=>String(v)===String(wanted));
  if(source<0) throw new Error('Result is not on this die');
  [values[landing],values[source]]=[values[source],values[landing]];
  return values;
}
