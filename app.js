import { Engine } from './engine.js';
import { createScene } from './js/scene.js';
import { createUi } from './js/ui.js';
import { createNavigation } from './js/navigation.js';
import { bindControls } from './js/controls.js';
import { local } from './js/spatial.js';

const canvas = document.querySelector('#world');
let engine;
try {
  engine = new Engine(canvas);
} catch (error) {
  document.querySelector('#error').hidden = false;
  document.querySelector('#error-message').textContent = error.message;
  throw error;
}

const { rooms, art } = createScene(engine);
const ui = createUi({ rooms, art, engine });
const navigation = createNavigation({ rooms, ui });
ui.bindActions(navigation);
bindControls({ canvas, engine, navigation, ui });

const returnRoom = new URLSearchParams(location.search).get('door');
const returnIndex = rooms.findIndex((room) => room.theme === returnRoom);
if (returnIndex !== -1) navigation.resumeAtDoor(returnIndex);

window.addEventListener('pageshow', (event) => {
  const index = navigation.state.room;
  if (event.persisted && rooms[index]?.page) navigation.resumeAtDoor(index);
});

let previousFrame = 0;
let lastPinUpdate = 0;
function tick(now) {
  const deltaSeconds = Math.min(0.05, (now - previousFrame) / 1000 || 0.016);
  previousFrame = now;
  navigation.update(now, deltaSeconds);
  engine.draw(navigation.camera);
  if (now - lastPinUpdate > 100) {
    lastPinUpdate = now;
    ui.updatePins(navigation.state);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// 保留原有检查入口，方便本地检查场景和交互。
window.__house = {
  state: navigation.state,
  rooms,
  camera: navigation.camera,
  engine,
  enter: navigation.approachRoom,
  openDoor: navigation.openDoor,
  leave: navigation.leave,
  projectDoor: (index) => engine.project(local(rooms[index], 0, 1.4, -0.15)),
};
