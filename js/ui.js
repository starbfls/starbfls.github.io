import { local } from './spatial.js';

const $ = (selector) => document.querySelector(selector);

/** 页面文案、弹窗和门口标签，独立于 WebGL 建模。 */
export function createUi({ rooms, art, engine }) {
  function setStatus(message) {
    $('#status').textContent = message;
  }

  function updateHud(state) {
    document.body.classList.toggle('inside', state.mode === 'room');
    document.body.classList.toggle('travelling', state.busy);
    if (state.busy) $('#world').classList.remove('dragging');
    document.body.classList.toggle('at-door', state.mode === 'doorway');
    $('#back').hidden = state.mode === 'atrium' && !state.busy;
    $('#open-door').hidden = state.mode !== 'doorway';
    $('#open-door').disabled = state.busy;
    if (state.room !== null) {
      $('#open-door').textContent =
        state.phase === 'opening'
          ? '正在开门…'
          : state.phase === 'entering'
            ? '正在进入…'
            : `开门 · ${rooms[state.room].name} →`;
    }
    $('#room-info').hidden = state.mode !== 'room' || state.busy;
    $('#movement-hint').innerHTML =
      state.mode === 'room'
        ? '<span class="drag-icon">↔</span><span>拖动环顾 / 滚轮前后</span>'
        : '<span class="drag-icon">↔</span><span>拖动旋转<span class="hint-divider">/</span>滚轮上下</span>';

    document.querySelectorAll('[data-room]').forEach((button) => {
      button.classList.toggle('active', Number(button.dataset.room) === state.room);
      button.disabled = state.busy || state.mode === 'room';
    });
    $('#location-number').textContent = state.room === null ? '00' : `0${state.room + 1}`;
    $('#location-label').textContent =
      state.room === null ? '中庭 / ATRIUM' : rooms[state.room].english;
  }

  function showRoom(index) {
    const room = rooms[index];
    $('#room-kicker').textContent = `0${index + 1} / ${room.english}`;
    $('#room-title').textContent = room.name;
    $('#room-description').textContent = room.description;
  }

  function showArt(id) {
    const item = art[id];
    $('#art-image').src = item.canvas.toDataURL('image/png');
    $('#art-image').alt = `${item.title}，程序绘制的示意画`;
    $('#art-title').textContent = item.title;
    $('#art-dialog').showModal();
  }

  function bindActions({ approachRoom, openDoor, leave, home }) {
    rooms.forEach((room, index) => {
      const pin = document.createElement('button');
      pin.className = 'door-pin';
      pin.innerHTML = `<span>0${index + 1}</span>${room.name} ↗`;
      pin.setAttribute('aria-label', `前往${room.name}门前`);
      pin.onclick = () => approachRoom(index);
      $('#pins').appendChild(pin);
      room.pin = pin;
    });

    document.querySelectorAll('[data-room]').forEach((button) => {
      button.onclick = () => approachRoom(Number(button.dataset.room));
    });
    $('#open-door').onclick = openDoor;
    $('#back').onclick = leave;
    $('#home').onclick = home;
    $('#help').onclick = () => $('#help-dialog').showModal();

    document.querySelectorAll('.dialog-close').forEach((button) => {
      button.onclick = () => button.closest('dialog').close();
    });
    document.querySelectorAll('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        const outside =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;
        if (outside) dialog.close();
      });
    });
  }

  function updatePins(state) {
    rooms.forEach((room, index) => {
      const position = engine.project(local(room, 0, 3.6, -0.35));
      const inViewport =
        position &&
        position.z < 1 &&
        position.x > 50 &&
        position.x < innerWidth - 45 &&
        position.y > 110 &&
        position.y < innerHeight - 130;
      let unobstructed = false;
      if (inViewport && !state.busy && state.mode === 'atrium') {
        const doorCenter = engine.project(local(room, 0, 1.6, -0.15));
        if (doorCenter) {
          const hit = engine.pick(doorCenter.x, doorCenter.y);
          unobstructed = hit?.action?.type === 'door' && hit.action.id === index;
        }
      }
      room.pin.hidden = !inViewport || !unobstructed || state.busy || state.mode !== 'atrium';
      if (position) {
        room.pin.style.left = `${position.x}px`;
        room.pin.style.top = `${position.y}px`;
      }
    });
  }

  function hasOpenDialog() {
    return Boolean(document.querySelector('dialog[open]'));
  }

  return { setStatus, updateHud, showRoom, showArt, bindActions, updatePins, hasOpenDialog };
}
