import {api}from './adapters/browser';
const root=document.querySelector<HTMLElement>('#app')!;
function initialize(){root.textContent='Cargando motor matemático…';void api.initialize().then(()=>{root.textContent='Motor matemático listo';}).catch(()=>{root.textContent='No se pudo cargar el motor matemático';const retry=document.createElement('button');retry.textContent='Reintentar';retry.onclick=initialize;root.append(retry);});}
initialize();
