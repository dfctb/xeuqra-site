document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('artists-container');
  if (!container) return;

  fetch('/data/artists.json')
    .then(r => { if (!r.ok) throw new Error('could not load artists.json'); return r.json(); })
    .then(data => {
      const artists = data.items || data;
      const { escapeHTML } = window.xeuqra;
      container.innerHTML = '';

      artists.forEach(artist => {
        const row = document.createElement('div');
        row.className = 'artist-row';
        row.innerHTML = `
          <div class="artist-meta">
            <div class="artist-name">${escapeHTML(artist.name)}</div>
            ${artist.realName ? `<div class="artist-real">${escapeHTML(artist.realName)}</div>` : ''}
          </div>
          <div class="artist-content">
            <div class="artist-note">${escapeHTML(artist.bio || '')}</div>
            ${artist.aliases ? `<div class="artist-aliases">also releases as: ${escapeHTML(artist.aliases)}</div>` : ''}
          </div>
        `;
        container.appendChild(row);
      });
    })
    .catch(err => { console.error(err); container.textContent = 'Could not load the artists. Please try again.'; });
});