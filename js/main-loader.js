document.addEventListener("DOMContentLoaded", () => {
  // 1. ЗАГРУЗКА РЕЛИЗОВ
  fetch('data/releases.json')
    .then(response => response.json())
    .then(data => {
      // Поддерживаем формат Sveltia CMS (объект items) или чистый массив
      const releases = data.items || data;
      const tbody = document.getElementById('releases-table-body');
      tbody.innerHTML = ''; // очистка

      releases.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="cat">${item.cat || '—'}</td>
          <td class="artist">${item.artist || '—'}</td>
          <td class="title">${item.title || '—'}</td>
          <td class="year">${item.year || '—'}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error('Ошибка загрузки релизов:', err));

  // 2. ЗАГРУЗКА АРТИСТОВ
  fetch('data/artists.json')
    .then(response => response.json())
    .then(data => {
      const artists = data.items || data;
      const container = document.getElementById('artists-container');
      container.innerHTML = '';

      artists.forEach(artist => {
        const row = document.createElement('div');
        row.className = 'artist-row';
        row.innerHTML = `
          <div class="artist-meta">
            <div class="artist-name">${artist.name}</div>
            ${artist.realName ? `<div class="artist-real">${artist.realName}</div>` : ''}
          </div>
          <div class="artist-content">
            <div class="artist-note">${artist.bio || ''}</div>
            ${artist.aliases ? `<div class="artist-aliases">also releases as: ${artist.aliases}</div>` : ''}
          </div>
        `;
        container.appendChild(row);
      });
    })
    .catch(err => console.error('Ошибка загрузки артистов:', err));

  // 3. ЗАГРУЗКА ДАННЫХ ЛЕЙБЛА И КОНТАКТОВ
  fetch('data/label.json')
    .then(response => response.json())
    .then(label => {
      // Описание
      document.getElementById('label-description').innerText = label.description || '';

      // Спецификации (Таблица ключ-значение)
      const kv = document.getElementById('label-kv');
      kv.innerHTML = `
        <div class="kv-row"><dt>founded</dt><dd>${label.founded || '—'}</dd></div>
        <div class="kv-row"><dt>founders</dt><dd>${label.founders || '—'}</dd></div>
        <div class="kv-row"><dt>sub-label</dt><dd>${label.sublabel || '—'}</dd></div>
        <div class="kv-row"><dt>roster</dt><dd>${label.roster || '—'}</dd></div>
      `;

      // Контакты
      const links = document.getElementById('contact-links');
      links.innerHTML = '';

      const platforms = [
        { key: 'bandcamp', label: 'bandcamp' },
        { key: 'soundcloud', label: 'soundcloud' },
        { key: 'discogs', label: 'discogs' },
        { key: 'email', label: 'email' }
      ];

      platforms.forEach(p => {
        if (label[p.key] && label[p.key] !== '—') {
          const li = document.createElement('li');
          const isEmail = p.key === 'email' || label[p.key].includes('@');
          const href = isEmail ? `mailto:${label[p.key]}` : `https://${label[p.key]}`;

          li.innerHTML = `
            <span class="platform">${p.label}</span>
            <a href="${href}" target="_blank">${label[p.key]}</a>
          `;
          links.appendChild(li);
        }
      });
    })
    .catch(err => console.error('Ошибка загрузки данных лейбла:', err));
});
