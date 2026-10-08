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
   сайт узнаёт один раз и помнит по ключу чата: «Получить код в Телеграме»
   → бот присылает 4 цифры → ученик вводит их здесь → ключ. Код рождается в
   Телеграме ученика, поэтому чужая ссылка «жми» не впустит шутника в его чат.
   Ссылки бота на сайт кода не несут — их можно пересылать.
   Пока чат не запущен для всех (CHAT_VSEM), без ключа — прежняя анкета.

   Учитель (D 07.10, на сервере флаг SITE_CHAT_D): D входит тем же кодом, сервер узнаёт
   его и вместо чата отдаёт учеников — лента имён над перепиской, цифра на «?» — сколько
   чатов ждут ответа. У обеих сторон: нажал на сообщение — реакция (одна от человека)
   или «Ответить» с цитатой. Сервер без флага про это молчит — окно остаётся прежним.
   Журнал (zhurnal.html) подключает этот же файл: вошедшему в журнал через бота код
   второй раз не нужен — берём его ключ (zh:ck).

   Сервер: сначала прямой адрес, не ответил за 5 с (у ребёнка VPN) —
   запасной через шлюз в Хельсинки. Та же схема и тот же ключ памяти,
   что в hw-core.js. Сам движок домашек сюда не подключаем: он вешает
   щелчок и вспышку на каждую кнопку сайта.
   ════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ?chatapi=http://127.0.0.1:порт — стенд на этом же компьютере (как ?api= у журнала); чужой адрес так не подставить */
const HOSTS = (() => {
  try {
    const p = new URLSearchParams(location.search), q = p.get('chatapi') || '';
    if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d{2,5})?$/.test(q)) return [q];
    /* журнал на стенде (?api=http://127.0.0.1…): чат тоже не ходит на боевой сервер */
    const zh = /^(http:\/\/(127\.0\.0\.1|localhost)(:\d{2,5})?)(\/[\w\/-]*)?$/.exec(p.get('api') || '');
    if (zh) return [zh[1]];
  } catch (_) {}
  return ['https://194-87-110-53.nip.io', 'https://hw.157-228-128-116.nip.io'];
})();
const HOST_KEY = 'hw-core-host';
const PROBE_MS = 5000;
const KLASS = 'g9';
const NAME_KEY = 'hw-core-name-' + KLASS;
const HINT_KEY = 'vopros-podskazka';        // сколько раз показали «что это за ?»; 9 — нажимал сам
const CHAT_KEY = 'vopros-chat-klyuch';      // ключ чата от сервера
const CHAT_SEEN = 'vopros-chat-videl';      // последний прочитанный ответ учителя
const VHOD_KEY = 'vopros-vhod';             // начатый вход: токен ссылки в бота и когда начат
const TEST_KEY = 'vopros-test';             // тестер (?test=chat): вход через тестового бота
const VYSHEL_KEY = 'vopros-vyshel';         // ключ журнала, с которым из чата вышли кнопкой «Выйти»: в чат по нему больше не пускаем
const UCH_KEY = 'vopros-uchitel';           // сервер сказал: это учитель — вместо чата список учеников
const BYSTRYE = ['👍', '❤️', '🔥', '👏', '😂', '🤔'];
const BOTY = { main: 'D_mathh_bot', test: 'Lemma_test1_bot' };
/* Чат для всех: без ключа «?» зовёт войти через Телеграм, а не в анкету.
   Включить после ответа Нормы (ШТАБ_ДЕТАЛИ #norma-chat-sayt) вместе с SITE_CHAT=1
   у боевого бота. До того чат видят только вошедшие, тестер и пришедшие по
   кнопке бота «Открыть чат». */
const CHAT_VSEM = true;
/* Знак «?» в журнале и вход в чат по ключу журнала (D 07.10). false — в журнале знака нет, чат только по своему коду. */
const V_ZHURNALE = true;

const PRICHINY = [
  ['ne-ponimayu',   '🤔', 'Не понимаю задание'],
  ['ne-reshaetsya', '😵', 'Не получается решить'],
  ['tormozit',      '📱', 'Сайт или домашка тормозит'],
  ['drugoe',        '💬', 'Другое'],
];

const dock = document.getElementById('dock');
if (!dock) return;
if (!V_ZHURNALE && /zhurnal\.html$/.test(location.pathname)) return;

/* Кнопка бота «Открыть чат»: #chat=1. Тестер: ?test=chat. Забираем и чистим
   адрес, чтобы это не осталось в закладке. Уроки сайта (#algebra-10) не трогаем. */
