import type {CipherRequest,CipherValue,CryptoApi,NormalizeKeyValue,PartialKey,Reply} from './types';
import {cipherReply,normalizeReply} from './validation';
export interface Engine {executeCipher(request:unknown):unknown;normalizeAffineKey(request:unknown):unknown}
export class CryptoAdapter implements CryptoApi {
 #engine:Engine|null=null;
 #pending:Promise<void>|null=null;
 constructor(private readonly load:()=>Promise<Engine>){}
 initialize():Promise<void>{
  if(this.#engine)return Promise.resolve();
  if(!this.#pending)this.#pending=Promise.resolve().then(this.load).then(engine=>{this.#engine=engine;}).finally(()=>{this.#pending=null;});
  return this.#pending;
 }
 executeCipher(request:CipherRequest):Reply<CipherValue>{return this.call(()=>cipherReply(this.#engine!.executeCipher(request)));}
 normalizeAffineKey(request:PartialKey):Reply<NormalizeKeyValue>{return this.call(()=>normalizeReply(this.#engine!.normalizeAffineKey(request)));}
 private call<T>(operation:()=>Reply<T>):Reply<T>{
  if(!this.#engine)return {ok:false,error:{code:'NotReady'}};
  try{return operation();}catch{return {ok:false,error:{code:'InternalError'}};}
 }
}
