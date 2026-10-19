import {mkdir,cp,copyFile} from 'node:fs/promises';
await mkdir('public/scan-pdf',{recursive:true});
for(const folder of ['standard_fonts','wasm'])await cp('node_modules/pdfjs-dist/'+folder,'public/scan-pdf/'+folder,{recursive:true});
await copyFile('node_modules/pdfjs-dist/LICENSE','public/scan-pdf/LICENSE');
