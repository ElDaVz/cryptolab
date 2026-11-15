import { test, expect } from '@playwright/test';
const start = async (page: import('@playwright/test').Page) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(page.getByText('Motor matemático listo')).toBeVisible();
};

test('FL/DE complete Spanish keyboard-accessible journey', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Letras y números' })).toBeVisible();
  for (const heading of ['Desplazamiento César', 'Transformación afín', 'Recuperar el mensaje']) {
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Abrir laboratorio' }).click();
  await expect(page.getByText('Motor matemático listo')).toBeVisible();
  await page.getByLabel('Mensaje', { exact: true }).fill('ABCXYZ');
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByTestId('output')).toHaveText('IJKFGH');
  await page.getByLabel('Algoritmo').selectOption('affine');
  await page.getByLabel('Mensaje', { exact: true }).fill('ABC');
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByTestId('output')).toHaveText('INS');
  await page.getByRole('button', { name: 'Ver cálculo' }).click();
  await expect(page.getByText('Operación del emisor', { exact: true })).toBeVisible();
  await page.getByText('Euclides y Bézout').click();
  await expect(page.getByTestId('euclid')).toContainText('21');
  await page.getByRole('button', { name: 'Interceptor', exact: true }).click();
  await expect(page.getByLabel('a · Factor')).toHaveValue('');
  await page.getByLabel('Fuente').selectOption('exercise');
  await page.getByLabel('a · Factor').fill('7');
  await page.getByLabel('b · Desplazamiento').fill('4');
  await page.getByRole('button', { name: 'Probar clave' }).click();
  await expect(page.getByTestId('output')).toHaveText('WLNWLGPPDELPYWZDOTDNZD');
  await page.getByRole('button', { name: 'Enviar clave' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Sin resolver' })).toBeVisible();
  await page.getByLabel('b · Desplazamiento').fill('3');
  await expect(page.getByRole('button', { name: 'Enviar clave' })).toBeDisabled();
  await page.getByRole('button', { name: 'Probar clave' }).click();
  await expect(page.getByTestId('output')).toHaveText('LACLAVEESTAENLOSDISCOS');
  await page.getByRole('button', { name: 'Enviar clave' }).click();
  await expect(page.getByText('Resuelto', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reiniciar ejercicio' }).click();
  await expect(page.getByLabel('a · Factor')).toHaveValue('');
  await page.getByRole('button', { name: 'Revelar solución' }).click();
  await expect(page.getByText('Revelado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Consultar solución original' }).click();
  await expect(
    page.getByText('Solución original · Ejercicio preparado', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Repetir introducción' }).click();
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(
    page.getByText('Solución original · Ejercicio preparado', { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('DE-03/04 exact inputs, errors, supplied keys and keyboard knobs', async ({ page }) => {
  await start(page);
  await page.getByLabel('Algoritmo').selectOption('affine');
  const a = page.getByLabel('a · Factor');
  await a.fill('31');
  await a.press('ArrowUp');
  await expect(a).toHaveValue('6');
  await expect(page.getByLabel('b · Desplazamiento')).toHaveValue('8');
  await a.fill('5');
  const message = page.getByLabel('Mensaje', { exact: true });
  await message.fill('A'.repeat(256));
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByTestId('output')).toHaveText('I'.repeat(256));
  await message.fill('A'.repeat(257));
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(message).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('256');
  await message.fill('AB🦀');
  await expect(page.getByText('3 / 256')).toBeVisible();
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByRole('alert')).toContainText('byte 2');
  await expect(message).toHaveValue('AB🦀');
  await a.fill('2');
  await message.fill('');
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByRole('alert')).toContainText('MCD');
});

test('WA-06/DE-07 initialization retry preserves drafts', async ({ page }) => {
  let first = true;
  await page.route('**/*.wasm', async (route) => {
    if (first) {
      first = false;
      await route.abort();
    } else await route.continue();
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await page.getByLabel('Mensaje', { exact: true }).fill('ABC');
  await expect(page.getByText('No se pudo cargar el motor matemático')).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('Motor matemático listo')).toBeVisible();
  await expect(page.getByLabel('Mensaje', { exact: true })).toHaveValue('ABC');
  await expect(page.getByTestId('output')).toHaveCount(0);
});

test('DE-08 textual fallback is complete without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await start(page);
  await expect(page.getByText(/Modo textual/)).toBeVisible();
  await page.getByLabel('Mensaje', { exact: true }).fill('ABC');
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByTestId('output')).toHaveText('IJK');
  await page.getByRole('button', { name: 'Siguiente carácter' }).click();
  await expect(page.getByTestId('equation')).toContainText('B');
  await page.getByRole('button', { name: 'Interceptor', exact: true }).click();
  await page.getByLabel('Fuente').selectOption('exercise');
  await page.getByLabel('a · Factor').fill('7');
  await page.getByLabel('b · Desplazamiento').fill('3');
  await page.getByRole('button', { name: 'Probar clave' }).click();
  await page.getByRole('button', { name: 'Enviar clave' }).click();
  await expect(page.getByText('Resuelto', { exact: true })).toBeVisible();
});
