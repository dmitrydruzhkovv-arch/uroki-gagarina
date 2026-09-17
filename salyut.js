/* ════════════════════════════════════════════════════════════════
   salyut.js — праздник, когда в домашке отмечены все задания (D, 17.09.2026).

   Каждый раз по-разному: случайно выбирается эффект, цвета, фраза,
   точка вспышки и количество частиц. Без библиотек — один canvas поверх
   страницы, сам убирается, когда всё догорело.

   Эффекты: конфетти из точки нажатия · фейерверк залпами ·
            дождь из математических знаков · звёздная волна.
   Кто просит «меньше движения» в настройках телефона — видит только фразу.

   Вызов: SALYUT(kursId, x, y, vsego)
   ════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const R = (a, b) => a + Math.random() * (b - a);
const RI = (a, b) => Math.floor(R(a, b + 1));
const PICK = arr => arr[Math.floor(Math.random() * arr.length)];

const CVETA = {
  geometriya:  ['#8b5cf6', '#6366f1', '#c4b5fd', '#a78bfa', '#38bdf8'],
  algebra:     ['#ff5c8a', '#e0115f', '#fb923c', '#ffc7da', '#f472b6'],
  veroyatnost: ['#e9c6ff', '#b58bc9', '#f5f3ff', '#94a3b8', '#c084fc'],
};
const ZOLOTO = ['#fde68a', '#fbbf24', '#ffffff'];

const FRAZY = [
  n => `${n} из ${n}. Всё сделано!`,
  () => 'Домашка закрыта. Можно выдохнуть',
  () => 'Чистая работа',
  () => 'Галочки кончились. Задания тоже',
  () => 'Минус одна забота',
  () => 'Вот это темп!',
  () => 'Готово. На уроке будет легко',
  () => 'Все номера — в копилку',
  () => 'Сделано. Теперь честно отдыхать',
  () => 'Ни одного пустого кружка',
  () => 'Так и надо',
  () => 'Математика побеждена. На сегодня',
];
const EMOJI = ['🎉', '🔥', '🚀', '⭐', '🏆', '💪', '✨', '🎯', '🥳', '⚡'];
const ZNAKI = ['✓', 'π', '√', '∑', '∞', '±', 'α', '≥', '=', '½', '★', '%'];

const tiho = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── фраза: крупная плашка, каждый раз чуть под другим углом ── */
function fraza(kid, n, x, y){
  const el = document.createElement('div');
  el.className = 'salyut-fraza k-' + kid;
  el.innerHTML = `<span class="sf-e">${PICK(EMOJI)}</span><span class="sf-t">${PICK(FRAZY)(n)}</span>`;
  el.style.setProperty('--rot', R(-6, 6).toFixed(1) + 'deg');
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  setTimeout(() => el.classList.remove('on'), 2600);
  setTimeout(() => el.remove(), 3200);
}

/* ── холст и цикл частиц ── */
function holst(){
  const c = document.createElement('canvas');
  c.className = 'salyut-holst';
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  document.body.appendChild(c);
  return { c, g };
}

function zapusk(chastitsy, dop){
  const { c, g } = holst();
  let t0 = performance.now();
  const shag = t => {
    const dt = Math.min((t - t0) / 16.7, 3); t0 = t;
    g.clearRect(0, 0, innerWidth, innerHeight);
    if (dop) dop(dt, g);
    let zhivye = 0;
    for (const p of chastitsy){
      if (p.zhdat > 0){ p.zhdat -= dt; zhivye++; continue; }
      p.zhizn -= dt; if (p.zhizn <= 0) continue;
      zhivye++;
      p.vx *= p.trenie ?? 0.99; p.vy = p.vy * (p.trenie ?? 0.99) + (p.grav ?? 0.25) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.ug += (p.vr || 0) * dt;
      const a = Math.min(1, p.zhizn / 30);
      g.save(); g.globalAlpha = a; g.translate(p.x, p.y); g.rotate(p.ug);
      p.ris(g, p);
      g.restore();
    }
    if (zhivye) requestAnimationFrame(shag); else c.remove();
  };
  requestAnimationFrame(shag);
}

const pryamoug = (g, p) => { g.fillStyle = p.cv; g.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9); };
const krug     = (g, p) => { g.fillStyle = p.cv; g.beginPath(); g.arc(0, 0, p.r, 0, 7); g.fill(); };
const iskra    = (g, p) => { g.strokeStyle = p.cv; g.lineWidth = p.r; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(-p.vx * 2.2, -p.vy * 2.2); g.stroke(); };
const zvezda   = (g, p) => { g.fillStyle = p.cv; g.beginPath();
  for (let i = 0; i < 10; i++){ const rr = i % 2 ? p.r * 0.45 : p.r, a = i * Math.PI / 5;
    g.lineTo(Math.sin(a) * rr, -Math.cos(a) * rr); } g.fill(); };
