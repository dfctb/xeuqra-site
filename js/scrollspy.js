document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("nav a");
  const sections = document.querySelectorAll("section");
  let isClicked = false; // Флаг, который блокирует скролл-баги при кликах

  const observerOptions = {
    root: null,
    rootMargin: "-25% 0px -65% 0px", // Сбалансированная зона чувствительности
    threshold: 0
  };

  const observerCallback = (entries) => {
    if (isClicked) return; // Если летим по клику — не переключаем кнопки на ходу

    const isAtBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 60;
    if (isAtBottom) {
      highlightLastLink();
      return;
    }

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        if (id) {
          navLinks.forEach((link) => link.classList.remove("active"));
          const activeLink = document.querySelector(`nav a[href="#${id}"]`);
          if (activeLink) activeLink.classList.add("active");
        }
      }
    });
  };

  function highlightLastLink() {
    navLinks.forEach((link) => link.classList.remove("active"));
    const lastLink = navLinks[navLinks.length - 1];
    if (lastLink) lastLink.classList.add("active");
  }

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  sections.forEach((section) => observer.observe(section));

  window.addEventListener("scroll", () => {
    if (isClicked) return;
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 60;
    if (isAtBottom) {
      highlightLastLink();
    }
  });

  // Умный перехват кликов: подсвечиваем то, на что НАЖАЛИ, и запрещаем скроллу менять это
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      isClicked = true;
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Включаем слежку обратно только после того, как плавная прокрутка завершится
      setTimeout(() => {
        isClicked = false;
      }, 800);
    });
  });
});
