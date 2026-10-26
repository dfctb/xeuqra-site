window.pageLoaders = window.pageLoaders || [];

async function loadAnnouncements() {
  const track = document.getElementById('announcement-track');
  const carousel = document.getElementById('announcement-carousel');
  if (!track || !carousel) return;
  const { escapeHTML, safeURL, parseDate } = window.xeuqra;
  async function loadJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('failed to load ' + url);
      return await response.json();
    } catch (error) { console.warn(error); return null; }
  }
  const [announcementData, newsData] = await Promise.all([
    loadJSON('/data/announcements.json'), loadJSON('/data/news.json')
  ]);
  const rawItems = announcementData?.items || announcementData;
  const items = Array.isArray(rawItems) ? rawItems.slice() : [];
  const news = Array.isArray(newsData?.items) ? newsData.items.slice() : [];
  news.sort((a, b) => parseDate(b.date) - parseDate(a.date));
  if (news.length) items.unshift({
    type: 'news', text: news[0].title || '', subtext: news[0].text || '',
    image: '/assets/announcements/pictures/news.jpg?v=605a422d0518',
    imageSrcset: '/assets/announcements/pictures/news-640.webp?v=0c5d6fc4f3be 640w, /assets/announcements/pictures/news-1280.webp?v=bc2ac83ab764 1280w, /assets/announcements/pictures/news-1920.webp?v=cc70da47ad84 1920w'
  });
  const prevBtn = document.getElementById('announcement-prev');
  const nextBtn = document.getElementById('announcement-next');
  if (!items.length) {
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }
  let current = 0, visible = true, timer = null;
  const fragment = document.createDocumentFragment();
  const slides = items.map((item, index) => {
    const slide = document.createElement('div');
    slide.className = 'announcement-slide' + (index === 0 ? ' active' : '');
    slide.inert = index !== 0;
    slide.setAttribute('aria-hidden', String(index !== 0));
    const link = safeURL(item.link);
    slide.innerHTML = `
      <div class="announcement-overlay"></div>
      <div class="announcement-text">
        <div class="announcement-title">${escapeHTML(item.text)}</div>
        ${item.subtext ? `<div class="announcement-subtext">${escapeHTML(item.subtext)}</div>` : ''}
        ${item.type === 'news' ? '<a class="announcement-news-link" href="/pages/news">[ Read the news ]</a>' : ''}
        ${link ? `<a class="announcement-news-link" href="${escapeHTML(link)}">${escapeHTML(item.linkText || '[ Open ]')}</a>` : ''}
      </div>`;
    // No media sources are attached to inactive slides.
    if (safeURL(item.video)) {
      const video = document.createElement('video');
      video.className = 'announcement-video';
      video.defaultMuted = true; video.muted = true;
      video.loop = true; video.playsInline = true; video.controls = false;
      video.preload = 'none';
      video.addEventListener('loadedmetadata', () => adjustTextWidth(slide));
      slide.prepend(video);
    } else if (safeURL(item.image)) {
      const picture = document.createElement('picture');
      if (item.imageSrcset) {
        const source = document.createElement('source');
        source.type = 'image/webp'; source.sizes = '100vw'; picture.append(source);
      }
      const image = document.createElement('img');
      image.className = 'announcement-image'; image.alt = '';
      image.width = 1920; image.height = 1080; image.decoding = 'async';
      image.fetchPriority = index === 0 ? 'high' : 'auto';
      picture.append(image); slide.prepend(picture);
    }
    fragment.append(slide);
    return slide;
  });
  track.replaceChildren(fragment);

  function adjustTextWidth(slide) {
    const video = slide.querySelector('video');
    if (!video) return;
    const text = slide.querySelector('.announcement-text');
    const width = video.videoWidth || 4, height = video.videoHeight || 3;
    video.classList.toggle('announcement-video--lowres', !!video.videoWidth && width <= 720 && height <= 576);
    text.style.maxWidth = Math.min(carousel.clientWidth, carousel.clientHeight * width / height) + 'px';
    text.style.margin = '0 auto';
  }
  function activateMedia(index) {
    const slide = slides[index], item = items[index];
    const image = slide.querySelector('img');
    if (image && !image.hasAttribute('src')) {
      const source = slide.querySelector('source');
      if (source) source.srcset = item.imageSrcset;
      image.src = item.image;
    }
    const video = slide.querySelector('video');
    if (video) {
      video.controls = false;
      video.autoplay = visible && !document.hidden;
      if (item.poster && !video.hasAttribute('poster')) video.poster = item.poster;
      if (!video.hasAttribute('src')) video.src = item.video;
      adjustTextWidth(slide);
      if (visible && !document.hidden) {
        video.play().catch(error => {
          // A slide change or tab switch can cancel a pending play() request.
          // Keep the original background presentation even if autoplay is blocked.
          if (error.name !== 'AbortError' && slide.classList.contains('active')) {
            console.warn('Background video autoplay was blocked:', error);
          }
        });
      }
    }
  }
  function show(index) {
    const old = slides[current];
    const oldVideo = old.querySelector('video');
    if (oldVideo) { oldVideo.autoplay = false; oldVideo.pause(); }
    old.classList.remove('active'); old.inert = true; old.setAttribute('aria-hidden', 'true');
    current = (index + slides.length) % slides.length;
    const slide = slides[current];
    slide.classList.add('active'); slide.inert = false; slide.setAttribute('aria-hidden', 'false');
    activateMedia(current);
  }
  function resetAutoTimer() {
    clearTimeout(timer);
    if (slides.length > 1 && visible && !document.hidden) {
      timer = setTimeout(() => { show(current + 1); resetAutoTimer(); }, 6000);
    }
  }
  function syncPlayback() {
    slides.forEach((slide, index) => {
      if (index !== current || !visible || document.hidden) {
        const video = slide.querySelector('video');
        if (video) { video.autoplay = false; video.pause(); }
      }
    });
    if (visible && !document.hidden) activateMedia(current);
    resetAutoTimer();
  }
  [prevBtn, nextBtn].forEach((button, index) => {
    if (!button) return;
    button.disabled = slides.length < 2;
    button.addEventListener('click', () => { show(current + (index ? 1 : -1)); resetAutoTimer(); });
  });
  if (window.ResizeObserver) new ResizeObserver(() => adjustTextWidth(slides[current])).observe(carousel);
  else window.addEventListener('resize', () => adjustTextWidth(slides[current]));
  if (window.IntersectionObserver) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; syncPlayback();
  }).observe(carousel);
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pagehide', () => {
    clearTimeout(timer);
    slides.forEach(slide => {
      const video = slide.querySelector('video');
      if (video) { video.autoplay = false; video.pause(); }
    });
  });
  window.addEventListener('pageshow', syncPlayback);
  activateMedia(current); resetAutoTimer();
}
document.addEventListener('DOMContentLoaded', () => { window.pageLoaders.push(loadAnnouncements()); });
