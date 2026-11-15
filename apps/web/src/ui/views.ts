import type { CipherStepData, CipherValue } from '../adapters/types';
import type { ResultRecord, ViewError, ViewModel } from '../experience/session';
export const escape = (v: unknown) =>
  String(v).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function button(action: string, text: string, disabled = false, extra = '') {
  return `<button type="button" data-action="${action}" ${disabled ? 'disabled' : ''} ${extra}>${text}</button>`;
}
export function errorText(e: ViewError): string {
  switch (e.code) {
    case 'InputError':
      return e.reason;
    case 'NotReady':
      return 'El motor matemático aún no está listo.';
    case 'EmptyMessage':
      return 'Introduce un mensaje de al menos una letra A–Z.';
    case 'InvalidCharacter':
      return `El carácter «${e.character}» en el byte ${e.byteIndex} no pertenece a A–Z. No se modifica el texto.`;
    case 'InvalidAffineKey':
      return `El factor ${e.suppliedA} se normaliza a ${e.normalizedA}; MCD(${e.normalizedA}, 26) = ${e.gcd}. No tiene inverso modular.`;
    case 'InvalidRequest':
      return `Entrada inválida en ${e.field}: ${{ missing: 'falta este valor', unknownField: 'campo no admitido', invalidType: 'tipo de entrada incorrecto', unsupportedValue: 'opción no admitida', notInteger: 'se requiere un entero', outOfRange: 'valor fuera del rango permitido', invalidUnicode: 'texto Unicode incompleto' }[e.reason]}.`;
    case 'InternalError':
      return 'No se pudo completar el cálculo. Conserva tus entradas e inténtalo de nuevo.';
  }
}
export function errorPanel(e: ViewError | null) {
  return e ? `<p role="alert" id="field-error" class="error">${escape(errorText(e))}</p>` : '';
}
export function keyFields(a: string, b: string) {
  return `<fieldset><legend>Clave afín · enteros i32</legend><p id="key-help">Se conservan los valores suministrados. Las perillas muestran residuos 0–25; ↑ y ↓ dan un paso.</p>${(['a', 'b'] as const).map((k) => `<label for="${k}">${k === 'a' ? 'a · Factor' : 'b · Desplazamiento'}</label><div class="key-row">${button('step', `−<span class="sr-only"> Disminuir ${k}</span>`, false, `data-field="${k}" data-delta="-1"`)}<input id="${k}" name="${k}" inputmode="numeric" value="${escape(k === 'a' ? a : b)}" aria-describedby="key-help field-error">${button('step', `+<span class="sr-only"> Aumentar ${k}</span>`, false, `data-field="${k}" data-delta="1"`)}</div>`).join('')}</fieldset>`;
}
export function equation(s: CipherStepData) {
  const a = s.arithmetic;
  const expression =
    a.kind === 'shift'
      ? `${a.input} + (${a.shift})`
      : a.kind === 'affineEncrypt'
        ? `${a.multiplier} × ${a.input} + ${a.offset}`
        : `${a.inverse} × (${a.input} − ${a.offset})`;
  return `${s.inputCharacter}=${s.inputValue} → (${expression}) = ${s.unreduced}; mod ${s.modulus} = ${s.outputValue} → ${s.outputCharacter}`;
}
export function output(value: CipherValue, label = 'Resultado vigente') {
  return `<h2>${label}</h2><output data-testid="output" class="output">${escape(value.cipher.output)}</output>${value.algorithm === 'affine' ? `<p>Clave suministrada: (${value.suppliedKey.a}, ${value.suppliedKey.b})<br>Normalizada: (${value.normalizedKey.a}, ${value.normalizedKey.b})</p>` : '<p>César · desplazamiento público +8; descifrado −8.</p>'}${button('internal', 'Ver cálculo')}`;
}
export function playback(record: ResultRecord | null) {
  const steps = record?.value.cipher.steps ?? [],
    index = record?.index ?? 0;
  return `<div class="play-buttons">${button('start', 'Volver al inicio', !record)}${button('previous', 'Anterior carácter', !record || index === 0)}${button('play', 'Reproducir', !record)}${button('next', 'Siguiente carácter', !record || index === steps.length - 1)}</div><div class="characters" aria-label="Ocurrencias del mensaje">${steps.map((s, i) => button('select', `${i + 1} · ${s.inputCharacter} → ${s.outputCharacter}`, false, `data-index="${i}" aria-pressed="${index === i}"`)).join('')}</div><p data-testid="equation">${record ? escape(equation(steps[index])) : 'Ejecuta una operación para consultar sus caracteres.'}</p>`;
}
export function renderView(
  model: ViewModel,
  ready: boolean,
  solution: { message: string; key: { a: number; b: number }; status: string } | null = null,
): { left: string; right: string } {
  if (model.view === 'interceptor') return interceptor(model, ready, solution);
  if (model.view === 'internal') return internal(model);
  const d = model.draft;
  return {
    left: `<p class="eyebrow">Laboratorio libre / 01</p><h1 id="view-title" tabindex="-1">Emisor</h1><p>Configura la máquina y transforma tu mensaje.</p><form data-form="sender"><label for="algorithm">Algoritmo</label><select id="algorithm"><option value="caesar" ${d.algorithm === 'caesar' ? 'selected' : ''}>César · +8 fijo</option><option value="affine" ${d.algorithm === 'affine' ? 'selected' : ''}>Afín</option></select><label for="operation">Operación</label><select id="operation"><option value="encrypt" ${d.operation === 'encrypt' ? 'selected' : ''}>Cifrar</option><option value="decrypt" ${d.operation === 'decrypt' ? 'selected' : ''}>Descifrar</option></select><label for="message">Mensaje</label><textarea id="message" rows="4" aria-describedby="message-help count field-error">${escape(d.message)}</textarea><p id="message-help">Solo A–Z, sin espacios, acentos ni minúsculas. No se normaliza la entrada.</p><p id="count">${[...d.message].length} / 256</p>${d.algorithm === 'affine' ? keyFields(d.a, d.b) : '<p>Desplazamiento conocido: +8. No hay clave editable.</p>'}<button type="submit" ${ready ? '' : 'disabled'}>Ejecutar</button></form>`,
    right: `${errorPanel(model.error)}${model.result ? output(model.result.value) : '<h2>Tu mesa de trabajo</h2><p>La salida completa aparecerá al ejecutar una operación válida. La reproducción comienza solo cuando la solicites.</p>'}<hr><h3>Instantánea interceptable</h3><p>${model.hasSnapshot ? 'Último cifrado válido de la sesión disponible desde Interceptor. Editar el borrador o descifrar no lo sustituye.' : 'Todavía no hay cifrado de sesión. Ejecuta un cifrado válido o explora el ejercicio preparado.'}</p>`,
  };
}

