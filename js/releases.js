// Загружаем данные из JSON
async function loadCatalog() {
    const response = await fetch('/data/matched_releases.json'); // или итоговый файл
    return response.json();
}

function renderTable(data) {
    const tbody = document.getElementById('releases-table-body');
    let html = '';
    data.forEach(item => {
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