const vopr = new URLSearchParams(location.search);
const zovutVChat = location.hash === '#chat=1' || vopr.get('chat') === '1';
try { if (vopr.get('test') === 'chat') localStorage.setItem(TEST_KEY, '1'); } catch (_) {}
if (zovutVChat || vopr.has('test')){
  ['chat', 'test'].forEach(k => vopr.delete(k));
  const q = vopr.toString();
  try { history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + (location.hash === '#chat=1' ? '' : location.hash)); } catch (_) {}
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
/* учителю подсказка «позови учителя» ни к чему: ни вошедшему в чат, ни открывшему журнал своим ключом */
const uchitelZhurnala = () => { try { return !!(localStorage.getItem('zh:key') || localStorage.getItem('kab:key')); } catch (_) { return false; } };
if ((+mem.get(HINT_KEY) || 0) < 3 && !uchitel() && !uchitelZhurnala()) setTimeout(podskazka, 1800);

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
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && otkryto){ if (mn) menuZakryt(); else zakryt(); } });
  /* нажал мимо меню сообщения — закрыть */
  document.addEventListener('pointerdown', e => { if (mn && !e.target.closest('.vq-menu') && !e.target.closest('.vq-msg[data-vq="menu"]')) menuZakryt(); }, true);
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
  else if (a.dataset.vq === 'tg'){ if (!a.dataset.token) e.preventDefault(); }   // вход ещё готовится
  else if (a.dataset.vq === 'kod') vvestiKod();
  else if (a.dataset.vq === 'chel') vybrat(+a.dataset.u);
  else if (a.dataset.vq === 'menu') menu(a);
  else if (a.dataset.vq === 'reak'){ if (a.dataset.kto === ya()) reagirovat(+a.dataset.id, ''); }   // своя — снять
  else if (a.dataset.vq === 'otv-net'){ otvetNa = 0; risovatOtvet(); }
  else if (a.dataset.vq === 'k-soobshcheniyu'){
    const el = okno.querySelector(`.vq-msg[data-id="${+a.dataset.id}"]`);
    if (el){ el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('vq-mig'); setTimeout(() => el.classList.remove('vq-mig'), 1200); }
  }
  else if (a.dataset.vq === 'vyjti'){                  // чужой или школьный компьютер
    /* на устройстве остался вход в журнал — чат по его ключу тоже закрываем, иначе следующий за этим
       компьютером откроет «?» и попадёт в чужую переписку. Сам журнал при этом остаётся открытым.
       Запоминаем до того, как забыть свой ключ: потом ключ журнала уже не отличить от отвергнутого */
    const zh = klyuchZhurnala(); if (zh) mem.set(VYSHEL_KEY, zh);
    zabytKlyuch(); zabytVhod(); clearInterval(chatTaimer); chatTaimer = null;
    menuZakryt(); komu = 0; lyudi = []; znachok(0);
    knopka.classList.remove('est-otvet');
    vhodEkran('Ты вышел из чата на этом устройстве.');
  }
}

function otkryt(){
  if (!okno) postroit();
  if (chatKey()) chatNachat();
  else if (CHAT_VSEM || tester() || zovutVChat || nachatyiVhod()) vhodEkran();   // начал вход — даём ввести код
  else { okno.classList.remove('vq-chat'); nachat(); }
  fon.hidden = false; okno.hidden = false;
  document.body.classList.add('vq-otkryto');
  otkryto = true;
  requestAnimationFrame(() => { fon.classList.add('on'); okno.classList.add('on'); okno.focus({ preventScroll: true }); });
}

