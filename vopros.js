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

   Чат (ТЗ 11 A2, D 28.09): «?» открывает переписку с учителем — история,
   текст, фото; ответ учителя приходит сюда, а в бот — «Д ответил». Сайт
   живёт в обычном браузере (мини-приложение Телеграма D отверг). Кто это —
   сайт узнаёт один раз и помнит по ключу чата:
     • ссылка из бота несёт одноразовый код (#vhod=…) → сервер даёт ключ;
       код после «#»: эта часть адреса не уходит на GitHub (США);
     • открыл сам → «Войти через Телеграм» → в боте выбрать число, которое
       показывает сайт (защита от чужой ссылки «жми») → ключ.
   Пока чат не запущен для всех (CHAT_VSEM), без ключа — прежняя анкета.

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
const CHAT_KEY = 'vopros-chat-klyuch';      // ключ чата от сервера
const CHAT_SEEN = 'vopros-chat-videl';      // последний прочитанный ответ учителя
const VHOD_KEY = 'vopros-vhod';             // «Войти через Телеграм»: токен, пока ждём «Да» в боте
const TEST_KEY = 'vopros-test';             // тестер (?test=chat или ссылка тестового бота)
const BOTY = { main: 'D_mathh_bot', test: 'Lemma_test1_bot' };
/* Чат для всех: без ключа «?» зовёт войти через Телеграм, а не в анкету.
   Включить после ответа Нормы (ШТАБ_ДЕТАЛИ #norma-chat-sayt) вместе с SITE_CHAT=1
   у боевого бота. До того чат видят только вошедшие по ссылке бота и тестер. */
const CHAT_VSEM = false;

const PRICHINY = [
  ['ne-ponimayu',   '🤔', 'Не понимаю задание'],
  ['ne-reshaetsya', '😵', 'Не получается решить'],
  ['tormozit',      '📱', 'Сайт или домашка тормозит'],
  ['drugoe',        '💬', 'Другое'],
];

const dock = document.getElementById('dock');
if (!dock) return;

/* Ссылка из бота: #vhod=<одноразовый код>&chat=1 (сразу открыть чат).
   Тестер: ?test=chat. Забираем и сразу чистим адрес: код не останется
   в истории и в закладке. Уроки сайта (#algebra-10) не трогаем. */
const vosk = new URLSearchParams(location.hash.slice(1));
const vopr = new URLSearchParams(location.search);
const vhodKod = vosk.get('vhod') || '';
const zovutVChat = vosk.get('chat') === '1' || vopr.get('chat') === '1';
try {
  if (vopr.get('test') === 'chat' || vhodKod.split('.')[1] === 'test') localStorage.setItem(TEST_KEY, '1');
} catch (_) {}
if (vosk.has('vhod') || vopr.has('chat') || vopr.has('test')){
  ['chat', 'test'].forEach(k => vopr.delete(k));
  const q = vopr.toString();
  try { history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + (vosk.has('vhod') ? '' : location.hash)); } catch (_) {}
}

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
  else if (a.dataset.vq === 'poslat') poslat();
  else if (a.dataset.vq === 'foto') okno.querySelector('.vq-file').click();
  else if (a.dataset.vq === 'bystro') poslat(a.dataset.tekst);
  else if (a.dataset.vq === 'uvelichit') uvelichit(a.getAttribute('src'));
  else if (a.dataset.vq === 'signal'){ okno.classList.remove('vq-chat'); nachat(); }
  else if (a.dataset.vq === 'snova'){ e.preventDefault(); vhodEkran(); }
  else if (a.dataset.vq === 'tg'){
    if (!a.dataset.token){ e.preventDefault(); return; }   // вход ещё готовится
    zhdat(a.dataset.token);                               // ссылка сама откроет Телеграм
  }
}

