window.pageLoaders = window.pageLoaders || [];

function loadArtists() {
  const container = document.getElementById('artists-container');
  if (!container) return Promise.resolve();

  return fetch('data/artists.json')
    .then(r => r.json())
    .then(data => {
      const artists = data.items || data;
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
}

function loadLabel() {
  const description = document.getElementById('label-description');
  if (!description) return Promise.resolve();

  return fetch('data/label.json')
    .then(r => r.json())
    .then(label => {
      description.innerText = label.description || '';

      document.getElementById('label-kv').innerHTML = `
        <div class="kv-row"><dt>founded</dt><dd>${label.founded || '—'}</dd></div>
        <div class="kv-row"><dt>founders</dt><dd>${label.founders || '—'}</dd></div>
        <div class="kv-row"><dt>sub-label</dt><dd>${label.sublabel || '—'}</dd></div>
        <div class="kv-row"><dt>roster</dt><dd>${label.roster || '—'}</dd></div>
      `;

      const links = document.getElementById('contact-links');
      links.innerHTML = '';

      const notLinks = ['description', 'founded', 'founders', 'sublabel', 'roster'];

      Object.keys(label)
        .filter(key => !notLinks.includes(key))
        .forEach(key => {
          const value = label[key];
          if (!value || value === '—') return;

          const isEmail = key === 'email' || /^[^\s\/:]+@[^\s\/:]+$/.test(value);
          const href = isEmail
            ? `mailto:${value}`
            : (value.startsWith('http') ? value : `https://${value}`);
          const shown = value.replace(/^https?:\/\//, '');

          const li = document.createElement('li');
          li.innerHTML = `
            <span class="platform">${key}</span>
            <a href="${href}" ${isEmail ? '' : 'target="_blank" rel="noopener"'}>${shown}</a>
          `;
          links.appendChild(li);
        });
    })
    .catch(err => console.error('Ошибка загрузки данных лейбла:', err));
}

document.addEventListener('DOMContentLoaded', () => {
  window.pageLoaders.push(loadArtists(), loadLabel());
});