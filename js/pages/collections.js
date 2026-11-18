// 照片统一在这里填写本地路径；空数组会保留相册和画框的留白。
export const albums = [
  {
    id: 'travel',
    title: '旅行日记',
    english: 'A JOURNAL OF PLACES',
    subtitle: '把沿途，收进书页。',
    color: '#33463c',
    motif: 'travel',
    photos: [],
    slots: 6,
  },
  {
    id: 'days',
    title: '日常手记',
    english: 'NOTES ON ORDINARY DAYS',
    subtitle: '给平凡的日子，留一页。',
    color: '#703f35',
    motif: 'days',
    photos: [],
    slots: 6,
  },
  {
    id: 'light',
    title: '光影片段',
    english: 'FRAGMENTS OF LIGHT',
    subtitle: '一些光，一些想留下的瞬间。',
    color: '#384554',
    motif: 'light',
    photos: [],
    slots: 6,
  },
];

// 每个画框对应一张作品：src 填写 ./assets/photos/ 中的实际文件路径，alt 写照片内容。
export const galleryFrames = [
  { id: 'west', src: null, alt: '', caption: '', position: 'side-left' },
  { id: 'one', src: null, alt: '', caption: '', position: 'wall-one' },
  { id: 'two', src: null, alt: '', caption: '', position: 'wall-two' },
  { id: 'three', src: null, alt: '', caption: '', position: 'wall-three' },
  { id: 'four', src: null, alt: '', caption: '', position: 'wall-four' },
  { id: 'east', src: null, alt: '', caption: '', position: 'side-right' },
];

// 后续提供音乐后，把 src 改为实际音频路径，例如 ./assets/music/study.mp3。
export const studyRecord = { src: null, title: '尚未放入唱片', artist: '' };
