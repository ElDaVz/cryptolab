import { gsap } from 'gsap';
import type { CipherStepData } from '../adapters/types';
import type { Perspective } from '../experience/session';
type Rotation = { z: number };
type Position = { x: number; y: number; z: number };
export function shortestTarget(current: number, target: number) {
  const turn = 2 * Math.PI;
  return current + ((((target - current + Math.PI) % turn) + turn) % turn) - Math.PI;
}
export class AnimationDirector {
  reduced = false;
  index = 0;
  playing = false;
  #id: number | null = null;
  #steps: readonly CipherStepData[] = [];
  #ring: Rotation | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #transition: { target: number; remaining: number; started: number } | null = null;
  #generation = 0;
  #ringTween: gsap.core.Tween | null = null;
  #cameraTween: gsap.core.Tween | null = null;
  #camera: { position: Position; target: Position } | null = null;
  #knobTargets = new Map<Rotation, number>();
  constructor(
    private readonly settled: (index: number) => void = () => {},
    private readonly click: () => void = () => {},
  ) {}
  setRing(ring: Rotation | null) {
    if (this.#ring === ring) return;
    this.#ringTween?.kill();
    this.#ring = ring;
    this.snap();
  }
  bind(id: number | null, steps: readonly CipherStepData[], index: number) {
    if (this.#id === id) return;
    this.cancel();
    this.#id = id;
    this.#steps = steps;
    this.index = index;
    this.snap();
  }
  private angle(index: number) {
    return (2 * Math.PI * (this.#steps[index]?.inputValue ?? 0)) / 26;
  }
  private snap() {
    if (this.#ring) this.#ring.z = this.angle(this.index);
  }
  select(index: number) {
    if (this.#id === null || index < 0 || index >= this.#steps.length) return;
    this.cancel();
    this.index = index;
    this.snap();
    this.settled(index);
  }
  play() {
    if (this.#id === null || this.#steps.length < 2 || this.playing) return;
    if (this.index === this.#steps.length - 1 && !this.#transition) this.select(0);
    this.playing = true;
    this.schedule();
  }
  private schedule() {
    if (!this.playing) return;
    const transition = this.#transition ?? {
      target: this.index + 1,
      remaining: 1000,
      started: performance.now(),
    };
    transition.started = performance.now();
    this.#transition = transition;
    const generation = this.#generation,
      id = this.#id;
    this.#ringTween?.kill();
    if (this.#ring && !this.reduced)
      this.#ringTween = gsap.to(this.#ring, {
        z: shortestTarget(this.#ring.z, this.angle(transition.target)),
        duration: transition.remaining / 1000,
        ease: 'none',
      });
    this.#timer = setTimeout(() => {
      if (generation !== this.#generation || id !== this.#id || !this.playing) return;
      this.#timer = null;
      this.#ringTween?.kill();
      this.#ringTween = null;
      this.index = transition.target;
      this.#transition = null;
      this.snap();
      if (this.index === this.#steps.length - 1) this.playing = false;
      this.settled(this.index);
      if (generation !== this.#generation || id !== this.#id) return;
      this.click();
      if (this.playing) this.schedule();
    }, transition.remaining);
  }
  pause() {
    if (!this.playing) return;
    this.playing = false;
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
    if (this.#transition)
      this.#transition.remaining = Math.max(
        0,
        this.#transition.remaining - (performance.now() - this.#transition.started),
      );
    this.#ringTween?.pause();
  }
  cancel() {
    this.#generation++;
    this.playing = false;
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
    this.#transition = null;
    this.#ringTween?.kill();
    this.#ringTween = null;
    this.snap();
  }
  get transitioning() {
    return this.#transition !== null;
  }
  setReduced(value: boolean) {
    this.cancel();
    this.reduced = value;
    this.#cameraTween?.kill();
    if (this.#camera) Object.assign(this.#camera.position, this.#camera.target);
    for (const [rotation, z] of this.#knobTargets) {
      gsap.killTweensOf(rotation);
      rotation.z = z;
    }
  }
  camera(position: Position, target: Position) {
    this.#cameraTween?.kill();
    this.#camera = { position, target };
    if (this.reduced) Object.assign(position, target);
    else this.#cameraTween = gsap.to(position, { ...target, duration: 0.6, ease: 'power2.inOut' });
  }
  knob(rotation: Rotation, position: number | null, snap = false) {
    const z = position === null ? 0 : (-2 * Math.PI * position) / 26;
    if (this.#knobTargets.get(rotation) === z && !snap) return;
    this.#knobTargets.set(rotation, z);
    gsap.killTweensOf(rotation);
    if (snap || this.reduced) rotation.z = z;
    else gsap.to(rotation, { z, duration: 0.12 });
  }
  detachGraphics() {
    this.cancel();
    this.setRing(null);
    this.#cameraTween?.kill();
    this.#cameraTween = null;
    this.#camera = null;
    for (const rotation of this.#knobTargets.keys()) gsap.killTweensOf(rotation);
    this.#knobTargets.clear();
  }
  destroy() {
    this.detachGraphics();
    this.#steps = [];
    this.#id = null;
  }
}
export function cameraPreset(perspective: Perspective, aspect: number) {
  const fit = Math.max(7.5, 8.5 / Math.max(0.4, aspect));
  return {
    x: perspective === 'sender' ? -1 : perspective === 'interceptor' ? 1 : 0,
    y: perspective === 'internal' ? 0.3 : 0.6,
    z: perspective === 'internal' ? fit * 0.92 : fit,
  };
}
