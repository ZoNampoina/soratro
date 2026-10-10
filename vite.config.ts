import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], optimizeDeps:{include:['fflate','pitchy']}, server:{host:'0.0.0.0',port:4173,strictPort:true,allowedHosts:['terminal.local']}, preview:{host:'0.0.0.0',port:4173,strictPort:true,allowedHosts:['terminal.local']}, build:{target:'es2022',emptyOutDir:true} });