function otkryt(){
  if (!okno) postroit();
  if (chatKey()) chatNachat();
  else if (CHAT_VSEM || tester()) vhodEkran();
  else { okno.classList.remove('vq-chat'); nachat(); }
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
  clearInterval(chatTaimer); chatTaimer = null;
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

/* ═════════════ ЧАТ С УЧИТЕЛЕМ (ТЗ 11 A2) ═════════════ */
const SKREPKA = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"/></svg>';
const STRELKA = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4l17.4-7.5a1 1 0 0 0 0-1.8L3.4 3.6a1 1 0 0 0-1.4 1.1L4 11l9 1-9 1-2 6.3a1 1 0 0 0 1.4 1.1z"/></svg>';

let chatTaimer = null, chatBase = '', lenta = [], lastId = 0, tyanu = false;

/* ключ вида bot.id.srok.podpis; просроченный не используем */
function chatKey(){
  const k = mem.get(CHAT_KEY);
  const srok = +(k.split('.')[2] || 0);
  return srok * 1000 > Date.now() ? k : '';
}
function zabytKlyuch(){ try { localStorage.removeItem(CHAT_KEY); } catch (_) {} }
const tester = () => mem.get(TEST_KEY) === '1';
function vzyatKlyuch(d){                               // ответ сервера с ключом → в память
  mem.set(CHAT_KEY, d.key);
  if (d.bot === 'test') mem.set(TEST_KEY, '1');
}

/* вход 1: одноразовый код из ссылки бота */
async function vhodPoKodu(){
  if (!vhodKod) return;
  try {
    const base = await serverBase();
    const r = await timedFetch(base + '/chat/login/code', {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: vhodKod }),
    }, 15000);
    const d = await r.json();
    if (d.ok && d.key) vzyatKlyuch(d);
    /* код уже использован — не беда: ключ с прошлого входа лежит в памяти браузера,
       а если нет — «?» предложит войти через Телеграм */
  } catch (_) { baseP = null; }
}

/* вход 2: «Войти через Телеграм». Сайт берёт токен, ребёнок жмёт ссылку
   t.me/<бот>?start=site-<токен>, в боте «Да, это я», сайт забирает ключ.
   Токен лежит в памяти браузера: если страница перезагрузится, пока ребёнок
   в Телеграме, вход всё равно закончится. */
let vhodTaimer = null;
const VHOD_MS = 10 * 60e3;

function vhodEkran(){
  okno.classList.remove('vq-chat');
  okno.innerHTML = `
    <div class="vq-head">${blok('vq-mini')}<h2 id="vq-h">Чат с учителем</h2>
      <button type="button" class="vq-x" data-vq="zakryt" aria-label="Закрыть">✕</button></div>
    <div class="vq-telo vq-vhod">
      <p class="vq-vhod-t">Здесь можно переписываться с учителем и присылать фото решений. Войди через Телеграм — один раз на этом устройстве.</p>
      <div class="vq-chislo" hidden><span>В Телеграме нажми число</span><b></b></div>
      <a class="vq-send vq-tg" data-vq="tg" aria-disabled="true">Готовлю вход…</a>
      <p class="vq-zhdu" hidden>Нажми в Телеграме это число и возвращайся сюда — чат откроется сам.</p>
      <p class="vq-err" hidden></p>
      <button type="button" class="vq-link" data-vq="signal">Нет Телеграма? Быстрый сигнал учителю</button>
    </div>`;
  gotovitVhod();
}

function nachatyiVhod(){                              // вход, начатый раньше и ещё живой
  let v = null;
  try { v = JSON.parse(localStorage.getItem(VHOD_KEY) || 'null'); } catch (_) {}
  return v && v.t && v.kod && Date.now() - v.ts < VHOD_MS ? v : null;
}

function pokazatVhod(a, token, kod){
  a.href = `https://t.me/${tester() ? BOTY.test : BOTY.main}?start=site-${token}`;
  a.dataset.token = token; a.dataset.kod = kod;
  a.removeAttribute('aria-disabled');
  a.textContent = '✈️ Войти через Телеграм';
  const ch = okno.querySelector('.vq-chislo');
  ch.querySelector('b').textContent = kod;
  ch.hidden = false;
}

