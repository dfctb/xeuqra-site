document.addEventListener('DOMContentLoaded', async () => {
  // Получаем имя файла из URL (например, "design" из "/pages/design.html")
  const path = window.location.pathname
  const pageName = path.substring(path.lastIndexOf('/') + 1).
    replace('.html', '')

  // Если это не наши подстраницы, ничего не делаем
  if (!['records', 'design', 'audio', 'sandbox'].includes(pageName)) return

  const titleEl = document.getElementById('page-title')
  const descEl = document.getElementById('page-desc')

  try {
    // Загружаем JSON
    const res = await fetch(`/data/${pageName}.json`)

    if (!res.ok) {
      throw new Error(
        `Файл /data/${pageName}.json не найден (Статус: ${res.status})`)
    }

    const data = await res.json()

    // 1. Меняем заголовок страницы
    document.title = `Xeuqra ${pageName.charAt(0).toUpperCase() +
    pageName.slice(1)}`
    titleEl.innerHTML = `xeuqra <b>${pageName}</b>`

    // 2. Вставляем описание
    descEl.textContent = data.description || ''

    // 3. Выводим массивы (услуги, продукты и т.д.)
    const listEl = document.getElementById('page-list')
    const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]))

    if (arrayKey && data[arrayKey].length > 0) {
      data[arrayKey].forEach(item => {
        const li = document.createElement('li')
        li.textContent = item
        listEl.appendChild(li)
      })
    } else {
      listEl.style.display = 'none'
    }

    // 4. Выводим характеристики (KV) и ссылки
    const kvEl = document.getElementById('page-kv')
    const ignoredKeys = ['description', arrayKey]

    for (const [key, value] of Object.entries(data)) {
      if (ignoredKeys.includes(key) || !value) continue

      const dt = document.createElement('dt')
      dt.textContent = key

      const dd = document.createElement('dd')

      if (typeof value === 'string' && value.startsWith('http')) {
        const a = document.createElement('a')
        a.href = value
        a.textContent = value.replace('https://', '').replace('http://', '')
        a.target = '_blank'
        dd.appendChild(a)
      } else {
        dd.textContent = value
      }

      kvEl.appendChild(dt)
      kvEl.appendChild(dd)
    }

  } catch (err) {
    console.error('Error loading page data:', err)
    // Показываем ошибку на экране вместо "Data not found"
    titleEl.textContent = 'Error'
    descEl.innerHTML = `<span style="color: red;">${err.message}</span>`
    descEl.innerHTML += `<br><br>Убедитесь, что файл <b>/data/${pageName}.json</b> существует и имеет правильный формат JSON (без ошибок в запятых).`
  }
})