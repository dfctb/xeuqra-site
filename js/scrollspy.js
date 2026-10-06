document.addEventListener("DOMContentLoaded", async () => {
  const navLinks = [...document.querySelectorAll("nav a:not(.no-scrollspy)")];
  const homeLink = navLinks.find(link =>
    link.pathname === "/index.html" || link.pathname === "/"
  );
  const sectionLinks = navLinks.filter(link => link !== homeLink);

  const sections = [...document.querySelectorAll("main section")];
  if (!sections.length) return;

  const HEADER = 60;
  const TRIGGER = HEADER + 80;
  let lockedByClick = false;

  function setActive(id) {
    // Сначала снимаем active вообще со всех
    navLinks.forEach(link => link.classList.remove("active"));

    if (id === "home") {
      homeLink?.classList.add("active");
    } else {
      const link = sectionLinks.find(link => link.hash === "#" + id);
      link?.classList.add("active");
    }
  }

  function atBottom() {
    return window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;
  }

  function updateActive() {
    if (lockedByClick) return;

    // Самый верх → HOME
    if (window.scrollY <= 1) {
      setActive("home");
      return;
    }

    // Самый низ → последняя секция
    if (atBottom()) {
      setActive(sections[sections.length - 1].id);
      return;
    }

    let current = null;

    for (const section of sections) {
      if (section.getBoundingClientRect().top <= TRIGGER) {
        current = section;
      }
    }

    if (current) {
      setActive(current.id);
    } else {
      setActive("home");
    }
  }

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (link === homeLink) {
        lockedByClick = true;
        setActive("home");
        return;
      }

      if (link.hash && document.getElementById(link.hash.slice(1))) {
        lockedByClick = true;
        setActive(link.hash.slice(1));
      }
    });
  });

  ["wheel", "touchstart", "keydown"].forEach(ev =>
    window.addEventListener(ev, () => {
      lockedByClick = false;
    }, { passive: true })
  );

  await new Promise(r => setTimeout(r, 0));
  await Promise.all(window.pageLoaders || []);

  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));

    if (target) {
      target.scrollIntoView({
        behavior: "instant",
        block: "start"
      });

      lockedByClick = true;
      setActive(target.id);
    }
  }

  updateActive();

  window.addEventListener("scroll", updateActive, {
    passive: true
  });
});