import { expect, it, vi } from 'vitest';
import { LABEL_BACKGROUND, LABEL_FOREGROUND, paintLabel } from './labels';

function canvasFixture(inkWidth: number, ascent = 66, descent = 0) {
  const ctx = {
    font: '',
    textAlign: '',
    textBaseline: '',
    fillStyle: '',
    measureText: () => ({
      actualBoundingBoxLeft: 3,
      actualBoundingBoxRight: inkWidth - 3,
      actualBoundingBoxAscent: ascent,
      actualBoundingBoxDescent: descent,
    }),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
  };
  let width = 300;
  let height = 150;
  const reset = () => {
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000000';
  };
  const canvas = {
    get width() {
      return width;
    },
    set width(value: number) {
      width = value;
      reset();
    },
    get height() {
      return height;
    },
    set height(value: number) {
      height = value;
      reset();
    },
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  return { canvas, ctx };
}

it('MI-09 gives wide and narrow letters square tiles and centers their actual ink', () => {
  for (const [letter, width] of [
    ['I', 14],
    ['M', 74],
    ['W', 86],
  ] as const) {
    const { canvas, ctx } = canvasFixture(width);
    paintLabel(canvas, letter);
    expect(canvas.width).toBe(canvas.height);
    expect(ctx.font).toBe('bold 88px sans-serif');
    expect(ctx.textAlign).toBe('left');
    expect(ctx.fillText).toHaveBeenCalledWith(letter, (128 - width) / 2 + 3, 97);
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalledOnce();
  }
});

it('MI-09 measures long captions without cropping and restores state after resizing', () => {
  const { canvas, ctx } = canvasFixture(780, 62, 12);
  paintLabel(canvas, 'b · Desplazamiento');
  expect(canvas.width).toBeGreaterThanOrEqual(780 + 32);
  expect(ctx.font).toBe('bold 64px sans-serif');
  expect(ctx.fillText).toHaveBeenCalledWith('b · Desplazamiento', 19, 89);
  expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
  expect(ctx.fillStyle).toBe(LABEL_FOREGROUND);
});

it('MI-09 label colors provide at least 4.5:1 text contrast', () => {
  function luminance(hex: string) {
    const channels = hex.match(/[0-9a-f]{2}/gi)!.map((pair) => {
      const channel = parseInt(pair, 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  expect(
    (luminance(LABEL_FOREGROUND) + 0.05) / (luminance(LABEL_BACKGROUND) + 0.05),
  ).toBeGreaterThanOrEqual(4.5);
});

it('fails explicitly if the text canvas cannot be initialized', () => {
  const canvas = { getContext: () => null } as unknown as HTMLCanvasElement;
  expect(() => paintLabel(canvas, 'A')).toThrow('No se pudo crear la etiqueta');
});
