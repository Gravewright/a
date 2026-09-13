import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from '../src/physics.js';
import {geometryData,orient,faceLabels} from '../src/geometry.js';
import {notation,preferences} from '../src/notation.js';
test('all physical geometries simulate finite transforms and map authoritative results',()=>{
 const sides=[2,3,4,6,8,10,12,14,16,20,24,30];
 const dice=sides.map(s=>({sides:s,value:s}));const r=simulate(dice,26,18,42);
 assert.ok(r.frames.length>60&&r.frames.length<=360);
 for(const frame of r.frames)assert.ok(frame.every(Number.isFinite));
 dice.forEach((d,i)=>{const data=orient(geometryData(d.sides)),labels=faceLabels(data,r.landing[i],d.value);assert.equal(labels[r.landing[i]],d.value);assert.deepEqual([...labels].sort(),[...data.values].sort());});
 assert.deepEqual(simulate(dice,26,18,42).frames,r.frames);
});
test('percentile and Fate facts retain results and discard status',()=>{
 const dice=notation({roll:{result:{rolls:[{plan:{initial:{sides:100}},facts:[{id:'a',face:100}],selection:{a:'discarded'}},{plan:{initial:{definition:{dice:[{id:'f',faces:[-1,-1,0,0,1,1].map(value=>({value}))}]}}},facts:[{dieId:'f',face:-1}]}]}}});
 assert.deepEqual(dice.map(d=>d.value),[0,0,-1]);assert.equal(dice[0].discarded,true);assert.equal(dice[2].sides,6);
});
test('appearance only accepts colors and bundled fonts',()=>{
 assert.equal(preferences({font:'https://evil.test',diceColor:'url(x)',textColor:'#abcdef'}).font,'atkinsonhyperlegible');assert.equal(preferences({textColor:'#abcdef'}).textColor,'#abcdef');
});
