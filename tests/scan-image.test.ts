import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_PREPARATION,type Quad} from '../src/recognition/types.ts';
import {preparePixels,sourceQuad,projectPoint,homography,validateQuad,binaryPixels,components,normalizedMask,shapeDistance,deskewAngle,type Pixels} from '../src/recognition/image-processing.ts';
const image=():Pixels=>{const p={width:160,height:100,data:new Uint8ClampedArray(160*100*4).fill(255)};for(const [x,y,w,h] of [[20,45,3,3],[34,45,2,7],[65,25,2,50],[100,30,15,20]])for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){const o=(j*p.width+i)*4;p.data[o]=p.data[o+1]=p.data[o+2]=0;}return p;};
test('Scan preprocessing preserves the source, round tiny marks and comma tails without morphology',()=>{
 const input=image(),before=input.data.slice();for(const settings of [{...DEFAULT_PREPARATION},{...DEFAULT_PREPARATION,contrast:1.3,flatten:true},{...DEFAULT_PREPARATION,adaptive:true,sharpness:.2,noise:.2}]){const prepared=preparePixels(input,structuredClone(settings)),parts=components(binaryPixels(prepared));assert.ok(parts.some(p=>p.x<25&&p.y>40&&p.area>=3),'period preserved');assert.ok(parts.some(p=>p.x>30&&p.x<40&&p.height>=5),'comma preserved');assert.deepEqual(input.data,before);}
});
test('Scan perspective and rotation preserve an invertible source correspondence; crossed corners are rejected',()=>{
 const q:Quad=[{x:.1,y:.1},{x:.9,y:.15},{x:.85,y:.85},{x:.12,y:.9}];validateQuad(q);assert.throws(()=>validateQuad([q[0],q[2],q[1],q[3]]),/quadrilatère/);for(const rotation of [0,90,180,270] as const){const p=preparePixels(image(),{...structuredClone(DEFAULT_PREPARATION),quad:q,rotation,deskew:2}),box={x:20,y:20,width:10,height:8},corners=sourceQuad(p.toSource,box),back=homography(corners,[{x:20,y:20},{x:30,y:20},{x:30,y:28},{x:20,y:28}]);const r=projectPoint(back,projectPoint(p.toSource,{x:25,y:24}));assert.ok(Math.abs(r.x-25)<1e-7);assert.ok(Math.abs(r.y-24)<1e-7);assert.ok(p.width*p.height<=2400000);}
});
test('Scan exemplar matching measures a real shape distance and distinguishes unequal shapes',()=>{
 const b=binaryPixels(image()),parts=components(b),a=parts.find(p=>p.x===20)!,c=parts.find(p=>p.x===100)!,first=normalizedMask(b,a),other=normalizedMask(b,c);assert.equal(first.length,784);assert.equal(shapeDistance(first,first,1,1),0);assert.ok(shapeDistance(first,other,1,.75)>0);
});
test('Scan blank pages do not invent a deskew angle or create foreground glyphs',()=>{const p={width:120,height:80,data:new Uint8ClampedArray(120*80*4).fill(255)};assert.equal(deskewAngle(p),0);assert.deepEqual(components(binaryPixels(p)),[]);});
