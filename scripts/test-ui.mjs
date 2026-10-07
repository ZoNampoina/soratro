import { build } from 'esbuild';
import { spawn } from 'node:child_process';
await build({entryPoints:['tests/ui.test.tsx'],outfile:'tests/.runtime/ui.test.mjs',bundle:true,packages:'external',platform:'node',format:'esm',target:'node24',define:{'import.meta.env':JSON.stringify({BASE_URL:'/soratro/',PROD:false})}});
const child=spawn(process.execPath,['--test','tests/.runtime/ui.test.mjs'],{stdio:'inherit'});child.on('exit',code=>process.exit(code??1));
