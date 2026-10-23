// One steel emblem for the whole page: a frame sequence scrubbed by scroll on a canvas.
// Frames 0-39 complete and turning, 40-79 coming apart, 80-119 back plate by plate, 120-159 turn to the seam and settle.
const N = 160;
const src = (i) => `img/seq/f${String(i).padStart(3, '0')}.webp`;

export function sequence(canvas, { still = false } = {}) {
  const ctx = canvas.getContext('2d');
  const frames = new Array(N);
  let ready = 0, drawn = -1, target = 0, idle = true, raf = 0;

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); drawn = -1; }
  }

  function draw(i) {
    const img = frames[i] || nearest(i);
    if (!img) return;
    size();
    const cw = canvas.width, ch = canvas.height;
    const s = Math.min(cw / img.width, ch / img.height) * 1.3; // the render leaves air around the emblem
    const w = img.width * s, h = img.height * s;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = i;
  }
  function nearest(i) { for (let d = 1; d < N; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; } return null; }

  // Load the first frame first, then the rest spread out, so the hero shows at once.
  function load(i) {
    return new Promise((res) => {
      const img = new Image(); img.decoding = 'async';
      img.onload = () => { frames[i] = img; ready++; if (i === drawn || drawn === -1) draw(target); res(); };
      img.onerror = () => res();
      img.src = src(i);
    });
  }
  load(0).then(async () => {
    draw(0);
    const order = [];
    for (let step = 16; step >= 1; step = step >> 1) for (let i = 0; i < N; i += step) if (!order.includes(i)) order.push(i);
    for (const i of order) if (!frames[i]) await load(i);
  });

  // Scroll position across the whole document maps onto the sequence.
  function progress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  }
  let t0 = performance.now();
  function tick(now) {
    if (still) return;
    if (idle) {
      // Before the first scroll the emblem turns slowly on its own (frames 0-39, back and forth).
      const k = ((now - t0) / 6000) % 2;
      target = Math.round((k < 1 ? k : 2 - k) * 39);
    } else target = Math.round(progress() * (N - 1));
    if (target !== drawn) draw(target);
    raf = requestAnimationFrame(tick);
  }
  addEventListener('scroll', () => { if (scrollY > 8) idle = false; else if (scrollY === 0) { idle = true; t0 = performance.now(); } }, { passive: true });
  addEventListener('resize', () => { drawn = -1; draw(target); });
  if (still) draw(0); else raf = requestAnimationFrame(tick);
  return { stop: () => cancelAnimationFrame(raf) };
}
