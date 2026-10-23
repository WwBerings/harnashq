# HARNAS mark as a machined steel badge, studio-lit, plus a seamless 8 s turntable loop.
#
# Still:  Blender -b --python brand/blender_logo.py -- still [samples=384] [scale%=100]
#         -> team/hero-still.png (flattened on #07080B), team/hero-still-alpha.png
# Loop:   Blender -b --python brand/blender_logo.py -- loop  [samples=128] [scale%=100]
#         -> team/hero-loop.webm, team/hero-loop.mp4, team/hero-poster.png (frames in /tmp/harnas-loop)
# Parts:  Blender -b --python brand/blender_logo.py -- parts [samples=256] [scale%] [plates|seam|lames ...]
#         -> team/part-<name>.png (transparent, 1200x1200) + .webp (q82, alpha)
# Seq:    Blender -b --python brand/blender_logo.py -- sequence [samples=128] [scale%] [first last]
#         -> team/seq/f000.webp .. f159.webp (q80, alpha) + team/seq/contact.jpg (every 8th frame)
# All modes save brand/harnas.blend. (Blender = /Applications/Blender.app/Contents/MacOS/Blender)
#
# Geometry is read straight from brand/harnas-mark.svg. The paths are simple M/L/Q/Z polygons, so the
# script parses them itself instead of bpy.ops.import_curve.svg: exact control over scale, pivots and
# face sets, and no dependency on the SVG add-on being present in a given Blender build.
import bpy, bmesh, re, os, sys, math, subprocess, time, shutil
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TEAM = os.path.join(ROOT, 'team')
SVG = os.path.join(HERE, 'harnas-mark.svg')
BLEND = os.path.join(HERE, 'harnas.blend')
FRAMES = '/tmp/harnas-loop'

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = argv[0] if argv and argv[0] in ('still', 'loop', 'parts', 'sequence') else 'still'
ONLY = [a for a in argv[1:] if a.isalpha()]   # parts mode: optional shot names, e.g. -- parts 64 seam
num = [a for a in argv if a.isdigit()]
SAMPLES = int(num[0]) if num else {'still': 384, 'loop': 128, 'parts': 256, 'sequence': 128}[MODE]
PCT = int(num[1]) if len(num) > 1 else 100

FPS, SECONDS = 30, 8
NFR = FPS * SECONDS          # 240 frames; frame NFR+1 would equal frame 1, so the loop is seamless
YAW_AMP = 12.5               # degrees each side: 25 degrees of travel
S = 0.02                     # SVG unit -> metres (logo ~1.6 x 2.0 m)
CX, CY = 50, 57.5            # visual centre of the mark in SVG units
BLUE = (0.0242, 0.0802, 0.7529)  # #2B50E0 in linear


def srgb2lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


# ---------- SVG -> polygons ----------
def parse(d):
    tok = re.findall(r'[MLQZ]|-?\d*\.?\d+', d)
    pts, i, cmd, cur = [], 0, None, None
    while i < len(tok):
        t = tok[i]
        if t in 'MLQZ':
            cmd = t; i += 1
            if t == 'Z':
                continue
        if cmd in 'ML':
            cur = (float(tok[i]), float(tok[i + 1])); pts.append(cur); i += 2
        elif cmd == 'Q':
            c = (float(tok[i]), float(tok[i + 1])); e = (float(tok[i + 2]), float(tok[i + 3])); i += 4
            for k in range(1, 17):
                u = k / 16
                pts.append(((1-u)**2*cur[0] + 2*(1-u)*u*c[0] + u*u*e[0],
                            (1-u)**2*cur[1] + 2*(1-u)*u*c[1] + u*u*e[1]))
            cur = e
    return pts


def paths():
    return re.findall(r'id="(\w+)"\s+d="([^"]+)"', open(SVG).read())


# ---------- scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene

root = bpy.data.objects.new('HARNAS', None)
scn.collection.objects.link(root)
root.rotation_euler = (math.radians(90), 0, 0)   # build in XY facing +Z, stand it up facing -Y

BORDER = 1.1 * S    # width of the machined border band inside the outer chamfer
STEP = 0.24 * S     # how far the brushed panel sits below the border