function zakryt(){
  if (!otkryto) return;
  menuZakryt();
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
    pro: d ? `${d.k.name} · ${d.u.zh ? 'урок ' + d.u.date : 'урок ' + d.u.n} «${korotko(d.u.title)}» · к ${d.u.dz.due}` : (spisok.length ? 'Не про домашку' : ''),
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

/* ═════════════ ЧАТ (ТЗ 11 A2): ученик ↔ учитель ═════════════ */
const SKREPKA = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"/></svg>';
const STRELKA = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4l17.4-7.5a1 1 0 0 0 0-1.8L3.4 3.6a1 1 0 0 0-1.4 1.1L4 11l9 1-9 1-2 6.3a1 1 0 0 0 1.4 1.1z"/></svg>';

let chatTaimer = null, chatBase = '', lenta = [], lastId = 0, tyanu = false;
let rv = -1, reakcii = {}, estReakcii = false, otvetNa = 0;   // реакции чата и их счётчик на сервере; на какое сообщение отвечаю
let komu = 0, lyudi = [], spisokKogda = 0, spisokVid = '';     // учитель: открытый ученик и лента имён
let pokolenie = 0;     // растёт при каждом сбросе ленты: ответ на запрос прошлого поколения выбрасываем

/* ключ вида bot.id.srok.podpis; просроченный не используем */
const zhivoi = k => (+(String(k).split('.')[2] || 0)) * 1000 > Date.now() ? k : '';
const svoiKlyuch = () => zhivoi(mem.get(CHAT_KEY));
/* вошёл в журнал через бота — тот же ключ годится и чату (страницы на одном адресе) */
let plohoiZh = '';
function klyuchZhurnala(){
  if (!V_ZHURNALE) return '';
  try {
    const k = zhivoi(JSON.parse(localStorage.getItem('zh:ck') || '""'));
    return k && k !== plohoiZh && k !== mem.get(VYSHEL_KEY) ? k : '';
  } catch (_) { return ''; }
}
function chatKey(){ return svoiKlyuch() || klyuchZhurnala(); }
function zabytKlyuch(){
  if (!svoiKlyuch()) plohoiZh = klyuchZhurnala();      // сервер отверг ключ журнала — больше его не пробуем
  try { localStorage.removeItem(CHAT_KEY); localStorage.removeItem(UCH_KEY); } catch (_) {}
}
function tester(){ return mem.get(TEST_KEY) === '1'; }
function uchitel(){ return mem.get(UCH_KEY) === '1'; }
const ya = () => (uchitel() ? 'd' : 's');
function vzyatKlyuch(d){                               // ответ сервера с ключом → в память
  mem.set(CHAT_KEY, d.key);
  try {                                                // вошёл через боевого бота — больше не тестер
    if (d.bot === 'test') localStorage.setItem(TEST_KEY, '1'); else localStorage.removeItem(TEST_KEY);
    if (d.uchitel) localStorage.setItem(UCH_KEY, '1'); else localStorage.removeItem(UCH_KEY);
  } catch (_) {}
}

/* Вход: «Получить код в Телеграме» (t.me/<бот>?start=site-<токен>) → бот
   присылает 4 цифры → ученик вводит их здесь. Начатый вход живёт в памяти
   браузера: сходил в Телеграм, вернулся, страница перезагрузилась — та же ссылка. */
function vhodEkran(soobshchenie){
  okno.classList.remove('vq-chat');
  okno.innerHTML = `
    <div class="vq-head">${blok('vq-mini')}<h2 id="vq-h">Чат с учителем</h2>
      <button type="button" class="vq-x" data-vq="zakryt" aria-label="Закрыть">✕</button></div>
    <div class="vq-telo vq-vhod">
      <p class="vq-vhod-t">Здесь можно переписываться с учителем и присылать фото решений. Войди один раз на этом устройстве:</p>
      <a class="vq-send vq-tg" data-vq="tg" aria-disabled="true">Готовлю вход…</a>
      <label class="vq-kod-l" for="vq-kod">Код из Телеграма</label>
      <div class="vq-kod-r">
        <input id="vq-kod" class="vq-kod" inputmode="numeric" autocomplete="one-time-code" maxlength="4" placeholder="····">
        <button type="button" class="vq-go" data-vq="kod" aria-label="Войти">${STRELKA}</button>
      </div>
      <p class="vq-err" hidden></p>
      <button type="button" class="vq-link" data-vq="signal">Нет Телеграма? Быстрый сигнал учителю</button>
    </div>`;
  const pole = okno.querySelector('.vq-kod');
  pole.addEventListener('input', () => {
    pole.value = pole.value.replace(/\D/g, '').slice(0, 4);
    if (pole.value.length === 4) vvestiKod();            // 4 цифры — входим сами
  });
  pole.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); vvestiKod(); } });
  gotovitVhod();
  if (soobshchenie) oshibka(soobshchenie);
}

function nachatyiVhod(){
  let v = null;
  try { v = JSON.parse(localStorage.getItem(VHOD_KEY) || 'null'); } catch (_) {}
  return v && v.t && Date.now() < v.do ? v : null;     // «do» — до какого времени вход жив
}
function zabytVhod(){ try { localStorage.removeItem(VHOD_KEY); } catch (_) {} }

async function gotovitVhod(){
  const a = okno.querySelector('.vq-tg');
  if (!a) return;
  let v = nachatyiVhod();
  try {
    if (!v){
      const base = await serverBase();
      const r = await timedFetch(base + '/chat/login/start', { method: 'POST', cache: 'no-store' }, 15000);
      const d = await r.json();
      if (!d.ok || !d.token) throw new Error(d.error || 'нет токена');
      v = { t: d.token, do: Date.now() + (d.ttl - 60) * 1000 };   // минута запаса на ввод
      try { localStorage.setItem(VHOD_KEY, JSON.stringify(v)); } catch (_) {}
    }
    a.href = `https://t.me/${tester() ? BOTY.test : BOTY.main}?start=site-${v.t}`;
    if (matchMedia('(pointer:fine)').matches) { a.target = '_blank'; a.rel = 'noopener'; }   // компьютер: сайт остаётся во вкладке
    a.dataset.token = v.t;
    a.removeAttribute('aria-disabled');
    a.textContent = '✈️ Получить код в Телеграме';
  } catch (_) {
    baseP = null;
    a.dataset.vq = 'snova'; a.removeAttribute('aria-disabled'); a.textContent = 'Попробовать ещё раз';
    oshibka('Не получилось связаться с сервером. Проверь интернет.');
  }
}

