import { albums } from './collections.js';
import { createPhotoViewer } from './photo-viewer.js';

const requested = new URLSearchParams(location.search).get('album') || 'travel';
const album = albums.find((item) => item.id === requested);
const wall = document.querySelector('#photo-wall');

if (!album) {
  document.title = '相册未找到 · starbfls';
  document.querySelector('#album-title').textContent = '这本书不在书架上';
  document.querySelector('#album-description').textContent = '回到书房，重新选一本日记吧。';
  document.querySelector('#album-empty-note').hidden = true;
  document.querySelector('.album-motif').hidden = true;
} else {
  document.title = `${album.title} · starbfls`;
  document.querySelector('#album-title').textContent = album.title;
  document.querySelector('#album-english').textContent = album.english;
  document.querySelector('#album-description').textContent = album.subtitle;
  document
    .querySelector('#album-motif')
    .setAttribute('href', `./assets/book-motifs.svg#${album.motif}`);
  const photos = album.photos.filter((photo) => photo.src);
  document.querySelector('#album-empty-note').hidden = photos.length > 0;
  const viewer = createPhotoViewer(photos);

  for (let index = 0; index < Math.max(album.slots, photos.length); index++) {
    const photo = photos[index];
    const figure = document.createElement('figure');
    figure.className = 'album-photo';
    const surface = document.createElement(photo ? 'button' : 'div');
    surface.className = 'photo-surface';
    if (photo) {
      surface.type = 'button';
      surface.setAttribute('aria-label', `查看${photo.caption || photo.alt || '照片'}`);
      const image = document.createElement('img');
      image.src = photo.src;
      image.alt = photo.alt || photo.caption || '相册照片';
      image.loading = 'lazy';
      surface.append(image);
      surface.addEventListener('click', () => viewer.open(index));
    } else {
      const blank = document.createElement('div');
      blank.className = 'empty-photo';
      blank.textContent = '待收录';
      surface.append(blank);
    }
    const caption = document.createElement('figcaption');
    caption.textContent = photo ? photo.caption || '' : '留给下一张照片';
    figure.append(surface, caption);
    wall.append(figure);
  }
}
