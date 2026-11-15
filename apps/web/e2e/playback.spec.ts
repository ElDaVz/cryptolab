import { test, expect } from '@playwright/test';
test('AN-01/02/05/07 full output precedes playback, cancellation and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(page.getByText('Motor matemático listo')).toBeVisible();
  await page.getByLabel('Mensaje', { exact: true }).fill('ABC');
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await expect(page.getByTestId('output')).toHaveText('IJK');
  await expect(page.getByTestId('equation')).toContainText('A=0');
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click();
  await expect(page.getByTestId('equation')).toContainText('B=1');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  const equation = await page.getByTestId('equation').textContent();
  await page.waitForTimeout(1100);
  await expect(page.getByTestId('equation')).toHaveText(equation!);
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByRole('button', { name: 'Reproducir', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page.getByTestId('equation')).toContainText('A=0');
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click();
  await page.getByLabel('Mensaje', { exact: true }).fill('XYZ');
  await expect(page.getByTestId('output')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reproducir', exact: true })).toBeDisabled();
  await page.waitForTimeout(1100);
  await expect(page.getByTestId('output')).toHaveCount(0);
});
