'use strict';

const player = document.querySelector('#player');
const grid = document.querySelector('#case-grid');
const title = document.querySelector('#video-title');
const duration = document.querySelector('#video-duration');
const download = document.querySelector('#download-video');
const statusLine = document.querySelector('#copy-status');
const copyButton = document.querySelector('#copy-link');
let cases = [];
let activeId = 'overview';

const formatTime = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.round(seconds % 60).toString().padStart(2, '0')}`;
const caseLabel = c => `Case ${String(c.number).padStart(2, '0')}`;

function selectVideo(id, {scroll = false, updateHash = false} = {}) {
  const selected = cases.find(c => c.id === id);
  if (id !== 'overview' && !selected) return;
  const next = selected || {id: 'overview', video: 'media/overview.mp4', poster: 'media/overview.webp', duration_s: 155.12};
  if (activeId !== id) {
    player.pause();
    player.src = next.video;
    player.poster = next.poster;
    player.load();
  }
  activeId = id;
  title.textContent = selected ? `${caseLabel(selected)} — ${selected.scene}` : 'Supplementary Video 1';
  duration.textContent = formatTime(next.duration_s);
  player.setAttribute('aria-label', `Four-method comparison video: ${title.textContent}`);
  download.href = next.video;
  document.querySelectorAll('[data-video]').forEach(link => {
    if (link.dataset.video === id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  if (updateHash) history.replaceState(null, '', `#${id}`);
  statusLine.textContent = '';
  if (scroll) document.querySelector('#viewer').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
}

function buildCards() {
  const fragment = document.createDocumentFragment();
  for (const c of cases) {
    const link = document.createElement('a');
    link.className = 'case-card';
    link.href = `#${c.id}`;
    link.dataset.video = c.id;
    link.setAttribute('aria-label', `Watch ${caseLabel(c)}, ${c.scene}, ${formatTime(c.duration_s)}`);
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const image = document.createElement('img');
    image.src = c.poster;
    image.alt = `${c.scene}: native MetaDrive views of SAC, SAC-Lag, CPO and Ours`;
    image.loading = 'lazy';
    image.width = 640;
    image.height = 360;
    thumb.append(image);
    const play = document.createElement('span');
    play.className = 'play-icon';
    play.setAttribute('aria-hidden', 'true');
    play.textContent = '▶';
    thumb.append(play);
    const copy = document.createElement('div');
    copy.className = 'card-copy';
    const line = document.createElement('div');
    line.className = 'card-line';
    const number = document.createElement('span');
    number.textContent = caseLabel(c).toUpperCase();
    const time = document.createElement('span');
    time.textContent = formatTime(c.duration_s);
    line.append(number, time);
    const heading = document.createElement('h3');
    heading.textContent = c.scene;
    copy.append(line, heading);
    link.append(thumb, copy);
    fragment.append(link);
  }
  grid.replaceChildren(fragment);
}

document.addEventListener('click', event => {
  const link = event.target.closest('[data-video]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  selectVideo(link.dataset.video, {scroll: true, updateHash: true});
});

copyButton.addEventListener('click', async () => {
  const url = new URL(location.href);
  url.hash = activeId;
  try {
    await navigator.clipboard.writeText(url.href);
    statusLine.textContent = 'Video link copied.';
  } catch {
    statusLine.textContent = `Copy this link: ${url.href}`;
  }
});

player.addEventListener('error', () => {
  statusLine.textContent = 'Playback could not start. Use “Download MP4” to open the video directly.';
});

function selectHash() {
  const id = location.hash.slice(1);
  if (id === 'overview' || cases.some(c => c.id === id)) selectVideo(id);
}
window.addEventListener('hashchange', selectHash);

fetch('data/cases.json').then(response => {
  if (!response.ok) throw new Error('Cannot load case data');
  return response.json();
}).then(data => {
  cases = data.cases;
  buildCards();
  selectHash();
}).catch(() => {
  const note = document.createElement('p');
  note.textContent = 'Individual videos: ';
  for (let number = 1; number <= 6; number++) {
    const link = document.createElement('a');
    link.href = `media/case-${String(number).padStart(2, '0')}.mp4`;
    link.textContent = `Case ${number}`;
    note.append(link, document.createTextNode(number === 6 ? '.' : ' · '));
  }
  grid.replaceChildren(note);
});