let vvozhu = false;
async function vvestiKod(){
  const pole = okno && okno.querySelector('.vq-kod');
  const v = nachatyiVhod();
  if (!pole || vvozhu) return;
  const kod = pole.value.replace(/\D/g, '');
  if (kod.length !== 4){ oshibka('В коде 4 цифры.'); return; }
  if (!v){ vhodEkran('Вход устарел — получи новый код.'); return; }
  vvozhu = true; oshibka('');
  try {
    const base = await serverBase();
    const r = await timedFetch(base + '/chat/login/finish', {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: v.t, kod }),
    }, 15000);
    const d = await r.json();
    if (d.ok && d.key){ zabytVhod(); vzyatKlyuch(d); chatNachat(); return; }
    pole.value = '';
    if (d.error === 'wrong') oshibka(`Код не подошёл. Осталось попыток: ${d.left}.`);
    else if (d.error === 'no code') oshibka('Сначала нажми «Получить код в Телеграме».');
    else { zabytVhod(); vhodEkran(d.error === 'bad' ? 'Попытки кончились — получи новый код.' : 'Вход устарел — получи новый код.'); }
  } catch (_) {
    baseP = null;
    oshibka('Не получилось связаться с сервером. Проверь интернет.');
  } finally { vvozhu = false; }
}

/* вернулся из Телеграма с кодом — поле ввода уже ждёт */
document.addEventListener('visibilitychange', () => {
  const pole = !document.hidden && otkryto && okno.querySelector('.vq-kod');
  if (pole && !pole.value) pole.focus({ preventScroll: true });
});

function urokSejchas(){
  const m = /^#([a-z]{2,20}-\d{1,3})$/.exec(location.hash);
  return m ? m[1] : '';
}
const zagolovki = t => ({ 'X-Chat-Key': chatKey(), ...(t ? { 'Content-Type': t } : {}) });
const fotoUrl = name => `${chatBase}/chat/photo/${encodeURIComponent(name)}?k=${encodeURIComponent(chatKey())}`;

function chatNachat(){
  const u = uchitel();
  okno.classList.add('vq-chat');
  okno.innerHTML = `
    <div class="vq-head">${blok('vq-mini')}<h2 id="vq-h">${u ? 'Чаты <span class="vq-zhdut" hidden></span>' : 'Чат с учителем'}</h2>
      <button type="button" class="vq-vyjti" data-vq="vyjti" title="Выйти из чата на этом устройстве">Выйти</button>
      <button type="button" class="vq-x" data-vq="zakryt" aria-label="Закрыть">✕</button></div>
    ${u ? '<div class="vq-lyudi" role="tablist" aria-label="Ученики"></div>' : ''}
    <div class="vq-lenta" role="log" aria-live="polite"><div class="vq-pusto">Загружаю…</div></div>
    <p class="vq-err" hidden></p>
    <div class="vq-otv" hidden></div>
    <div class="vq-pole"${u ? ' hidden' : ''}>
      <button type="button" class="vq-skrepka" data-vq="foto" aria-label="Прикрепить фото">${SKREPKA}</button>
      <input type="file" class="vq-file" accept="image/*" hidden>
      <textarea class="vq-vvod" rows="1" maxlength="2000" placeholder="${u ? 'Ответ ученику…' : 'Напиши сообщение…'}" aria-label="${u ? 'Ответ ученику' : 'Сообщение учителю'}"></textarea>
      <button type="button" class="vq-go" data-vq="poslat" aria-label="Отправить">${STRELKA}</button>
    </div>`;
  lenta = []; lastId = 0; rv = -1; reakcii = {}; otvetNa = 0; spisokVid = ''; pokolenie++;
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
  if (!u) tyanut(true);
  else {
    spisokKogda = 0;                                   // список — как можно скорее (и повторить, если этот запрос не выйдет)
    if (chelovek(komu)){                               // открываю снова: тот же ученик и поле ответа сразу
      okno.querySelector('.vq-pole').hidden = false;
      risovatLyudi(); tyanut(true);
    }
    spisokTyanut(true);
  }
  /* меню сообщения привязано к месту на экране: лента поехала — закрываем, иначе реакция уйдёт не тому сообщению */
  okno.querySelector('.vq-lenta').addEventListener('scroll', menuZakryt, { passive: true });
  clearInterval(chatTaimer);
  chatTaimer = setInterval(() => {
    if (document.hidden) return;
    if (!uchitel()){ tyanut(false); return; }
    if (komu) tyanut(false);
    if (Date.now() - spisokKogda > 12000) spisokTyanut(false);     // лента имён — реже переписки
  }, 4000);
}

