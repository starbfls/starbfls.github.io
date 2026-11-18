const ARROW_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** 鼠标、触屏、滚轮和键盘输入；镜头行进由 navigation 负责。 */
export function bindControls({ canvas, engine, navigation, ui }) {
  const { state, interactWithDoor, leave } = navigation;

  function handlePointerDown(event) {
    if (state.busy) return;
    canvas.setPointerCapture(event.pointerId);
    state.pointers.set(event.pointerId, [event.clientX, event.clientY]);
    state.drag = {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      distance: 0,
      multi: state.pointers.size > 1,
    };
    canvas.classList.add('dragging');
  }

  function handlePointerMove(event) {
    if (!state.drag || state.busy) return;
    const drag = state.drag;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.distance += Math.hypot(dx, dy);
    drag.x = event.clientX;
    drag.y = event.clientY;
    state.pointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (state.mode === 'doorway') return;

    if (state.pointers.size > 1) {
      drag.multi = true;
      if (state.mode === 'atrium') state.height = clamp(state.height + dy * 0.022, 0.5, 10.5);
      else state.depth = clamp(state.depth + dy * 0.012, 1.1, 3.55);
      return;
    }
    if (state.mode === 'atrium') {
      state.angle -= dx * 0.006;
      state.height = clamp(state.height + dy * 0.018, 0.5, 10.5);
    } else {
      state.yaw = clamp(state.yaw - dx * 0.005, -1.5, 1.5);
      state.pitch = clamp(state.pitch + dy * 0.004, -0.65, 0.55);
    }
  }

  function handlePointerEnd(event) {
    state.pointers.delete(event.pointerId);
    if (!state.drag) return;
    const drag = state.drag;
    if (state.pointers.size > 0) {
      drag.multi = true;
      return;
    }
    state.drag = null;
    canvas.classList.remove('dragging');
    if (drag.distance < 7 && !drag.multi && !state.busy) {
      const hit = engine.pick(event.clientX, event.clientY);
      if (hit?.action?.type === 'door') interactWithDoor(hit.action.id);
      if (hit?.action?.type === 'art') ui.showArt(hit.action.id);
    }
  }

  function handlePointerCancel() {
    state.drag = null;
    state.pointers.clear();
    canvas.classList.remove('dragging');
  }

  function handleWheel(event) {
    event.preventDefault();
    if (state.busy || state.mode === 'doorway') return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const delta = event.deltaY * unit;
    if (state.mode === 'atrium') state.height = clamp(state.height + delta * 0.008, 0.5, 10.5);
    else state.depth = clamp(state.depth - delta * 0.0025, 1.1, 3.55);
  }

  function handleKeyDown(event) {
    if (ui.hasOpenDialog()) return;
    if (event.key === 'Escape') {
      leave();
      return;
    }
    if (state.busy || state.mode === 'doorway' || !ARROW_KEYS.includes(event.key)) return;
    event.preventDefault();
    if (state.mode === 'atrium') {
      state.angle += event.key === 'ArrowLeft' ? 0.12 : event.key === 'ArrowRight' ? -0.12 : 0;
      state.height = clamp(
        state.height + (event.key === 'ArrowUp' ? 0.4 : event.key === 'ArrowDown' ? -0.4 : 0),
        0.5,
        10.5,
      );
    } else {
      state.yaw = clamp(
        state.yaw + (event.key === 'ArrowLeft' ? 0.12 : event.key === 'ArrowRight' ? -0.12 : 0),
        -1.5,
        1.5,
      );
      state.depth = clamp(
        state.depth + (event.key === 'ArrowUp' ? 0.15 : event.key === 'ArrowDown' ? -0.15 : 0),
        1.1,
        3.55,
      );
    }
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerEnd);
  canvas.addEventListener('pointercancel', handlePointerCancel);
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('keydown', handleKeyDown);
}
