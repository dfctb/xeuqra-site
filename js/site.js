(function () {
  'use strict';
  function parseDate(value) {
    if (typeof value !== 'string') return 0;
    const parts = value.trim().split(/[.-]/).map(Number);
    if (parts.length !== 3 || parts.some(n => !Number.isInteger(n))) return 0;
    const [year, month, day] = parts[0] >= 1000 ? parts : parts.slice().reverse();
    if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return 0;
    const time = Date.UTC(year, month - 1, day);
    const date = new Date(time);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day ? time : 0;
  }
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }
  function safeURL(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value, location.origin);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? value.trim() : '';
    } catch (_) { return ''; }
  }
  window.xeuqra = { parseDate, escapeHTML, safeURL };

  document.querySelectorAll('.dropdown').forEach((dropdown, index) => {
    const toggle = dropdown.querySelector(':scope > a');
    const menu = dropdown.querySelector('.dropdown-content');
    if (!toggle || !menu) return;
    menu.id = menu.id || 'site-submenu-' + index;
    toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
    let wasOpen = false;
    function expand(open) {
      dropdown.classList.toggle('is-open', open);
      dropdown.classList.toggle('is-closed', !open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('pointerdown', () => { wasOpen = dropdown.classList.contains('is-open'); });
    toggle.addEventListener('click', event => {
      // First tap opens the menu; a second tap follows the existing records link.
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        if (!wasOpen) { event.preventDefault(); expand(true); }
      }
    });
    dropdown.addEventListener('focusin', () => expand(true));
    dropdown.addEventListener('focusout', event => {
      if (!dropdown.contains(event.relatedTarget)) expand(false);
    });
    dropdown.addEventListener('mouseenter', () => {
      if (matchMedia('(hover: hover)').matches) expand(true);
    });
    dropdown.addEventListener('mouseleave', () => {
      if (!dropdown.contains(document.activeElement)) expand(false);
    });
    dropdown.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        toggle.focus(); expand(false); event.preventDefault();
      } else if (event.target === toggle && (event.key === 'ArrowDown' || event.key === ' ')) {
        expand(true); menu.querySelector('a')?.focus(); event.preventDefault();
      }
    });
    document.addEventListener('click', event => { if (!dropdown.contains(event.target)) expand(false); });
  });
})();
