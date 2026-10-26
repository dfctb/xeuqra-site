async function loadNews() {
    const list = document.getElementById("news-list");
    if (!list) return;

    try {
        const res = await fetch("/data/news.json");
        if (!res.ok) throw new Error("failed to load news.json");
        const data = await res.json();
        const items = data.items || [];

        const { parseDate, escapeHTML, safeURL } = window.xeuqra;
        items.sort((a, b) => parseDate(b.date) - parseDate(a.date));

        list.innerHTML = "";

        items.forEach((item) => {
            const li = document.createElement("li");
            li.className = "news-item";

            const titleHtml = safeURL(item.url)
                ? `<a href="${escapeHTML(safeURL(item.url))}">${escapeHTML(item.title)}</a>`
                : escapeHTML(item.title);

            li.innerHTML = `
        <div class="news-date">${escapeHTML(item.date)}</div>
        <div class="news-body">
          <div class="news-title">${titleHtml}</div>
          <div class="news-text">${escapeHTML(item.text || '')}</div>
        </div>
      `;

            list.appendChild(li);
        });
    } catch (err) {
        list.innerHTML = `<li class="news-item"><div class="news-date">—</div><div class="news-body"><div class="news-text tag">could not load news.json</div></div></li>`;
        console.error(err);
    }
}

loadNews();
