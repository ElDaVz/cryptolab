export const LABEL_FOREGROUND = '#ffe8af';
export const LABEL_BACKGROUND = '#18251f';

export function paintLabel(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear la etiqueta de la máquina');
  const letter = /^[A-Z]$/.test(text);
  const font = `bold ${letter ? 88 : 64}px sans-serif`;
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText(text);
  const width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
  const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  // Single letters need a square tile, not the panoramic texture used for captions.
  canvas.width = letter ? 128 : Math.max(128, Math.ceil(width + 32));
  canvas.height = 128;
  // Resizing a canvas resets its drawing state, including font and alignment.
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = LABEL_BACKGROUND;
  if (letter) {
    ctx.beginPath();
    ctx.arc(64, 64, 64, 0, 2 * Math.PI);
    ctx.fill();
  } else ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = LABEL_FOREGROUND;
  ctx.fillText(
    text,
    (canvas.width - width) / 2 + metrics.actualBoundingBoxLeft,
    (canvas.height - height) / 2 + metrics.actualBoundingBoxAscent,
  );
}