def plate(name, pts, depth):
    xy = [((x - CX) * S, -(y - CY) * S) for x, y in pts]
    if abs(xy[0][0] - xy[-1][0]) < 1e-6 and abs(xy[0][1] - xy[-1][1]) < 1e-6:
        xy = xy[:-1]
    area = sum(xy[i][0] * xy[i-1][1] - xy[i-1][0] * xy[i][1] for i in range(len(xy)))
    if area > 0:                     # want counter-clockwise seen from +Z
        xy.reverse()
    cx = sum(p[0] for p in xy) / len(xy); cy = sum(p[1] for p in xy) / len(xy)
    bm = bmesh.new()
    vs = [bm.verts.new((x - cx, y - cy, -depth)) for x, y in xy]
    back = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[back])
    top_v = [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]
    top_f = [g for g in ext['geom'] if isinstance(g, bmesh.types.BMFace)]
    bmesh.ops.translate(bm, verts=top_v, vec=(0, 0, depth))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 1          # sides, back: polished
    # Machined badge: a polished border band that steps down into a brushed panel.
    ins = bmesh.ops.inset_region(bm, faces=top_f, thickness=BORDER, depth=-STEP, use_even_offset=True)
    for f in ins['faces']:
        f.material_index = 1
    for f in top_f:
        f.material_index = 0          # brushed panel
    for e in bm.edges:
        e.smooth = False              # crisp lines; the bevel modifier rounds what it chamfers
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    scn.collection.objects.link(ob)
    ob.parent = root
    ob.location = (cx, cy, 0)
    bev = ob.modifiers.new('chamfer', 'BEVEL')
    bev.width = 0.55 * S; bev.segments = 3; bev.profile = 0.62
    bev.limit_method = 'ANGLE'; bev.angle_limit = math.radians(40)
    bev.harden_normals = True; bev.miter_outer = 'MITER_ARC'
    wn = ob.modifiers.new('wn', 'WEIGHTED_NORMAL'); wn.keep_sharp = True
    return ob


plates = {}
for pid, d in paths():
    depth = 6 * S if pid in ('l', 'r') else 5 * S
    plates[pid] = plate(pid, parse(d), depth)

# Shallow V on the chest plates (centre ridge forward), lames stepped back like a watch-case stack.
plates['l'].rotation_euler = (0, math.radians(-5), 0)
plates['r'].rotation_euler = (0, math.radians(5), 0)
for i, pid in enumerate(('b1', 'b2', 'b3')):
    o = plates[pid]
    o.location.z -= 0.025 * (i + 1)
    o.rotation_euler = (math.radians(-6), 0, 0)


# ---------- materials ----------
def node(nt, kind, **inputs):
    n = nt.nodes.new(kind)
    for k, v in inputs.items():
        n.inputs[k].default_value = v
    return n


