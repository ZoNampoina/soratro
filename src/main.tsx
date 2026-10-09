import React from 'react';
import { isAndroid } from './platform/native';
import { registerOffline } from './pwa/updates';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/style.css';
import './ui/workspace.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<main className="splash"><h1>SORATRO</h1><p>L’atelier a rencontré une erreur. Les partitions sauvegardées restent sur cet appareil.</p><button onClick={()=>location.reload()}>Rouvrir l’atelier</button></main>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
if(import.meta.env.PROD&&!isAndroid()){window.addEventListener('load',()=>{void registerOffline();});}
