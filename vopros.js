/* ════════════════════════════════════════════════════════════════
   vopros.js — блок «?» у часов: ребёнок застрял и зовёт учителя
   (ТЗ 11, просьба D 25.09.2026, Кодер).

   Детям страшно признаться, что не понимают, и трудно сформулировать
   вопрос. Поэтому всё выбирается кнопками: про какую домашку и что
   случилось, писать не обязательно. Тап по блоку — как в «Марио»:
   блок подпрыгивает, вылетает монетка, звенит.

   Куда уходит: наш сервер в РФ (vk_bot/hw_report.py, адрес /help),
   оттуда D в Телеграм. Лимиты от баловства держит сервер.

   Кто спрашивает: имя, которое спрашивают веб-домашки класса (ключ
   hw-core-name-g9). Сайт и домашки живут на одном адресе, поэтому имя
   видят и те и другие. Имени нет — окно спросит его один раз.

   Сервер: сначала прямой адрес, не ответил за 5 с (у ребёнка VPN) —
   запасной через шлюз в Хельсинки. Та же схема и тот же ключ памяти,
   что в hw-core.js. Сам движок домашек сюда не подключаем: он вешает
   щелчок и вспышку на каждую кнопку сайта.
   ════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const HOSTS = ['https://194-87-110-53.nip.io', 'https://hw.157-228-128-116.nip.io'];
const HOST_KEY = 'hw-core-host';
const PROBE_MS = 5000;
const KLASS = 'g9';
const NAME_KEY = 'hw-core-name-' + KLASS;
const HINT_KEY = 'vopros-podskazka';        // сколько раз показали «что это за ?»; 9 — нажимал сам

const PRICHINY = [
  ['ne-ponimayu',   '🤔', 'Не понимаю задание'],
  ['ne-reshaetsya', '😵', 'Не получается решить'],
  ['tormozit',      '📱', 'Сайт или домашка тормозит'],
  ['drugoe',        '💬', 'Другое'],
];

const dock = document.getElementById('dock');
if (!dock) return;

const esc = t => String(t == null ? '' : t)
  .replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const mem = {
  get(k){ try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch (_) {} },
};
/* как в hw-core.js: только буквы, пробел и дефис — точка там разделитель кода разбора */
const cleanName = s => String(s || '').replace(/[^A-Za-zА-Яа-яЁё \-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);

/* ═════════════ БЛОК «?»: пиксели 16×16, рисуем сами ═════════════ */
const ZNAK = ['.####.', '##..##', '....##', '...##.', '..##..', '..##..', '......', '..##..'];
const pikseli = (x0, y0) => ZNAK.flatMap((row, y) => [...row].map((c, x) =>
  c === '#' ? `<rect x="${x0 + x}" y="${y0 + y}" width="1" height="1"/>` : '')).join('');
const blok = cls => `<svg class="${cls}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
  <rect width="16" height="16" fill="#3b1a07"/>
  <rect x="1" y="1" width="14" height="14" fill="#f4a91f"/>
  <rect x="1" y="1" width="14" height="1" fill="#ffd66b"/><rect x="1" y="1" width="1" height="14" fill="#ffd66b"/>
  <rect x="1" y="14" width="14" height="1" fill="#c46a0c"/><rect x="14" y="1" width="1" height="14" fill="#c46a0c"/>
  <g fill="#7a3d0a"><rect x="2" y="2" width="1" height="1"/><rect x="13" y="2" width="1" height="1"/><rect x="2" y="13" width="1" height="1"/><rect x="13" y="13" width="1" height="1"/></g>
  <g fill="#7a3d0a">${pikseli(6, 5)}</g>
  <g class="vq-znak" fill="#fff4d6">${pikseli(5, 4)}</g>
</svg>`;

const knopka = document.createElement('button');
knopka.type = 'button';
knopka.className = 'vopros';
knopka.title = 'Не получается? Позови учителя';
knopka.setAttribute('aria-label', 'Не получается? Позвать учителя');
knopka.innerHTML = blok('vq-blok') + '<span class="vq-moneta" aria-hidden="true"></span>';
dock.prepend(knopka);
dock.classList.add('s-voprosom');
document.body.classList.add('est-vopros');

/* звон монетки: две ноты прямоугольной волной, тихо. Без звука (беззвучный режим) — не беда */
let actx = null;
function zvon(){
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime;
    [[988, 0, .09], [1319, .09, .34]].forEach(([f, s, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t + s);
      g.gain.exponentialRampToValueAtTime(.06, t + s + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + s + d);
      o.connect(g); g.connect(actx.destination);
      o.start(t + s); o.stop(t + s + d + .02);
    });
  } catch (_) {}
}

