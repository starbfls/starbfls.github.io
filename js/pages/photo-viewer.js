/** 已配置照片后可直接使用的大图查看器；空画框不会绑定无效点击。 */
export function createPhotoViewer(photos) {
  const dialog = document.querySelector('#photo-viewer');
  const image = document.querySelector('#viewer-image');
  const caption = document.querySelector('#viewer-caption');
  const previous = document.querySelector('#previous-photo');
  const next = document.querySelector('#next-photo');
  let current = 0;

  function show(index) {
    if (!photos.length) return;
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.src = photo.src;
    image.alt = photo.alt || photo.caption || '相册照片';
    caption.textContent = photo.caption || '';
    document.querySelector('#viewer-position').textContent = `${current + 1} / ${photos.length}`;
    previous.disabled = photos.length < 2;
    next.disabled = photos.length < 2;
  }

  function open(index) {
    if (!photos[index]) return;
    show(index);
    dialog.showModal();
  }

  dialog.querySelector('[data-close-viewer]').addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(current - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + 1);
    }
  });
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
  image.addEventListener('error', () => {
    caption.textContent = '这张照片暂时无法读取。';
  });
  dialog.addEventListener('close', () => {
    if (!dialog.open) image.removeAttribute('src');
  });
  return { open };
}
