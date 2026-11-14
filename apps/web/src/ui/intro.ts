import type{CryptoApi,CipherRequest}from'../adapters/types';
import{button,equation,escape}from'./views';
const titles=['Letras y números','Desplazamiento César','Transformación afín','Recuperar el mensaje'];
const descriptions=[
 'A=0, B=1, …, Z=25. Trabajamos con el alfabeto ASCII A–Z. Los mensajes no admiten espacios, acentos ni minúsculas.',
 'César usa un desplazamiento fijo y público de ocho letras. Al pasar Z volvemos al inicio del alfabeto.',
 'El cifrado afín aplica (a × x + b) mod 26. El factor debe ser coprimo con 26. (2,3) se rechaza porque MCD(2,26)=2.',
 'Para recuperar el mensaje usamos el inverso modular: a⁻¹ × (y − b) mod 26. Euclides extendido explica por qué existe.'
];
const requests:CipherRequest[]=[{algorithm:'caesar',operation:'encrypt',message:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'},{algorithm:'caesar',operation:'encrypt',message:'ABCXYZ'},{algorithm:'affine',operation:'encrypt',message:'ABC',key:{a:5,b:8}},{algorithm:'affine',operation:'decrypt',message:'INS',key:{a:5,b:8}}];
export function intro(step:number,api:CryptoApi,ready:boolean){
 const reply=ready?api.executeCipher(requests[step]):null;const value=reply?.ok?reply.value:null;
 return `<p class="eyebrow">Una máquina, tres perspectivas · ${step+1} / 4</p><h1 id="intro-title" tabindex="-1">${titles[step]}</h1><p>${descriptions[step]}</p>${step===0?'<p class="alphabet">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>0 1 2 … 25</p>':`<p class="output">${requests[step].message} → ${value?.cipher.output??'Motor cargando…'}</p>`}<details><summary>Explicación matemática</summary>${value?value.cipher.steps.map(s=>`<p>${escape(equation(s))}</p>`).join(''):'<p>Disponible al cargar el motor matemático.</p>'}${value?.algorithm==='affine'?`<p>MCD(${value.normalizedKey.a},26)=${value.inverse.derivation.gcd}; inverso=${value.inverse.inverse}.</p><p>Bézout: ${value.normalizedKey.a} × (${value.inverse.derivation.x}) + 26 × (${value.inverse.derivation.y}) = ${value.inverse.derivation.gcd}</p>`:''}</details><div class="intro-actions">${step?button('intro-previous','Anterior'):''}${button(step===3?'intro-close':'intro-next',step===3?'Abrir laboratorio':'Siguiente')}${button('intro-close','Omitir introducción')}</div><p class="fine">Cifrados educativos: no ofrecen seguridad moderna. Todo el progreso vive en memoria y se pierde al recargar.</p>`;
}