function rost(el){ el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 4, 120) + 'px'; }

function oshibka(text){
  const e = okno && okno.querySelector('.vq-err');
  if (!e) return;
  e.textContent = text || ''; e.hidden = !text;
}

/* ═════════════ УЧИТЕЛЬ: лента имён над перепиской ═════════════ */
const CVETA = ['#7c3aed', '#0ea5e9', '#f97316', '#10b981', '#e11d48', '#6366f1', '#0d9488', '#d97706'];
const chelovek = u => lyudi.find(p => p.u === u);

/* сервер больше не считает учителем (режим выключили) — обычный чат */
function neUchitel(){
  try { localStorage.removeItem(UCH_KEY); } catch (_) {}
  komu = 0; lyudi = []; znachok(0);
  if (otkryto) chatNachat();
}

/* цифра на «?»: сколько чатов ждут ответа */
function znachok(n){
  let z = knopka.querySelector('.vq-n');
  if (!n){ if (z) z.remove(); return; }
  if (!z){ z = document.createElement('span'); z.className = 'vq-n'; knopka.appendChild(z); }
  z.textContent = n > 9 ? '9+' : n;
}
/* открытый чат учитель читает прямо сейчас — он не «ждёт» */
const zhdut = () => lyudi.filter(p => p.novyh && !(otkryto && p.u === komu)).length;

function risovatLyudi(){
  znachok(zhdut());
  const box = okno && okno.querySelector('.vq-lyudi');
  if (!box) return;
  const z = okno.querySelector('.vq-zhdut');
  if (z){ z.hidden = !zhdut(); z.textContent = 'ждут: ' + zhdut(); }
  const vid = JSON.stringify([komu, lyudi.map(p => [p.u, p.name, p.u === komu ? 0 : p.novyh])]);
  if (vid === spisokVid) return;                       // то же самое не перерисовываем: палец может быть на кружке
  spisokVid = vid;
  const sdvig = box.scrollLeft;
  box.innerHTML = lyudi.map(p => {
    const slova = String(p.name).trim().split(/\s+/);
    const novyh = p.u === komu ? 0 : p.novyh;
    return `<button type="button" class="vq-chel${p.u === komu ? ' on' : ''}" role="tab" aria-selected="${p.u === komu}" data-vq="chel" data-u="${p.u}" title="${esc(p.name)}${p.groups ? ' · ' + esc(p.groups) : ''}">
      <span class="vq-ava" style="background:${CVETA[Math.abs(p.u) % CVETA.length]}">${esc([...slova[0]][0] || '?')}</span>${novyh ? `<u>${novyh > 9 ? '9+' : novyh}</u>` : ''}
      <span class="vq-kto2">${esc(slova[0])}${slova.length > 1 ? '<br>' + esc(slova.slice(1).join(' ')) : ''}</span></button>`;
  }).join('');
  box.scrollLeft = sdvig;
}

let spisokIdet = false;
async function spisokTyanut(pervyi){
  if (spisokIdet || !chatKey()) return;
  spisokIdet = true;
  try {
    const base = await serverBase();
    const r = await timedFetch(base + '/chat/d/list', { cache: 'no-store', headers: zagolovki() }, 15000);
    if (r.status === 401){ zabytKlyuch(); znachok(0); if (otkryto) vhodEkran(); return; }
    if (r.status === 403 || r.status === 404){ neUchitel(); return; }
    const d = await r.json();
    if (d.key) mem.set(CHAT_KEY, d.key);
    lyudi = d.people || [];
    spisokKogda = Date.now();
    risovatLyudi();
    if (!otkryto || !okno.querySelector('.vq-lyudi')) return;
    if (!lyudi.length){
      komu = 0;
      okno.querySelector('.vq-pole').hidden = true;
      okno.querySelector('.vq-lenta').innerHTML = '<div class="vq-pusto">Пока никто из учеников не входил в чат. Как только кто-то откроет «?» и войдёт, он появится здесь.</div>';
    } else if (!chelovek(komu)) vybrat(lyudi[0].u);  // никого не открыто (или открытый ушёл из класса) — первого по списку
    if (pervyi) oshibka('');
  } catch (_) {
    baseP = null;
    if (pervyi) oshibka('Не получилось загрузить список. Проверь интернет.');
  } finally { spisokIdet = false; }
}

function vybrat(u){
  if (!chelovek(u)) return;
  menuZakryt();
  komu = u; lenta = []; lastId = 0; rv = -1; reakcii = {}; otvetNa = 0; pokolenie++;
  okno.querySelector('.vq-pole').hidden = false;
  okno.querySelector('.vq-lenta').innerHTML = '<div class="vq-pusto">Загружаю…</div>';
  oshibka(''); risovatOtvet(); risovatLyudi();
  tyanut(true);
}

