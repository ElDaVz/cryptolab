import { test,expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('WA-01–05/07/09 real production WASM strict contract, vectors and all keys',async({page})=>{
 let wasmURL='';page.on('response',response=>{if(response.url().endsWith('.wasm'))wasmURL=response.url();});await page.goto('./');await expect(page.getByText('Motor matemático listo')).toBeVisible();expect(wasmURL).toContain('/assets/');const response=await page.request.get(wasmURL);expect(response.headers()['content-type']).toContain('application/wasm');
 // Execute the exact generated bindings against the WASM asset shipped by Vite.
 // No debug exports, extra files in dist, or development server are required.
 const bindings=readFileSync(new URL('../../../crates/crypto-wasm/pkg/crypto_wasm.js',import.meta.url),'utf8');
 const results=await page.evaluate(async({bindings,wasmURL})=>{
  const url=URL.createObjectURL(new Blob([bindings],{type:'text/javascript'}));
  try{
   const engine=await import(/* @vite-ignore */ url);await engine.default({module_or_path:wasmURL});
   const call=(request:unknown)=>engine.executeCipher(request);
   const caesar={algorithm:'caesar',operation:'encrypt',message:'ABCXYZ'};
   const affine={algorithm:'affine',operation:'encrypt',message:'ABC',key:{a:5,b:8}};
   const malformed:unknown[]=[null,[],{},true,{...caesar,key:{a:5,b:8}},{...caesar,other:0},{...caesar,algorithm:'rsa'},{...caesar,operation:'x'},{...caesar,message:5},{...caesar,message:'\ud800'},{...caesar,message:'\udc00'}];
   for(const a of [1.5,NaN,Infinity,-Infinity,'5',true,null,2147483648,-2147483649])malformed.push({...affine,key:{a,b:8}});
   malformed.push({...affine,key:{a:5}}, {...affine,key:[5,8]}, {...affine,key:{a:5,b:8,c:0}});
   const invalid=malformed.map(call);
   const samples=[call(caesar),call({...caesar,operation:'decrypt',message:'IJKFGH'}),call(affine),call({...affine,operation:'decrypt',message:'INS'}),call({...affine,message:'',key:{a:2,b:3}}),call({...caesar,message:''}),call({...caesar,message:'AB🦀'}),call({...caesar,message:'A'.repeat(257)})];
   const keys=[{a:31,b:34},{a:-21,b:-18},{a:2147483647,b:-2147483648}].map(key=>call({...affine,key}));
   const normalize=engine.normalizeAffineKey({a:2,b:null});
   const normalizedExtreme=engine.normalizeAffineKey({a:-2147483648,b:2147483647});
   const mapping=[call({...caesar,message:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'}),call({...caesar,message:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',operation:'decrypt'}),call({...affine,message:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'}),call({...affine,message:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',operation:'decrypt'})];
   const exercise=call({...affine,message:'LACLAVEESTAENLOSDISCOS',key:{a:7,b:3}});
   const wrong=call({...affine,operation:'decrypt',message:'CDRCDUFFZGDFQCXZYHZRXZ',key:{a:7,b:4}});
   let valid=0;let roundTrips=true;let safe=true;
   const inspect=(v:unknown):boolean=>typeof v==='number'?Number.isSafeInteger(v):Array.isArray(v)?v.every(inspect):v!==null&&typeof v==='object'?Object.getPrototypeOf(v)===Object.prototype&&Object.values(v).every(inspect):typeof v!=='bigint';
   for(let a=0;a<26;a++)for(let b=0;b<26;b++){
    const encrypted=call({...affine,message:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',key:{a,b}});safe&&=inspect(encrypted);
    if(encrypted.ok){valid++;roundTrips&&=call({...affine,operation:'decrypt',message:encrypted.value.cipher.output,key:{a,b}}).value.cipher.output==='ABCDEFGHIJKLMNOPQRSTUVWXYZ';}
   }
   return {invalid,samples,keys,normalize,normalizedExtreme,mapping,exercise,wrong,valid,roundTrips,safe};
  }finally{URL.revokeObjectURL(url);}
 },{bindings,wasmURL});
 expect(results.invalid.every((r:{ok:boolean;error:{code:string}})=>!r.ok&&r.error.code==='InvalidRequest')).toBe(true);
 expect(results.samples[0].value.cipher.output).toBe('IJKFGH');expect(results.samples[1].value.cipher.output).toBe('ABCXYZ');expect(results.samples[2].value.cipher.output).toBe('INS');expect(results.samples[3].value.cipher.output).toBe('ABC');expect(results.samples[3].value.cipher.steps[0]).toMatchObject({byteIndex:0,unreduced:0,arithmetic:{kind:'affineDecrypt',input:8,inverse:21,offset:8}});
 expect(results.samples[4].error.code).toBe('InvalidAffineKey');expect(results.samples[5].error.code).toBe('EmptyMessage');expect(results.samples[6].error).toEqual({code:'InvalidCharacter',character:'🦀',byteIndex:2});expect(results.samples[7].value.cipher.output).toHaveLength(257);
 expect(results.keys[0].value).toMatchObject({suppliedKey:{a:31,b:34},normalizedKey:{a:5,b:8}});expect(results.keys[1].value).toMatchObject({suppliedKey:{a:-21,b:-18},normalizedKey:{a:5,b:8}});expect(results.keys[2].ok).toBe(true);
 expect(results.normalize.value).toEqual({suppliedKey:{a:2,b:null},normalizedKey:{a:2,b:null}});expect(results.normalizedExtreme.ok).toBe(true);
 expect(results.mapping.map((r:{value:{cipher:{output:string}}})=>r.value.cipher.output)).toEqual(['IJKLMNOPQRSTUVWXYZABCDEFGH','STUVWXYZABCDEFGHIJKLMNOPQR','INSXCHMRWBGLQVAFKPUZEJOTYD','OJEZUPKFAVQLGBWRMHCXSNIDYT']);
 expect(results.exercise.value.cipher.output).toBe('CDRCDUFFZGDFQCXZYHZRXZ');expect(results.wrong.value.cipher.output).toBe('WLNWLGPPDELPYWZDOTDNZD');expect(results.valid).toBe(312);expect(results.roundTrips).toBe(true);expect(results.safe).toBe(true);
});