async function gotovitVhod(){
  const a = okno.querySelector('.vq-tg');
  if (!a) return;
  const v = nachatyiVhod();
  if (v){                                               // вернулся, а вход ещё ждёт — то же число
    pokazatVhod(a, v.t, v.kod);
    okno.querySelector('.vq-zhdu').hidden = false;
    return;
  }
  try {
    const base = await serverBase();
    const r = await timedFetch(base + '/chat/login/start', { method: 'POST', cache: 'no-store' }, 15000);
    const d = await r.json();
    if (!d.ok || !d.token) throw new Error(d.error || 'нет токена');
    pokazatVhod(a, d.token, d.kod);
  } catch (_) {
    baseP = null;
    a.dataset.vq = 'snova'; a.removeAttribute('aria-disabled'); a.textContent = 'Попробовать ещё раз';
    oshibka('Не получилось связаться с сервером. Проверь интернет.');
  }
}

function zhdat(token){
  const a = okno && okno.querySelector('.vq-tg');
  try { localStorage.setItem(VHOD_KEY, JSON.stringify({ t: token, kod: a ? a.dataset.kod : '', ts: Date.now() })); } catch (_) {}
  const z = okno && okno.querySelector('.vq-zhdu');
  if (z) z.hidden = false;
  zhdatFonom();
}
function zhdatFonom(){
  clearInterval(vhodTaimer);
  vhodTaimer = setInterval(() => { if (!document.hidden) proveritVhod(); }, 2500);
}
function zabytVhod(){
  clearInterval(vhodTaimer); vhodTaimer = null;
  try { localStorage.removeItem(VHOD_KEY); } catch (_) {}
}

async function proveritVhod(){
  let v = null;
  try { v = JSON.parse(localStorage.getItem(VHOD_KEY) || 'null'); } catch (_) {}
  if (!v || !v.t || Date.now() - v.ts > VHOD_MS){ zabytVhod(); return 'old'; }
  try {
    const base = await serverBase();
    const r = await timedFetch(`${base}/chat/login/check?token=${encodeURIComponent(v.t)}`, { cache: 'no-store' }, 10000);
    const d = await r.json();
    if (d.status === 'ok' && d.key){
      zabytVhod(); vzyatKlyuch(d);
      if (otkryto) chatNachat(); else otkryt();      // ради чата и входил — сразу показываем
      return 'ok';
    }
    if (d.status === 'old'){                           // устарел или в боте выбрали не то число
      zabytVhod();
      if (otkryto && okno.querySelector('.vq-vhod')){ vhodEkran(); oshibka('Вход не получился — нажми «Войти» ещё раз.'); }
      return 'old';
    }
    return 'wait';
  } catch (_) { baseP = null; return 'wait'; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && vhodTaimer) proveritVhod(); });

/* страница открылась, а вход начат раньше (вернулся из Телеграма, страница перезагрузилась) */
async function dozhdatsya(){
  if (!mem.get(VHOD_KEY)) return;
  if (await proveritVhod() === 'wait') zhdatFonom();
}

function urokSejchas(){
  const m = /^#([a-z]{2,20}-\d{1,3})$/.exec(location.hash);
  return m ? m[1] : '';
}
const zagolovki = t => ({ 'X-Chat-Key': chatKey(), ...(t ? { 'Content-Type': t } : {}) });
const fotoUrl = name => `${chatBase}/chat/photo/${encodeURIComponent(name)}?k=${encodeURIComponent(chatKey())}`;

function chatNachat(){
  okno.classList.add('vq-chat');
  okno.innerHTML = `
    <div class="vq-head">${blok('vq-mini')}<h2 id="vq-h">Чат с учителем</h2>
      <button type="button" class="vq-x" data-vq="zakryt" aria-label="Закрыть">✕</button></div>
    <div class="vq-lenta" role="log" aria-live="polite"><div class="vq-pusto">Загружаю…</div></div>
    <p class="vq-err" hidden></p>
    <div class="vq-pole">
      <button type="button" class="vq-skrepka" data-vq="foto" aria-label="Прикрепить фото">${SKREPKA}</button>
      <input type="file" class="vq-file" accept="image/*" hidden>
      <textarea class="vq-vvod" rows="1" maxlength="2000" placeholder="Напиши сообщение…" aria-label="Сообщение учителю"></textarea>
      <button type="button" class="vq-go" data-vq="poslat" aria-label="Отправить">${STRELKA}</button>
    </div>`;
  lenta = []; lastId = 0;
  const vvod = okno.querySelector('.vq-vvod');
  vvod.addEventListener('input', () => rost(vvod));
  /* Enter отправляет только на компьютере; на телефоне это перенос строки */
  vvod.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer:fine)').matches){ e.preventDefault(); poslat(); }
  });
  okno.querySelector('.vq-file').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) poslatFoto(f);
  });
  tyanut(true);
  clearInterval(chatTaimer);
  chatTaimer = setInterval(() => { if (!document.hidden) tyanut(false); }, 4000);
}