def steel(name, brushed):
    mat = bpy.data.materials.new(name)
    nt = mat.node_tree if mat.node_tree else (setattr(mat, 'use_nodes', True) or mat.node_tree)
    N, L = nt.nodes, nt.links
    N.clear()
    out = N.new('ShaderNodeOutputMaterial'); b = N.new('ShaderNodeBsdfPrincipled')
    L.new(b.outputs[0], out.inputs['Surface'])
    b.inputs['Base Color'].default_value = (0.62, 0.64, 0.67, 1)
    b.inputs['Metallic'].default_value = 1.0
    tc = N.new('ShaderNodeTexCoord')
    # Micro-roughness: broad, low-contrast variation so no face is one flat tone.
    mp_m = N.new('ShaderNodeMapping'); mp_m.inputs['Scale'].default_value = (12.0, 12.0, 12.0)
    L.new(tc.outputs['Object'], mp_m.inputs['Vector'])
    micro = node(nt, 'ShaderNodeTexNoise', Scale=1.0, Detail=6.0, Roughness=0.55)
    L.new(mp_m.outputs[0], micro.inputs['Vector'])
    if not brushed:
        r = node(nt, 'ShaderNodeMapRange', **{'From Min': 0.35, 'From Max': 0.65, 'To Min': 0.07, 'To Max': 0.12})
        L.new(micro.outputs['Fac'], r.inputs['Value']); L.new(r.outputs[0], b.inputs['Roughness'])
        return mat
    # Brushing: two stretched noise layers along local X, fine grain plus sparse longer strokes.
    mp_f = N.new('ShaderNodeMapping'); mp_f.inputs['Scale'].default_value = (4.0, 5200.0, 4.0)
    mp_c = N.new('ShaderNodeMapping'); mp_c.inputs['Scale'].default_value = (1.5, 900.0, 1.5)
    L.new(tc.outputs['Object'], mp_f.inputs['Vector']); L.new(tc.outputs['Object'], mp_c.inputs['Vector'])
    fine = node(nt, 'ShaderNodeTexNoise', Scale=1.0, Detail=3.0, Roughness=0.5)
    coarse = node(nt, 'ShaderNodeTexNoise', Scale=1.0, Detail=2.0, Roughness=0.5)
    L.new(mp_f.outputs[0], fine.inputs['Vector']); L.new(mp_c.outputs[0], coarse.inputs['Vector'])
    mix = N.new('ShaderNodeMix'); mix.data_type = 'FLOAT'; mix.inputs['Factor'].default_value = 0.35
    L.new(fine.outputs['Fac'], mix.inputs['A']); L.new(coarse.outputs['Fac'], mix.inputs['B'])
    brush = N.new('ShaderNodeMapRange')
    brush.inputs['From Min'].default_value = 0.3; brush.inputs['From Max'].default_value = 0.7
    brush.inputs['To Min'].default_value = -0.035; brush.inputs['To Max'].default_value = 0.035
    L.new(mix.outputs['Result'], brush.inputs['Value'])
    base = N.new('ShaderNodeMapRange')
    base.inputs['From Min'].default_value = 0.35; base.inputs['From Max'].default_value = 0.65
    base.inputs['To Min'].default_value = 0.20; base.inputs['To Max'].default_value = 0.225
    L.new(micro.outputs['Fac'], base.inputs['Value'])
    add = N.new('ShaderNodeMath'); add.operation = 'ADD'
    L.new(base.outputs[0], add.inputs[0]); L.new(brush.outputs[0], add.inputs[1])
    L.new(add.outputs[0], b.inputs['Roughness'])
    b.inputs['Anisotropic'].default_value = 0.6
    bump = node(nt, 'ShaderNodeBump', Strength=0.03, Distance=0.002)
    L.new(mix.outputs['Result'], bump.inputs['Height']); L.new(bump.outputs[0], b.inputs['Normal'])
    tan = node(nt, 'ShaderNodeCombineXYZ', X=1.0)
    vt = N.new('ShaderNodeVectorTransform'); vt.vector_type = 'VECTOR'
    vt.convert_from = 'OBJECT'; vt.convert_to = 'WORLD'
    L.new(tan.outputs[0], vt.inputs[0]); L.new(vt.outputs[0], b.inputs['Tangent'])
    return mat


m_brushed, m_polished = steel('brushed_steel', True), steel('polished_steel', False)
for o in plates.values():
    o.data.materials.append(m_brushed); o.data.materials.append(m_polished)


# ---------- light ----------
def area(name, loc, size, power, color=(1, 1, 1), size_y=None):
    ld = bpy.data.lights.new(name, 'AREA'); ld.shape = 'RECTANGLE'
    ld.size = size; ld.size_y = size_y or size; ld.energy = power; ld.color = color
    ob = bpy.data.objects.new(name, ld); scn.collection.objects.link(ob); ob.location = loc
    c = ob.constraints.new('TRACK_TO'); c.target = root; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    return ob


def ring(az, d=10.0, z=-0.35):
    a = math.radians(az)
    return (-d * math.sin(a), -d * math.cos(a), z)


