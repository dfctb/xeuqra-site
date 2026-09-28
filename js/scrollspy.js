document.addEventListener("DOMContentLoaded", async () => {
  const navLinks = [...document.querySelectorAll("nav a:not(.no-scrollspy)")];
  const sections = [...document.querySelectorAll("main section")];
  if (!sections.length) return;

  const HEADER = 60;            // высота шапки, должна совпадать с CSS
  const TRIGGER = HEADER + 80;  // линия, по которой определяем текущий раздел

  let lockedByClick = false;

  function setActive(id) {
    navLinks.forEach(link => {
      link.classList.toggle("active", link.hash === "#" + id);
    });
  }

  function atBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  }

  function updateActive() {
    if (lockedByClick) return;

    if (atBottom()) {
      setActive(sections[sections.length - 1].id);
      return;
    }

    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= TRIGGER) current = section;
    }
    setActive(current.id);
  }

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (link.hash && document.getElementById(link.hash.slice(1))) {
        lockedByClick = true;
        setActive(link.hash.slice(1));
      }
    });
  });

  // как только ты сам крутишь колесо или трогаешь экран, подсветка снова следует за страницей
  ["wheel", "touchstart", "keydown"].forEach(ev =>
    window.addEventListener(ev, () => { lockedByClick = false; }, { passive: true })
  );

  // ждём, пока остальные скрипты зарегистрируют загрузку данных и она закончится
  await new Promise(r => setTimeout(r, 0));
  await Promise.all(window.pageLoaders || []);

  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: "instant", block: "start" });
      lockedByClick = true;
      setActive(target.id);
    }
  }

  updateActive();
  window.addEventListener("scroll", updateActive, { passive: true });
});