function rost(el){ el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 4, 120) + 'px'; }

function oshibka(text){
  const e = okno && okno.querySelector('.vq-err');
  if (!e) return;
  e.textContent = text || ''; e.hidden = !text;
}

const DNI = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
function denPodpis(d){
  const s = new Date(); s.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const n = Math.round((s - x) / 864e5);
  if (n === 0) return 'Сегодня';
  if (n === 1) return 'Вчера';
  return `${DNI[x.getDay()]}, ${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}`;
}
const vremya = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

function risovat(vniz){
  const box = okno && okno.querySelector('.vq-lenta');
  if (!box) return;
  const bylVnizu = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  if (!lenta.length){
    box.innerHTML = `<div class="vq-pusto">
      <p>Застрял? Напиши, что не получается, или сфоткай решение <b>📎</b>. Учитель ответит здесь, а бот пришлёт уведомление.</p>
      <div class="vq-chips vq-prichiny">
        ${PRICHINY.filter(p => p[0] !== 'drugoe').map(([, e, t]) =>
          `<button type="button" class="vq-chip" data-vq="bystro" data-tekst="${esc(e + ' ' + t)}"><span class="e">${e}</span>${esc(t)}</button>`).join('')}
      </div></div>`;
    return;
  }
  let den = '', html = '';
  lenta.forEach(m => {
    const d = new Date(m.ts);
    const dp = denPodpis(d);
    if (dp !== den){ den = dp; html += `<div class="vq-den">${dp}</div>`; }
    const src = m.preview || (m.photo ? fotoUrl(m.photo) : '');
    html += `<div class="vq-msg ${m.who === 's' ? 'moe' : 'ego'}${m.zhdet ? ' zhdet' : ''}">
      ${src ? `<img src="${esc(src)}" alt="Фото" data-vq="uvelichit">` : ''}
      ${m.text ? `<div class="t">${esc(m.text)}</div>` : ''}
      <div class="vr">${m.zhdet ? 'отправляю…' : vremya(d)}</div></div>`;
  });
  box.innerHTML = html;
  if (vniz || bylVnizu){
    box.scrollTop = box.scrollHeight;
    /* картинки догружаются позже и сдвигают низ — докручиваем */
    box.querySelectorAll('img').forEach(i => i.addEventListener('load', () => { box.scrollTop = box.scrollHeight; }, { once: true }));
  }
}

function videl(){
  const d = lenta.filter(m => m.who === 'd' && m.id).pop();
  if (d && d.id > (+mem.get(CHAT_SEEN) || 0)) mem.set(CHAT_SEEN, String(d.id));
  knopka.classList.remove('est-otvet');
}

async function tyanut(pervyi){
  if (tyanu || !chatKey()) return;
  tyanu = true;
  try {
    chatBase = await serverBase();
    const r = await timedFetch(`${chatBase}/chat/history?after=${lastId}`, { cache: 'no-store', headers: zagolovki() }, 15000);
    if (r.status === 401){ zabytKlyuch(); vhodEkran(); return; }
    const d = await r.json();
    if (d.key) mem.set(CHAT_KEY, d.key);             // сервер продлил ключ
    if (d.msgs && d.msgs.length){
      lastId = d.msgs[d.msgs.length - 1].id;
      lenta = lenta.filter(m => !m.zhdet).concat(d.msgs, lenta.filter(m => m.zhdet));
    }
    if (pervyi || (d.msgs && d.msgs.length)) risovat(pervyi);
    if (otkryto) videl();
    if (pervyi) oshibka('');
  } catch (_) {
    baseP = null;
    if (pervyi) oshibka('Не получилось загрузить переписку. Проверь интернет.');
  } finally { tyanu = false; }
}

