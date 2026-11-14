// Validate every transport value before giving it a TypeScript domain type.
import type {ApiError,CipherValue,NormalizeKeyValue,Reply} from './types';
type Check=(v:unknown)=>boolean;
const integer:Check=v=>typeof v==='number'&&Number.isSafeInteger(v);
const string:Check=v=>typeof v==='string';
const oneOf=(...values:unknown[]):Check=>v=>values.includes(v);
const array=(check:Check):Check=>v=>Array.isArray(v)&&v.every(check);
const nullable=(check:Check):Check=>v=>v===null||check(v);
const object=(shape:Record<string,Check>):Check=>v=>v!==null&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype&&Object.keys(v).length===Object.keys(shape).length&&Object.entries(shape).every(([k,check])=>Object.hasOwn(v,k)&&check((v as Record<string,unknown>)[k]));
const key=object({a:integer,b:integer});
const partialKey=object({a:nullable(integer),b:nullable(integer)});
const arithmetic:Check=v=>object({kind:oneOf('shift'),input:integer,shift:integer})(v)||object({kind:oneOf('affineEncrypt'),input:integer,multiplier:integer,offset:integer})(v)||object({kind:oneOf('affineDecrypt'),input:integer,inverse:integer,offset:integer})(v);
const step=object({byteIndex:integer,inputCharacter:string,inputValue:integer,arithmetic,unreduced:integer,modulus:integer,outputValue:integer,outputCharacter:string});
const cipher=object({operation:oneOf('encrypt','decrypt'),output:string,steps:array(step)});
const inverse=object({inverse:integer,derivation:object({gcd:integer,x:integer,y:integer,steps:array(object({dividend:integer,divisor:integer,quotient:integer,remainder:integer}))})});
const value:Check=v=>object({algorithm:oneOf('caesar'),cipher})(v)||object({algorithm:oneOf('affine'),cipher,suppliedKey:key,normalizedKey:key,inverse})(v);
const error:Check=v=>object({code:oneOf('NotReady','EmptyMessage','InternalError')})(v)||object({code:oneOf('InvalidRequest'),field:string,reason:oneOf('missing','unknownField','invalidType','unsupportedValue','notInteger','outOfRange','invalidUnicode')})(v)||object({code:oneOf('InvalidCharacter'),character:string,byteIndex:integer})(v)||object({code:oneOf('InvalidAffineKey'),suppliedA:integer,normalizedA:integer,gcd:integer})(v);
function reply<T>(v:unknown,check:Check):Reply<T>{
 if(object({ok:oneOf(true),value:check})(v)||object({ok:oneOf(false),error})(v))return v as Reply<T>;
 return {ok:false,error:{code:'InternalError'}};
}
export const cipherReply=(v:unknown):Reply<CipherValue>=>reply(v,value);
export const normalizeReply=(v:unknown):Reply<NormalizeKeyValue>=>reply(v,object({suppliedKey:partialKey,normalizedKey:partialKey}));
export const isApiError=(v:unknown):v is ApiError=>error(v);
