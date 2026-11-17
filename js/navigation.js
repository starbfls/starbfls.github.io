import { V, M } from './engine/math.js';
import { TAU, STAIR_START_ANGLE } from './config.js';
import { world, local } from './spatial.js';

/** 管理镜头状态、连续行进路径及开关门动画。 */
export function createNavigation({ rooms, ui }) {
  // Camera journeys are continuous paths. The doorway is crossed only after opening.
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const camera = { eye: [23, 16, 28], target: [0, 5.1, 0], fov: 0.72 };
  const state = {
    mode: 'atrium',
    room: null,
    busy: false,
    angle: 0.72,
    height: 6,
    radius: 35,
    yaw: 0,
    pitch: 0,
    depth: 2.3,
    drag: null,
    pointers: new Map(),
    token: 0,
  };

  const overview = () => ({
    eye: world(state.radius, state.angle, state.height + 10),
    target: [0, state.height - 0.9, 0],
  });

  function setCamera(c) {
    camera.eye = [...c.eye];
    camera.target = [...c.target];
    camera.fov = c.fov ?? camera.fov;
  }

  const setStatus = ui.setStatus;

  const updateHud = () => ui.updateHud(state);

  const smoothStep = (t) => t * t * (3 - 2 * t);

  let activeTween = null;

  function animate(duration, update, token) {
    return new Promise((resolve) => {
      activeTween = {
        start: performance.now(),
        duration: duration * (prefersReducedMotion ? 0.5 : 1),
        update,
        resolve,
        token,
      };
    });
  }

  async function moveTo(next, ms, token) {
    const from = { eye: [...camera.eye], target: [...camera.target], fov: camera.fov };
    return animate(
      ms,
      (t) => {
        camera.eye = from.eye.map((v, i) => v + (next.eye[i] - v) * t);
        camera.target = from.target.map((v, i) => v + (next.target[i] - v) * t);
        camera.fov = from.fov + ((next.fov ?? 0.72) - from.fov) * t;
      },
      token,
    );
  }

  async function moveAlongArc(radius, from, to, y0, y1, ms, token) {
    return animate(
      ms,
      (t) => {
        const a = from + (to - from) * t,
          y = y0 + (y1 - y0) * t;
        camera.eye = world(radius, a, y);
        camera.target = world(radius + 1.8, a + 0.13, y - 0.18);
      },
      token,
    );
  }

  const isCancelled = (token) => token !== state.token;

  async function enter(index) {
    if (state.busy || state.mode === 'room') return;
    const room = rooms[index],
      token = ++state.token;
    state.busy = true;
    state.room = index;
    updateHud();
    setStatus(`沿旋转楼梯前往 ${room.name}`);
    // Approach the open front of the ground floor, then step onto the spiral.
    await moveTo(
      { eye: world(10.3, STAIR_START_ANGLE, 1.68), target: world(1.8, STAIR_START_ANGLE, 1.55) },
      1300,
      token,
    );
    if (isCancelled(token)) return;
    await moveTo(
      {
        eye: world(2.25, STAIR_START_ANGLE, 1.68),
        target: world(3.2, STAIR_START_ANGLE + 0.14, 1.55),
      },
      1250,
      token,
    );
    if (isCancelled(token)) return;
    if (index > 0) {
      await moveAlongArc(
        2.25,
        STAIR_START_ANGLE,
        STAIR_START_ANGLE + index * TAU,
        1.68,
        room.y + 1.68,
        1600 + index * 700,
        token,
      );
      if (isCancelled(token)) return;
    }
    await moveTo(
      {
        eye: world(5.5, STAIR_START_ANGLE, room.y + 1.68),
        target: world(6.8, STAIR_START_ANGLE + 0.12, room.y + 1.6),
      },
      700,
      token,
    );
    if (isCancelled(token)) return;
    const doorAngle =
      STAIR_START_ANGLE +
      Math.atan2(
        Math.sin(room.angle - STAIR_START_ANGLE),
        Math.cos(room.angle - STAIR_START_ANGLE),
      );
    await moveAlongArc(
      5.5,
      STAIR_START_ANGLE,
      doorAngle,
      room.y + 1.68,
      room.y + 1.68,
      1100,
      token,
    );
    if (isCancelled(token)) return;
    await moveTo(
      { eye: local(room, 0, 1.65, -1.4), target: local(room, 0, 1.5, 3.8), fov: 0.85 },
      650,
      token,
    );
    if (isCancelled(token)) return;
    setStatus('门正在打开…');
    await animate(
      1000,
      (t) => {
        room.door = t * Math.PI * 0.53;
      },
      token,
    );
    if (isCancelled(token)) return;
    setStatus('走进房间…');
    await moveTo(
      { eye: local(room, 0, 1.65, 2.3), target: local(room, 0, 1.5, 5.5), fov: 1.04 },
      1400,
      token,
    );
    if (isCancelled(token)) return;
    state.mode = 'room';
    state.busy = false;
    state.yaw = 0;
    state.pitch = -0.04;
    state.depth = 2.3;
    ui.showRoom(index);
    setStatus('拖动环顾 · 点击画作查看 · ESC 返回');
    updateHud();
  }

  async function leave() {
    if (state.busy) {
      state.token++;
      if (activeTween) {
        activeTween.resolve();
        activeTween = null;
      }
      state.busy = false;
      for (const r of rooms) r.door = 0;
      state.mode = 'atrium';
      state.room = null;
      const token = ++state.token;
      state.busy = true;
      updateHud();
      setStatus('正在返回中庭…');
      await moveTo(overview(), 1200, token);
      state.busy = false;
      updateHud();
      setStatus('选一扇门，开始探索');
      return;
    }
    if (state.mode !== 'room') return;
    const room = rooms[state.room],
      token = ++state.token;
    state.busy = true;
    updateHud();
    setStatus('沿原路返回回廊…');
    await moveTo(
      { eye: local(room, 0, 1.65, 0.9), target: local(room, 0, 1.5, 4.8), fov: 0.85 },
      700,
      token,
    );
    if (isCancelled(token)) return;
    await moveTo(
      { eye: local(room, 0, 1.65, -1.4), target: local(room, 0, 1.5, 3.8), fov: 0.85 },
      1100,
      token,
    );
    if (isCancelled(token)) return;
    const d = room.door;
    await animate(
      950,
      (t) => {
        room.door = d * (1 - t);
      },
      token,
    );
    if (isCancelled(token)) return;
    // Remain on the landing, then fly out above its handrail into the overview.
    await moveTo(
      { eye: world(5.4, room.angle, room.y + 2.4), target: [0, room.y + 1, 0], fov: 0.72 },
      1000,
      token,
    );
    if (isCancelled(token)) return;
    await moveTo({ eye: world(5.4, STAIR_START_ANGLE, 14.8), target: [0, 7, 0] }, 1000, token);
    if (isCancelled(token)) return;
    state.mode = 'atrium';
    state.room = null;
    await moveTo(overview(), 1300, token);
    if (isCancelled(token)) return;
    state.busy = false;
    updateHud();
    setStatus('选一扇门，开始探索');
  }

  async function home() {
    if (state.busy || state.mode === 'room') {
      await leave();
      return;
    }
    state.angle = 0.72;
    state.height = 6;
    state.radius = innerWidth < 650 ? 44 : 35;
    state.busy = true;
    updateHud();
    await moveTo(overview(), 1100, state.token);
    state.busy = false;
    updateHud();
  }

  function update(now, deltaSeconds) {
    const dt = deltaSeconds;
    if (activeTween) {
      const a = activeTween,
        t = Math.min(1, (now - a.start) / a.duration);
      if (a.token !== state.token) {
        activeTween = null;
        a.resolve();
      } else {
        a.update(smoothStep(t));
        if (t >= 1) {
          activeTween = null;
          a.resolve();
        }
      }
    } else if (!state.busy) {
      if (state.mode === 'atrium') {
        const goal = overview(),
          s = 1 - Math.exp(-dt * 9);
        camera.eye = camera.eye.map((v, i) => v + (goal.eye[i] - v) * s);
        camera.target = camera.target.map((v, i) => v + (goal.target[i] - v) * s);
        camera.fov += (0.72 - camera.fov) * s;
      } else {
        const r = rooms[state.room],
          eye = local(r, 0, 1.65, state.depth),
          direction = [
            Math.sin(state.yaw) * Math.cos(state.pitch),
            Math.sin(state.pitch),
            Math.cos(state.yaw) * Math.cos(state.pitch),
          ];
        camera.eye = eye;
        camera.target = V.add(eye, M.transform(M.pose(0, 0, 0, r.angle), V.scale(direction, 4), 0));
      }
    }
  }
  if (innerWidth < 650) {
    state.radius = 44;
    state.height = 5;
  }
  setCamera(overview());
  updateHud();
  return { state, camera, enter, leave, home, update };
}
