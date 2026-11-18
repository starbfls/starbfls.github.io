import { galleryFrames } from './collections.js';
import { createPhotoViewer } from './photo-viewer.js';

const wall = document.querySelector('#museum-wall');
const photos = galleryFrames.filter((frame) => frame.src);
const viewer = createPhotoViewer(photos);

for (const frame of galleryFrames) {
  const figure = document.createElement('figure');
  figure.className = `gallery-frame ${frame.position}`;
  figure.dataset.frame = frame.id;
  const surround = document.createElement(frame.src ? 'button' : 'div');
  surround.className = 'frame-object';
  const mat = document.createElement('div');
  mat.className = 'gallery-mat';
  const canvas = document.createElement('div');
  canvas.className = 'gallery-canvas';

  if (frame.src) {
    surround.type = 'button';
    surround.setAttribute('aria-label', `查看${frame.caption || frame.alt || '照片'}`);
    const image = document.createElement('img');
    image.src = frame.src;
    image.alt = frame.alt || frame.caption || '展厅照片';
    image.loading = 'lazy';
    canvas.append(image);
    surround.addEventListener('click', () => viewer.open(photos.indexOf(frame)));
  } else {
    figure.setAttribute('aria-label', '空白画框，等待照片入藏');
  }

  mat.append(canvas);
  surround.append(mat);
  const caption = document.createElement('figcaption');
  caption.textContent = frame.caption || (frame.src ? '' : '待入藏');
  figure.append(surround, caption);
  wall.append(figure);
}
