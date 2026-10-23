// Hero: het stalen harnas wordt uit vijf delen samengesteld terwijl een stroom data erin wordt opgenomen.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildLogo, steel, envFor, reduced, webglOk, easeOut } from './logo3d.js';

export async function hero(canvas) {
  if (!webglOk()) return false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080b);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const env = await envFor(renderer);
  const logo = buildLogo(steel(env, { color: 0x8e97a6, roughness: 0.3, env: 0.75 }), 0.036);
  scene.add(logo);

  const rim = new THREE.DirectionalLight(0x3d63ff, 9); rim.position.set(-4, 2, -3); scene.add(rim);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); scene.add(key);

  // Datastroom: punten die van ver naar het logo trekken en opnieuw beginnen.
  const N = innerWidth < 700 ? 900 : 2200;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    seed.set([th, ph, 7 + Math.random() * 9, Math.random()], i * 4);
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pmat = new THREE.PointsMaterial({ color: 0x7f9bff, size: 0.035, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(pgeo, pmat);
  scene.add(points);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.5, 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Startposities van de delen: verspreid, gedraaid.
  const parts = logo.children.map((m, i) => ({
    m, from: new THREE.Vector3((i % 2 ? 1 : -1) * (3 + Math.random() * 3), (Math.random() - 0.5) * 6, -2 - Math.random() * 6),
    rot: new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3), delay: 0.25 + i * 0.16,
  }));

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h;
    // Op smalle schermen het logo kleiner en hoger, zodat de kop eronder past.
    const narrow = w / h < 0.9;
    camera.position.z = narrow ? 13 : 9;
    logo.position.set(narrow ? 0 : 1.9, narrow ? 1.5 : 0.1, 0);
    camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  const target = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => { target.x = e.clientX / innerWidth - 0.5; target.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  const still = reduced();
  const t0 = performance.now();
  let running = true;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) loop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) loop(); });

  let raf = 0;
  function frame(now) {
    const t = still ? 99 : (now - t0) / 1000;
    for (const p of parts) {
      const k = easeOut(Math.min(1, Math.max(0, (t - p.delay) / 1.6)));
      p.m.position.lerpVectors(p.from, p.m.userData.home, k);
      p.m.rotation.set(p.rot.x * (1 - k), p.rot.y * (1 - k), p.rot.z * (1 - k));
    }
    logo.rotation.y += ((target.x * 0.6 + Math.sin(t * 0.4) * 0.18) - logo.rotation.y) * 0.05;
    logo.rotation.x += ((target.y * 0.35) - logo.rotation.x) * 0.05;

    for (let i = 0; i < N; i++) {
      const [th, ph, r0, o] = seed.subarray(i * 4, i * 4 + 4);
      const life = (o + t * 0.08) % 1;               // 0 = ver weg, 1 = in het logo
      const r = r0 * (1 - easeOut(life)) + 0.2;
      const swirl = th + life * 2.2;
      pos[i * 3] = r * Math.sin(ph) * Math.cos(swirl) + logo.position.x;
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.7 + logo.position.y;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(swirl) - 1;
    }
    pgeo.attributes.position.needsUpdate = true;
    composer.render();
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = (now) => { frame(now); if (running && !still) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  loop();
  canvas.classList.add('is-live');
  return true;
}
