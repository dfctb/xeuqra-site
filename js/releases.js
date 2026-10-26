// Загружаем данные из JSON
async function loadCatalog() {
    const response = await fetch('/data/releases.json');
    if (!response.ok) throw new Error('could not load releases.json');
    const data = await response.json();
    const items = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(items)) throw new Error('invalid releases data');
    return items;
}

// Сортировка по убыванию номера каталога (новые релизы сверху)
function sortByNewest(data) {
    return data.sort((a, b) => {
        // Извлекаем число из cat (например, "XQ0063" → 63)
        const numA = parseInt(String(a.cat || '').replace(/\D/g, '')) || 0;
        const numB = parseInt(String(b.cat || '').replace(/\D/g, '')) || 0;
        return numB - numA; // по убыванию
    });
}

function renderTable(data) {
    const sortedData = sortByNewest(data); // сортируем перед рендерингом
    const tbody = document.getElementById('releases-table-body');
    const { escapeHTML, safeURL } = window.xeuqra;
    let html = '';
    sortedData.forEach(item => {
        const titleContent = safeURL(item.bandcamp)
            ? `<a href="${escapeHTML(safeURL(item.bandcamp))}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.title)}</a>`
            : escapeHTML(item.title);
        html += `<tr>
            <td>${escapeHTML(item.cat)}</td>
            <td>${escapeHTML(item.artist)}</td>
            <td>${titleContent}</td>
            <td>${escapeHTML(item.year)}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

window.pageLoaders = window.pageLoaders || [];

document.addEventListener('DOMContentLoaded', () => {
    window.pageLoaders.push(
        loadCatalog().then(renderTable).catch(error => {
            console.error(error);
            const body = document.getElementById('releases-table-body');
            if (body) body.innerHTML = '<tr><td colspan="4">Could not load the catalogue. Please try again.</td></tr>';
        })
    );
});