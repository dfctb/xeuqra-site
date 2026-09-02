// Загружаем данные из JSON
async function loadCatalog() {
    const response = await fetch('/data/releases.json');
    return response.json();
}

// Сортировка по убыванию номера каталога (новые релизы сверху)
function sortByNewest(data) {
    return data.sort((a, b) => {
        // Извлекаем число из cat (например, "XQ0063" → 63)
        const numA = parseInt(a.cat.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.cat.replace(/\D/g, '')) || 0;
        return numB - numA; // по убыванию
    });
}

function renderTable(data) {
    const sortedData = sortByNewest(data); // сортируем перед рендерингом
    const tbody = document.getElementById('releases-table-body');
    let html = '';
    sortedData.forEach(item => {
        const titleContent = item.bandcamp
            ? `<a href="${item.bandcamp}" target="_blank">${item.title}</a>`
            : item.title;
        html += `<tr>
            <td>${item.cat}</td>
            <td>${item.artist}</td>
            <td>${titleContent}</td>
            <td>${item.year}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await loadCatalog();
    renderTable(data);
});