import { V, M } from './engine/math.js';
import { world, local } from './spatial.js';

const DOOR_OPEN_ANGLE = Math.PI * 0.53;
const DOOR_OPEN_DURATION = 2800;
const APPROACH_DURATION = 950;

/** 总览 → 门前停留 → 点击开门 → 连续进入；不再沿楼梯绕行。 */
export function createNavigation({ rooms, ui }) {
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const camera = { eye: [23, 16, 28], target: [0, 5.1, 0], fov: 0.72 };
  const state = {
    mode: 'atrium',
    phase: null,
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
  let activeTween = null;

  const smoothStep = (t) => t * t * (3 - 2 * t);
  const isCancelled = (token) => token !== state.token;
  const updateHud = () => ui.updateHud(state);
  const setStatus = ui.setStatus;

  function overview() {
    return {
      eye: world(state.radius, state.angle, state.height + 10),
      target: [0, state.height - 0.9, 0],
      fov: 0.72,
    };
  }

  // 镜头位于回廊内缘外侧；竖屏也至少露出门框两侧的墙面。
  function doorway(room) {
    const aspect = innerWidth / innerHeight;
    const fov = Math.max(1.4, 2 * Math.atan(3.8 / (6 * aspect)));
    return {
      eye: local(room, 0, 1.85, -3),
      target: local(room, 0, 1.85, 0),
      fov,
    };
  }

  function setCamera(next) {
    camera.eye = [...next.eye];
    camera.target = [...next.target];
    camera.fov = next.fov ?? camera.fov;
  }

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

  function moveTo(next, duration, token) {
    const from = { eye: [...camera.eye], target: [...camera.target], fov: camera.fov };
    return animate(
      duration,
      (progress) => {
        camera.eye = V.lerp(from.eye, next.eye, progress);
        camera.target = V.lerp(from.target, next.target, progress);
        camera.fov = from.fov + ((next.fov ?? 0.72) - from.fov) * progress;
      },
      token,
    );
  }

  function stopAnimation() {
    state.token++;
    if (activeTween) {
      const interrupted = activeTween;
      activeTween = null;
      interrupted.resolve();
    }
    state.drag = null;
    state.pointers.clear();
    return state.token;
  }

  async function approachRoom(index) {
    if (state.busy || state.mode === 'room' || !rooms[index]) return;
    if (state.mode === 'doorway' && state.room === index) return;
    const token = stopAnimation();
    state.busy = true;
    state.phase = 'approaching';
    state.room = index;
    updateHud();
    setStatus(`前往 ${rooms[index].name} 门前…`);

    await moveTo(doorway(rooms[index]), APPROACH_DURATION, token);
    if (isCancelled(token)) return;
    state.mode = 'doorway';
    state.phase = null;
    state.busy = false;
    updateHud();
    setStatus('点击房门或「开门」，慢慢走进去');
  }

  async function openDoor() {
    if (state.busy || state.mode !== 'doorway') return;
    const room = rooms[state.room];
    const token = stopAnimation();
    state.busy = true;
    state.phase = 'opening';
    updateHud();
    setStatus('门正在缓缓打开…');

    const initialAngle = room.door;
    await animate(
      DOOR_OPEN_DURATION,
      (progress) => {
        room.door = initialAngle + (DOOR_OPEN_ANGLE - initialAngle) * progress;
      },
      token,
    );
    if (isCancelled(token)) return;

    state.phase = 'entering';
    updateHud();
    setStatus(`走进${room.name}…`);
    await moveTo(
      {
        eye: local(room, 0, 1.65, 2.3),
        target: local(room, 0, 1.5, 5.5),
        fov: 1.04,
      },
      1500,
      token,
    );
    if (isCancelled(token)) return;

    state.mode = 'room';
    state.phase = null;
    state.busy = false;
    state.yaw = 0;
    state.pitch = -0.04;
    state.depth = 2.3;
    if (room.page) {
      setStatus(`欢迎来到${room.name}`);
      window.location.assign(room.page);
      return;
    }
    ui.showRoom(state.room);
    updateHud();
    setStatus('拖动环顾 · 点击画作查看 · ESC 返回');
  }

  function interactWithDoor(index) {
    if (state.mode === 'doorway' && state.room === index) return openDoor();
    if (state.mode === 'atrium') return approachRoom(index);
  }

  function resumeAtDoor(index) {
    if (!rooms[index]) return;
    stopAnimation();
    for (const room of rooms) room.door = 0;
    state.mode = 'doorway';
    state.phase = null;
    state.room = index;
    state.busy = false;
    setCamera(doorway(rooms[index]));
    updateHud();
    setStatus('点击房门或「开门」，慢慢走进去');
  }

  async function returnToOverview() {
    const token = stopAnimation();
    state.busy = true;
    state.phase = 'returning';
    updateHud();
    setStatus('返回建筑总览…');
    await moveTo(overview(), 850, token);
    if (isCancelled(token)) return;

    for (const room of rooms) room.door = 0;
    state.mode = 'atrium';
    state.phase = null;
    state.room = null;
    state.busy = false;
    updateHud();
    setStatus('选一扇门，开始探索');
  }

  async function leave() {
    if (state.busy || state.mode === 'doorway') return returnToOverview();
    if (state.mode !== 'room') return;
    const room = rooms[state.room];
    const token = stopAnimation();
    state.busy = true;
    state.phase = 'leaving';
    updateHud();
    setStatus('走出房间…');
    await moveTo(doorway(room), 1150, token);
    if (isCancelled(token)) return;

    state.phase = 'closing';
    setStatus('轻轻关上门…');
    const initialAngle = room.door;
    await animate(
      1700,
      (progress) => {
        room.door = initialAngle * (1 - progress);
      },
      token,
    );
    if (isCancelled(token)) return;
    return returnToOverview();
  }

  async function home() {
    if (state.mode !== 'atrium' || state.busy) return leave();
    state.angle = 0.72;
    state.height = innerWidth < 650 ? 5 : 6;
    state.radius = innerWidth < 650 ? 44 : 35;
    return returnToOverview();
  }

  function updateRoomCamera() {
    const room = rooms[state.room];
    const eye = local(room, 0, 1.65, state.depth);
    const direction = [
      Math.sin(state.yaw) * Math.cos(state.pitch),
      Math.sin(state.pitch),
      Math.cos(state.yaw) * Math.cos(state.pitch),
    ];
    camera.eye = eye;
    camera.target = V.add(eye, M.transform(M.pose(0, 0, 0, room.angle), V.scale(direction, 4), 0));
  }

  function update(now, deltaSeconds) {
    if (activeTween) {
      const tween = activeTween;
      const progress = Math.min(1, (now - tween.start) / tween.duration);
      if (isCancelled(tween.token)) {
        activeTween = null;
        tween.resolve();
      } else {
        tween.update(smoothStep(progress));
        if (progress >= 1) {
          activeTween = null;
          tween.resolve();
        }
      }
      return;
    }
    if (state.busy) return;
    if (state.mode === 'doorway') {
      setCamera(doorway(rooms[state.room]));
    } else if (state.mode === 'room') {
      updateRoomCamera();
    } else {
      const target = overview();
      const smoothing = 1 - Math.exp(-deltaSeconds * 9);
      camera.eye = V.lerp(camera.eye, target.eye, smoothing);
      camera.target = V.lerp(camera.target, target.target, smoothing);
      camera.fov += (target.fov - camera.fov) * smoothing;
    }
  }

  if (innerWidth < 650) {
    state.radius = 44;
    state.height = 5;
  }
  setCamera(overview());
  updateHud();
  return {
    state,
    camera,
    approachRoom,
    openDoor,
    interactWithDoor,
    resumeAtDoor,
    leave,
    home,
    update,
  };
}
