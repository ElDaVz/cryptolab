import { test, expect } from '@playwright/test';
test('FL-01/03/04 DE-03/04 intro and sender preserve exact input', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Letras y números' })).toBeVisible();
  await expect(page.getByText('Motor matemático listo')).toBeVisible();
  for (const title of ['Desplazamiento César', 'Transformación afín', 'Recuperar el mensaje']) {
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Abrir laboratorio' }).click();
  await expect(page.getByRole('heading', { name: 'Emisor' })).toBeFocused();
  const message = page.getByLabel('Mensaje', { exact: true });
  await message.fill('ABCXYZ');
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByTestId('output')).toHaveText('IJKFGH');
  await page.getByLabel('Algoritmo').selectOption('affine');
  await message.fill('ABC');
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByTestId('output')).toHaveText('INS');
  await message.fill('ABé');
  await expect(page.getByTestId('output')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByRole('alert')).toContainText('byte 2');
  await expect(message).toHaveValue('ABé');
  await expect(message).toBeFocused();
  await page.getByRole('button', { name: 'Repetir introducción' }).click();
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(message).toHaveValue('ABé');
  await expect(page.getByRole('button', { name: 'Repetir introducción' })).toBeFocused();
});