function poslat(gotovyi){
  const vvod = okno.querySelector('.vq-vvod');
  const text = String(gotovyi || vvod.value).trim();
  if (!text) return;
  if (!gotovyi){ vvod.value = ''; rost(vvod); }
  otpravitVChat(JSON.stringify({ text, urok: urokSejchas() }), 'application/json', { text }, () => {
    if (!gotovyi && !vvod.value){ vvod.value = text; rost(vvod); }     // вернуть текст, чтобы не набирать заново
  });
}

/* фото с телефона бывает 5–10 МБ: уменьшаем до 1600 px и JPEG. Заодно отпадают
   геометка и прочие данные снимка, и iPhone-формат HEIC превращается в обычный */
function szhat(file){
  return new Promise(done => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { URL.revokeObjectURL(url); done(b); }, 'image/jpeg', 0.85);
      } catch (_) { URL.revokeObjectURL(url); done(null); }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      done(/^image\/(jpeg|png|webp)$/.test(file.type) && file.size < 8e6 ? file : null);
    };
    img.src = url;
  });
}

async function poslatFoto(file){
  oshibka('');
  const blob = await szhat(file);
  if (!blob){ oshibka('Это не фото или оно слишком большое. Попробуй другое.'); return; }
  const vvod = okno.querySelector('.vq-vvod');
  const text = vvod.value.trim();
  vvod.value = ''; rost(vvod);
  const fd = new FormData();
  fd.append('photo', blob, 'foto.jpg');
  if (text) fd.append('text', text);
  if (urokSejchas()) fd.append('urok', urokSejchas());
  otpravitVChat(fd, '', { text, preview: URL.createObjectURL(blob) }, () => {
    if (text && !vvod.value){ vvod.value = text; rost(vvod); }
  });
}

async function otpravitVChat(body, tip, vid, vernut){
  oshibka('');
  const m = Object.assign({ who: 's', ts: new Date().toISOString(), zhdet: true }, vid);
  lenta.push(m); risovat(true);
  const ubrat = () => { lenta = lenta.filter(x => x !== m); risovat(); if (m.preview) URL.revokeObjectURL(m.preview); };
  try {
    chatBase = await serverBase();
    const r = await timedFetch(chatBase + '/chat/send',
      { method: 'POST', cache: 'no-store', headers: zagolovki(tip), body }, 45000);
    if (r.status === 429){ ubrat(); vernut(); oshibka('Много сообщений подряд. Подожди пару минут.'); return; }
    if (r.status === 401){ ubrat(); zabytKlyuch(); vhodEkran(); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    lenta = lenta.filter(x => x !== m);            // настоящее сообщение придёт с сервера
    await tyanut(false);
    risovat(true);
    if (m.preview) setTimeout(() => URL.revokeObjectURL(m.preview), 60000);
  } catch (_) {
    baseP = null;
    ubrat(); vernut();
    oshibka(vid.preview ? 'Фото не отправилось. Проверь интернет и прикрепи ещё раз.'
                        : 'Не отправилось. Проверь интернет и нажми ещё раз.');
  }
}

function uvelichit(src){
  const d = document.createElement('div');
  d.className = 'vq-bigfoto';
  d.innerHTML = `<img src="${esc(src)}" alt="Фото">`;
  d.addEventListener('click', () => d.remove());
  document.body.appendChild(d);
}

/* красная точка на «?», если учитель ответил, а ребёнок ещё не видел */
async function estOtvet(){
  if (!chatKey() || otkryto || document.hidden) return;
  try {
    const base = await serverBase();
    const r = await timedFetch(`${base}/chat/history?after=${+mem.get(CHAT_SEEN) || 0}`,
      { cache: 'no-store', headers: zagolovki() }, 15000);
    if (r.status === 401){ zabytKlyuch(); return; }
    const d = await r.json();
    if (d.key) mem.set(CHAT_KEY, d.key);
    knopka.classList.toggle('est-otvet', !!(d.msgs || []).some(m => m.who === 'd'));
  } catch (_) {}
}

(async () => {
  await vhodPoKodu();
  await dozhdatsya();                    // вход, начатый до перезагрузки, откроет чат сам
  setInterval(estOtvet, 60000);
  if (!chatKey() || otkryto) return;
  if (zovutVChat) otkryt();
  else estOtvet();
})();
})();

