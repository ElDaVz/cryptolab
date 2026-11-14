import{gsap}from'gsap';
import type{Perspective}from'../experience/session';
export class AnimationDirector {
 reduced=false;
 private cameraTween:gsap.core.Tween|null=null;
 camera(position:{x:number;y:number;z:number},target:{x:number;y:number;z:number}){this.cameraTween?.kill();if(this.reduced)Object.assign(position,target);else this.cameraTween=gsap.to(position,{...target,duration:.6,ease:'power2.inOut'});}
 destroy(){this.cameraTween?.kill();this.cameraTween=null;}
}
export function cameraPreset(perspective:Perspective,aspect:number){const fit=Math.max(7.5,8.5/Math.max(.4,aspect));return{x:perspective==='sender'?-1:perspective==='interceptor'?1:0,y:perspective==='internal'?.3:.6,z:perspective==='internal'?fit*.92:fit};}
