/* ════════════════════════════════════════════════════════════════
   fon.js — живая стена на фоне всей шапки (заказ D, 17.09.2026).
   Лежит ПОД панелями календаря и дня, видна вокруг них и снизу.

   Наклонённая в перспективу сетка плиток, чуть размыта и притушена.
   Каждые пару секунд случайная плитка плавно меняется на новую.

   Откуда плитки:
     • DATA.fon.giphyKey заполнен → гифки с GIPHY по тегам DATA.fon.tegi
       (только rating=g — «для всех возрастов»), в углу «Powered by GIPHY»;
     • ключа нет или GIPHY не ответил → свои неоновые плитки с математикой.
       Они ничего не грузят из интернета.

   ⚠ Включая GIPHY, допиши в pravila.html: гифки грузятся с сервиса GIPHY (США),
     и он получает адрес устройства. Сейчас там написано «никаких данных».

   Бережём телефон и глаза: на узком экране плиток меньше и без размытия;
   календарь ушёл с экрана — стена замирает; «уменьшить движение» — стоит.
   ════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const stena = document.getElementById('gifWall');
if (!stena) return;

const CFG = (typeof DATA !== 'undefined' && DATA.fon) || {};
const TIHO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const UZKO = matchMedia('(max-width:700px)').matches;
const KOLONKI = UZKO ? 4 : 8;
const RYADY = UZKO ? 6 : 6;

/* ── свои плитки: неон + математика, SVG с CSS-анимацией ── */
const NEON = [['#A855F7', '#D946EF'], ['#4F46E5', '#22D3EE'], ['#D946EF', '#FB7185'], ['#7C3AED', '#A5B4FC'], ['#22D3EE', '#A855F7']];
const sluch = a => a[Math.floor(Math.random() * a.length)];

const MOTIVY = [
  /* синусоида бежит */
  ([a, b]) => `<svg viewBox="0 0 160 120"><g class="m-run"><path d="M-80 60 q20 -34 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="${a}" stroke-width="4" stroke-linecap="round"/></g><line x1="0" y1="60" x2="160" y2="60" stroke="${b}" stroke-opacity=".35"/></svg>`,
  /* шестиугольник и треугольник вращаются навстречу */
  ([a, b]) => `<svg viewBox="0 0 160 120"><g class="m-rot"><polygon points="80,22 113,41 113,79 80,98 47,79 47,41" fill="none" stroke="${a}" stroke-width="3.5"/></g><g class="m-rot-r"><polygon points="80,36 104,78 56,78" fill="none" stroke="${b}" stroke-width="3"/></g></svg>`,
  /* парабола, по ней едет точка */
  ([a, b]) => `<svg viewBox="0 0 160 120"><path d="M20 20 Q80 190 140 20" fill="none" stroke="${a}" stroke-width="3.5"/><circle r="7" fill="${b}"><animateMotion dur="3s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear" path="M20 20 Q80 190 140 20"/></circle></svg>`,
  /* круги расходятся */
  ([a, b]) => `<svg viewBox="0 0 160 120"><circle class="m-ring" cx="80" cy="60" r="10" fill="none" stroke="${a}" stroke-width="3"/><circle class="m-ring m-d2" cx="80" cy="60" r="10" fill="none" stroke="${b}" stroke-width="3"/><circle cx="80" cy="60" r="5" fill="${a}"/></svg>`,
  /* единичная окружность: радиус крутится, синус пишется */
  ([a, b]) => `<svg viewBox="0 0 160 120"><circle cx="60" cy="60" r="38" fill="none" stroke="${a}" stroke-opacity=".5" stroke-width="2"/><g class="m-rot" style="transform-box:view-box; transform-origin:60px 60px"><line x1="60" y1="60" x2="98" y2="60" stroke="${b}" stroke-width="3.5"/><circle cx="98" cy="60" r="6" fill="${b}"/></g><line x1="112" y1="18" x2="112" y2="102" stroke="${a}" stroke-opacity=".35"/></svg>`,
  /* гистограмма дышит — вероятность */
  ([a, b]) => `<svg viewBox="0 0 160 120">${[0,1,2,3,4,5].map(i => `<rect class="m-bar" style="animation-delay:${-i * .35}s" x="${22 + i * 20}" y="20" width="13" height="80" rx="3" fill="${i % 2 ? a : b}"/>`).join('')}</svg>`,
  /* формула мерцает */
  ([a, b]) => `<svg viewBox="0 0 160 120"><text class="m-glow" x="80" y="70" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="${sluch([19, 21, 23])}" font-weight="700" fill="${a}" style="filter:drop-shadow(0 0 6px ${b})">${sluch(['a²+b²=c²', 'sin²α+cos²α=1', 'D=b²−4ac', 'S=½ab·sinC', 'x₁+x₂=−b/a', 'P(A)=m/n', 'y=kx+b'])}</text></svg>`,
  /* точки-волна */
  ([a, b]) => `<svg viewBox="0 0 160 120">${Array.from({ length: 24 }, (_, i) => `<circle class="m-dot" style="animation-delay:${-(i % 6) * .25 - Math.floor(i / 6) * .15}s" cx="${30 + (i % 6) * 20}" cy="${30 + Math.floor(i / 6) * 20}" r="4.5" fill="${i % 3 ? a : b}"/>`).join('')}</svg>`,
  /* фигура Лиссажу */
  ([a, b]) => `<svg viewBox="0 0 160 120"><path d="M80 20 C140 20 140 100 80 100 C20 100 20 20 80 20 M40 60 C40 0 120 120 120 60 C120 0 40 120 40 60" fill="none" stroke="${a}" stroke-opacity=".45" stroke-width="2"/><circle r="6" fill="${b}"><animateMotion dur="4s" repeatCount="indefinite" path="M40 60 C40 0 120 120 120 60 C120 0 40 120 40 60"/></circle></svg>`,
];

