async function loadDiscogsCatalog() {
    const labelId = "3714837";
    const url = `https://discogs.com{labelId}/releases?per_page=100`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'XeuqraWebArchive/1.0 (https://workers.dev)'
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка сети: ${response.status}`);
        }

        const data = await response.json();
        const releases = data.releases;

        renderTable(releases);

    } catch (error) {
        console.error("Не удалось загрузить каталог:", error);
        const tbody = document.getElementById('releases-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">error loading catalog.</td></tr>`;
        }
    }
}

function renderTable(releases) {
    const tbody = document.getElementById('releases-table-body');
    if (!tbody) return;

    let html = "";

    // Генерируем строчки в вашей структуре
    releases.forEach(item => {
        html += `
            <tr>
                <td>${item.catno || '—'}</td>
                <td>${item.artist || 'Unknown'}</td>
                <td><a href="https://discogs.com{item.id}" target="_blank" style="color: inherit; text-decoration: underline;">${item.title}</a></td>
                <td>${item.year || '—'}</td>
            </tr>
        `;
    });

    // Заменяем строчку "Loading..." на готовый каталог
    tbody.innerHTML = html;
}

// Запуск процесса
document.addEventListener('DOMContentLoaded', loadDiscogsCatalog);
