// One steel emblem for the whole page: a frame sequence scrubbed by scroll on a canvas.
// Smoothness comes from three things: every frame is decoded up front, the shown position eases
// toward the scroll position (inertia), and in between two frames the canvas crossfades them.
const N = Number(document.getElementById('emblem')?.dataset.frames || 160);
const src = (i) => `img/seq/f${String(i).padStart(3, '0')}.webp`;
const ZOOM = 1.3;        // the render leaves air around the emblem
const SMOOTH = 0.14;     // share of the remaining distance covered per frame at 60 fps

export function sequence(canvas, { still = false } = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const frames = new Array(N);
  let pos = 0, target = 0, idle = true, raf = 0, lastDrawn = -1, lastW = 0, lastH = 0;

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w !== lastW || h !== lastH) { canvas.width = w; canvas.height = h; lastW = w; lastH = h; lastDrawn = -1; }
  }

  function blit(img, alpha) {
    const cw = canvas.width, ch = canvas.height;
    const s = Math.min(cw / img.width, ch / img.height) * ZOOM;
    const w = img.width * s, h = img.height * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  // Draw a fractional position: the frame below at full strength, the one above faded in.
  function draw(p) {
    size();
    const i = Math.floor(p), f = p - i;
    const a = frames[i] || nearest(i), b = frames[Math.min(N - 1, i + 1)];
    if (!a) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    blit(a, 1);
    if (b && b !== a && f > 0.02) blit(b, f);
    ctx.globalAlpha = 1;
    lastDrawn = p;
  }
  function nearest(i) { for (let d = 1; d < N; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; } return null; }

  // Decode every frame to a bitmap so a draw never waits on the decoder. First frame first,
  // then coarse to fine, so a half-loaded page already scrubs without gaps.
  async function load(i) {
    try {
      const res = await fetch(src(i));
      const blob = await res.blob();
      frames[i] = 'createImageBitmap' in window ? await createImageBitmap(blob) : await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = URL.createObjectURL(blob); });
    } catch {}
  }
  (async () => {
    await load(0); draw(0);
    const order = [];
    for (let step = 32; step >= 1; step >>= 1) for (let i = 0; i < N; i += step) if (!order.includes(i)) order.push(i);
    // four at a time keeps the network busy without starving the first paint
    for (let k = 0; k < order.length; k += 4) await Promise.all(order.slice(k, k + 4).map((i) => frames[i] ? null : load(i)));
    lastDrawn = -1;
  })();

  function progress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  }

  let t0 = performance.now(), tPrev = t0;
  function tick(now) {
    const dt = Math.min(50, now - tPrev); tPrev = now;
    if (idle) {
      const k = ((now - t0) / 6000) % 2;                 // before the first scroll: a slow turn, back and forth
      target = (k < 1 ? k : 2 - k) * 39;
    } else target = progress() * (N - 1);
    // frame-rate independent easing toward the target
    const ease = 1 - Math.pow(1 - SMOOTH, dt / 16.67);
    pos += (target - pos) * ease;
    if (Math.abs(target - pos) < 0.002) pos = target;
    if (Math.abs(pos - lastDrawn) > 0.004) draw(pos);
    raf = requestAnimationFrame(tick);
  }
  addEventListener('scroll', () => { if (scrollY > 8) idle = false; else if (scrollY === 0) { idle = true; t0 = performance.now(); } }, { passive: true });
  addEventListener('resize', () => { lastDrawn = -1; draw(pos); });
  if (still) { draw(0); return { stop() {} }; }
  raf = requestAnimationFrame(tick);
  return { stop: () => cancelAnimationFrame(raf) };
}