function svoyaPlitka(){
  const el = document.createElement('div');
  const cvet = sluch(NEON);
  el.className = 'gw-in gw-svg';
  el.style.setProperty('--h1', cvet[0]);
  el.style.setProperty('--h2', cvet[1]);
  el.innerHTML = sluch(MOTIVY)(cvet);
  return Promise.resolve(el);
}

/* ── GIPHY: пул ссылок, кэш на час в sessionStorage (лимит бесплатного ключа — 100 запросов в час) ── */
let PUL = [];
async function sobratPul(){
  if (!CFG.giphyKey) return false;
  try {
    const kesh = JSON.parse(sessionStorage.getItem('gifPul') || 'null');
    if (kesh && Date.now() - kesh.t < 3600e3 && kesh.url.length){ PUL = kesh.url; return true; }
  } catch (_) {}
  const tegi = (CFG.tegi && CFG.tegi.length) ? CFG.tegi : ['math', 'neon', 'space'];
  const otvety = await Promise.all(tegi.map(t =>
    fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(CFG.giphyKey)}&q=${encodeURIComponent(t)}&limit=15&rating=g&lang=en`)
      .then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] }))));
  PUL = otvety.flatMap(o => (o.data || []).map(g => {
    const im = g.images && (g.images.fixed_width || g.images.fixed_width_small);
    return im && (im.webp || im.url);
  })).filter(Boolean);
  try { sessionStorage.setItem('gifPul', JSON.stringify({ t: Date.now(), url: PUL })); } catch (_) {}
  return PUL.length > 8;
}

function gifPlitka(){
  const img = new Image();
  img.className = 'gw-in';
  img.alt = '';
  img.decoding = 'async';
  img.src = sluch(PUL);
  /* показываем, только когда картинка уже скачана — иначе мигнёт пустота */
  return (img.decode ? img.decode() : new Promise(r => { img.onload = r; }))
    .then(() => img).catch(() => svoyaPlitka());
}

/* ── стена ── */
async function start(){
  const gif = await sobratPul();
  const novaya = gif ? gifPlitka : svoyaPlitka;
  stena.classList.toggle('is-gif', gif);

  const plosk = document.createElement('div');
  plosk.className = 'gw-plane';
  plosk.style.setProperty('--cols', KOLONKI);
  const plitki = [];
  for (let i = 0; i < KOLONKI * RYADY; i++){
    const p = document.createElement('div');
    p.className = 'gw-tile';
    plosk.appendChild(p);
    plitki.push(p);
    novaya().then(el => p.appendChild(el));
  }
  stena.appendChild(plosk);
  if (gif){
    const znak = document.createElement('span');
    znak.className = 'gw-by';
    znak.textContent = 'Powered by GIPHY';
    stena.appendChild(znak);
  }
  if (TIHO) return;

  /* шапка ушла с экрана — ничего не крутим */
  let vidno = true;
  if ('IntersectionObserver' in window){
    new IntersectionObserver(([e]) => {
      vidno = e.isIntersecting;
      stena.classList.toggle('paused', !vidno);
    }).observe(stena);
  }
  document.addEventListener('visibilitychange', () => stena.classList.toggle('paused', document.hidden || !vidno));

  /* хаотичная смена: случайная плитка, случайная пауза */
  const smena = async () => {
    if (vidno && !document.hidden){
      const p = sluch(plitki);
      const staraya = p.firstElementChild;
      const el = await novaya();
      el.classList.add('vhod');
      p.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('vhod')));
      if (staraya) setTimeout(() => staraya.remove(), 1000);
    }
    setTimeout(smena, 900 + Math.random() * 1900);
  };
  setTimeout(smena, 1500);
}

start();
})();
