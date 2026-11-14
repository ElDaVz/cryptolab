import*as THREE from'three';
import type{MachineModel}from'../experience/session';
import{cameraPreset}from'./AnimationDirector';

export class Machine {
 readonly scene=new THREE.Scene();
 readonly camera=new THREE.PerspectiveCamera(38,1,.1,100);
 readonly rings=new THREE.Group();
 readonly knobs={a:new THREE.Group(),b:new THREE.Group()};
 readonly renderer:THREE.WebGLRenderer;
 private readonly outputLabels=new THREE.Group();
 private readonly resources=new Set<THREE.BufferGeometry|THREE.Material|THREE.Texture>();
 private readonly observer:ResizeObserver;
 private frame=0;
 private disposed=false;
 private mapping:string|null|undefined=undefined;
 private model:MachineModel|null=null;
 private drag:{field:'a'|'b';pointerId:number;lastX:number}|null=null;
 onStep:(field:'a'|'b',delta:number)=>void=()=>{};
 constructor(private readonly container:HTMLElement,private readonly lost:()=>void){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.setClearColor(0x131c19,1);container.append(this.renderer.domElement);
  this.scene.add(new THREE.HemisphereLight(0xffe4b0,0x20332c,2.5));
  const warm=new THREE.DirectionalLight(0xffcc88,4);warm.position.set(-4,5,8);this.scene.add(warm);
  const edge=new THREE.DirectionalLight(0xc6e5d6,2);edge.position.set(4,1,3);this.scene.add(edge);
  const wood=this.material(0x483126,.2),brass=this.material(0xb89b51,.8),dark=this.material(0x233831,.5);
  const tabletop=this.mesh(new THREE.BoxGeometry(18,.3,12),wood);tabletop.position.set(0,-2.65,-1.5);
  const body=this.mesh(new THREE.BoxGeometry(4.8,4.65,.6),wood);body.position.set(0,0,-.65);
  const face=this.mesh(new THREE.BoxGeometry(4.55,4.4,.12),dark);face.position.z=-.27;
  for(const x of [-2.05,2.05])for(const y of [-1.95,1.95]){const screw=this.mesh(new THREE.SphereGeometry(.055,8,8),brass);screw.position.set(x,y,-.15);}
  this.rings.position.y=.45;this.scene.add(this.rings);this.rings.add(this.outputLabels);
  for(const radius of [1.02,1.65,1.9]){const ring=this.mesh(new THREE.TorusGeometry(radius,.055,12,96),brass,this.rings);ring.position.z=.08;}
  const hub=this.mesh(new THREE.CylinderGeometry(.78,.78,.18,64),dark,this.rings);hub.rotation.x=Math.PI/2;
  for(let i=0;i<26;i++){
   const angle=2*Math.PI*i/26;const input=this.label('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i]);input.position.set(1.27*Math.sin(angle),1.27*Math.cos(angle),.19);this.rings.add(input);
   const tick=this.mesh(new THREE.BoxGeometry(.018,.1,.02),brass,this.rings);tick.position.set(1.46*Math.sin(angle),1.46*Math.cos(angle),.12);tick.rotation.z=-angle;
  }
  const pointer=this.mesh(new THREE.ConeGeometry(.105,.28,3),brass);pointer.position.set(0,2.29,.3);pointer.rotation.z=Math.PI;
  for(const [field,x]of [['a',-1.12],['b',1.12]]as const){
   const group=this.knobs[field];group.position.set(x,-1.65,.05);this.scene.add(group);
   const knob=this.mesh(new THREE.CylinderGeometry(.34,.38,.3,26),brass,group);knob.rotation.x=Math.PI/2;knob.userData.field=field;
   const mark=this.mesh(new THREE.BoxGeometry(.045,.23,.04),dark,group);mark.position.set(0,.16,.18);
   const label=this.label(field==='a'?'a · Factor':'b · Desplazamiento',.9);label.position.set(x,-2.17,.1);label.userData.knobLabel=true;this.scene.add(label);
  }
  const name=this.label('CRIPTO LAB',1.15);name.position.set(0,.45,.24);this.scene.add(name);
  this.renderer.domElement.addEventListener('webglcontextlost',this.onLoss);
  const canvas=this.renderer.domElement;canvas.addEventListener('pointerdown',this.pointerDown);canvas.addEventListener('pointermove',this.pointerMove);canvas.addEventListener('pointerup',this.cancelDrag);canvas.addEventListener('pointercancel',this.cancelDrag);canvas.addEventListener('lostpointercapture',this.cancelDrag);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);this.resize();
  this.loop();
 }
 private material(color:number,metalness:number){const m=new THREE.MeshStandardMaterial({color,metalness,roughness:.38});this.resources.add(m);return m;}
 private mesh(geometry:THREE.BufferGeometry,material:THREE.Material,parent:THREE.Object3D=this.scene){this.resources.add(geometry);const mesh=new THREE.Mesh(geometry,material);parent.add(mesh);return mesh;}
 private label(text:string,width=.25){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.font='64px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffe8af';ctx.fillText(text,256,64);
  const texture=new THREE.CanvasTexture(canvas),material=new THREE.SpriteMaterial({map:texture,depthWrite:false});this.resources.add(texture);this.resources.add(material);
  const sprite=new THREE.Sprite(material);sprite.scale.set(width,width/4,1);return sprite;
 }
 private clearOutput(){for(const child of [...this.outputLabels.children]){const sprite=child as THREE.Sprite;const material=sprite.material;material.map?.dispose();if(material.map)this.resources.delete(material.map);material.dispose();this.resources.delete(material);this.outputLabels.remove(child);}}
 update(model:MachineModel){
  if(this.model?.context!==model.context)this.cancelDrag();
  this.model=model;
  if(this.mapping!==model.mapping){this.clearOutput();this.mapping=model.mapping;if(model.mapping)for(let i=0;i<26;i++){const angle=2*Math.PI*i/26;const label=this.label(model.mapping[i]);label.position.set(1.75*Math.sin(angle),1.75*Math.cos(angle),.2);this.outputLabels.add(label);}}
  for(const field of ['a','b']as const){this.knobs[field].visible=model.algorithm==='affine';const position=model.positions[field];this.knobs[field].children[1].visible=position!==null;}
  this.scene.children.filter(o=>o.userData.knobLabel).forEach(o=>{o.visible=model.algorithm==='affine';});
  this.renderer.domElement.dataset.mapping=model.mapping??'';
 }
 target(){return cameraPreset(this.model?.perspective??'sender',this.camera.aspect);}
 private resize(){if(this.disposed)return;const width=this.container.clientWidth,height=this.container.clientHeight;if(width===0||height===0)return;this.renderer.setSize(width,height,false);this.camera.aspect=width/height;Object.assign(this.camera.position,this.target());this.camera.updateProjectionMatrix();}
 private loop=()=>{if(this.disposed)return;this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);const canvas=this.renderer.domElement;canvas.dataset.triangles=String(this.renderer.info.render.triangles);canvas.dataset.frames=String(Number(canvas.dataset.frames??0)+1);for(const field of ['a','b']as const){const p=this.knobs[field].position.clone().project(this.camera);canvas.dataset[field==='a'?'knobA':'knobB']=`${(p.x+1)*canvas.clientWidth/2},${(1-p.y)*canvas.clientHeight/2}`;}this.frame=requestAnimationFrame(this.loop);};
 private pointerDown=(event:PointerEvent)=>{
  if(!this.model?.editable||this.model.algorithm!=='affine'||event.button!==0)return;
  const canvas=this.renderer.domElement,bounds=canvas.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,1-(event.clientY-bounds.top)/bounds.height*2),this.camera);
  const hit=ray.intersectObjects([this.knobs.a,this.knobs.b],true).find(hit=>hit.object.userData.field);if(!hit)return;
  this.drag={field:hit.object.userData.field as 'a'|'b',pointerId:event.pointerId,lastX:event.clientX};canvas.setPointerCapture(event.pointerId);event.preventDefault();
 };
 private pointerMove=(event:PointerEvent)=>{const drag=this.drag;if(!drag||drag.pointerId!==event.pointerId)return;const steps=Math.trunc((event.clientX-drag.lastX)/12);if(!steps)return;drag.lastX+=steps*12;for(let i=0;i<Math.abs(steps);i++)this.onStep(drag.field,Math.sign(steps));};
 cancelDrag=()=>{const drag=this.drag;this.drag=null;if(drag&&this.renderer.domElement.hasPointerCapture(drag.pointerId))this.renderer.domElement.releasePointerCapture(drag.pointerId);};
 private onLoss=(event:Event)=>{event.preventDefault();this.lost();};
 destroy(){if(this.disposed)return;this.disposed=true;this.cancelDrag();const canvas=this.renderer.domElement;canvas.removeEventListener('pointerdown',this.pointerDown);canvas.removeEventListener('pointermove',this.pointerMove);canvas.removeEventListener('pointerup',this.cancelDrag);canvas.removeEventListener('pointercancel',this.cancelDrag);canvas.removeEventListener('lostpointercapture',this.cancelDrag);cancelAnimationFrame(this.frame);this.observer.disconnect();this.renderer.domElement.removeEventListener('webglcontextlost',this.onLoss);this.clearOutput();for(const resource of this.resources)resource.dispose();this.resources.clear();this.scene.clear();this.renderer.dispose();this.renderer.domElement.remove();}
}
