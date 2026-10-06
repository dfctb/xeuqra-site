document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('artists-container');
  if (!container) return;

  fetch('/data/artists.json')
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
});