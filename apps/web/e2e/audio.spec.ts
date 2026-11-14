import{test,expect}from'@playwright/test';
test('DE-09 audio starts muted, explicit activation only, failure is independent',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'AudioContext',{value:class{constructor(){throw Error('unavailable');}},configurable:true});});
 await page.goto('./');await page.getByRole('button',{name:'Omitir introducción'}).click();await expect(page.getByRole('button',{name:'Sonido: desactivado'})).toBeVisible();await page.getByRole('button',{name:'Sonido: desactivado'}).click();await expect(page.getByText('Audio no disponible; el sonido permanece desactivado.')).toBeVisible();await expect(page.getByText('Motor matemático listo')).toBeVisible();await page.getByLabel('Mensaje',{exact:true}).fill('ABC');await page.getByRole('button',{name:'Ejecutar'}).click();await expect(page.getByTestId('output')).toHaveText('IJK');
});