function interceptor(
  model: Extract<ViewModel, { view: 'interceptor' }>,
  ready: boolean,
  solution: { message: string; key: { a: number; b: number }; status: string } | null,
) {
  const exercise = model.source === 'exercise';
  return {
    left: `<p class="eyebrow">Información observable / 02</p><h1 id="view-title" tabindex="-1">Interceptor</h1><label for="source">Fuente</label><select id="source"><option value="session" ${!exercise ? 'selected' : ''}>Cifrado de la sesión</option><option value="exercise" ${exercise ? 'selected' : ''}>Ejercicio preparado</option></select><p>${exercise ? 'Recupera una clave afín con intentos manuales. El mensaje está en español, sin espacios ni acentos.' : 'Último cifrado válido de la sesión. Esta vista simula información limitada. Si creaste el mensaje, es posible que ya conozcas la clave.'}</p><p>Alfabeto público: A–Z; módulo 26. ${model.algorithm === 'caesar' ? 'Desplazamiento público conocido: +8.' : 'E(x) = (a × x + b) mod 26.'}</p>${model.ciphertext ? `<h2>Texto interceptado</h2><p class="output">${escape(model.ciphertext)}</p><form data-form="candidate">${model.algorithm === 'affine' ? keyFields(model.key.a, model.key.b) : ''}<button type="submit" ${ready ? '' : 'disabled'}>${model.algorithm === 'caesar' ? 'Descifrar con César' : 'Probar clave'}</button></form>` : '<p>Crea primero un cifrado válido desde Emisor o selecciona el ejercicio preparado.</p>'}<p class="fine">Separación educativa de información; no garantiza confidencialidad frente a quien inspecciona su navegador.</p>`,
    right: `${errorPanel(model.error)}${model.candidate ? `<h2>Texto candidato</h2><output data-testid="output" class="output">${escape(model.candidate)}</output><p>Resultado del intento elegido. Probar no califica la clave.</p>${button('internal', 'Ver cálculo')}` : '<h2>Explora una hipótesis</h2><p>El candidato comienza vacío. Probar una clave muestra su texto y permite consultar únicamente su cálculo.</p>'}${exercise ? `<hr><p role="status"><strong>${model.status}</strong></p>${model.feedback ? `<p role="status">${escape(model.feedback)}</p>` : ''}${button('hint', 'Mostrar pista')}${model.hint ? `<p>${model.hint}</p>` : ''}${button('submit', 'Enviar clave', !model.canSubmit)}${button('reveal', 'Revelar solución', model.status !== 'Sin resolver')}${button('reset', 'Reiniciar ejercicio')}${solution ? `<section aria-label="Solución autorizada"><h3>Solución original</h3><p>${escape(solution.message)}</p><p>Clave original normalizada: (${solution.key.a}, ${solution.key.b})</p><p>${solution.status === 'Revelado' ? 'Revelar no cuenta como resolución.' : 'Ejercicio resuelto.'}</p>${button('solution', 'Consultar solución original', !ready)}</section>` : ''}` : ''}`,
  };
}
function internal(model: Extract<ViewModel, { view: 'internal' }>) {
  const r = model.result,
    value = r?.value;
  return {
    left: `<p class="eyebrow">Operaciones exactas / 03</p><h1 id="view-title" tabindex="-1">Mecanismo interno</h1><p>${model.label}</p>${button('return', 'Volver al origen')}${r ? `<h2>Entradas de este cálculo</h2><p>${value!.algorithm === 'caesar' ? 'César' : 'Afín'} · ${r.request.operation === 'encrypt' ? 'Cifrar' : 'Descifrar'}</p><p class="output">${escape(r.request.message)}</p>${value!.algorithm === 'affine' ? `<p>Suministrada: (${value!.suppliedKey.a}, ${value!.suppliedKey.b})<br>Normalizada: (${value!.normalizedKey.a}, ${value!.normalizedKey.b})</p>` : ''}` : '<p>Ejecuta una operación o prueba una clave para inspeccionar un cálculo vigente de este origen.</p>'}`,
    right: value
      ? `${output(value)}<h3>Ecuación del carácter seleccionado</h3><p>${escape(equation(value.cipher.steps[r!.index]))}</p>${value.algorithm === 'affine' ? `<details><summary>Euclides y Bézout</summary><div data-testid="euclid">${value.inverse.derivation.steps.map((s) => `<p>${s.dividend} = ${s.quotient} × ${s.divisor} + ${s.remainder}</p>`).join('')}<p>MCD(${value.normalizedKey.a},26) = ${value.inverse.derivation.gcd}</p><p>${value.normalizedKey.a} × (${value.inverse.derivation.x}) + 26 × (${value.inverse.derivation.y}) = ${value.inverse.derivation.gcd}</p><p>Inverso modular: ${value.inverse.inverse}</p></div></details>` : '<p>Desplazamiento fijo: +8 al cifrar, −8 al descifrar.</p>'}`
      : '<h2>Sin traza vigente</h2><p>Este contexto no tiene un cálculo autorizado. No se sustituye por otro resultado.</p>',
  };
}