area('key',   (-4.5, -5.5, 4.0), 3.5, 900, (1.0, 0.97, 0.93), size_y=2.2)
area('strip', (0.8, -3.5, 4.8), 7.0, 260, (0.95, 0.97, 1.0), size_y=0.35)
# The flat faces mirror a point ~(-0.37, -0.94, -0.12) from the logo (azimuth ~21 deg left of the
# camera axis). Brushing stretches highlights vertically, so the gradient runs sideways: a tall
# softbox whose inner edge sits in that reflection cone lights one chest plate and lets the other
# fall off. In the loop this softbox is the one that sweeps.
SOFT_AZ = 44
softbox = area('softbox', ring(SOFT_AZ), 2.6, 62, (1.0, 0.985, 0.96), size_y=9.0)
kicker = area('kicker', ring(-2), 2.0, 14, (0.92, 0.95, 1.0), size_y=9.0)
# The lames tilt up 6 deg, so they mirror ~12 deg higher than the chest plates: a wide low strip there.
area('lames', ring(20, z=2.0), 7.0, 22, (1.0, 0.99, 0.97), size_y=1.4)
area('fill',  (5.5, -6.0, -1.0), 4.0, 90, (0.85, 0.9, 1.0))
area('rim_blue', (4.0, 6.0, 1.0), 2.0, 900, BLUE, size_y=4.0)
area('rim_blue_l', (-4.0, 5.5, -1.5), 1.5, 350, BLUE, size_y=3.0)

# World: near-black to the camera, a soft studio environment in reflections (HDRI-style gradient:
# a broad lobe left-front plus a faint horizon band) so flat faces never mirror pure black.
world = bpy.data.worlds.new('studio'); scn.world = world
wt = world.node_tree if world.node_tree else (setattr(world, 'use_nodes', True) or world.node_tree)
W, WL = wt.nodes, wt.links
W.clear()
wout = W.new('ShaderNodeOutputWorld')
tc = W.new('ShaderNodeTexCoord')
d0 = Vector((-0.45, -0.87, 0.18)).normalized()
dot = W.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
dot.inputs[1].default_value = d0
WL.new(tc.outputs['Generated'], dot.inputs[0])
lobe = W.new('ShaderNodeMapRange'); lobe.interpolation_type = 'SMOOTHSTEP'
lobe.inputs['From Min'].default_value = 0.6; lobe.inputs['From Max'].default_value = 1.0
lobe.inputs['To Min'].default_value = 0.0; lobe.inputs['To Max'].default_value = 0.05
WL.new(dot.outputs['Value'], lobe.inputs['Value'])
sep = W.new('ShaderNodeSeparateXYZ'); WL.new(tc.outputs['Generated'], sep.inputs[0])
hz = W.new('ShaderNodeMapRange'); hz.interpolation_type = 'SMOOTHSTEP'
hz.inputs['From Min'].default_value = -0.45; hz.inputs['From Max'].default_value = 0.15
hz.inputs['To Min'].default_value = 0.004; hz.inputs['To Max'].default_value = 0.014
WL.new(sep.outputs['Z'], hz.inputs['Value'])
tot = W.new('ShaderNodeMath'); tot.operation = 'ADD'
WL.new(lobe.outputs[0], tot.inputs[0]); WL.new(hz.outputs[0], tot.inputs[1])
env = W.new('ShaderNodeBackground'); env.inputs['Color'].default_value = (0.92, 0.95, 1.0, 1)
WL.new(tot.outputs[0], env.inputs['Strength'])
cambg = W.new('ShaderNodeBackground')
cambg.inputs['Color'].default_value = (srgb2lin(7), srgb2lin(8), srgb2lin(11), 1)
lp = W.new('ShaderNodeLightPath')
mixw = W.new('ShaderNodeMixShader')
WL.new(lp.outputs['Is Camera Ray'], mixw.inputs['Fac'])
WL.new(env.outputs[0], mixw.inputs[1]); WL.new(cambg.outputs[0], mixw.inputs[2])
WL.new(mixw.outputs[0], wout.inputs['Surface'])

# ---------- camera ----------
target = bpy.data.objects.new('aim', None); scn.collection.objects.link(target)
target.location = (0, 0, -0.05)
cd = bpy.data.cameras.new('cam'); cd.lens = 85
cd.dof.use_dof = True; cd.dof.focus_object = target; cd.dof.aperture_fstop = 5.6
cam = bpy.data.objects.new('cam', cd); scn.collection.objects.link(cam)
d, yaw, pitch = 9.8, math.radians(22), math.radians(7)
cam.location = (d * math.sin(yaw) * math.cos(pitch), -d * math.cos(yaw) * math.cos(pitch), d * math.sin(pitch))
c = cam.constraints.new('TRACK_TO'); c.target = target; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
scn.camera = cam

