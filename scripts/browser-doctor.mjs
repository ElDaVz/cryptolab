import { chromium } from '../apps/web/node_modules/playwright-core/index.mjs';
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage();
 const info=await page.evaluate(async()=>{
  const c=document.createElement('canvas');const gl=c.getContext('webgl2');if(!gl)throw Error('WebGL2 unavailable');
  const program=gl.createProgram();if(!program)throw Error('No WebGL program');
  for(const [type,source] of [[gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p[3]=vec2[3](vec2(-1.,-1.),vec2(1.,-1.),vec2(0.,1.));gl_Position=vec4(p[gl_VertexID],0.,1.);}'],[gl.FRAGMENT_SHADER,'#version 300 es\nprecision mediump float;out vec4 color;void main(){color=vec4(.8,.5,.2,1.);}']]){
   const shader=gl.createShader(Number(type));if(!shader)throw Error('No shader');gl.shaderSource(shader,String(source));gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader)??'Shader failed');gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Link failed');gl.useProgram(program);
  const query=gl.createQuery();if(!query)throw Error('No query');gl.beginQuery(gl.ANY_SAMPLES_PASSED,query);gl.drawArrays(gl.TRIANGLES,0,3);gl.endQuery(gl.ANY_SAMPLES_PASSED);gl.flush();
  for(let i=0;i<200&&!gl.getQueryParameter(query,gl.QUERY_RESULT_AVAILABLE);i++)await new Promise(r=>setTimeout(r,10));
  const rendered=Boolean(gl.getQueryParameter(query,gl.QUERY_RESULT));const error=gl.getError();const version=gl.getParameter(gl.VERSION);gl.deleteQuery(query);gl.deleteProgram(program);
  return {rendered,error,version};
 });
 if(info.error!==0||!info.rendered)throw Error(`WebGL rendering failed: ${JSON.stringify(info)}`);
 console.log('Chromium',browser.version(),'WebGL triangle produced samples',info);
}finally{await browser.close();}
