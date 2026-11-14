import{describe,it,expect,vi,afterEach}from'vitest';
import{MechanicalAudio}from'./MechanicalAudio';
afterEach(()=>vi.useRealTimers());
describe('AN-09/10 optional audio lifecycle',()=>{
 it('creates nothing until enabled, caps clicks and stops all voices',async()=>{
  vi.useFakeTimers();const oscillators:Record<string,any>[]=[];const gains:Record<string,any>[]=[];
  const context={state:'running',currentTime:0,destination:{},resume:vi.fn(async()=>{}),close:vi.fn(async()=>{}),createOscillator:()=>{const o={frequency:{value:0},connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null};oscillators.push(o);return o;},createGain:()=>{const g={gain:{setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()};gains.push(g);return g;}};
  const create=vi.fn(()=>context as unknown as AudioContext),audio=new MechanicalAudio(create);audio.click();expect(create).not.toHaveBeenCalled();expect(audio.enabled).toBe(false);await audio.enable();audio.click();audio.click();expect(oscillators).toHaveLength(1);expect(oscillators[0].stop).toHaveBeenCalledWith(.04);vi.advanceTimersByTime(100);audio.click();expect(oscillators).toHaveLength(2);audio.mute();for(const oscillator of oscillators)expect(oscillator.disconnect).toHaveBeenCalled();for(const gain of gains)expect(gain.disconnect).toHaveBeenCalled();audio.click();expect(oscillators).toHaveLength(2);audio.destroy();expect(context.close).toHaveBeenCalledOnce();
 });
 it('failure stays muted without propagating',async()=>{const audio=new MechanicalAudio(()=>{throw Error('unavailable');});expect(await audio.enable()).toBe(false);expect(audio.enabled).toBe(false);audio.destroy();});
});