# ---------- animation: periodic, so frame 1 == the still and frame NFR+1 == frame 1 ----------
scn.render.fps = FPS
scn.frame_start, scn.frame_end = 1, NFR
for f in range(1, NFR + 1):
    t = (f - 1) / NFR
    s = math.sin(2 * math.pi * t)                           # ease in-out at both turning points
    root.rotation_euler = (math.radians(90), 0, math.radians(YAW_AMP * s))
    root.keyframe_insert('rotation_euler', frame=f)
    # Softbox sweeps ahead of the turn (quarter-period lead) so a highlight travels across the plates.
    softbox.location = ring(SOFT_AZ + 14 * math.sin(2 * math.pi * t + math.pi / 3) - 14 * math.sin(math.pi / 3))
    softbox.keyframe_insert('location', frame=f)
scn.frame_set(1)

# ---------- render settings ----------
r = scn.render
r.engine = 'CYCLES'; r.resolution_x = 1600; r.resolution_y = 1000; r.resolution_percentage = PCT
r.film_transparent = True
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'; r.image_settings.color_depth = '8'
r.use_persistent_data = True
scn.view_settings.view_transform = 'AgX'
try:
    scn.view_settings.look = 'AgX - Medium High Contrast'
except TypeError:
    pass
cy = scn.cycles
cy.samples = SAMPLES; cy.use_denoising = True
cy.max_bounces = 8; cy.glossy_bounces = 6
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'; prefs.get_devices()
    for dv in prefs.devices:
        dv.use = True
    cy.device = 'GPU'
except Exception as e:
    print('GPU unavailable, CPU render:', e)

os.makedirs(TEAM, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)

BG = '0x07080B'
FLAT = ("from PIL import Image;import sys;f=Image.open(sys.argv[1]).convert('RGBA');"
        "b=Image.new('RGBA',f.size,(7,8,11,255));Image.alpha_composite(b,f).convert('RGB').save(sys.argv[2])")

# Section images: close crops on parts of the emblem, same scene, lights and materials.
# name: (aim point in world space, yaw deg, pitch deg, distance m, lens mm, f-stop, exposure)
# The softbox is re-aimed per shot with the hero's rule: its inner edge sits in the mirror direction
# of the view (azimuth yaw + 22 deg, kicker at yaw - 24 deg, elevation about 5 deg above minus the camera pitch).
SHOTS = {
    'plates': ((0.03, 0.0, 0.46), 24, 24, 4.3, 85, 8.0, 0.5),
    'seam':   ((0.0, -0.06, 0.22), 30, 8, 1.7, 100, 4.0, 0.0),
    'lames':  ((0.05, 0.0, -0.52), 18, -10, 2.9, 85, 8.0, -1.0),
}

# Scroll sequence: 160 frames, fixed camera, emblem turns, comes apart, reassembles plate by plate.
SEQ_BASE = 160    # the motion is authored on a 160-frame timeline (frames 0-159 below)
SEQ_N = next((int(a[1:]) for a in argv if re.fullmatch(r'n\d+', a)), SEQ_BASE)   # e.g. -- sequence 96 n320
SEQ_DIR = os.path.join(TEAM, 'seq' if SEQ_N == SEQ_BASE else f'seq{SEQ_N}')
SEQ_TMP = f'/tmp/harnas-seq{SEQ_N}'
SOFT_DIM = 0.65   # the fill light drops to 35% while the plates are apart: the tilted right chest plate mirrors it
                  # (found by switching lights off one at a time; softbox and lames strip were not the cause)
# Per plate, in build space (x right, y up, z towards the viewer): offset at full separation and
# extra rotation in degrees. Chest plates go up and out, lames step down and forward.
EXPLODE = {
    'l':  ((-0.36, 0.42, 0.18), (4, -6, 4)),
    'r':  ((0.36, 0.42, 0.18), (4, 6, -4)),
    'b1': ((0.0, 0.0, 0.30), (-5, 0, 3)),
    'b2': ((0.0, -0.36, 0.16), (-6, 4, -3)),
    'b3': ((0.0, -0.72, 0.04), (-7, -4, 3)),
}
RETURN_ORDER = ('l', 'r', 'b1', 'b2', 'b3')


