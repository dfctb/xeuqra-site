window.pageLoaders = window.pageLoaders || []

async function loadAnnouncements () {
  const track = document.getElementById('announcement-track')
  if (!track) return

  try {
    // Загружаем объявления и новости одновременно
    const [announcementsRes, newsRes] = await Promise.all([
      fetch('/data/announcements.json'),
      fetch('/data/news.json'),
    ])

    if (!announcementsRes.ok) throw new Error(
      'failed to load announcements.json')
    if (!newsRes.ok) throw new Error('failed to load news.json')

    const announcementData = await announcementsRes.json()
    const newsData = await newsRes.json()

    const items = [...(announcementData.items || announcementData)]
    const news = [...(newsData.items || [])]

    // Сортируем новости: новые сначала (с защитой от отсутствующих дат)
    news.sort((a, b) => {
      const parseDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return 0
        const [day, month, year] = dateStr.split('.')
        return new Date(year, month - 1, day).getTime()
      }
      return parseDate(b.date) - parseDate(a.date)
    })

    // Последняя новость → первое объявление
    if (news.length) {
      const latest = news[0]
      items.unshift({
        type: 'news',
        text: latest.title || '',
        subtext: latest.text || '',
        image: '/assets/announcements/pictures/news.jpg',
      })
    }

    if (!items.length) return

    track.innerHTML = ''

    items.forEach((item, i) => {
      const el = document.createElement('div')
      el.className = 'announcement-slide' + (i === 0 ? ' active' : '')

      const video = item.video
        ? `<video class="announcement-video" autoplay muted loop playsinline>
             <source src="${item.video}" type="video/mp4">
           </video>`
        : ''

      if (!item.video && item.image) {
        el.style.backgroundImage = `url(${item.image})`
      }

      el.innerHTML = `
        ${video}
        <div class="announcement-overlay"></div>
        <div class="announcement-text">
          <div class="announcement-title">${item.text || ''}</div>
          
          ${item.subtext
        ? `<div class="announcement-subtext">${item.subtext}</div>`
        : ''}
          
          ${item.type === 'news'
        ? `<a class="announcement-news-link" href="/pages/news.html">[ Read the news ]</a>`
        : ''}
          
          ${item.link
        ? `<a class="announcement-news-link" href="${item.link}">${item.linkText ||
        '[ Open ]'}</a>`
        : ''}
        </div>
      `

      // --- БЛОК 1: Проверка на PAL-видео и сужение текста ---
      const videoEl = el.querySelector('.announcement-video')
      const textEl = el.querySelector('.announcement-text')

      if (videoEl && textEl) {
        // Функция для выравнивания ширины текста по ширине видео на экране
        const adjustTextWidth = () => {
          const carousel = el.closest('.announcement-carousel')
          if (!carousel) return

          const cw = carousel.clientWidth
          const ch = carousel.clientHeight

          // Берем реальные пропорции видео (если не загрузились, берем 4:3)
          const vw = videoEl.videoWidth || 4
          const vh = videoEl.videoHeight || 3

          // Вычисляем реальную ширину видео на экране
          let renderedWidth
          if ((vw / vh) > (cw / ch)) {
            renderedWidth = cw
          } else {
            renderedWidth = ch * (vw / vh)
          }

          // Применяем ширину к текстовому блоку
          textEl.style.maxWidth = renderedWidth + 'px'
          textEl.style.margin = '0 auto'
        }

        const applySizeClass = () => {
          const w = videoEl.videoWidth
          const h = videoEl.videoHeight

          // Если это PAL VHS (720×576 или меньше) — добавляем класс для CSS
          if (w && h && w <= 720 && h <= 576) {
            videoEl.classList.add('announcement-video--lowres')
          }

          // В любом случае подгоняем ширину текста под ширину видео на экране
          adjustTextWidth()
        }

        if (videoEl.readyState >= 1) {
          applySizeClass()
        } else {
          videoEl.addEventListener('loadedmetadata', applySizeClass,
            { once: true })
        }

        // Пересчитываем при ресайзе окна
        window.addEventListener('resize', adjustTextWidth)
      }

      track.appendChild(el)
    })

    const slides = track.querySelectorAll('.announcement-slide')
    let current = 0

    function show (index) {
      slides[current].classList.remove('active')
      current = (index + slides.length) % slides.length
      slides[current].classList.add('active')
    }

    let autoTimer = null

    function resetAutoTimer () {
      if (autoTimer) clearTimeout(autoTimer)
      if (slides.length > 1) {
        autoTimer = setTimeout(() => {
          show(current + 1)
          resetAutoTimer()
        }, 6000)
      }
    }

    const prevBtn = document.getElementById('announcement-prev')
    const nextBtn = document.getElementById('announcement-next')

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        show(current - 1)
        resetAutoTimer()
      })
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        show(current + 1)
        resetAutoTimer()
      })
    }

    resetAutoTimer()

  } catch (err) {
    console.error('Error announcements:', err)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pageLoaders.push(loadAnnouncements())
})