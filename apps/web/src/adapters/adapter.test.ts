import { describe, it, expect, vi } from 'vitest';
import { CryptoAdapter, type Engine } from './adapter';
const request = { algorithm: 'caesar', operation: 'encrypt', message: 'ABC' } as const;
describe('WA-06 initialization and transport failures', () => {
  it('coalesces, reports NotReady, retries without replaying requests', async () => {
    const engine: Engine = {
      executeCipher: vi.fn(() => ({ ok: false, error: { code: 'EmptyMessage' } })),
      normalizeAffineKey: vi.fn(),
    };
    let attempts = 0;
    const api = new CryptoAdapter(async () => {
      if (attempts++ === 0) throw Error('network');
      return engine;
    });
    expect(api.executeCipher(request)).toEqual({ ok: false, error: { code: 'NotReady' } });
    const first = api.initialize();
    expect(api.initialize()).toBe(first);
    await expect(first).rejects.toThrow('network');
    await api.initialize();
    expect(engine.executeCipher).not.toHaveBeenCalled();
    expect(api.executeCipher(request)).toEqual({ ok: false, error: { code: 'EmptyMessage' } });
  });
  it('turns malformed replies and runtime failures into InternalError', async () => {
    const api = new CryptoAdapter(async () => ({
      executeCipher: () => ({ ok: true, value: { algorithm: 'caesar' } }),
      normalizeAffineKey: () => {
        throw Error('private detail');
      },
    }));
    await api.initialize();
    expect(api.executeCipher(request)).toEqual({ ok: false, error: { code: 'InternalError' } });
    expect(api.normalizeAffineKey({ a: 2, b: null })).toEqual({
      ok: false,
      error: { code: 'InternalError' },
    });
  });
});