def smooth(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * t * (t * (6 * t - 15) + 10)       # smootherstep: zero velocity and accel at ends


def seq_amount(pid, f):
    if f < 40:
        return 0.0
    if f < 80:
        return smooth((f - 40) / 39)
    k = RETURN_ORDER.index(pid)
    return 1.0 - smooth((f - (80 + 6 * k)) / 15)     # windows 80-95, 86-101, ... 104-119


# Yaw of the emblem (deg) at key frames; 22 deg turns the seam square to the camera.
YAW_KEYS = [(0, 0.0), (39, 10.0), (79, 12.0), (119, 14.0), (138, 22.0), (159, 0.0)]


def seq_yaw(f):
    for (f0, y0), (f1, y1) in zip(YAW_KEYS, YAW_KEYS[1:]):
        if f <= f1:
            return y0 + (y1 - y0) * smooth((f - f0) / (f1 - f0))
    return YAW_KEYS[-1][1]


if MODE == 'sequence':
    first, last = (int(num[2]), int(num[3])) if len(num) > 3 else (0, SEQ_N - 1)
    r.resolution_x = r.resolution_y = 1200
    root.animation_data_clear(); softbox.animation_data_clear()
    softbox.location = ring(SOFT_AZ)
    # Fixed camera: hero direction, pulled back so the exploded state fits with margin.
    d2 = 10.0
    cam.location = (d2 * math.sin(yaw) * math.cos(pitch), -d2 * math.cos(yaw) * math.cos(pitch), d2 * math.sin(pitch))
    cd.dof.aperture_fstop = 11.0
    scn.frame_start, scn.frame_end = 0, SEQ_N - 1
    dim_lights = [(bpy.data.objects[n], bpy.data.objects[n].data.energy) for n in ('fill',)]
    for fn in range(SEQ_N):
        f = fn * (SEQ_BASE - 1) / (SEQ_N - 1)          # resample the 160-frame timeline
        root.rotation_euler = (math.radians(90), 0, math.radians(seq_yaw(f)))
        root.keyframe_insert('rotation_euler', frame=fn)
        for lo, e0 in dim_lights:
            lo.data.energy = e0 * (1 - SOFT_DIM * seq_amount('r', f))
            lo.data.keyframe_insert('energy', frame=fn)
        for pid, (off, rot) in EXPLODE.items():
            a, o = seq_amount(pid, f), plates[pid]
            o.delta_location = tuple(a * v for v in off)
            o.delta_rotation_euler = tuple(a * math.radians(v) for v in rot)
            o.keyframe_insert('delta_location', frame=fn); o.keyframe_insert('delta_rotation_euler', frame=fn)
    os.makedirs(SEQ_TMP, exist_ok=True); os.makedirs(SEQ_DIR, exist_ok=True)
    scn.frame_start, scn.frame_end = first, last
    r.filepath = os.path.join(SEQ_TMP, 'f###')
    t0 = time.time()
    bpy.ops.render.render(animation=True)
    print(f'RENDER_SECONDS {time.time() - t0:.0f}')
    conv = (
        "from PIL import Image, ImageDraw;import sys,os\n"
        "src,dst,a,b=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])\n"
        "from concurrent.futures import ProcessPoolExecutor\n"
        "def w(f): Image.open(f'{src}/f{f:03d}.png').save(f'{dst}/f{f:03d}.webp','WEBP',quality=80,alpha_quality=60,method=6)\n"
        "if __name__=='__main__':\n"
        "    with ProcessPoolExecutor(mp_context=__import__('multiprocessing').get_context('fork')) as ex: list(ex.map(w, range(a,b+1)))\n"
        "fr=[f for f in range(0,int(sys.argv[5]),int(sys.argv[5])//20) if os.path.exists(f'{src}/f{f:03d}.png')]\n"
        "T=300;sheet=Image.new('RGB',(T*5,T*((len(fr)+4)//5)),(7,8,11));d=ImageDraw.Draw(sheet)\n"
        "for i,f in enumerate(fr):\n"
        "    im=Image.open(f'{src}/f{f:03d}.png').convert('RGBA').resize((T,T),Image.LANCZOS)\n"
        "    x,y=(i%5)*T,(i//5)*T;sheet.paste(im,(x,y),im);d.text((x+8,y+6),f'f{f:03d}',fill=(150,155,170))\n"
        "sheet.save(f'{dst}/contact.jpg',quality=88)\n"
    )
    subprocess.run(['python3', '-c', conv, SEQ_TMP, SEQ_DIR, str(first), str(last), str(SEQ_N)], check=True)
    tot = sum(os.path.getsize(os.path.join(SEQ_DIR, n)) for n in os.listdir(SEQ_DIR) if n.endswith('.webp'))
    print(f'SEQ_TOTAL_KB {tot // 1024}')
elif MODE == 'parts':
    r.resolution_x = r.resolution_y = 1200
    root.animation_data_clear(); softbox.animation_data_clear()
    root.rotation_euler = (math.radians(90), 0, 0)
    for name, (aim, yw, pt, dist, lens, fstop, ev) in SHOTS.items():
        if ONLY and name not in ONLY:
            continue
        target.location = aim
        softbox.location = ring(yw + 22, z=10.0 * math.tan(math.radians(5 - pt)))
        kicker.location = ring(yw - 24, z=10.0 * math.tan(math.radians(5 - pt)))
        scn.view_settings.exposure = ev
        yw, pt = math.radians(yw), math.radians(pt)
        cam.location = (aim[0] + dist * math.sin(yw) * math.cos(pt),
                        aim[1] - dist * math.cos(yw) * math.cos(pt),
                        aim[2] + dist * math.sin(pt))
        cd.lens = lens; cd.dof.aperture_fstop = fstop
        png = os.path.join(TEAM, f'part-{name}.png')
        r.filepath = png
        bpy.ops.render.render(write_still=True)
        subprocess.run(['python3', '-c', "from PIL import Image;import sys;"
                        "Image.open(sys.argv[1]).save(sys.argv[2],'WEBP',quality=82,method=6)",
                        png, png[:-4] + '.webp'], check=True)
        print('wrote', png, os.path.getsize(png[:-4] + '.webp') // 1024, 'KB webp')
elif MODE == 'still':
    alpha = os.path.join(TEAM, 'hero-still-alpha.png')
    r.filepath = alpha
    bpy.ops.render.render(write_still=True)
    subprocess.run(['python3', '-c', FLAT, alpha, os.path.join(TEAM, 'hero-still.png')], check=True)
    print('wrote', os.path.join(TEAM, 'hero-still.png'))
else:
    shutil.rmtree(FRAMES, ignore_errors=True); os.makedirs(FRAMES)
    r.filepath = os.path.join(FRAMES, 'f')       # f0001.png ...
    t0 = time.time()
    bpy.ops.render.render(animation=True)
    print(f'RENDER_SECONDS {time.time() - t0:.0f}')
    src = ['-f', 'lavfi', '-i', f'color=c={BG}:s=1600x1000:r={FPS}',
           '-framerate', str(FPS), '-i', os.path.join(FRAMES, 'f%04d.png'),
           '-filter_complex', '[0][1]overlay=shortest=1,format=yuv420p']
    ff = ['ffmpeg', '-y', '-loglevel', 'error']
    webm, mp4 = os.path.join(TEAM, 'hero-loop.webm'), os.path.join(TEAM, 'hero-loop.mp4')
    subprocess.run(ff + src + ['-c:v', 'libvpx-vp9', '-b:v', '1700k', '-pass', '1', '-an', '-f', 'null',
                               '-passlogfile', '/tmp/harnas-vp9', '/dev/null'], check=True)
    subprocess.run(ff + src + ['-c:v', 'libvpx-vp9', '-b:v', '1700k', '-pass', '2', '-an',
                               '-passlogfile', '/tmp/harnas-vp9', '-row-mt', '1', webm], check=True)
    subprocess.run(ff + src + ['-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-profile:v', 'high',
                               '-movflags', '+faststart', '-an', mp4], check=True)
    subprocess.run(['python3', '-c', FLAT, os.path.join(FRAMES, 'f0001.png'),
                    os.path.join(TEAM, 'hero-poster.png')], check=True)
    for p in (webm, mp4):
        print('wrote', p, os.path.getsize(p) // 1024, 'KB')
