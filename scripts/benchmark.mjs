import {performance} from 'node:perf_hooks';
import {largeScore} from '../tests/fixtures/large-score.ts';
import {engraveProject} from '../src/score/engraving.ts';
const project=largeScore(),times=[];
let doc;
for(let i=0;i<6;i++){const before=performance.now();doc=engraveProject(project);times.push(performance.now()-before);}
const warm=times.slice(1).sort((a,b)=>a-b);
console.log(JSON.stringify({node:process.version,measures:100,voices:4,notes:2400,verses:8,syllables:1600,pages:doc.pages.length,systems:doc.systems.length,coldMs:+times[0].toFixed(1),medianWarmMs:+warm[2].toFixed(1),worstWarmMs:+warm.at(-1).toFixed(1)},null,2));