/* ═════════════ ПОДСКАЗКА «что это за ?» ═════════════
   D (25.09): «вопросик — а что он означает?» Первые три захода на сайт
   под блоком всплывает пояснение. Нажал блок сам — больше не показываем. */
let hint = null;
function podskazka(){
  if (document.body.classList.contains('sheet-open') || otkryto) return;
  mem.set(HINT_KEY, String((+mem.get(HINT_KEY) || 0) + 1));
  hint = document.createElement('div');
  hint.className = 'vq-hint';
  hint.setAttribute('role', 'status');
  hint.textContent = 'Не получается? Жми «?» — учитель поможет';
  document.body.appendChild(hint);
  const b = knopka.getBoundingClientRect();
  const w = hint.offsetWidth, left = Math.max(10, Math.min(b.left + b.width / 2 - 26, innerWidth - w - 10));
  hint.style.left = left + 'px';
  hint.style.top = (b.bottom + 12) + 'px';
  hint.style.setProperty('--strelka', Math.round(b.left + b.width / 2 - left - 6) + 'px');
  requestAnimationFrame(() => hint && hint.classList.add('on'));
  setTimeout(ubratPodskazku, 6500);
}
function ubratPodskazku(){
  if (!hint) return;
  const h = hint; hint = null;
  h.classList.remove('on');
  setTimeout(() => h.remove(), 400);
}
if ((+mem.get(HINT_KEY) || 0) < 3) setTimeout(podskazka, 1800);

/* ═════════════ ДОМАШКИ «про что» — из data.js ═════════════ */
function dateOf(str){                                   /* как в app.js: «29.09» → дата учебного года */
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(String(str || '').trim());
  if (!m || typeof DATA === 'undefined') return null;
  const years = ((DATA.site && DATA.site.year) || '').match(/\d{4}/g) || [];
  const y = +(+m[2] >= 9 ? years[0] : years[1]) || new Date().getFullYear();
  return new Date(y, +m[2] - 1, +m[1]);
}
function domashki(){
  if (typeof DATA === 'undefined') return [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const vecher = new Date().getHours() >= 16;          /* школьный день кончился — сегодняшнюю уже сдали */
  const out = [];
  (DATA.kursy || []).forEach(k => (k.uroki || []).forEach(u => {
    const due = u.dz && dateOf(u.dz.due);
    if (due && (due > today || (+due === +today && !vecher))) out.push({ k, u, due });
  }));
  return out.sort((a, b) => a.due - b.due).slice(0, 4);
}
const korotko = t => { t = String(t || ''); return t.length > 28 ? t.slice(0, 27) + '…' : t; };

/* ═════════════ ОКНО ВОПРОСА ═════════════ */
let okno = null, fon = null, otkryto = false;
let spisok = [], pro = null, prichina = null, zanyato = false;

function postroit(){
  fon = document.createElement('div');
  fon.className = 'vq-bg'; fon.hidden = true;
  okno = document.createElement('section');
  okno.className = 'vq'; okno.hidden = true; okno.tabIndex = -1;
  okno.setAttribute('role', 'dialog');
  okno.setAttribute('aria-modal', 'true');
  okno.setAttribute('aria-labelledby', 'vq-h');
  document.body.append(fon, okno);
  fon.addEventListener('click', zakryt);
  okno.addEventListener('click', onKlik);
  okno.addEventListener('input', obnovit);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && otkryto) zakryt(); });
}

