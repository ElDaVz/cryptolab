import{api}from'./adapters/browser';
import{Session,type SenderDraft,type KeyDraft}from'./experience/session';
import{button,renderView,playback}from'./ui/views';
import{intro}from'./ui/intro';
import'./ui/style.css';
import{Machine}from'./machine/Machine';
import{AnimationDirector}from'./machine/AnimationDirector';
const root=document.querySelector<HTMLElement>('#app')!;
const session=new Session(api);
let loading:'loading'|'ready'|'failed'='loading';let repeated=false;
root.innerHTML=`<header><a class="brand" href="./">CRIPTO<span>LAB</span></a><nav id="navigation" aria-label="Perspectivas">${button('sender','Emisor')}${button('interceptor','Interceptor')}${button('internal','Mecanismo interno')}${button('intro-repeat','Repetir introducción',false,'id="repeat"')}</nav><div id="preferences">${button('audio','Sonido: desactivado')}<label><input type="checkbox" id="reduced"> Reducir movimiento</label></div></header><div id="engine" role="status"></div><div id="render-notice"></div><div id="machine" aria-hidden="true"></div><aside id="machine-info" class="machine-info"></aside><div id="intro" class="panel intro-panel"></div><section id="left" class="panel" aria-label="Configuración" tabindex="-1"></section><section id="right" class="panel" aria-label="Resultado y explicación" tabindex="0"></section><section id="bottom" class="panel" aria-label="Selección y reproducción"></section><footer>Matemática discreta · A–Z / módulo 26 · Uso educativo, sin seguridad moderna</footer>`;
const el=(id:string)=>document.getElementById(id)!;
const director=new AnimationDirector(index=>{session.select(index);render();});
const motion=matchMedia('(prefers-reduced-motion: reduce)');
director.setReduced(motion.matches);
let machine:Machine|null=null;let machineContext='';
function loseWebGL(){director.detachGraphics();machine?.destroy();machine=null;el('render-notice').textContent='Modo textual: WebGL no está disponible. Todos los cálculos y controles siguen disponibles.';}
try{machine=new Machine(el('machine'),loseWebGL);machine.onStep=(field,delta)=>{director.cancel();session.stepKey(field,delta);render();};}catch{loseWebGL();}
function render(focusHeading=false){
 const active=document.activeElement as HTMLInputElement|HTMLTextAreaElement|null;const saved=active?.id;const selection=active?.tagName==='TEXTAREA'||(active?.tagName==='INPUT'&&active.type==='text')?[active.selectionStart,active.selectionEnd]:null;
 el('engine').innerHTML=loading==='ready'?'Motor matemático listo':loading==='loading'?'Cargando motor matemático…':`No se pudo cargar el motor matemático ${button('retry','Reintentar')}`;
 const guided=session.intro!==null;
 for(const id of ['navigation','preferences','left','right','bottom'])el(id).hidden=guided;
 el('intro').hidden=!guided;el('machine').hidden=guided;el('machine-info').hidden=guided;
 const model=session.machine();machine?.update(model);
 const contextChanged=machineContext!==model.context;
 if(contextChanged){director.cancel();machine?.cancelDrag();machineContext=model.context;}
 if(machine)for(const field of ['a','b']as const)director.knob(machine.knobs[field].rotation,model.positions[field],contextChanged);
 if(machine&&contextChanged){director.camera(machine.camera.position,machine.target());}
 el('machine-info').innerHTML=`<p>${session.playback()?'Correspondencia del cálculo':'Vista previa de configuración'} · ${model.algorithm==='affine'?'Afín':model.algorithm==='caesar'?'César · +8 público':'Sin configuración'}</p><p>Entrada · A–Z / Salida · ${model.operation==='encrypt'?'Cifrar':'Descifrar'}</p><p data-testid="mapping">${model.mapping??'Configura una clave válida'}</p><p data-testid="positions">${model.algorithm==='affine'?`a=${model.positions.a??'sin posición'} · b=${model.positions.b??'sin posición'}`:''}</p>`;
 const selected=guided?null:session.playback();director.setRing(machine?.rings.rotation??null);director.bind(selected?.id??null,selected?.value.cipher.steps??[],selected?.index??0);
 if(guided)el('intro').innerHTML=intro(session.intro!,api,loading==='ready');
 else{const view=renderView(session.project(),loading==='ready',session.perspective==='interceptor'&&session.source==='exercise'?session.solution():null);el('left').innerHTML=view.left;el('right').innerHTML=view.right;el('bottom').innerHTML=playback(session.playback());const playButton=el('bottom').querySelector<HTMLElement>('[data-action=play]');if(playButton){playButton.textContent=director.playing?'Pausar':'Reproducir';playButton.dataset.action=director.playing?'pause':'play';}if(director.transitioning)el('bottom').insertAdjacentHTML('beforeend','<span class="transition">Transición al siguiente carácter</span>');}
 for(const region of ['intro','left','right','bottom'])for(const control of el(region).querySelectorAll<HTMLButtonElement>('button[data-action]'))if(!control.id)control.id=`${region}-${control.dataset.action==='pause'?'play':control.dataset.action}-${control.dataset.index??control.dataset.field??''}-${control.dataset.delta??''}`;
 if(focusHeading)el(guided?'intro-title':'view-title')?.focus();
 else if(saved){const restored=document.getElementById(saved) as HTMLInputElement|HTMLTextAreaElement|null;restored?.focus();if(selection&&restored?.setSelectionRange)restored.setSelectionRange(selection[0],selection[1]);}
}
function focusError(){const view=session.project();if(!('error'in view)||!view.error)return;const e=view.error;const field=e.code==='InputError'?e.field:e.code==='InvalidAffineKey'?'a':'message';const input=document.getElementById(field);input?.setAttribute('aria-invalid','true');(input??el('view-title')).focus();}
function execute(){director.cancel();if(loading!=='ready')return;if(session.perspective==='sender')session.executeSender();else session.tryCandidate();render();focusError();}
root.addEventListener('submit',event=>{event.preventDefault();execute();});
root.addEventListener('input',event=>{const target=event.target as HTMLInputElement;const id=target.id;if(!['message','a','b'].includes(id))return;director.cancel();if(session.perspective==='sender')session.editSender({[id]:target.value} as Partial<SenderDraft>);else session.editCandidate({[id]:target.value} as Partial<KeyDraft>);render();});
root.addEventListener('change',event=>{const target=event.target as HTMLSelectElement;if(target.id==='reduced'){director.setReduced(motion.matches||(target as unknown as HTMLInputElement).checked);render();return;}director.cancel();if(target.id==='algorithm'||target.id==='operation'){session.editSender({[target.id]:target.value} as Partial<SenderDraft>);render();}if(target.id==='source'){session.setSource(target.value as 'session'|'exercise');render();}});
root.addEventListener('keydown',event=>{const target=event.target as HTMLElement;if((target.id==='a'||target.id==='b')&&(event.key==='ArrowUp'||event.key==='ArrowDown')){event.preventDefault();director.cancel();session.stepKey(target.id,event.key==='ArrowUp'?1:-1);render();}});
root.addEventListener('click',event=>{
 const target=(event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');if(!target||target.disabled)return;const action=target.dataset.action;
 if(action==='play'){director.play();render();return;}if(action==='pause'){director.pause();render();return;}director.cancel();
 if(action==='retry'){void initialize();return;}
 if(action==='intro-next'){session.nextIntro();render(true);return;}if(action==='intro-previous'){session.previousIntro();render(true);return;}
 if(action==='intro-close'){session.closeIntro();render(!repeated);if(repeated)el('repeat').focus();return;}
 if(action==='intro-repeat'){repeated=true;session.repeatIntro();render(true);return;}
 if(action==='sender'||action==='interceptor'||action==='internal'){session.navigate(action);render(true);return;}
 if(action==='step'){session.stepKey(target.dataset.field as 'a'|'b',Number(target.dataset.delta));render();return;}
 if(action==='select'){director.select(Number(target.dataset.index));render();return;}
 if(action==='hint')session.hint();if(action==='submit')session.submit();if(action==='reveal')session.reveal();if(action==='reset')session.resetExercise();if(action==='solution'){session.openSolution();render(true);return;}if(action==='return'){session.returnToOrigin();render(true);return;}
 const record=session.playback();if(action==='previous')director.select((record?.index??0)-1);if(action==='next')director.select((record?.index??0)+1);if(action==='start')director.select(0);
 render();
});
async function initialize(){loading='loading';render();try{await api.initialize();loading='ready';}catch{loading='failed';}render();}
render();void initialize();

window.addEventListener('pagehide',()=>{director.destroy();machine?.destroy();},{once:true});

const motionChange=()=>{director.setReduced(motion.matches||(el('reduced') as HTMLInputElement).checked);render();};
motion.addEventListener('change',motionChange);
const visibility=()=>{if(document.hidden){director.cancel();machine?.cancelDrag();render();}};
document.addEventListener('visibilitychange',visibility);
window.addEventListener('pagehide',()=>{motion.removeEventListener('change',motionChange);document.removeEventListener('visibilitychange',visibility);},{once:true});
