import { albums } from './collections.js';
import { setupRecordPlayer } from './record-player.js';

const shelf = document.querySelector('#bookshelf');
const dialog = document.querySelector('#book-preview');
const book = document.querySelector('#enlarged-book');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function previewBook(album, sourceButton) {
  const destination = `./photos.html?album=${encodeURIComponent(album.id)}`;
  document.querySelector('#book-preview-title').textContent = album.title;
  document.querySelector('#cover-title').textContent = album.title;
  document.querySelector('#preview-spine').textContent = album.title;
  document.querySelector('#cover-english').textContent = album.english;
  document
    .querySelector('#cover-motif')
    .setAttribute('href', `./assets/book-motifs.svg#${album.motif}`);
  document.querySelector('#preview-cover').href = destination;
  document
    .querySelector('#preview-cover')
    .setAttribute('aria-label', `翻开${album.title}，查看照片墙`);
  document.querySelector('#open-album').href = destination;
  book.style.setProperty('--book-color', album.color);
  for (const animation of book.getAnimations()) animation.cancel();

  const source = sourceButton.getBoundingClientRect();
  dialog.showModal();
  if (reducedMotion) return;
  const target = book.getBoundingClientRect();
  const dx = source.x + source.width / 2 - target.x - target.width / 2;
  const dy = source.y + source.height / 2 - target.y - target.height / 2;
  const scale = Math.min(source.width / target.width, source.height / target.height);
  book.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotateY(-100deg) rotateX(5deg)` },
      { transform: 'translate(0, 0) scale(1) rotateY(-18deg) rotateX(4deg)' },
    ],
    { duration: 1050, easing: 'cubic-bezier(.2,.75,.18,1)', fill: 'both' },
  );
}

for (const album of albums) {
  const button = document.createElement('button');
  button.className = 'shelf-book';
  button.dataset.album = album.id;
  button.style.setProperty('--book-color', album.color);
  button.setAttribute('aria-label', `从书架取下${album.title}`);
  button.setAttribute('aria-haspopup', 'dialog');
  button.title = `翻阅${album.title}`;
  const label = document.createElement('span');
  label.textContent = album.title;
  button.append(label);
  button.addEventListener('click', () => previewBook(album, button));
  shelf.append(button);
}

document.querySelector('#close-book').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    dialog.close();
});
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  for (const animation of book.getAnimations()) animation.cancel();
});
setupRecordPlayer();
