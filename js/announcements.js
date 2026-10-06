window.pageLoaders = window.pageLoaders || [];

async function loadAnnouncements() {
    const track = document.getElementById('announcement-track');
    if (!track) return;

    try {
        // Загружаем объявления и новости одновременно
        const [announcementsRes, newsRes] = await Promise.all([
            fetch('/data/announcements.json'),
            fetch('/data/news.json')
        ]);

        if (!announcementsRes.ok) {
            throw new Error('failed to load announcements.json');
        }

        if (!newsRes.ok) {
            throw new Error('failed to load news.json');
        }

        const announcementData = await announcementsRes.json();
        const newsData = await newsRes.json();

        const items = [...(announcementData.items || announcementData)];
        const news = [...(newsData.items || [])];

        // Сортируем новости: новые сначала
        news.sort((a, b) => {
            const parseDate = (date) => {
                const [day, month, year] = date.split('.');
                return new Date(year, month - 1, day);
            };

            return parseDate(b.date) - parseDate(a.date);
        });

        // Последняя новость → первое объявление
        if (news.length) {
            const latest = news[0];

            items.unshift({
                type: 'news',
                text: latest.title || '',
                subtext: latest.text || '',
                image: '/assets/announcements/pictures/news.jpg'
            });
        }

        if (!items.length) return;

        track.innerHTML = '';

        items.forEach((item, i) => {
            const hasLink = !!item.link;

            const el = document.createElement(
                hasLink ? 'a' : 'div'
            );

            if (hasLink) {
                el.href = item.link;
            }

            el.className =
                'announcement-slide' + (i === 0 ? ' active' : '');

            const video = item.video
                ? `<video class="announcement-video" autoplay muted loop playsinline>
               <source src="${item.video}" type="video/mp4">
             </video>`
                : '';

            if (!item.video && item.image) {
                el.style.backgroundImage = `url(${item.image})`;
            }

            el.innerHTML = `
          ${video}
        
          <div class="announcement-overlay"></div>

        <div class="announcement-text">
          <div class="announcement-title">
            ${item.text || ''}
          </div>

          ${
                item.subtext
                    ? `<div class="announcement-subtext">${item.subtext}</div>`
                    : ''
            }

          ${
                item.type === 'news'
                    ? `<a class="announcement-news-link" href="/pages/news.html">[ Read the news ]</a>`
                    : ''
            }
        </div>
      `;

            track.appendChild(el);
        });

        const slides =
            track.querySelectorAll('.announcement-slide');

        let current = 0;

        function show(index) {
            slides[current].classList.remove('active');

            current =
                (index + slides.length) % slides.length;

            slides[current].classList.add('active');
        }

        let autoTimer = null;

        function resetAutoTimer() {
            if (autoTimer) {
                clearTimeout(autoTimer);
            }

            if (slides.length > 1) {
                autoTimer = setTimeout(() => {
                    show(current + 1);
                    resetAutoTimer();
                }, 6000);
            }
        }

        document
            .getElementById('announcement-prev')
            ?.addEventListener('click', () => {
                show(current - 1);
                resetAutoTimer();
            });

        document
            .getElementById('announcement-next')
            ?.addEventListener('click', () => {
                show(current + 1);
                resetAutoTimer();
            });

        resetAutoTimer();

    } catch (err) {
        console.error(
            'Error announcements:',
            err
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pageLoaders.push(loadAnnouncements());
});