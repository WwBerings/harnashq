// Level-up: na de scan ontsteekt het harnas. De score stuurt gloed, vlammen en vonken.
// Niveau 1 (<50) smeult blauw, niveau 2 (50-79) brandt, niveau 3 (80+) wordt wit-heet.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildLogo, steel, envFor, reduced, webglOk, easeOut } from './logo3d.js';

export const tier = (s) => (s >= 80 ? 3 : s >= 50 ? 2 : 1);

const FLAME_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const FLAME_FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime, uHeat, uSeed;
uniform vec3 uCool, uMid, uHot;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=.5; } return v; }
void main(){
  float heat = uHeat;
  vec2 q = vec2(vUv.x - .5, vUv.y - .24);
  float t = uTime * (1.2 + heat * 1.8);
  float n1 = fbm(vec2(q.x * 5. + uSeed, q.y * 4. - t));
  float n2 = fbm(vec2(q.x * 11. - uSeed, q.y * 9. - t * 1.7));
  float top = mix(.2, .58, heat);
  float width = mix(.21, .27, heat) * (1. - smoothstep(0., top, q.y) * .8);
  float edge = abs(q.x + (n1 - .5) * .16 * q.y * 4.) / max(width, .01);
  float tall = q.y / top;
  float body = 1. - smoothstep(.55, 1., max(edge, tall + (n1 - .5) * .9));
  body *= smoothstep(-.06, .12, q.y);
  float f = body * smoothstep(.34, .7, n2 * .8 + (1. - tall) * .45);
  vec3 col = mix(uCool, uMid, smoothstep(.15, .55, f));
  col = mix(col, uHot, smoothstep(.82, 1., f) * smoothstep(.5, 1., heat));
  gl_FragColor = vec4(col, f * smoothstep(0., .12, heat) * .75);
}`;

export async function level(canvas) {
  if (!webglOk()) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080b);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100); camera.position.set(0, 0.3, 10.5);

  const env = await envFor(renderer);
  const mat = steel(env, { color: 0x8e97a6, roughness: 0.3, env: 0.75 });
  const logo = buildLogo(mat, 0.036); logo.position.y = -0.2; scene.add(logo);
  const rim = new THREE.DirectionalLight(0x3d63ff, 7); rim.position.set(-4, 3, -3); scene.add(rim);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 4, 5); scene.add(key);

  // Twee vlamlagen: één achter het logo, één ervoor die alleen de toppen draagt.
  const flames = [[-0.6, 0.0, 1.0], [-1.4, 2.3, 0.8]].map(([z, s, o]) => {
    const m = new THREE.ShaderMaterial({
      vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uHeat: { value: 0 }, uSeed: { value: s },
        uCool: { value: new THREE.Color(0x0c1a6e) }, uMid: { value: new THREE.Color(0x2b50e0) }, uHot: { value: new THREE.Color(0xdfe6ff) } },
      opacity: o,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 11), m);
    mesh.position.set(0, 1.6, z); scene.add(mesh); m.userData.o = o; return m;
  });

  // Vonken.
  const N = 600, pos = new Float32Array(N * 3), sd = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) sd.set([Math.random() * 2 - 1, Math.random(), Math.random() * 2 - 1], i * 3);
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const smat = new THREE.PointsMaterial({ color: 0xb8c6ff, size: 0.05, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.Points(sgeo, smat));

  // Schokring bij niveau 3.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 8, 96), new THREE.MeshBasicMaterial({ color: 0xdfe6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(ring);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.5, 0.82); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  const still = reduced();
  const st = { heat: 0, goal: 0, tier: 0, lit: -1, t0: performance.now() };
  let running = true, raf = 0;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) loop(); }).observe(canvas);

  function frame(now) {
    const t = (now - st.t0) / 1000;
    st.heat += (st.goal - st.heat) * (still ? 1 : 0.035);
    const H = st.heat;
        for (const f of flames) { f.uniforms.uTime.value = t; f.uniforms.uHeat.value = H * (f.userData.o < 1 ? 1.08 : 1); }
    mat.emissiveIntensity = H * (st.tier >= 3 ? 0.45 : 0.2);
    mat.roughness = 0.24 - H * 0.1;
    bloom.strength = 0.3 + H * 0.35;
    logo.rotation.y = Math.sin(t * 0.5) * 0.35;
    logo.position.y = -0.2 + Math.sin(t * 1.3) * 0.05 + H * 0.25;

    smat.opacity = st.tier >= 2 ? Math.min(1, H * 1.2) : H * 0.5;
    for (let i = 0; i < N; i++) {
      const life = (sd[i * 3 + 1] + t * (0.15 + H * 0.5)) % 1;
      pos[i * 3] = sd[i * 3] * (1.3 + life * 1.4) + Math.sin(t * 2 + i) * 0.08;
      pos[i * 3 + 1] = -1.6 + life * (3 + H * 4);
      pos[i * 3 + 2] = sd[i * 3 + 2] * 1.2;
    }
    sgeo.attributes.position.needsUpdate = true;

    if (st.lit >= 0) {
      const k = Math.min(1, (t - st.lit) / 1.4);
      ring.scale.setScalar(0.5 + easeOut(k) * 4.5);
      ring.material.opacity = st.tier >= 2 ? (1 - k) * (st.tier === 3 ? 1 : 0.5) : 0;
    }
    composer.render();
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = (now) => { frame(now); if (running && !still) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  loop();

  return {
    set(score, instant = false) {
      st.tier = tier(score);
      st.goal = score / 100;
      if (instant) st.heat = st.goal;
      st.lit = (performance.now() - st.t0) / 1000;
      if (still) frame(performance.now());
      else loop();
    },
    reset() { st.goal = 0; st.tier = 0; st.lit = -1; loop(); },
  };
}
