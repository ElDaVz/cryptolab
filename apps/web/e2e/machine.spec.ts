import{test,expect}from'@playwright/test';
test('MI-01/02/05/06 real rendering, mapping isolation and desktop bounds',async({page})=>{
 for(const size of [{width:1280,height:720},{width:1920,height:1080}]){
  await page.setViewportSize(size);await page.goto('./');await page.getByRole('button',{name:'Omitir introducción'}).click();await expect(page.getByText('Motor matemático listo')).toBeVisible();
  const canvas=page.locator('#machine canvas');await expect.poll(()=>canvas.getAttribute('data-triangles')).toMatch(/^[1-9]\d*$/);
  await page.getByLabel('Algoritmo').selectOption('affine');await expect(page.getByTestId('mapping')).toHaveText('INSXCHMRWBGLQVAFKPUZEJOTYD');await page.getByLabel('Mensaje',{exact:true}).fill('ABA');await page.getByRole('button',{name:'Ejecutar'}).click();await expect(page.getByTestId('output')).toHaveText('INI');
  await page.getByRole('button',{name:'Siguiente carácter'}).click();await expect(page.getByTestId('equation')).toContainText('B=1');
  await page.getByRole('button',{name:'Interceptor',exact:true}).click();await expect(page.getByTestId('mapping')).toHaveText('Configura una clave válida');await expect(canvas).toHaveAttribute('data-mapping','');await expect(page.getByTestId('positions')).toContainText('sin posición');
  const bounds=await canvas.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(300);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(size.width-300);
  expect(await canvas.evaluate(c=>(c as HTMLCanvasElement).getContext('webgl2')!.getError())).toBe(0);
 }
});
