(function () {
  const el = document.getElementById("typewriter");
  if (!el) return;
  const text = el.dataset.text || "XEUQRA";


  const TYPE_MS = 110;     // скорость набора одной буквы
  const ERASE_MS = 70;     // скорость стирания
  const HOLD_FULL = 2500;  // сколько держится готовое слово
  const HOLD_EMPTY = 700;  // пауза с пустой строкой

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function loop() {
    while (true) {
      el.classList.add("typing");
      for (let i = 1; i <= text.length; i++) {
        el.textContent = text.slice(0, i);
        await wait(TYPE_MS + Math.random() * 70); // лёгкая неровность, как у живой печати
      }
      el.classList.remove("typing");
      await wait(HOLD_FULL);

      el.classList.add("typing");
      for (let i = text.length - 1; i >= 0; i--) {
        el.textContent = text.slice(0, i);
        await wait(ERASE_MS);
      }
      el.classList.remove("typing");
      await wait(HOLD_EMPTY);
    }
  }

  loop();
})();