const znak     = (g, p) => { g.fillStyle = p.cv; g.font = `800 ${p.r}px Onest, system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.s, 0, 0); };

/* 1. конфетти — хлопушка из точки нажатия */
function konfetti(cv, x, y){
  const n = RI(90, 160), ch = [];
  const shir = R(0.9, 1.6), vverh = R(9, 15);
  for (let i = 0; i < n; i++){
    const a = -Math.PI / 2 + R(-shir, shir);
    const v = R(4, vverh);
    ch.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, ug: R(0, 6), vr: R(-0.3, 0.3),
      r: R(3, 7), cv: PICK(cv), zhizn: R(70, 130), grav: 0.28, trenie: 0.985,
      ris: Math.random() < 0.7 ? pryamoug : krug });
  }
  zapusk(ch);
}

/* 2. фейерверк — несколько залпов в случайных местах */
function feyerverk(cv){
  const ch = [], zalpov = RI(3, 6);
  for (let z = 0; z < zalpov; z++){
    const cx = R(0.15, 0.85) * innerWidth, cy = R(0.12, 0.5) * innerHeight;
    const cvZ = [PICK(cv), PICK(cv), PICK(ZOLOTO)];
    const n = RI(40, 80), sila = R(3.5, 7), zhdat = z * R(10, 22);
    for (let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2 + R(-0.05, 0.05), v = sila * R(0.6, 1);
      ch.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, ug: 0,
        r: R(1.8, 3.2), cv: PICK(cvZ), zhizn: R(45, 80), grav: 0.06, trenie: 0.965, zhdat, ris: iskra });
    }
  }
  zapusk(ch);
}

/* 3. дождь из математических знаков */
function dozhd(cv){
  const ch = [], n = RI(40, 70);
  for (let i = 0; i < n; i++){
    ch.push({ x: R(0, innerWidth), y: R(-80, -20), vx: R(-0.6, 0.6), vy: R(2, 5), ug: R(-0.4, 0.4), vr: R(-0.03, 0.03),
      r: R(18, 38), cv: PICK([...cv, ...ZOLOTO]), zhizn: R(110, 170), grav: 0.05, trenie: 0.995,
      zhdat: R(0, 50), s: PICK(ZNAKI), ris: znak });
  }
  zapusk(ch);
}

/* 4. звёздная волна — кольцо звёзд расходится от точки, плюс волна-круг */
function volna(cv, x, y){
  const ch = [], kolec = RI(2, 3);
  for (let k = 0; k < kolec; k++){
    const n = RI(14, 24), v = R(3, 6) + k * 2;
    for (let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2 + k * 0.3;
      ch.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, ug: R(0, 6), vr: R(-0.15, 0.15),
        r: R(6, 12), cv: PICK([...cv, ...ZOLOTO]), zhizn: R(50, 80), grav: 0.04, trenie: 0.96, zhdat: k * 8, ris: zvezda });
    }
  }
  let radius = 0, ostalos = 40;
  const kv = PICK(cv);
  zapusk(ch, (dt, g) => {
    if (ostalos <= 0) return;
    ostalos -= dt; radius += 9 * dt;
    g.save(); g.globalAlpha = Math.max(0, ostalos / 40); g.strokeStyle = kv; g.lineWidth = 4;
    g.beginPath(); g.arc(x, y, radius, 0, 7); g.stroke(); g.restore();
  });
}

/* Объём «как десять нажатий подряд» в одно закрытие (D, 17.09.2026):
   8—12 залпов случайных эффектов вразнобой за ~2 секунды. Первый — из точки
   нажатия, остальные — из случайных мест экрана. Фраза одна. */
window.SALYUT = (kid, x, y, vsego) => {
  const cv = CVETA[kid] || CVETA.algebra;
  const px = x ?? innerWidth / 2, py = y ?? innerHeight / 2;
  fraza(kid, vsego, px, py);
  try { navigator.vibrate && navigator.vibrate(PICK([[40, 50, 40, 50, 90], [80, 40, 80], [30, 30, 30, 30, 30, 30, 120]])); } catch (_) {}
  if (tiho) return;
  const zalpov = RI(8, 12);
  const effekty = [konfetti, feyerverk, dozhd, volna];
  let t = 0;
  for (let i = 0; i < zalpov; i++){
    const ex = i === 0 ? px : R(0.1, 0.9) * innerWidth;
    const ey = i === 0 ? py : R(0.2, 0.85) * innerHeight;
    const fn = i === 0 ? konfetti : PICK(effekty);
    setTimeout(() => fn(cv, ex, ey), t);
    t += R(90, 260);
  }
};
})();
