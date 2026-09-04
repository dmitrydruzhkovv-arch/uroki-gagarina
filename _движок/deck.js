/* deck.js — движок презентации: масштаб сцены, навигация, пошаговое раскрытие, KaTeX.
   Подключать ПОСЛЕ katex.min.js и auto-render.min.js.
   Разметка: <div id="stage"><section class="slide">…</section>…</div>          */

(() => {
  const stage = document.getElementById('stage');
  // Узкий экран = режим ленты (см. deck.css): слайды идут подряд, листалка не нужна.
  const lenta = () => matchMedia('(max-width:1000px)').matches;
  const slides = [...document.querySelectorAll('.slide')];
  const N = slides.length;
  let i = 0;            // текущий слайд
  let k = 0;            // сколько шагов раскрыто на нём

  /* ── 1. Математика: всё, что в $…$ и $$…$$, рисует KaTeX ── */
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
      strict: false,
      macros: {
        '\\tg': '\\operatorname{tg}',
        '\\ctg': '\\operatorname{ctg}',
        '\\gr': '^\\circ',
      },
    });
  }

  /* ── 1б. Знаки препинания не отрываются от формулы ──
     KaTeX-формула — отдельный inline-блок, и браузер спокойно переносит
     точку или запятую после неё на новую строку. Склеиваем их автоматически,
     чтобы об этом не приходилось думать при вёрстке слайда.               */
  for (const k of [...document.querySelectorAll('.katex')]) {
    if (k.closest('.nw')) continue;
    // формула может быть последней внутри <b>/<span> — тогда точка стоит за этой обёрткой
    let node = k;
    while (node && !node.nextSibling && node.parentElement && node.parentElement !== document.body
           && !/^(P|DIV|LI|TD|TH|SECTION)$/.test(node.parentElement.tagName)) node = node.parentElement;
    const nxt = node && node.nextSibling;
    if (!nxt || nxt.nodeType !== 3) continue;
    const m = nxt.textContent.match(/^[.,;:!?»)\]]+/);
    if (!m) continue;
    const wrap = document.createElement('span');
    wrap.className = 'nw';
    node.parentNode.insertBefore(wrap, node);
    wrap.appendChild(node);
    wrap.appendChild(document.createTextNode(m[0]));
    nxt.textContent = nxt.textContent.slice(m[0].length);
  }

  /* ── 2. Сцена 1600×900 вписывается в окно целиком ── */
  const fit = () => {
    if (lenta()) { stage.style.transform = ''; return; }
    const s = Math.min(innerWidth / stage.offsetWidth, innerHeight / stage.offsetHeight);
    stage.style.transform = `scale(${s})`;
  };
  addEventListener('resize', fit);

  /* ── 3. Слайды и шаги ── */
  const steps = s => [...s.querySelectorAll('.rv')];

  function draw() {
    if (lenta()) return;                       // в ленте показаны все слайды сразу
    slides.forEach((s, n) => s.classList.toggle('on', n === i));
    const s = slides[i];
    steps(s).forEach((e, n) => e.classList.toggle('shown', n < k));
    const bar = s.querySelector('.bar');
    if (bar) bar.style.width = ((i + 1) / N * 100) + '%';
    location.hash = 's' + (i + 1);
  }
  function go(n, opened = 0) {
    i = Math.max(0, Math.min(N - 1, n));
    k = opened === 'all' ? steps(slides[i]).length : opened;
    draw();
  }
  function next() {
    if (k < steps(slides[i]).length) { k++; draw(); }
    else if (i < N - 1) go(i + 1, 0);
  }
  function prev() {
    if (k > 0) { k--; draw(); }
    else if (i > 0) go(i - 1, 'all');
  }

  /* ── 4. Клавиши ── */
  addEventListener('keydown', e => {
    if (lenta()) return;
    const c = e.key;
    if (c === 'ArrowRight' || c === 'PageDown' || c === ' ' || c === 'Enter') { e.preventDefault(); next(); }
    else if (c === 'ArrowLeft' || c === 'PageUp' || c === 'Backspace') { e.preventDefault(); prev(); }
    else if (c === 'ArrowDown') { e.preventDefault(); go(i + 1, 0); }
    else if (c === 'ArrowUp') { e.preventDefault(); go(i - 1, 'all'); }
    else if (c === 'Home') go(0, 0);
    else if (c === 'End') go(N - 1, 'all');
    else if (c === 'о' || c === 'О' || c === 'j' || c === 'J') document.body.classList.toggle('keys');
    else if (c === 'в' || c === 'В' || c === 'd' || c === 'D') { document.body.classList.toggle('noanim'); k = steps(slides[i]).length; draw(); }
    else if (c === 'ф' || c === 'Ф' || c === 'a' || c === 'A') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    }
    else if (/^[1-9]$/.test(c)) go(+c - 1, 0);
  });

  /* ── 5. Клик по правой/левой половине экрана — вперёд/назад (для пульта и мыши) ── */
  addEventListener('click', e => {
    if (lenta()) return;                       // на телефоне тап — это прокрутка, а не «дальше»
    if (e.target.closest('a,button,input')) return;
    (e.clientX > innerWidth * 0.5 ? next : prev)();
  });

  /* ── 6. Старт: слайд из адреса (#s3) или первый ── */
  const h = +(location.hash.match(/^#s(\d+)$/) || [])[1];
  go(h ? h - 1 : 0, 0);
  fit();
  // KaTeX подтягивает шрифты асинхронно — пересчитываем масштаб после их загрузки
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  setTimeout(fit, 400);
})();
