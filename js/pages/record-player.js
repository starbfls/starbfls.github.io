import { studyRecord } from './collections.js';

/** 留声机先保留唱片位；没有提供音频时不会假装播放或自动发声。 */
export function setupRecordPlayer() {
  const button = document.querySelector('#gramophone');
  const audio = document.querySelector('#study-audio');
  const note = document.querySelector('#record-note');
  const stateLabel = document.querySelector('#record-state');
  const status = document.querySelector('#music-status');

  function setNote(open) {
    note.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  }

  function reflectPlayback() {
    const playing = !audio.paused;
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    stateLabel.textContent = playing ? '轻触暂停' : '轻触播放';
    button.setAttribute('aria-label', `${playing ? '暂停' : '播放'}${studyRecord.title}`);
  }

  if (studyRecord.src) {
    audio.src = studyRecord.src;
    audio.loop = true;
    audio.volume = 0.35;
    reflectPlayback();
    audio.addEventListener('play', reflectPlayback);
    audio.addEventListener('pause', reflectPlayback);
    audio.addEventListener('error', () => {
      status.textContent = '这张唱片暂时无法播放。';
      stateLabel.textContent = '唱片暂时无法播放';
      button.classList.remove('is-playing');
      button.setAttribute('aria-pressed', 'false');
    });
  }

  button.addEventListener('click', async () => {
    if (!studyRecord.src) {
      setNote(note.hidden);
      status.textContent = note.hidden ? '' : '尚未放入唱片，音乐会从这里响起。';
      return;
    }
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
      status.textContent = `正在播放${studyRecord.title}`;
    } catch {
      status.textContent = '这张唱片暂时无法播放，请稍后再试。';
    }
  });
  document.querySelector('#close-record-note').addEventListener('click', () => {
    setNote(false);
    button.focus();
  });
}
