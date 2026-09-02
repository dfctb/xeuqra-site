async function loadNews() {
  const list = document.getElementById("news-list");
  if (!list) return;

  try {
    const res = await fetch("../data/news.json");
    if (!res.ok) throw new Error("failed to load news.json");
    const data = await res.json();
    const items = data.items || [];

    // newest first
    items.sort((a, b) => (a.date < b.date ? 1 : -1));

    list.innerHTML = "";

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "news-item";

      const titleHtml = item.url
        ? `<a href="${item.url}">${item.title}</a>`
        : item.title;

      li.innerHTML = `
        <div class="news-date">${item.date}</div>
        <div class="news-body">
          <div class="news-title">${titleHtml}</div>
          <div class="news-text">${item.text || ""}</div>
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