function imyaSejchas(){
  const inp = okno.querySelector('#vq-imya');
  return inp && !inp.closest('[hidden]') ? cleanName(inp.value) : cleanName(mem.get(NAME_KEY));
}

function nachat(){
  spisok = domashki();
  pro = spisok.length ? 0 : null;                      // ближайшая домашка — по умолчанию
  prichina = null;
  const imya = cleanName(mem.get(NAME_KEY));
  okno.innerHTML = `
    <div class="vq-head">${blok('vq-mini')}<h2 id="vq-h">Что случилось?</h2>
      <button type="button" class="vq-x" data-vq="zakryt" aria-label="Закрыть">✕</button></div>
    <div class="vq-telo">
      <div class="vq-imya"${imya ? ' hidden' : ''}>
        <label for="vq-imya">Как тебя зовут?</label>
        <input id="vq-imya" autocomplete="given-name" placeholder="Имя" maxlength="24" value="${esc(imya)}">
      </div>
      ${imya ? `<div class="vq-kto">Спрашивает <b>${esc(imya)}</b> · <button type="button" data-vq="ne-ya">не ты?</button></div>` : ''}
      ${spisok.length ? `<div class="vq-sec">Про что</div>
      <div class="vq-chips">
        ${spisok.map((d, i) => `<button type="button" class="vq-chip" data-pro="${i}" aria-pressed="${i === 0}">${esc(d.k.icon || '')} ${esc(d.k.name)} · к ${esc(d.u.dz.due)}</button>`).join('')}
        <button type="button" class="vq-chip" data-pro="net" aria-pressed="false">Другое</button>
      </div>` : ''}
      <div class="vq-sec">Что не так</div>
      <div class="vq-chips vq-prichiny">
        ${PRICHINY.map(([id, e, t]) => `<button type="button" class="vq-chip" data-prichina="${id}" aria-pressed="false"><span class="e">${e}</span>${esc(t)}</button>`).join('')}
      </div>
      <textarea class="vq-tekst" maxlength="300" rows="2" placeholder="Можешь дописать пару слов — необязательно"></textarea>
      <button type="button" class="vq-send" data-vq="otpravit" disabled>🙋 Позвать учителя</button>
      <p class="vq-err" hidden></p>
      <p class="vq-note">Спросить — это нормально. Учитель увидит твоё имя и напишет тебе.</p>
    </div>`;
  obnovit();
}

function obnovit(){
  if (!okno || zanyato) return;
  const b = okno.querySelector('[data-vq="otpravit"]');
  if (b) b.disabled = !(prichina && imyaSejchas().length >= 2);
}

function otmetit(sel, el){
  okno.querySelectorAll(sel).forEach(x => x.setAttribute('aria-pressed', String(x === el)));
}

function onKlik(e){
  const t = e.target;
  const p = t.closest('[data-pro]');
  if (p){ pro = p.dataset.pro === 'net' ? null : +p.dataset.pro; otmetit('[data-pro]', p); return; }
  const r = t.closest('[data-prichina]');
  if (r){ prichina = r.dataset.prichina; otmetit('[data-prichina]', r); obnovit(); return; }
  const a = t.closest('[data-vq]');
  if (!a) return;
  if (a.dataset.vq === 'zakryt') zakryt();
  else if (a.dataset.vq === 'ne-ya'){
    okno.querySelector('.vq-kto').remove();
    const box = okno.querySelector('.vq-imya');
    box.hidden = false;
    const inp = box.querySelector('input'); inp.value = ''; inp.focus();
    obnovit();
  }
  else if (a.dataset.vq === 'otpravit') otpravit();
}

function otkryt(){
  if (!okno) postroit();
  nachat();
  fon.hidden = false; okno.hidden = false;
  document.body.classList.add('vq-otkryto');
  otkryto = true;
  requestAnimationFrame(() => { fon.classList.add('on'); okno.classList.add('on'); okno.focus({ preventScroll: true }); });
}

