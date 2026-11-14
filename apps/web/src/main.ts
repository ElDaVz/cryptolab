import{api}from'./adapters/browser';
import{Session,type SenderDraft,type KeyDraft}from'./experience/session';
import{button,renderView,playback}from'./ui/views';
import{intro}from'./ui/intro';
import'./ui/style.css';
const root=document.querySelector<HTMLElement>('#app')!;
const session=new Session(api);
let loading:'loading'|'ready'|'failed'='loading';let repeated=false;
root.innerHTML=`<header><a class="brand" href="./">CRIPTO<span>LAB</span></a><nav id="navigation" aria-label="Perspectivas">${button('sender','Emisor')}${button('interceptor','Interceptor')}${button('internal','Mecanismo interno')}${button('intro-repeat','Repetir introducción',false,'id="repeat"')}</nav><div id="preferences">${button('audio','Sonido: desactivado')}<label><input type="checkbox" id="reduced"> Reducir movimiento</label></div></header><div id="engine" role="status"></div><div id="render-notice"></div><div id="machine" aria-hidden="true"></div><div id="intro" class="panel intro-panel"></div><section id="left" class="panel" aria-label="Configuración" tabindex="-1"></section><section id="right" class="panel" aria-label="Resultado y explicación" tabindex="0"></section><section id="bottom" class="panel" aria-label="Selección y reproducción"></section><footer>Matemática discreta · A–Z / módulo 26 · Uso educativo, sin seguridad moderna</footer>`;
const el=(id:string)=>document.getElementById(id)!;
function render(focusHeading=false){
 const active=document.activeElement as HTMLInputElement|HTMLTextAreaElement|null;const saved=active?.id;const selection=active?.tagName==='TEXTAREA'||(active?.tagName==='INPUT'&&active.type==='text')?[active.selectionStart,active.selectionEnd]:null;
 el('engine').innerHTML=loading==='ready'?'Motor matemático listo':loading==='loading'?'Cargando motor matemático…':`No se pudo cargar el motor matemático ${button('retry','Reintentar')}`;
 const guided=session.intro!==null;
 for(const id of ['navigation','preferences','left','right','bottom'])el(id).hidden=guided;
 el('intro').hidden=!guided;
 if(guided)el('intro').innerHTML=intro(session.intro!,api,loading==='ready');
 else{const view=renderView(session.project(),loading==='ready');el('left').innerHTML=view.left;el('right').innerHTML=view.right;el('bottom').innerHTML=playback(session.playback());}
 if(focusHeading)el(guided?'intro-title':'view-title')?.focus();
 else if(saved){const restored=document.getElementById(saved) as HTMLInputElement|HTMLTextAreaElement|null;restored?.focus();if(selection&&restored?.setSelectionRange)restored.setSelectionRange(selection[0],selection[1]);}
}
function focusError(){const view=session.project();if(!('error'in view)||!view.error)return;const e=view.error;const field=e.code==='InputError'?e.field:e.code==='InvalidAffineKey'?'a':'message';const input=document.getElementById(field);input?.setAttribute('aria-invalid','true');(input??el('view-title')).focus();}
function execute(){if(loading!=='ready')return;if(session.perspective==='sender')session.executeSender();else session.tryCandidate();render();focusError();}
root.addEventListener('submit',event=>{event.preventDefault();execute();});
root.addEventListener('input',event=>{const target=event.target as HTMLInputElement;const id=target.id;if(!['message','a','b'].includes(id))return;if(session.perspective==='sender')session.editSender({[id]:target.value} as Partial<SenderDraft>);else session.editCandidate({[id]:target.value} as Partial<KeyDraft>);render();});
root.addEventListener('change',event=>{const target=event.target as HTMLSelectElement;if(target.id==='algorithm'||target.id==='operation'){session.editSender({[target.id]:target.value} as Partial<SenderDraft>);render();}if(target.id==='source'){session.setSource(target.value as 'session'|'exercise');render();}});
root.addEventListener('keydown',event=>{const target=event.target as HTMLElement;if((target.id==='a'||target.id==='b')&&(event.key==='ArrowUp'||event.key==='ArrowDown')){event.preventDefault();session.stepKey(target.id,event.key==='ArrowUp'?1:-1);render();}});
root.addEventListener('click',event=>{
 const target=(event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');if(!target||target.disabled)return;const action=target.dataset.action;
 if(action==='retry'){void initialize();return;}
 if(action==='intro-next'){session.nextIntro();render(true);return;}if(action==='intro-previous'){session.previousIntro();render(true);return;}
 if(action==='intro-close'){session.closeIntro();render(!repeated);if(repeated)el('repeat').focus();return;}
 if(action==='intro-repeat'){repeated=true;session.repeatIntro();render(true);return;}
 if(action==='sender'||action==='interceptor'||action==='internal'){session.navigate(action);render(true);return;}
 if(action==='step'){session.stepKey(target.dataset.field as 'a'|'b',Number(target.dataset.delta));render();return;}
 if(action==='select'){session.select(Number(target.dataset.index));render();return;}
 const record=session.playback();if(action==='previous')session.select((record?.index??0)-1);if(action==='next')session.select((record?.index??0)+1);if(action==='start')session.select(0);
 render();
});
async function initialize(){loading='loading';render();try{await api.initialize();loading='ready';}catch{loading='failed';}render();}
render();void initialize();
