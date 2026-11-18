import { M, material, box, ring, tube } from '../engine.js';
import { TAU, FLOOR_HEIGHT, STAIR_START_ANGLE, ROOM_DEFINITIONS } from './config.js';
import { world } from './spatial.js';

/** 所有房间在初始化时建好；进出房间只移动镜头和门扇。 */
export function createScene(engine) {
  const rooms = ROOM_DEFINITIONS.map((definition) => ({ ...definition }));
  const art = [];
  const mat = {
    stone: material('#c8c5b5'),
    edge: material('#e5dfca'),
    rail: material('#807b65'),
    metal: material('#5b6255'),
    brass: material('#b39458'),
    wood: material('#99714d'),
    darkwood: material('#604c39'),
    white: material('#eae8df'),
    black: material('#263432'),
    leaf: material('#536d4b'),
    leaf2: material('#748460'),
    pot: material('#b38868'),
    soil: material('#443d31'),
    glow: material('#f6d58d', { emissive: 1 }),
    blue: material('#63bfcd', { emissive: 1 }),
    pink: material('#ce7fb4', { emissive: 1 }),
    ground: material('#d8d7c9'),
  };
  const identity = M.identity(),
    pose = M.pose,
    mul = M.multiply;

  function addMesh(g, m, x = 0, y = 0, z = 0, a = 0, parent = identity, action = null) {
    return engine.add(g, m, mul(parent, pose(x, y, z, a)), action);
  }

  function addBlock(w, h, d, m, x, y, z, a = 0, parent = identity, action = null) {
    return addMesh(box(w, h, d), m, x, y, z, a, parent, action);
  }

  function addCylinder(r, h, m, x, y, z, parent = identity) {
    return addMesh(ring(0, r, h, 0, TAU, 20), m, x, y, z, 0, parent);
  }

  function addTube(points, r, m, parent = identity) {
    return engine.add(tube(points, r), m, parent);
  }

  function createTexture(draw, w = 512, h = 512) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    return { texture: engine.texture(c), canvas: c };
  }

  function createTextMaterial(text, bg = '#e9e2cd', fg = '#4b5144', size = 40) {
    const { texture: t } = createTexture(
      (c, w, h) => {
        c.fillStyle = bg;
        c.fillRect(0, 0, w, h);
        c.fillStyle = fg;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = `${size}px "Microsoft YaHei",sans-serif`;
        c.fillText(text, w / 2, h / 2);
      },
      512,
      128,
    );
    return material('#ffffff', { texture: t, emissive: 0.7 });
  }

  function addPlant(x, y, z, parent = identity, scale = 1) {
    addCylinder(0.25 * scale, 0.42 * scale, mat.pot, x, y + 0.21 * scale, z, parent);
    addCylinder(0.22 * scale, 0.025, mat.soil, x, y + 0.43 * scale, z, parent);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4,
        r = (0.18 + (i % 3) * 0.09) * scale,
        h = (0.55 + (i % 4) * 0.18) * scale,
        p = [x + Math.sin(a) * r, y + h, z + Math.cos(a) * r];
      addTube([[x, y + 0.4 * scale, z], p], 0.018 * scale, mat.leaf, parent);
      const leaf = box(0.17 * scale, 0.38 * scale, 0.05 * scale);
      addMesh(leaf, i % 2 ? mat.leaf : mat.leaf2, ...p, a, parent);
    }
  }

  function createArtwork(seed, theme) {
    return createTexture(
      (c, w, h) => {
        const grad = c.createLinearGradient(0, 0, 0, h);
        const colors =
          theme === 'lab'
            ? ['#172c48', '#43516b', '#b86693']
            : theme === 'study'
              ? ['#e8d9bd', '#9fa587', '#5f7566']
              : ['#b4c7ce', '#f0d4b5', '#747f76'];
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.6, colors[1]);
        grad.addColorStop(1, colors[2]);
        c.fillStyle = grad;
        c.fillRect(0, 0, w, h);
        c.fillStyle = theme === 'lab' ? '#f1a9b9' : '#f2e6c8';
        c.beginPath();
        c.arc(w * (0.28 + seed * 0.09), h * 0.28, w * 0.095, 0, TAU);
        c.fill();
        for (let j = 0; j < 4; j++) {
          c.beginPath();
          c.moveTo(0, h);
          for (let i = 0; i <= 12; i++) {
            const x = (i * w) / 12,
              y =
                h * (0.42 + j * 0.11) +
                Math.sin(i * 0.8 + j * 1.2 + seed) * h * 0.07 +
                Math.cos(i * 1.6 + seed) * h * 0.025;
            c.lineTo(x, y);
          }
          c.lineTo(w, h);
          c.closePath();
          c.fillStyle = (
            theme === 'lab'
              ? ['#566181', '#3a4668', '#233850', '#182b40']
              : ['#b6b79c', '#8d9f91', '#6d887c', '#45675e']
          )[j];
          c.fill();
        }
        c.fillStyle = '#fff9';
        c.font = '12px sans-serif';
        c.fillText(`STUDY ${String(seed + 1).padStart(2, '0')} · PLACEHOLDER`, 28, h - 24);
      },
      512,
      640,
    );
  }

  function addArtworkFrame(x, y, z, w, h, a, parent, theme, seed) {
    const item = createArtwork(seed, theme),
      id = art.length;
    art.push({
      canvas: item.canvas,
      title: ['窗边的山', '落日以后', '沿途的风', '远山来信', '海边停留', '夜航'][seed] || '风景',
    });
    const backing = mul(parent, pose(x, y, z, a));
    engine.add(
      box(w + 0.14, h + 0.14, 0.12),
      theme === 'gallery' ? mat.white : mat.darkwood,
      backing,
    );
    engine.add(
      box(w, h, 0.025),
      material('#ffffff', { texture: item.texture, emissive: 0.65 }),
      mul(backing, pose(0, 0, 0.08)),
      { type: 'art', id },
    );
  }

  function buildAtrium() {
    // A shared atrium: every room exists here before its door opens.
    addMesh(ring(0, 10.6, 0.32, 0, TAU, 120), mat.ground, 0, -0.3, 0);
    addMesh(ring(9.9, 10.3, 0.04, 0, TAU, 120), mat.edge, 0, -0.115, 0);
    addCylinder(0.31, 10.65, mat.stone, 0, 5.25, 0);
    addCylinder(0.39, 0.16, mat.brass, 0, 10.62, 0);
    for (let i = 0; i < 3; i++) {
      const y = i * FLOOR_HEIGHT;
      addMesh(ring(4.05, 7.45, 0.26), mat.stone, 0, y - 0.13, 0);
      addMesh(ring(7.4, 7.5, 0.1), mat.edge, 0, y - 0.06, 0);
      // Four slender structural posts instead of an opaque exterior wall.
      for (const a of [-1.2, -0.1, 1.5, 4.9]) {
        const p = world(7.1, a, y + 2.2);
        addCylinder(0.105, 4.4, mat.stone, ...p);
        addCylinder(0.17, 0.12, mat.brass, p[0], y + 0.08, p[2]);
      }
      // The landing bridge is left open at the staircase connection.
      addBlock(
        1.2,
        0.18,
        2.4,
        mat.stone,
        ...world(3.6, STAIR_START_ANGLE, y - 0.09),
        STAIR_START_ANGLE,
      );
      const hand = [];
      for (let j = 0; j <= 64; j++) {
        const a = STAIR_START_ANGLE + 0.24 + ((TAU - 0.48) * j) / 64;
        hand.push(world(4.06, a, y + 1.02));
        if (j % 2 === 0) {
          const p = world(4.06, a, y + 0.5);
          addCylinder(0.025, 1, mat.rail, ...p);
        }
      }
      addTube(hand, 0.045, mat.brass);
      for (let j = 0; j < 84; j++) {
        const a = (j * TAU) / 84,
          doorAngle = rooms[i].angle,
          diff = Math.atan2(Math.sin(a - doorAngle), Math.cos(a - doorAngle));
        if (Math.abs(diff) < 0.43) continue;
        const p = world(7.4, a, y + 0.5);
        if (j % 2 === 0) addCylinder(0.028, 1, mat.rail, ...p);
        if (j < 83) {
          const b = ((j + 1) * TAU) / 84;
          addTube([world(7.4, a, y + 1.02), world(7.4, b, y + 1.02)], 0.037, mat.rail);
        }
      }
      addPlant(...world(6.5, rooms[i].angle + 0.58, y), identity, 0.9);
    }
  }

  function buildStaircase() {
    // 64 individual radial treads, two complete turns, one landing per revolution.
    const steps = 64;
    for (let i = 0; i < steps; i++) {
      const a = STAIR_START_ANGLE + (i * TAU) / 32,
        y = ((i + 1) * FLOOR_HEIGHT) / 32;
      addMesh(
        ring(0.4, 3.1, 0.13, a, TAU / 32 + 0.008, 3),
        i % 2 ? mat.wood : mat.darkwood,
        0,
        y - 0.065,
        0,
      );
      const p = world(3.02, a + 0.06, y + 0.53);
      addCylinder(0.022, 1.02, mat.rail, ...p);
    }
    const helix = [];
    for (let i = 0; i <= 256; i++)
      helix.push(world(3.04, STAIR_START_ANGLE + (i * TAU) / 128, 1.04 + (i * FLOOR_HEIGHT) / 128));
    addTube(helix, 0.047, mat.brass);
  }

  function buildSkylight() {
    // An open skylight ring, suspended pendants and a small ground-floor garden.
    addMesh(ring(4.05, 7.5, 0.14), mat.edge, 0, 13.8, 0);
    for (const a of [-1.2, -0.1, 1.5, 4.9]) {
      const p = world(7.1, a, 11.7);
      addCylinder(0.105, 4.2, mat.stone, ...p);
    }
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4,
        p = world(0.9, a, 11.8 - i * 0.7);
      addTube([[p[0], 13.7, p[2]], p], 0.012, mat.brass);
      addCylinder(0.14, 0.2, mat.glow, ...p);
    }
    addPlant(-1, 0, 6.2, identity, 1.4);
    addPlant(-1.6, 0, 5.7, identity, 0.8);
  }

  function buildRoom(room, i) {
    room.y = i * FLOOR_HEIGHT;
    room.door = 0;
    room.parent = pose(...world(7.28, room.angle, room.y), room.angle);
    const p = room.parent,
      wall = material(
        room.theme === 'study' ? '#9da18b' : room.theme === 'gallery' ? '#e2e0d6' : '#303e50',
      ),
      floor = material(
        room.theme === 'study' ? '#887052' : room.theme === 'gallery' ? '#c9c7bd' : '#39414b',
      ),
      doorMat = material(room.color);
    addBlock(6, 0.2, 5.8, floor, 0, -0.1, 2.8, 0, p);
    addBlock(0.16, 3.65, 5.8, wall, -3, 1.825, 2.8, 0, p);
    addBlock(0.16, 3.65, 5.8, wall, 3, 1.825, 2.8, 0, p);
    addBlock(6, 3.65, 0.16, wall, 0, 1.825, 5.65, 0, p);
    // Real door opening: two jambs plus a lintel; no wall fills the aperture.
    addBlock(2.12, 3.65, 0.2, wall, -1.94, 1.825, 0, 0, p);
    addBlock(2.12, 3.65, 0.2, wall, 1.94, 1.825, 0, 0, p);
    addBlock(1.76, 0.88, 0.2, wall, 0, 3.21, 0, 0, p);
    const frameMaterial =
      room.theme === 'gallery' ? mat.white : room.theme === 'lab' ? mat.metal : mat.brass;
    for (const x of [-0.93, 0.93]) addBlock(0.12, 2.9, 0.28, frameMaterial, x, 1.45, -0.02, 0, p);
    addBlock(1.98, 0.12, 0.28, frameMaterial, 0, 2.86, -0.02, 0, p);
    // Both a mesh and all of its fittings pivot around the left hinge.
    const doorTransform = (x, y, z) => () =>
      mul(p, mul(pose(-0.86, 0, 0, -room.door), pose(x, y, z)));
    engine.add(box(1.72, 2.76, 0.13), doorMat, doorTransform(0.86, 1.38, 0), {
      type: 'door',
      id: i,
    });
    for (const h of [0.8, 2.05])
      engine.add(
        box(1.35, 0.88, 0.045),
        material(
          room.theme === 'study' ? '#795539' : room.theme === 'gallery' ? '#bfb49b' : '#3a4657',
        ),
        doorTransform(0.86, h, -0.085),
        { type: 'door', id: i },
      );
    engine.add(box(0.055, 0.23, 0.09), mat.brass, doorTransform(1.51, 1.25, -0.13), {
      type: 'door',
      id: i,
    });
    addDoorPlaque(room, i, p);
    addBlock(1.7, 0.018, 0.025, room.theme === 'lab' ? mat.blue : mat.glow, 0, 0.02, -0.15, 0, p);
    // Interior edge details and a small uplight strip.
    for (const x of [-2.9, 2.9]) addBlock(0.06, 0.1, 5.55, mat.brass, x, 0.07, 2.8, 0, p);
    addBlock(5.6, 0.05, 0.06, room.theme === 'lab' ? mat.pink : mat.glow, 0, 3.4, 5.5, 0, p);

    const furnish = {
      study: furnishStudy,
      gallery: furnishGallery,
      lab: furnishLab,
    }[room.theme];
    furnish(room.parent);
    const decorateFacade = {
      study: decorateStudyFacade,
      gallery: decorateGalleryFacade,
      lab: decorateLabFacade,
    }[room.theme];
    decorateFacade(room.parent);
  }

  function addDoorPlaque(room, index, parent) {
    const width = 1.7;
    const height = 0.32;
    const geometry = box(width, height, 0.04);
    const face = [];
    // 仅正面使用文字纹理，其余侧面保持纯色，避免文字在薄边上重复。
    for (let offset = 0; offset < geometry.length; offset += 8) {
      if (geometry[offset + 5] > -0.5) continue;
      face.push(
        geometry[offset],
        geometry[offset + 1],
        -0.025,
        0,
        0,
        -1,
        0.5 - geometry[offset] / width,
        0.5 + geometry[offset + 1] / height,
      );
    }
    const dark = room.theme === 'lab';
    const background = dark ? '#273540' : '#e9e2cd';
    const label = createTextMaterial(
      `${String(index + 1).padStart(2, '0')}  ${room.name}`,
      background,
      dark ? '#a3d7d2' : '#4b5144',
    );
    const transform = mul(parent, pose(0, 3.3, -0.24));
    engine.add(geometry, material(background), transform);
    engine.add(face, label, transform);
  }

  function decorateStudyFacade(parent) {
    const timber = material('#795b40');
    const trim = material('#534a36');
    for (const side of [-1, 1]) {
      for (let index = 0; index < 9; index++) {
        addBlock(0.085, 3.35, 0.09, timber, side * (1.16 + index * 0.215), 1.85, -0.15, 0, parent);
      }
      addBlock(1.95, 0.24, 0.16, trim, side * 2.02, 0.13, -0.13, 0, parent);
      addBlock(0.2, 0.5, 0.2, trim, side * 1.35, 2.15, -0.28, 0, parent);
      addBlock(0.11, 0.32, 0.24, mat.glow, side * 1.35, 2.15, -0.31, 0, parent);
      for (let index = 0; index < 8; index++) {
        addBlock(0.075, 3.35, 0.085, timber, side * 3.1, 1.85, 0.5 + index * 0.65, 0, parent);
      }
    }
    addBlock(6.2, 0.17, 0.4, timber, 0, 3.62, -0.08, 0, parent);
    addPlant(2.35, 0, -0.55, parent, 0.85);
  }

  function decorateGalleryFacade(parent) {
    const stone = material('#efeee5');
    const joint = material('#bdc0b4');
    for (const side of [-1, 1]) {
      addBlock(1.94, 0.18, 0.17, stone, side * 2.02, 0.11, -0.15, 0, parent);
      for (const height of [0.68, 1.45, 2.22, 3.02]) {
        addBlock(1.94, 0.018, 0.025, joint, side * 2.02, height, -0.115, 0, parent);
      }
      addBlock(0.035, 3.55, 0.025, joint, side * 2.2, 1.82, -0.115, 0, parent);
      addBlock(0.14, 3.12, 0.38, stone, side * 1.08, 1.56, -0.15, 0, parent);
      addBlock(0.12, 0.2, 5.8, stone, side * 3.1, 0.11, 2.8, 0, parent);
    }
    addBlock(2.3, 0.16, 0.38, stone, 0, 3.04, -0.15, 0, parent);
    addBlock(6.15, 0.12, 0.28, stone, 0, 3.64, 0, 0, parent);
    // 一块小型几何浮雕，让展厅外墙与室内的作品展示相呼应。
    addBlock(0.52, 0.82, 0.08, material('#a9b9aa'), 2.18, 1.95, -0.17, 0, parent);
    addBlock(0.3, 0.3, 0.12, material('#d3b18c'), 2.03, 1.85, -0.25, 0.28, parent);
    addBlock(0.23, 0.45, 0.13, stone, 2.3, 2.03, -0.25, -0.2, parent);
  }

  function decorateLabFacade(parent) {
    const panel = material('#293540');
    const edge = material('#687a83');
    for (const side of [-1, 1]) {
      addBlock(1.72, 2.95, 0.09, panel, side * 2.03, 1.76, -0.16, 0, parent);
      for (const height of [0.36, 1.02, 2.48, 3.18]) {
        addBlock(1.74, 0.035, 0.04, edge, side * 2.03, height, -0.23, 0, parent);
      }
      addBlock(0.055, 3.12, 0.06, mat.blue, side * 1.12, 1.58, -0.22, 0, parent);
      addBlock(0.11, 3.3, 0.18, edge, side * 2.98, 1.7, -0.12, 0, parent);
      addBlock(0.08, 2.95, 5.4, panel, side * 3.11, 1.76, 2.8, 0, parent);
    }
    addBlock(5.7, 0.05, 0.065, mat.pink, 0, 3.48, -0.15, 0, parent);
    addBlock(2.25, 0.14, 0.3, panel, 0, 3, -0.16, 0, parent);
    addBlock(0.18, 0.045, 0.06, mat.blue, 0.75, 3.02, -0.35, 0, parent);
    addBlock(0.35, 0.48, 0.09, edge, 1.65, 1.35, -0.27, 0, parent);
    addBlock(0.25, 0.3, 0.04, mat.blue, 1.65, 1.41, -0.34, 0, parent);
  }

  function furnishStudy(parent) {
    // Plank floor, bookcase, desk, chair, rug, and a standing lamp.
    for (let j = 0; j < 17; j++)
      addBlock(0.015, 0.012, 5.6, mat.darkwood, -2.8 + j * 0.35, 0.008, 2.8, 0, parent);
    const rug = material('#b8aa89');
    addBlock(2.8, 0.022, 2.2, rug, 0.1, 0.024, 2.8, 0, parent);
    for (const x of [-2.65, -0.9]) addBlock(0.12, 2.6, 0.46, mat.darkwood, x, 1.3, 5.28, 0, parent);
    for (let j = 0; j < 5; j++) {
      addBlock(1.85, 0.09, 0.5, mat.wood, -1.77, 0.2 + j * 0.56, 5.28, 0, parent);
      for (let k = 0; k < 9; k++) {
        const cm = [mat.leaf, mat.brass, mat.white, mat.darkwood][(j + k) % 4];
        addBlock(
          0.11,
          0.3 + (k % 3) * 0.07,
          0.28,
          cm,
          -2.52 + k * 0.17,
          0.4 + j * 0.56,
          5.26,
          0,
          parent,
        );
      }
    }
    addBlock(2, 0.12, 0.85, mat.wood, 0.9, 0.82, 4, 0, parent);
    for (const x of [0.05, 1.75])
      for (const z of [3.7, 4.3]) addBlock(0.08, 0.76, 0.08, mat.darkwood, x, 0.38, z, 0, parent);
    addBlock(0.7, 0.09, 0.66, mat.leaf, 0.85, 0.47, 2.9, 0, parent);
    addBlock(0.7, 0.6, 0.09, mat.leaf, 0.85, 0.82, 2.6, 0, parent);
    for (const x of [0.56, 1.14])
      for (const z of [2.66, 3.14])
        addBlock(0.045, 0.42, 0.045, mat.darkwood, x, 0.21, z, 0, parent);
    addBlock(0.5, 0.045, 0.36, mat.white, 0.7, 0.91, 4, 0, parent);
    addCylinder(0.08, 0.17, mat.pot, 1.45, 0.98, 3.9, parent);
    addCylinder(0.22, 0.07, mat.darkwood, 2.4, 0.035, 4.9, parent);
    addCylinder(0.027, 1.9, mat.brass, 2.4, 0.95, 4.9, parent);
    addMesh(ring(0.12, 0.37, 0.3, 0, TAU, 24), mat.glow, 2.4, 1.98, 4.9, 0, parent);
    addArtworkFrame(-2.88, 1.9, 2.45, 1.25, 1.65, Math.PI / 2, parent, 'study', 0);
    addPlant(2.3, 0, 1, parent, 1.1);
  }

  function furnishGallery(parent) {
    for (let j = 0; j < 7; j++) addBlock(6, 0.008, 0.015, mat.white, 0, 0.008, j * 0.8, 0, parent);
    addArtworkFrame(-1.4, 1.95, 5.48, 1.45, 1.8, Math.PI, parent, 'gallery', 1);
    addArtworkFrame(1.35, 1.95, 5.48, 1.45, 1.8, Math.PI, parent, 'gallery', 2);
    addArtworkFrame(-2.88, 1.95, 2.5, 1.45, 1.8, Math.PI / 2, parent, 'gallery', 3);
    addArtworkFrame(2.88, 1.95, 2.5, 1.45, 1.8, -Math.PI / 2, parent, 'gallery', 4);
    addBlock(1.8, 0.12, 0.6, mat.wood, 0.1, 0.52, 3.2, 0, parent);
    for (const x of [-0.6, 0.8]) addBlock(0.1, 0.48, 0.4, mat.black, x, 0.24, 3.2, 0, parent);
    for (const x of [-1.5, 1.5]) {
      addBlock(0.05, 0.06, 4.9, mat.black, x, 3.4, 2.8, 0, parent);
      for (const z of [1.3, 3, 4.7]) addBlock(0.2, 0.12, 0.28, mat.white, x, 3.28, z, 0, parent);
    }
    addPlant(2.3, 0, 4.85, parent, 1.3);
  }

  function furnishLab(parent) {
    for (let j = 0; j < 11; j++) {
      addBlock(5.8, 0.012, 0.015, material('#50576a'), 0, 0.008, j * 0.55, 0, parent);
      addBlock(0.015, 0.012, 5.6, material('#50576a'), -2.75 + j * 0.55, 0.008, 2.8, 0, parent);
    }
    for (const x of [-2.88, 2.88]) addBlock(0.04, 2.7, 0.045, mat.blue, x, 1.7, 4.9, 0, parent);
    addBlock(3, 0.12, 1, mat.black, 0, 0.85, 4.7, 0, parent);
    for (const x of [-1.35, 1.35]) addBlock(0.1, 0.8, 0.65, mat.metal, x, 0.4, 4.7, 0, parent);
    for (const x of [-0.8, 0.8]) {
      addBlock(1.26, 0.85, 0.1, mat.black, x, 1.49, 5.05, 0, parent);
      addBlock(
        1.12,
        0.7,
        0.025,
        createTextMaterial(x < 0 ? '> hello, world' : '夜里也有光', '#142a3a', '#8bdac8', 36),
        x,
        1.49,
        4.98,
        0,
        parent,
      );
      addBlock(0.08, 0.28, 0.08, mat.metal, x, 1, 5.05, 0, parent);
    }
    addBlock(0.7, 0.04, 0.22, mat.metal, 0, 0.94, 4.45, 0, parent);
    addBlock(0.72, 0.1, 0.7, mat.black, 0.1, 0.5, 3.1, 0, parent);
    addBlock(0.72, 0.7, 0.15, mat.black, 0.1, 0.95, 2.8, 0, parent);
    addCylinder(0.05, 0.45, mat.metal, 0.1, 0.23, 3.1, parent);
    addArtworkFrame(-2.88, 1.95, 2.6, 1.6, 1.9, Math.PI / 2, parent, 'lab', 5);
    for (let j = 0; j < 3; j++) {
      addBlock(
        0.58,
        0.58,
        0.58,
        material(['#497a82', '#a47599', '#b8a274'][j]),
        2.3,
        0.32 + j * 0.58,
        4.8,
        j * 0.2,
        parent,
      );
    }
    addBlock(
      2.4,
      0.45,
      0.05,
      createTextMaterial('MAKE SOMETHING.', '#303e50', '#a3d7d2', 36),
      0,
      2.8,
      5.53,
      Math.PI,
      parent,
    );
  }
  buildAtrium();
  buildStaircase();
  buildSkylight();
  rooms.forEach(buildRoom);
  engine.compile();
  return { rooms, art };
}
