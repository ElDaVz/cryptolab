import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimationDirector } from './AnimationDirector';
import { api } from '../test-api';
const reply = api.executeCipher({ algorithm: 'caesar', operation: 'encrypt', message: 'ABA' });
if (!reply.ok) throw Error('fixture');
const steps = reply.value.cipher.steps;
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
function setup() {
  const selected: number[] = [];
  const director = new AnimationDirector(
    () => selected.push(director.index),
    () => {},
  );
  director.reduced = true;
  director.bind(1, steps, 0);
  return { director, selected };
}

describe('AN · controlled playback', () => {
  it('AN-01/02 full result is independent and sequence is paused at zero', () => {
    const { director, selected } = setup();
    expect(director.index).toBe(0);
    expect(director.playing).toBe(false);
    expect(selected).toEqual([]);
    director.play();
    vi.advanceTimersByTime(999);
    expect(director.index).toBe(0);
    vi.advanceTimersByTime(1);
    expect(director.index).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(director.index).toBe(2);
    expect(director.playing).toBe(false);
    director.play();
    expect(director.index).toBe(0);
    director.destroy();
  });
  it('AN-03 pause resumes remaining interval; manual selection discards it', () => {
    const { director } = setup();
    director.play();
    vi.advanceTimersByTime(400);
    director.pause();
    vi.advanceTimersByTime(3000);
    expect(director.index).toBe(0);
    director.play();
    vi.advanceTimersByTime(599);
    expect(director.index).toBe(0);
    vi.advanceTimersByTime(1);
    expect(director.index).toBe(1);
    director.select(0);
    vi.advanceTimersByTime(3000);
    expect(director.index).toBe(0);
    director.destroy();
  });
  it('AN-05/07/08 cancellation and reduced-motion changes prevent stale callbacks', () => {
    const { director, selected } = setup();
    director.play();
    vi.advanceTimersByTime(400);
    director.cancel();
    director.bind(2, steps, 0);
    vi.advanceTimersByTime(10000);
    expect(selected).toEqual([]);
    director.play();
    vi.advanceTimersByTime(500);
    director.setReduced(true);
    expect(director.playing).toBe(false);
    expect(director.index).toBe(0);
    director.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('AN-02 singleton and preview never start timers', () => {
    const { director } = setup();
    director.bind(3, steps.slice(0, 1), 0);
    director.play();
    expect(director.playing).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    director.bind(null, [], 0);
    director.play();
    expect(vi.getTimerCount()).toBe(0);
    director.destroy();
  });
});

it('MI-02/AN-04 shortest visual path and clockwise half-turn do not determine output', async () => {
  const { shortestTarget } = await import('./AnimationDirector');
  expect(shortestTarget(0, Math.PI)).toBeCloseTo(-Math.PI);
  expect(shortestTarget(2 * Math.PI - 0.1, 0.1)).toBeCloseTo(2 * Math.PI + 0.1);
});
