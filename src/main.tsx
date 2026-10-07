import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/style.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<main className="splash"><h1>SORATRO</h1><p>L’atelier a rencontré une erreur. Les partitions sauvegardées restent sur cet appareil.</p><button onClick={()=>location.reload()}>Rouvrir l’atelier</button></main>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
if('serviceWorker' in navigator&&import.meta.env.PROD){window.addEventListener('load',()=>{void navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{scope:import.meta.env.BASE_URL}).catch(error=>console.error('SORATRO offline cache:',error));});}
