// Het harnas-logo als 3D-object: vijf delen uit brand/harnas-mark.svg, geëxtrudeerd en afgeschuind.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export const MARK = [
  'M48.5 25 L36 7 L11 12.5 Q22 23 19.5 34 L24.5 63 L48.5 71 Z',
  'M51.5 25 L64 7 L89 12.5 Q78 23 80.5 34 L75.5 63 L51.5 71 Z',
  'M25.5 68.5 L50 76.5 L74.5 68.5 L72.5 77 L50 85 L27.5 77 Z',
  'M29.5 82.5 L50 89.5 L70.5 82.5 L68.5 91 L50 98 L31.5 91 Z',
  'M34 96 L50 101.5 L66 96 L64 103 L50 108 L36 103 Z',
];

export function steel(envMap, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: opts.color ?? 0xc8ced8, metalness: 1, roughness: opts.roughness ?? 0.24,
    clearcoat: 1, clearcoatRoughness: 0.12, envMap, envMapIntensity: opts.env ?? 1.15,
    emissive: new THREE.Color(0x2b50e0), emissiveIntensity: 0,
  });
}

// Geeft een groep met vijf meshes; elk deel kent zijn eindpositie (userData.home).
export function buildLogo(material, scale = 0.05) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">${MARK.map((d) => `<path d="${d}"/>`).join('')}</svg>`;
  const data = new SVGLoader().parse(svg);
  const group = new THREE.Group();
  data.paths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 7, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 0.9, bevelSegments: 5, curveSegments: 16,
    });
    geo.computeBoundingBox();
    const c = new THREE.Vector3(); geo.boundingBox.getCenter(c);
    geo.translate(-c.x, -c.y, -c.z);
    const mesh = new THREE.Mesh(geo, material);
    // SVG-y loopt omlaag; spiegel en schaal naar wereldmaten, midden van het logo op (50, 57.5).
    mesh.scale.set(scale, -scale, scale);
    mesh.position.set((c.x - 50) * scale, -(c.y - 57.5) * scale, 0);
    mesh.userData.home = mesh.position.clone();
    group.add(mesh);
  });
  return group;
}

export function envFor(renderer) {
  return import('three/addons/environments/RoomEnvironment.js').then(({ RoomEnvironment }) => {
    const pm = new THREE.PMREMGenerator(renderer);
    return pm.fromScene(new RoomEnvironment(), 0.04).texture;
  });
}

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
}

export const easeOut = (t) => 1 - Math.pow(1 - t, 4);