/* ═════════════ ЛЕНТА СООБЩЕНИЙ ═════════════ */
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

const kratko = m => (m.text ? (m.text.length > 70 ? m.text.slice(0, 69) + '…' : m.text) : '📷 фото');
/* чьё сообщение — подпись в цитате */
function chyo(m){
  if (m.who === ya()) return uchitel() ? 'Вы' : 'Ты';
  if (!uchitel()) return 'Учитель';
  const p = chelovek(komu);
  return p ? String(p.name).trim().split(/\s+/)[0] : 'Ученик';
}
function citata(id){
  const o = lenta.find(x => x.id === id);
  return `<div class="vq-cit" data-vq="k-soobshcheniyu" data-id="${+id}">${o ? `<b>${esc(chyo(o))}</b>${esc(kratko(o))}` : '<b>↩</b>Сообщение выше'}</div>`;
}
function reakciiHtml(m){
  const r = m.id && reakcii[m.id];
  if (!r) return '';
  const h = ['s', 'd'].filter(k => r[k]).map(k =>
    `<button type="button" class="${k === ya() ? 'moya' : ''}" data-vq="reak" data-id="${m.id}" data-kto="${k}" title="${k === ya() ? 'Твоя реакция — нажми, чтобы убрать' : (k === 'd' ? 'Реакция учителя' : 'Реакция ученика')}">${esc(r[k])}</button>`).join('');
  return h ? `<div class="vq-reak">${h}</div>` : '';
}

