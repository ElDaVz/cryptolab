import type {ApiError,CipherRequest,CipherValue,CryptoApi,Direction,Key,PartialKey} from '../adapters/types';
export type Perspective='sender'|'interceptor'|'internal';
export type Source='session'|'exercise';
export type Context='sender'|'session'|'exercise'|'solution';
export type InputError={code:'InputError';field:'a'|'b'|'message';reason:string};
export type ViewError=ApiError|InputError;
export type KeyDraft={a:string;b:string};
export type SenderDraft=KeyDraft&{algorithm:'caesar'|'affine';operation:Direction;message:string};
export type ResultRecord={id:number;request:CipherRequest;value:CipherValue;index:number};
type Attempt={key:KeyDraft;result:ResultRecord|null;error:ViewError|null;feedback:string|null};
const attempt=():Attempt=>({key:{a:'',b:''},result:null,error:null,feedback:null});
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const exerciseCiphertext='CDRCDUFFZGDFQCXZYHZRXZ';
const exerciseMessage='LACLAVEESTAENLOSDISCOS';
export const keyNumber=(value:string):number|null=>/^[+-]?\d+$/.test(value)&&Number(value)>=-2147483648&&Number(value)<=2147483647?Number(value):null;
function parsedKey(key:KeyDraft):Key|InputError {
 for(const field of ['a','b'] as const)if(keyNumber(key[field])===null)return{code:'InputError',field,reason:'Introduce un entero entre −2147483648 y 2147483647.'};
 return{a:keyNumber(key.a)!,b:keyNumber(key.b)!};
}
export class Session {
 intro:number|null=0;
 perspective:Perspective='sender';
 source:Source='session';
 #draft:SenderDraft={algorithm:'caesar',operation:'encrypt',message:'',a:'5',b:'8'};
 #senderResult:ResultRecord|null=null;
 #senderError:ViewError|null=null;
 #snapshot:{algorithm:'caesar'|'affine';ciphertext:string}|null=null;
 #attempts:Record<Source,Attempt>={session:attempt(),exercise:attempt()};
 #status:'Sin resolver'|'Resuelto'|'Revelado'='Sin resolver';
 #hint=false;
 #solution:ResultRecord|null=null;
 #origin:Context='sender';
 #id=0;
 constructor(private readonly api:CryptoApi){}
 closeIntro(){this.intro=null;}
 repeatIntro(){this.intro=0;}
 nextIntro(){if(this.intro!==null)this.intro=Math.min(3,this.intro+1);}
 previousIntro(){if(this.intro!==null)this.intro=Math.max(0,this.intro-1);}
 navigate(view:Perspective){if(view==='internal'){this.openInternal();return;}this.perspective=view;}
 setSource(source:Source){this.source=source;if(this.perspective==='internal')this.#origin=source;}
 editSender(patch:Partial<SenderDraft>){if(Object.entries(patch).every(([k,v])=>this.#draft[k as keyof SenderDraft]===v))return;Object.assign(this.#draft,patch);this.#senderResult=null;this.#senderError=null;}
 editCandidate(patch:Partial<KeyDraft>){const a=this.#attempts[this.source];if(Object.entries(patch).every(([k,v])=>a.key[k as keyof KeyDraft]===v))return;Object.assign(a.key,patch);a.result=null;a.error=null;a.feedback=null;}
 private run(request:CipherRequest):ResultRecord|ViewError {
  if([...request.message].length>256)return{code:'InputError',field:'message',reason:'El mensaje supera el límite de 256 caracteres; corrígelo sin truncarlo.'};
  const reply=this.api.executeCipher(request);
  return reply.ok?{id:++this.#id,request:structuredClone(request),value:reply.value,index:0}:reply.error;
 }
 executeSender(){
  this.#senderResult=null;this.#senderError=null;
  const {algorithm,operation,message}=this.#draft;
  let request:CipherRequest;
  if(algorithm==='affine'){const key=parsedKey(this.#draft);if('code'in key){this.#senderError=key;return;}request={algorithm,operation,message,key};}
  else request={algorithm,operation,message};
  const result=this.run(request);if('code'in result){this.#senderError=result;return;}this.#senderResult=result;
  if(operation==='encrypt'){this.#snapshot={algorithm,ciphertext:result.value.cipher.output};const a=this.#attempts.session;a.result=null;a.error=null;a.feedback=null;}
 }
 tryCandidate(){
  const a=this.#attempts[this.source];a.result=null;a.error=null;a.feedback=null;
  const source=this.publicSource();if(!source)return;
  let request:CipherRequest;
  if(source.algorithm==='affine'){const key=parsedKey(a.key);if('code'in key){a.error=key;return;}request={algorithm:'affine',operation:'decrypt',message:source.ciphertext,key};}
  else request={algorithm:'caesar',operation:'decrypt',message:source.ciphertext};
  const result=this.run(request);if('code'in result)a.error=result;else a.result=result;
 }
 hint(){this.#hint=true;}
 submit(){
  const a=this.#attempts.exercise;
  if(this.source!=='exercise'||this.#status!=='Sin resolver'||!a.result||a.result.value.algorithm!=='affine')return;
  const key=a.result.value.normalizedKey;
  if(key.a===7&&key.b===3){this.#status='Resuelto';a.feedback='Clave correcta. Has resuelto el ejercicio.';}
  else a.feedback='La clave enviada no coincide. Puedes seguir probando.';
 }
 reveal(){if(this.source==='exercise'&&this.#status==='Sin resolver')this.#status='Revelado';}
 resetExercise(){this.#attempts.exercise=attempt();this.#status='Sin resolver';this.#hint=false;this.#solution=null;}
 private publicSource(){return this.source==='exercise'?{algorithm:'affine' as const,ciphertext:exerciseCiphertext}:this.#snapshot;}
 private result(context:Context):ResultRecord|null {return context==='sender'?this.#senderResult:context==='solution'?(this.#status==='Sin resolver'?null:this.#solution):this.#attempts[context].result;}
 private activeContext():Context{return this.perspective==='internal'?this.#origin:this.perspective==='sender'?'sender':this.source;}
 select(index:number){const result=this.result(this.activeContext());if(result&&Number.isInteger(index)&&index>=0&&index<result.value.cipher.steps.length)result.index=index;}
 openInternal(){if(this.perspective!=='internal')this.#origin=this.perspective==='sender'?'sender':this.source;this.perspective='internal';}
 openSolution(){this.#origin='solution';this.perspective='internal';if(this.#status!=='Sin resolver'&&!this.#solution){const result=this.run({algorithm:'affine',operation:'encrypt',message:exerciseMessage,key:{a:7,b:3}});if(!('code'in result))this.#solution=result;}}
 returnToOrigin(){this.perspective=this.#origin==='sender'?'sender':'interceptor';if(this.#origin!=='sender')this.source=this.#origin==='solution'?'exercise':this.#origin;}
 sender(){return structuredClone({draft:this.#draft,result:this.#senderResult,error:this.#senderError,hasSnapshot:this.#snapshot!==null});}
 interceptor(){const source=this.publicSource(),a=this.#attempts[this.source];return structuredClone({source:this.source,algorithm:source?.algorithm??null,ciphertext:source?.ciphertext??null,key:a.key,candidate:a.result?.value.cipher.output??null,error:a.error,status:this.source==='exercise'?this.#status:null,feedback:a.feedback,hint:this.source==='exercise'&&this.#hint?'El factor multiplicativo normalizado es a=7. Prueba los desplazamientos b del 0 al 25.':null,canSubmit:this.source==='exercise'&&this.#status==='Sin resolver'&&a.result!==null});}
 internal(){const labels:Record<Context,string>={sender:'Operación del emisor',session:'Intento candidato · Cifrado de la sesión',exercise:'Intento candidato · Ejercicio preparado',solution:'Solución original · Ejercicio preparado'};return structuredClone({origin:this.#origin,label:labels[this.#origin],result:this.result(this.#origin)});}
 solution(){return this.#status==='Sin resolver'?null:{message:exerciseMessage,key:{a:7,b:3},status:this.#status};}
 project(){return this.perspective==='sender'?{view:'sender' as const,...this.sender()}:this.perspective==='interceptor'?{view:'interceptor' as const,...this.interceptor(),solution:this.solutionForSource() }:{view:'internal' as const,...this.internal()};}
 private solutionForSource(){return this.source==='exercise'?this.solution():null;}
 playback(){return structuredClone(this.result(this.activeContext()));}
 machine(){
  const context=this.activeContext();let algorithm:'caesar'|'affine'|null=null,operation:Direction='encrypt',key:PartialKey={a:null,b:null};
  let request:CipherRequest|null=null;
  if(context==='sender'){algorithm=this.#draft.algorithm;operation=this.#draft.operation;key={a:keyNumber(this.#draft.a),b:keyNumber(this.#draft.b)};}
  else if(context==='session'||context==='exercise'){const source=context==='exercise'?{algorithm:'affine' as const,ciphertext:exerciseCiphertext}:this.#snapshot;algorithm=source?.algorithm??null;operation='decrypt';const draft=this.#attempts[context].key;key={a:keyNumber(draft.a),b:keyNumber(draft.b)};}
  if(this.perspective==='internal'){const result=this.result(context);if(result){request={...result.request,message:alphabet};algorithm=result.value.algorithm;operation=result.request.operation;key=result.value.algorithm==='affine'?result.value.suppliedKey:{a:null,b:null};}else algorithm=null;}
  else if(algorithm==='caesar')request={algorithm,operation,message:alphabet};
  else if(algorithm==='affine'&&key.a!==null&&key.b!==null)request={algorithm,operation,message:alphabet,key:{a:key.a,b:key.b}};
  const normalized=algorithm==='affine'?this.api.normalizeAffineKey(key):null;
  const mapping=request?this.api.executeCipher(request):null;
  return {context:`${this.perspective}:${context}`,perspective:this.perspective,algorithm,operation,editable:this.perspective!=='internal',positions:normalized?.ok?normalized.value.normalizedKey:{a:null,b:null},mapping:mapping?.ok?mapping.value.cipher.output:null};
 }
 stepKey(field:'a'|'b',delta:number){
  if(this.perspective==='internal')return;
  const current=this.machine().positions[field];const next=current===null?0:(current+delta+26)%26;
  if(this.perspective==='sender')this.editSender({[field]:String(next)});else this.editCandidate({[field]:String(next)});
 }
}
export type MachineModel=ReturnType<Session['machine']>;
export type ViewModel=ReturnType<Session['project']>;
