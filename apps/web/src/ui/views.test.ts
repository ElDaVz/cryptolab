import { expect, it } from 'vitest';
import { errorText, escape } from './views';
it('DE-04 translates transport reasons and escapes user-supplied text', () => {
  expect(
    errorText({ code: 'InvalidRequest', field: 'message', reason: 'invalidUnicode' }),
  ).toContain('texto Unicode incompleto');
  expect(errorText({ code: 'InvalidRequest', field: 'key.a', reason: 'outOfRange' })).toContain(
    'fuera del rango',
  );
  expect(escape('<img src=x onerror="fail()">')).toBe(
    '&lt;img src=x onerror=&quot;fail()&quot;&gt;',
  );
});