function risovat(vniz){
  const box = okno && okno.querySelector('.vq-lenta');
  if (!box) return;
  menuZakryt();
  const bylVnizu = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  if (!lenta.length){
    box.innerHTML = uchitel()
      ? '<div class="vq-pusto">Переписки пока нет. Напиши первым — ученику придёт уведомление в Телеграм.</div>'
      : `<div class="vq-pusto">
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
    /* нажатие на сообщение — реакция или «Ответить»: только если сервер это умеет и сообщение уже на сервере */
    html += `<div class="vq-msg ${m.who === ya() ? 'moe' : 'ego'}${m.zhdet ? ' zhdet' : ''}"${m.id && estReakcii ? ` data-vq="menu" data-id="${m.id}"` : ''}>
      ${m.re ? citata(m.re) : ''}
      ${src ? `<img src="${esc(src)}" alt="Фото" data-vq="uvelichit">` : ''}
      ${m.text ? `<div class="t">${esc(m.text)}</div>` : ''}
      <div class="vr">${m.zhdet ? 'отправляю…' : vremya(d)}</div>${reakciiHtml(m)}</div>`;
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
  if ((tyanu && !pervyi) || !chatKey()) return;
  const u = uchitel(), dlya = komu, pok = pokolenie;
  if (u && !dlya) return;
  const tot = () => pok === pokolenie && u === uchitel();   // лента та же, что при запросе (не сменили ученика, не сбросили)
  tyanu = true;
  try {
    chatBase = await serverBase();
    /* open=1: чат открыт — сервер отмечает «видел» и не шлёт уведомление со звуком, пока человек тут.
       rv — мой счётчик реакций: сервер пришлёт их заново, только если что-то поменялось */
    const adres = u ? `/chat/d/history?u=${dlya}&` : '/chat/history?';
    const r = await timedFetch(`${chatBase}${adres}after=${lastId}&open=1&rv=${rv}`, { cache: 'no-store', headers: zagolovki() }, 15000);
    if (!tot()) return;                                // пока ждали ответ, открыли другого ученика
    if (r.status === 401){ zabytKlyuch(); znachok(0); vhodEkran(); return; }
    if (u && r.status === 403){ neUchitel(); return; }
    if (u && r.status === 404){ komu = 0; spisokTyanut(true); return; }      // ученик ушёл из класса
    const d = await r.json();
    if (!tot()) return;                                // и пока читали ответ — тоже: чужие сообщения в ленту не кладём
    if (d.key) mem.set(CHAT_KEY, d.key);             // сервер продлил ключ
    if (!u && d.uchitel){ mem.set(UCH_KEY, '1'); chatNachat(); return; }     // это учитель: вместо чата — ученики
    let novoe = false;
    const msgs = (d.msgs || []).filter(m => m.id > lastId);
    if (msgs.length){
      lastId = msgs[msgs.length - 1].id;
      lenta = lenta.filter(m => !m.zhdet).concat(msgs, lenta.filter(m => m.zhdet));
      novoe = true;
    }
    if ('rv' in d){
      if (!estReakcii){ estReakcii = true; novoe = true; }
      rv = d.rv;
      if (d.reak){
        reakcii = {};
        d.reak.forEach(([id, kto, e]) => { (reakcii[id] = reakcii[id] || {})[kto] = e; });
        novoe = true;
      }
    }
    if (pervyi || novoe) risovat(pervyi);
    if (otkryto && !u) videl();
    if (u && novoe){ const p = chelovek(dlya); if (p) p.novyh = 0; risovatLyudi(); }
    if (pervyi) oshibka('');
  } catch (_) {
    baseP = null;
    if (pervyi) oshibka('Не получилось загрузить переписку. Проверь интернет.');
  } finally { tyanu = false; }
}

/* ═════════════ РЕАКЦИИ И ОТВЕТ НА СООБЩЕНИЕ ═════════════ */
/* первый «знак» строки целиком: смайлик из нескольких частей (семья, флаг, цвет кожи) не режем */
function pervyiSmail(t){
  t = String(t || '').trim();
  if (!t) return '';
  try { return [...new Intl.Segmenter('ru', { granularity: 'grapheme' }).segment(t)][0].segment; } catch (_) { return [...t][0]; }
}
let mn = null;
function menuZakryt(){ if (mn){ mn.remove(); mn = null; } }
function menu(el){
  const id = +el.dataset.id;
  const bylo = mn && +mn.dataset.id === id;
  menuZakryt();
  if (bylo) return;                                    // второе нажатие на то же сообщение — закрыть
  const moya = (reakcii[id] || {})[ya()] || '';
  mn = document.createElement('div');
  mn.className = 'vq-menu'; mn.dataset.id = id;
  mn.innerHTML = `<div class="vq-menu-r">${BYSTRYE.map(e => `<button type="button" data-e="${e}"${moya === e ? ' class="on"' : ''}>${e}</button>`).join('')}<button type="button" data-plus title="Любой смайлик с клавиатуры" aria-label="Другой смайлик">＋</button></div>
    <button type="button" class="vq-menu-o" data-otv>↩ Ответить</button>`;
  document.body.appendChild(mn);
  const r = el.getBoundingClientRect(), w = mn.offsetWidth, h = mn.offsetHeight;
  mn.style.left = Math.max(8, Math.min(el.classList.contains('moe') ? r.right - w : r.left, innerWidth - w - 8)) + 'px';
  mn.style.top = (r.top - h - 6 > 8 ? r.top - h - 6 : Math.min(r.bottom + 6, innerHeight - h - 8)) + 'px';
  mn.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.e){ menuZakryt(); reagirovat(id, moya === b.dataset.e ? '' : b.dataset.e); }
    else if ('otv' in b.dataset){
      menuZakryt(); otvetNa = id; risovatOtvet();
      okno.querySelector('.vq-vvod').focus({ preventScroll: true });
    }
    else if ('plus' in b.dataset){
      mn.querySelector('.vq-menu-r').innerHTML = '<input class="vq-menu-in" placeholder="Смайлик с клавиатуры" maxlength="16" aria-label="Смайлик">';
      const inp = mn.querySelector('.vq-menu-in');
      inp.focus();
      inp.addEventListener('input', () => {
        const e = pervyiSmail(inp.value);
        if (e && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(e)){ menuZakryt(); reagirovat(id, e); }
        else if (e) inp.value = '';                  // буква или цифра — не реакция
      });
    }
  });
}

async function reagirovat(id, e){
  const bylo = (reakcii[id] || {})[ya()] || '';
  const postavit = v => { reakcii[id] = Object.assign({}, reakcii[id]); if (v) reakcii[id][ya()] = v; else delete reakcii[id][ya()]; risovat(); };
  postavit(e);                                         // сразу на экране, сервер подтвердит
  try {
    const base = await serverBase();
    const r = await timedFetch(base + '/chat/react', { method: 'POST', cache: 'no-store',
      headers: zagolovki('application/json'), body: JSON.stringify({ id, e }) }, 15000);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    oshibka('');
  } catch (_) {
    postavit(bylo);
    oshibka('Реакция не сохранилась. Попробуй ещё раз.');
  }
  rv = -1;                                             // следующий опрос сверит реакции с сервером
}

function risovatOtvet(){
  const box = okno && okno.querySelector('.vq-otv');
  if (!box) return;
  const o = otvetNa && lenta.find(x => x.id === otvetNa);
  box.hidden = !o;
  box.innerHTML = o ? `<span><b>↩ ${esc(chyo(o))}</b>${esc(kratko(o))}</span><button type="button" data-vq="otv-net" aria-label="Не отвечать на сообщение">✕</button>` : '';
}

/* ═════════════ ОТПРАВКА В ЧАТ ═════════════ */
function poslat(gotovyi){
  const vvod = okno.querySelector('.vq-vvod');
  const text = String(gotovyi || vvod.value).trim();
  if (!text || (uchitel() && !komu)) return;
  if (!gotovyi){ vvod.value = ''; rost(vvod); }
  const re = otvetNa;
  const telo = uchitel() ? { u: komu, text } : { text, urok: urokSejchas() };
  if (re) telo.re = re;
  otpravitVChat(JSON.stringify(telo), 'application/json', { text, re }, () => {
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
  const dlya = komu;
  const blob = await szhat(file);
  if (!blob){ oshibka('Это не фото или оно слишком большое. Попробуй другое.'); return; }
  if (dlya !== komu || (uchitel() && !komu)) return;   // пока фото сжималось, открыли другого ученика
  const vvod = okno.querySelector('.vq-vvod');
  const text = vvod.value.trim();
  vvod.value = ''; rost(vvod);
  const re = otvetNa;
  const fd = new FormData();
  fd.append('photo', blob, 'foto.jpg');
  if (text) fd.append('text', text);
  if (re) fd.append('re', re);
  if (uchitel()) fd.append('u', komu);
  else if (urokSejchas()) fd.append('urok', urokSejchas());
  otpravitVChat(fd, '', { text, re, preview: URL.createObjectURL(blob) }, () => {
    if (text && !vvod.value){ vvod.value = text; rost(vvod); }
  });
}

async function otpravitVChat(body, tip, vid, vernut){
  oshibka('');
  const u = uchitel(), dlya = komu;
  const m = Object.assign({ who: ya(), ts: new Date().toISOString(), zhdet: true }, vid);
  otvetNa = 0; risovatOtvet();
  lenta.push(m); risovat(true);
  const tot = () => dlya === komu;                     // всё ещё открыт тот же чат
  const ubrat = () => { lenta = lenta.filter(x => x !== m); if (tot()) risovat(); if (m.preview) URL.revokeObjectURL(m.preview); };
  const nazad = () => { ubrat(); if (tot()){ vernut(); if (vid.re){ otvetNa = vid.re; risovatOtvet(); } } };
  try {
    chatBase = await serverBase();
    const r = await timedFetch(chatBase + (u ? '/chat/d/send' : '/chat/send'),
      { method: 'POST', cache: 'no-store', headers: zagolovki(tip), body }, 45000);
    if (r.status === 429){ nazad(); oshibka('Много сообщений подряд. Подожди пару минут.'); return; }
    if (r.status === 401){ ubrat(); zabytKlyuch(); znachok(0); vhodEkran(); return; }
    if (u && r.status === 403){ ubrat(); neUchitel(); return; }
    if (!u && r.status === 403){                       // сервер уже считает учителем, а окно ещё нет — открываем учеников
      nazad(); mem.set(UCH_KEY, '1'); chatNachat(); return;
    }
    if (u && r.status === 404){ nazad(); oshibka('Этот ученик больше не в классе — сообщение не ушло.'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    lenta = lenta.filter(x => x !== m);            // настоящее сообщение придёт с сервера
    if (tot()){ await tyanut(true); risovat(true); }
    if (u) spisokTyanut(false);
    if (m.preview) setTimeout(() => URL.revokeObjectURL(m.preview), 60000);
  } catch (_) {
    baseP = null;
    nazad();
    oshibka(vid.preview ? 'Фото не отправилось. Проверь интернет и прикрепи ещё раз.'
                        : 'Не отправилось. Проверь интернет и нажми ещё раз.');
  }
}

function uvelichit(src){
  menuZakryt();
  const d = document.createElement('div');
  d.className = 'vq-bigfoto';
  d.innerHTML = `<img src="${esc(src)}" alt="Фото">`;
  d.addEventListener('click', () => d.remove());
  document.body.appendChild(d);
}

/* окно закрыто: ученику — красная точка «учитель ответил», учителю — цифра «ждут ответа» */
async function estOtvet(){
  if (!chatKey() || otkryto || document.hidden) return;
  if (uchitel()){ spisokTyanut(false); return; }
  try {
    const base = await serverBase();
    const r = await timedFetch(`${base}/chat/history?after=${+mem.get(CHAT_SEEN) || 0}`,
      { cache: 'no-store', headers: zagolovki() }, 15000);
    if (r.status === 401){ zabytKlyuch(); return; }
    const d = await r.json();
    if (d.key) mem.set(CHAT_KEY, d.key);
    if (d.uchitel){ mem.set(UCH_KEY, '1'); knopka.title = 'Чаты с учениками'; spisokTyanut(false); return; }
    knopka.classList.toggle('est-otvet', !!(d.msgs || []).some(m => m.who === 'd'));
  } catch (_) {}
}

if (uchitel()){ knopka.title = 'Чаты с учениками'; knopka.setAttribute('aria-label', 'Чаты с учениками'); }
setInterval(estOtvet, 60000);
/* вернулся кнопкой «Назад» из Телеграма посреди входа — сразу поле для кода */
const nazad = ((performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {}).type === 'back_forward';
if (zovutVChat || (nazad && !chatKey() && nachatyiVhod())) otkryt();   // «Открыть чат» из бота: чат или вход
else estOtvet();
})();