function zakryt(){
  if (!otkryto) return;
  otkryto = false;
  fon.classList.remove('on'); okno.classList.remove('on');
  document.body.classList.remove('vq-otkryto');
  setTimeout(() => { if (!otkryto){ fon.hidden = true; okno.hidden = true; } }, 280);
  knopka.focus({ preventScroll: true });
}

knopka.addEventListener('click', () => {
  mem.set(HINT_KEY, '9'); ubratPodskazku();
  zvon();
  knopka.classList.remove('bump'); void knopka.offsetWidth; knopka.classList.add('bump');
  setTimeout(otkryt, 260);
});

/* ═════════════ ОТПРАВКА ═════════════ */
function timedFetch(url, opts, ms){
  const ctrl = window.AbortController ? new AbortController() : null;
  const t = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
  if (ctrl) opts.signal = ctrl.signal;
  return fetch(url, opts).then(r => { clearTimeout(t); return r; }, e => { clearTimeout(t); throw e; });
}
function hostOrder(){
  const saved = mem.get(HOST_KEY);
  return HOSTS.indexOf(saved) > 0 ? [saved].concat(HOSTS.filter(h => h !== saved)) : HOSTS.slice();
}
/* живой адрес сервера: кто ответил на /health, туда и шлём (как в hw-core.js) */
let baseP = null;
function serverBase(){
  if (baseP) return baseP;
  const order = hostOrder();
  baseP = new Promise(done => {
    let i = 0;
    (function next(){
      if (i >= order.length){ baseP = null; done(HOSTS[0]); return; }
      const h = order[i++];
      timedFetch(h + '/health', { mode: 'no-cors', cache: 'no-store' }, PROBE_MS).then(() => {
        if (h === HOSTS[0]) { try { localStorage.removeItem(HOST_KEY); } catch (_) {} }
        else mem.set(HOST_KEY, h);
        done(h);
      }, next);
    })();
  });
  return baseP;
}

async function otpravit(){
  const imya = imyaSejchas();
  if (zanyato || !prichina || imya.length < 2) return;
  zanyato = true;
  const btn = okno.querySelector('[data-vq="otpravit"]'), err = okno.querySelector('.vq-err');
  btn.disabled = true; btn.textContent = 'Отправляю…'; err.hidden = true;
  const d = pro == null ? null : spisok[pro];
  const body = {
    token: `${KLASS}-${imya}`.slice(0, 40),
    reason: prichina,
    pro: d ? `${d.k.name} · урок ${d.u.n} «${korotko(d.u.title)}» · к ${d.u.dz.due}` : (spisok.length ? 'Не про домашку' : ''),
    urok: d ? `${d.k.id}-${d.u.n}` : '',
    text: okno.querySelector('.vq-tekst').value.trim().slice(0, 300),
  };
  try {
    const base = await serverBase();
    const r = await timedFetch(base + '/help', {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, 15000);
    if (!r.ok && r.status !== 429) throw new Error('HTTP ' + r.status);
    mem.set(NAME_KEY, imya);                             // то же имя увидят веб-домашки класса
    gotovo(r.status === 429);
  } catch (_) {
    baseP = null;                                        // в следующий раз адрес пощупаем заново
    err.textContent = 'Не получилось отправить. Проверь интернет и нажми ещё раз.';
    err.hidden = false;
    btn.textContent = '🙋 Позвать учителя';
    zanyato = false;
    obnovit();
  }
}

function gotovo(uzhe){
  zanyato = false;
  okno.querySelector('.vq-telo').innerHTML = `
    <div class="vq-done">
      <div class="vq-big">${uzhe ? '🙂' : '✅'}</div>
      <h3>${uzhe ? 'Учитель уже знает про твой вопрос' : 'Готово! Учитель получил сигнал'}</h3>
      <p>${uzhe ? 'Скоро напишет — подожди немного.' : 'Он напишет тебе, как только увидит. А пока можно отдохнуть или решать дальше.'}</p>
      <button type="button" class="vq-send" data-vq="zakryt">Хорошо</button>
    </div>`;
  okno.focus({ preventScroll: true });
}
})();
