window.pageLoaders = window.pageLoaders || [];

function loadLabelAndContact() {
  const description = document.getElementById('label-description');
  if (!description) return Promise.resolve();

  return fetch('/data/label.json')
    .then(r => { if (!r.ok) throw new Error('could not load label.json'); return r.json(); })
    .then(label => {
      const { escapeHTML } = window.xeuqra;
      description.innerText = label.description || '';

      document.getElementById('label-kv').innerHTML = `
        <div class="kv-row"><dt>founded</dt><dd>${escapeHTML(label.founded || '—')}</dd></div>
        <div class="kv-row"><dt>founders</dt><dd>${escapeHTML(label.founders || '—')}</dd></div>
        <div class="kv-row"><dt>sub-label</dt><dd>${escapeHTML(label.sublabel || '—')}</dd></div>
        <div class="kv-row"><dt>roster</dt><dd>${escapeHTML(label.roster || '—')}</dd></div>
      `;

      const links = document.getElementById('contact-links');
      links.innerHTML = '';

      const notLinks = ['description', 'founded', 'founders', 'sublabel', 'roster'];
      Object.keys(label)
        .filter(key => !notLinks.includes(key))
        .forEach(key => {
          const value = label[key];
          if (typeof value !== 'string' || !value || value === '—') return;

          const isEmail = key === 'email' || /^[^\s\/:]+@[^\s\/:]+$/.test(value);
          const href = isEmail
            ? `mailto:${value}`
            : (value.startsWith('http') ? value : `https://${value}`);
          const shown = value.replace(/^https?:\/\//, '');

          const li = document.createElement('li');
          li.innerHTML = `
            <span class="platform">${escapeHTML(key)}</span>
            <a href="${escapeHTML(href)}" ${isEmail ? '' : 'target="_blank" rel="noopener"'}>${escapeHTML(shown)}</a>
          `;
          links.appendChild(li);
        });
    })
    .catch(err => { console.error(err); description.textContent = 'Could not load the label information. Please try again.'; });
}

document.addEventListener('DOMContentLoaded', () => {
  window.pageLoaders.push(loadLabelAndContact());
});