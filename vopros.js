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
const KOMNATA_KEY = 'vopros-komnata';       // беседа класса (ТЗ 27): последняя открытая — 'b' (беседа) или '' (учитель)
const BESEDA_KEY = 'vopros-beseda';         // проба беседы на этом устройстве (?beseda=1 — включить, ?beseda=0 — убрать)
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
/* уведомление беседы в Телеграме ведёт на #chat=b — окно открывается сразу в беседе */
let zovutVBesedu = location.hash === '#chat=b';
const zovutVChat = location.hash === '#chat=1' || zovutVBesedu || vopr.get('chat') === '1';
try { if (vopr.get('test') === 'chat') localStorage.setItem(TEST_KEY, '1'); } catch (_) {}
try { if (vopr.get('beseda') === '1') localStorage.setItem(BESEDA_KEY, '1'); else if (vopr.get('beseda') === '0') localStorage.removeItem(BESEDA_KEY); } catch (_) {}
if (zovutVChat || vopr.has('test') || vopr.has('beseda')){
  ['chat', 'test', 'beseda'].forEach(k => vopr.delete(k));
  const q = vopr.toString();
  try { history.replaceState(history.state, '', location.pathname + (q ? '?' + q : '') + (/^#chat=[1b]$/.test(location.hash) ? '' : location.hash)); } catch (_) {}
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
/* на экране кода класса подсказка закрывала заголовок (ТЗ 22, E6): там — после неверного кода (журнал шлёт
   «vopros:podskazka») или через 20 секунд, если код так и не ввели */
const naVhode = () => !!document.getElementById('gateIn');
// журнал, который ещё грузится, — тоже «вход»: экран кода может появиться после ответа сервера
const zhurnalNeGotov = () => !!document.getElementById('footLinks') && !document.documentElement.classList.contains('vid') && !document.querySelector('#wrap table');
const mozhno = () => (+mem.get(HINT_KEY) || 0) < 3 && !uchitel() && !uchitelZhurnala() && !hint;
if (mozhno())
  setTimeout(() => { if (!naVhode() && !zhurnalNeGotov()) podskazka(); else setTimeout(() => { if (naVhode() && mozhno()) podskazka(); }, 18200); }, 1800);
document.addEventListener('vopros:podskazka', () => { if (mozhno()) podskazka(); });

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
  else if (a.dataset.vq === 'foto'){ if (komnata && uchitel() && bOpOn) skrepkaMenu(a); else okno.querySelector('.vq-file').click(); }
  else if (a.dataset.vq === 'golos') golosovat(+a.dataset.id, +a.dataset.n);
  else if (a.dataset.vq && a.dataset.vq.startsWith('op-')) oprosForma(a);
  else if (a.dataset.vq === 'bystro') poslat(a.dataset.tekst);
  else if (a.dataset.vq === 'uvelichit') uvelichit(a.getAttribute('src'));
  else if (a.dataset.vq === 'signal'){ okno.classList.remove('vq-chat'); nachat(); }
  else if (a.dataset.vq === 'snova'){ e.preventDefault(); vhodEkran(); }
  else if (a.dataset.vq === 'tg'){ if (!a.dataset.token) e.preventDefault(); }   // вход ещё готовится
  else if (a.dataset.vq === 'kod') vvestiKod();
  else if (a.dataset.vq === 'chel') vybrat(+a.dataset.u);
  else if (a.dataset.vq === 'menu') menu(a);
  else if (a.dataset.vq === 'reak'){ if (a.dataset.kto === ya()) reagirovat(+a.dataset.id, ''); }   // своя — снять
  else if (a.dataset.vq === 'reakb'){                  // беседа: нажал на чужую — такая же; на свою — снять
    const moya = (reakcii[+a.dataset.id] || {})[ya()] || '';
    reagirovat(+a.dataset.id, moya === a.dataset.e ? '' : a.dataset.e);
  }
  else if (a.dataset.vq === 'komnata') vybratKomnatu(a.dataset.j || '');
  else if (a.dataset.vq === 'kto') ktoProchital(+a.dataset.id);
  else if (a.dataset.vq === 'kto-x'){ const ov = okno.querySelector('.vq-ktookno'); if (ov) ov.remove(); opSbrosKart(); opV = []; }
  else if (a.dataset.vq === 'napomnit') napomnit(a);
  else if (a.dataset.vq === 'mat') materialy();
  else if (a.dataset.vq === 'pin-x'){ const p = bPins[pinIdx % bPins.length]; if (p) zakrepit(p.id, false); }
  else if (a.dataset.vq === 'red-net') bezPravki(true);
  else if (a.dataset.vq === 'at') vstavitImya(a.dataset.imya);
  else if (a.dataset.vq === 'sostav'){ const b = okno.querySelector('.vq-sostav'); b.classList.toggle('raskryt'); a.setAttribute('aria-expanded', b.classList.contains('raskryt')); }
  else if (a.dataset.vq === 'otv-net'){ otvetNa = 0; risovatOtvet(); }
  else if (a.dataset.vq === 'k-soobshcheniyu'){
    if (a.closest('.vq-ktookno')){                     // из «Материалов»: сообщение в ленте — закрыть лист и к нему
      const est = okno.querySelector(`.vq-msg[data-id="${+a.dataset.id}"], .vq-msg[data-ids~="${+a.dataset.id}"]`);
      if (!est){ a.classList.toggle('raskryt'); return; }   // старое, в ленте его нет — показать целиком здесь же
      a.closest('.vq-ktookno').remove();
    }
    if (a.classList.contains('vq-pin-t') && bPins.length > 1){ pinIdx = (pinIdx + 1) % bPins.length; risovatPin(); }   // как в Телеграме: дальше — следующий закреп
    const el = okno.querySelector(`.vq-msg[data-id="${+a.dataset.id}"], .vq-msg[data-ids~="${+a.dataset.id}"]`);
    if (el){ el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('vq-mig'); setTimeout(() => el.classList.remove('vq-mig'), 1200); }
  }
  else if (a.dataset.vq === 'vyjti'){                  // чужой или школьный компьютер
    /* на устройстве остался вход в журнал — чат по его ключу тоже закрываем, иначе следующий за этим
       компьютером откроет «?» и попадёт в чужую переписку. Сам журнал при этом остаётся открытым.
       Запоминаем до того, как забыть свой ключ: потом ключ журнала уже не отличить от отвергнутого */
    const zh = klyuchZhurnala(); if (zh) mem.set(VYSHEL_KEY, zh);
    zabytKlyuch(); zabytVhod(); clearInterval(chatTaimer); chatTaimer = null;
    menuZakryt(); komu = 0; lyudi = []; znachok(0); komnata = ''; besedy = []; besedaZnachok();
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

/* Клавиатура телефона (D 04.11: «чат сворачивается в маленькое окошко вверху»). Айфон не сжимает страницу под
   клавиатуру, а сдвигает видимую часть: лист чата снизу уезжает под клавиатуру. Пока клавиатура открыта, окно
   чата занимает ровно видимую часть экрана (visualViewport), шапка «Чат с учителем» прячется — место под переписку.
   Полоску браузера со стрелками и «✓» над клавиатурой рисует сам Safari — страница её убрать не может */
function podKlaviaturu(){
  const vv = window.visualViewport;
  if (!okno || !vv || (!otkryto && !okno.classList.contains('vq-kb'))) return;
  const pishet = document.activeElement && okno.contains(document.activeElement) && /^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName);
  const kb = otkryto && pishet && okno.classList.contains('vq-chat') && matchMedia('(max-width:700px)').matches
    && vv.scale < 1.05 && document.documentElement.clientHeight - vv.height > 120;
  if (!kb && !okno.classList.contains('vq-kb')) return;
  const box = okno.querySelector('.vq-lenta');
  const vnizu = box && box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  okno.classList.toggle('vq-kb', kb);
  okno.style.top = kb ? Math.round(vv.offsetTop) + 'px' : '';
  okno.style.height = kb ? Math.round(vv.height) + 'px' : '';
  if (box && vnizu) box.scrollTop = box.scrollHeight;
}
if (window.visualViewport){
  visualViewport.addEventListener('resize', podKlaviaturu);
  visualViewport.addEventListener('scroll', podKlaviaturu);
}

function zakryt(){
  if (!otkryto) return;
  menuZakryt();
  otkryto = false;
  podKlaviaturu();
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
let rv = -1, reakcii = {}, estReakcii = false, otvetNa = 0, pravka = 0;   // реакции чата и их счётчик на сервере; на какое сообщение отвечаю; какое своё правлю (беседа)
let komu = 0, lyudi = [], spisokKogda = 0, spisokVid = '';     // учитель: открытый ученик и лента имён
let pokolenie = 0;     // растёт при каждом сбросе ленты: ответ на запрос прошлого поколения выбрасываем

/* ключ вида bot.id.srok.podpis; просроченный не используем */
const zhivoi = k => (+(String(k).split('.')[2] || 0)) * 1000 > Date.now() ? k : '';
const svoiKlyuch = () => zhivoi(mem.get(CHAT_KEY));
/* вошёл в журнал через бота — тот же ключ годится и чату (страницы на одном адресе) */
const plohoiZh = new Set();   // ключи журнала, которые сервер отверг: больше их не пробуем
const kto = k => String(k || '').split('.').slice(0, 2).join('.');   // bot.id: ключ по личной ссылке выдаётся заново при каждом заходе — «Выйти» помнит человека, а не ключ
function klyuchZhurnala(){
  if (!V_ZHURNALE) return '';
  try {
    const v = mem.get(VYSHEL_KEY), a = zhivoi(JSON.parse(localStorage.getItem('zh:ck') || '""'));
    if (a && !plohoiZh.has(a) && a !== v) return a;   // вход через бота: «Выйти» помнит сам ключ — новый вход через бота пускает снова
    // ключ по личной ссылке (ТЗ 22, E5) выдаётся заново при каждом заходе — «Выйти» помнит человека, а не ключ
    const b = zhivoi(JSON.parse(localStorage.getItem('zh:ckl') || '""'));
    return b && !plohoiZh.has(b) && kto(b) !== kto(v) ? b : '';
  } catch (_) { return ''; }
}
function chatKey(){ return svoiKlyuch() || klyuchZhurnala(); }
function zabytKlyuch(){
  if (!svoiKlyuch() && klyuchZhurnala()) plohoiZh.add(klyuchZhurnala());      // сервер отверг ключ журнала — больше его не пробуем (следующий — по ссылке, если есть)
  try { localStorage.removeItem(CHAT_KEY); localStorage.removeItem(UCH_KEY); } catch (_) {}
}
function tester(){ return mem.get(TEST_KEY) === '1'; }
function uchitel(){ return mem.get(UCH_KEY) === '1'; }
const ya = () => (komnata ? bYa : (uchitel() ? 'd' : 's'));     // в беседе «я» — номер своей строки журнала (или 'd')
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
  podKlaviaturu();
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
    ${u ? '<div class="vq-lyudi" role="tablist" aria-label="Ученики"></div>' : '<div class="vq-komnaty" role="tablist" aria-label="Куда писать" hidden></div>'}
    <div class="vq-sostav" hidden></div>
    <div class="vq-pin" hidden></div>
    <div class="vq-lenta" role="log" aria-live="polite"><div class="vq-pusto">Загружаю…</div></div>
    <p class="vq-err" hidden></p>
    <div class="vq-otv" hidden></div>
    <div class="vq-at" hidden></div>
    <div class="vq-pole"${u ? ' hidden' : ''}>
      <button type="button" class="vq-skrepka" data-vq="foto" aria-label="Прикрепить фото">${SKREPKA}</button>
      <input type="file" class="vq-file" accept="image/*" multiple hidden>
      <textarea class="vq-vvod" rows="1" maxlength="2000" placeholder="${u ? 'Ответ ученику…' : 'Напиши сообщение…'}" aria-label="${u ? 'Ответ ученику' : 'Сообщение учителю'}"></textarea>
      <button type="button" class="vq-go" data-vq="poslat" aria-label="Отправить">${STRELKA}</button>
    </div>`;
  lenta = []; lastId = 0; rv = -1; reakcii = {}; otvetNa = 0; if (pravka) bezPravki(true); spisokVid = ''; pokolenie++;
  bSbros();
  /* беседа (ТЗ 27): пришёл из её уведомления или в прошлый раз был в ней — открываем её, если сервер её знает */
  const hotel = besedaVidna() && (zovutVBesedu || mem.get(KOMNATA_KEY) === 'b');
  komnata = hotel && besedy.length ? besedy[0].j : '';
  if (komnata) zovutVBesedu = false;
  if (komnata && u) komu = 0;
  const vvod = okno.querySelector('.vq-vvod');
  vvod.addEventListener('input', () => { rost(vvod); atProverit(); });
  vvod.addEventListener('click', atProverit);
  /* Enter отправляет только на компьютере; на телефоне это перенос строки */
  vvod.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer:fine)').matches){ e.preventDefault(); poslat(); }
  });
  /* несколько фото разом (D 04.11): уходят по одному подряд, в ленте собираются в одно сообщение-альбом */
  okno.querySelector('.vq-file').addEventListener('change', e => {
    const f = Array.from(e.target.files || []);
    e.target.value = '';
    if (f.length && pravka) bezPravki(true);
    if (f.length) poslatFotki(f);
  });
  risovatKomnaty();
  if (komnata){ okno.querySelector('.vq-pole').hidden = false; tyanut(true); }
  else if (!u) tyanut(true);
  if (u){
    spisokKogda = 0;                                   // список — как можно скорее (и повторить, если этот запрос не выйдет)
    if (!komnata && chelovek(komu)){                   // открываю снова: тот же ученик и поле ответа сразу
      okno.querySelector('.vq-pole').hidden = false;
      risovatLyudi(); tyanut(true);
    }
    spisokTyanut(true);
  }
  /* беседу сервер мог ещё не прислать (первый заход на страницу) — спросим и, если звали в неё, перейдём */
  besedaPing(true).then(() => {
    if (!otkryto || !okno.classList.contains('vq-chat') || !besedaVidna()) return;
    if (!komnata && (zovutVBesedu || mem.get(KOMNATA_KEY) === 'b') && besedy.length && !lenta.some(m => m.zhdet)) vybratKomnatu(besedy[0].j);
    zovutVBesedu = false;
  });
  /* меню сообщения привязано к месту на экране: лента поехала — закрываем, иначе реакция уйдёт не тому сообщению */
  okno.querySelector('.vq-lenta').addEventListener('scroll', menuZakryt, { passive: true });
  zapustitTaimer();
}

/* опрос открытого чата: беседа и личный — раз в 3 с, лента имён учителя — раз в 12 с */
function zapustitTaimer(){
  clearInterval(chatTaimer);
  chatTaimer = setInterval(() => {
    if (document.hidden) return;
    if (komnata){ tyanut(false); if (uchitel() && Date.now() - spisokKogda > 12000) spisokTyanut(false); return; }
    if (!uchitel()){ tyanut(false); return; }
    if (komu) tyanut(false);
    if (Date.now() - spisokKogda > 12000) spisokTyanut(false);     // лента имён — реже переписки
  }, 3000);
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
  const bes = besedaVidna() ? besedy : [];
  const vid = JSON.stringify([komu, komnata, bes.map(b => [b.j, b.j === komnata ? 0 : b.novyh]), lyudi.map(p => [p.u, p.name, p.u === komu ? 0 : p.novyh])]);
  if (vid === spisokVid) return;                       // то же самое не перерисовываем: палец может быть на кружке
  spisokVid = vid;
  const sdvig = box.scrollLeft;
  /* беседа класса — первым кружком (ТЗ 27) */
  box.innerHTML = bes.map(b => {
    const on = b.j === komnata, novyh = on ? 0 : b.novyh;
    return `<button type="button" class="vq-chel vq-klass${on ? ' on' : ''}" role="tab" aria-selected="${on}" data-vq="komnata" data-j="${esc(b.j)}" title="Беседа класса">
      <span class="vq-ava">👥</span>${novyh ? `<u>${novyh > 99 ? '99+' : novyh}</u>` : ''}<span class="vq-kto2">Беседа<br>класса</span></button>`;
  }).join('') + lyudi.map(p => {
    const slova = String(p.name).trim().split(/\s+/);
    const vybran = p.u === komu && !komnata;
    const novyh = vybran ? 0 : p.novyh;
    return `<button type="button" class="vq-chel${vybran ? ' on' : ''}" role="tab" aria-selected="${vybran}" data-vq="chel" data-u="${p.u}" title="${esc(p.name)}${p.groups ? ' · ' + esc(p.groups) : ''}">
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
    if (komnata) { /* открыта беседа класса — ученика не выбираем */ }
    else if (!lyudi.length){
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
  menuZakryt(); atZakryt();
  if (komnata){ komnata = ''; mem.set(KOMNATA_KEY, ''); bSbros(); risovatKomnaty(); zapustitTaimer(); }
  komu = u; lenta = []; lastId = 0; rv = -1; reakcii = {}; otvetNa = 0; if (pravka) bezPravki(true); pokolenie++;
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

const kratko = m => (m.del ? 'сообщение удалено' : m.text ? (m.ft === 'opros' ? '📊 ' : '') + (m.text.length > 70 ? m.text.slice(0, 69) + '…' : m.text)
  : m.ft === 'video' ? '🎬 видео' : m.ft === 'file' ? '📄 ' + (m.fn || 'файл') : '📷 фото');
/* чьё сообщение — подпись в цитате */
function chyo(m){
  if (m.who === ya()) return uchitel() ? 'Вы' : 'Ты';
  if (komnata) return imyaKogo(m.who, m.n);
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
  if (komnata) return risovatB(vniz);
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
  albomy(lenta).forEach(g => {
    const m = g[0], d = new Date(m.ts), konec = new Date(g[g.length - 1].ts);
    const dp = denPodpis(d);
    if (dp !== den){ den = dp; html += `<div class="vq-den">${dp}</div>`; }
    const fotki = g.map(x => x.preview || (x.photo ? fotoUrl(x.photo) : '')).filter(Boolean);
    const zhdet = g.some(x => x.zhdet);
    const img = src => `<img src="${esc(src)}" alt="Фото" data-vq="uvelichit">`;
    /* нажатие на сообщение — реакция или «Ответить»: только если сервер это умеет и сообщение уже на сервере.
       У альбома реакция и ответ — к первому фото, к нему же подпись */
    html += `<div class="vq-msg ${m.who === ya() ? 'moe' : 'ego'}${zhdet ? ' zhdet' : ''}${fotki.length > 1 ? ' alb' : ''}"${m.id && estReakcii ? ` data-vq="menu" data-id="${m.id}"` : ''}${g.length > 1 ? ` data-ids="${g.map(x => x.id || '').join(' ')}"` : ''}>
      ${m.re ? citata(m.re) : ''}
      ${fotki.length > 1 ? `<div class="vq-alb${fotki.length % 2 ? ' nechet' : ''}">${fotki.map(img).join('')}</div>` : fotki.map(img).join('')}
      ${m.text ? `<div class="t">${esc(m.text)}</div>` : ''}
      <div class="vr">${zhdet ? 'отправляю…' : vremya(konec)}</div>${reakciiHtml(m)}</div>`;
  });
  box.innerHTML = html;
  if (vniz || bylVnizu){
    box.scrollTop = box.scrollHeight;
    /* картинки догружаются позже и сдвигают низ — докручиваем */
    box.querySelectorAll('img').forEach(i => i.addEventListener('load', () => { box.scrollTop = box.scrollHeight; }, { once: true }));
  }
}

/* фото, отправленные пачкой: идут подряд от одного человека, без своей подписи и ответа, в пределах трёх минут
   и одного дня — рисуем одним сообщением. Первое в пачке может быть с подписью — она и есть подпись альбома */
function albomy(spisok){
  const gr = [];
  spisok.forEach(m => {
    const g = gr[gr.length - 1], p = g && g[g.length - 1];
    const foto = x => !!(x.preview || x.photo || (x.ft === 'photo' && x.f)) && !x.del;
    if (p && foto(m) && foto(p) && !m.text && !m.re && !(m.id && reakcii[m.id]) && m.who === p.who && g.length < FOTO_ZA_RAZ
        && Math.abs(new Date(m.ts) - new Date(p.ts)) < 180000 && denPodpis(new Date(m.ts)) === denPodpis(new Date(p.ts))) g.push(m);
    else gr.push([m]);
  });
  return gr;
}

function videl(){
  const d = lenta.filter(m => m.who === 'd' && m.id).pop();
  if (d && d.id > (+mem.get(CHAT_SEEN) || 0)) mem.set(CHAT_SEEN, String(d.id));
  knopka.classList.remove('est-otvet');
}

async function tyanut(pervyi){
  if (komnata) return tyanutB(pervyi);
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
    if (r.status === 401){
      zabytKlyuch();
      if (!u && chatKey()){ setTimeout(() => tyanut(true), 0); return; }   // есть другой ключ (по личной ссылке) — пробуем его; отвергнутые не повторяются
      znachok(0); vhodEkran(); return;
    }
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
    <button type="button" class="vq-menu-o" data-otv>↩ Ответить</button>${menuBesedy(id)}`;
  document.body.appendChild(mn);
  const r = el.getBoundingClientRect(), w = mn.offsetWidth, h = mn.offsetHeight;
  mn.style.left = Math.max(8, Math.min(el.classList.contains('moe') ? r.right - w : r.left, innerWidth - w - 8)) + 'px';
  mn.style.top = (r.top - h - 6 > 8 ? r.top - h - 6 : Math.min(r.bottom + 6, innerHeight - h - 8)) + 'px';
  mn.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.e){ menuZakryt(); reagirovat(id, moya === b.dataset.e ? '' : b.dataset.e); }
    else if ('otv' in b.dataset){
      menuZakryt(); if (pravka) bezPravki(true); otvetNa = id; risovatOtvet();
      okno.querySelector('.vq-vvod').focus({ preventScroll: true });
    }
    else if ('kto' in b.dataset){ menuZakryt(); ktoProchital(id); }
    else if ('pin' in b.dataset){ menuZakryt(); zakrepit(id, !bPins.some(p => p.id === id)); }
    else if ('red' in b.dataset){ menuZakryt(); nachatPravku(id); }
    else if ('stop' in b.dataset){ menuZakryt(); zavershitOpros(id); }
    else if ('del' in b.dataset){ menuZakryt(); udalit((el.dataset.ids || String(id)).split(' ').map(Number).filter(Boolean)); }
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
    const r = await timedFetch(base + (komnata ? '/chat/beseda/react' : '/chat/react'), { method: 'POST', cache: 'no-store',
      headers: zagolovki('application/json'), body: JSON.stringify(komnata ? { j: komnata, id, e } : { id, e }) }, 15000);
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
  const r = pravka && lenta.find(x => x.id === pravka && !x.del);
  if (r){
    box.hidden = false;
    box.innerHTML = `<span><b>✏️ Изменить</b>${esc(kratko(r))}</span><button type="button" data-vq="red-net" aria-label="Не менять">✕</button>`;
    return;
  }
  const o = otvetNa && lenta.find(x => x.id === otvetNa);
  box.hidden = !o;
  box.innerHTML = o ? `<span><b>↩ ${esc(chyo(o))}</b>${esc(kratko(o))}</span><button type="button" data-vq="otv-net" aria-label="Не отвечать на сообщение">✕</button>` : '';
}

/* ═════════════ ОТПРАВКА В ЧАТ ═════════════ */
function poslat(gotovyi){
  const vvod = okno.querySelector('.vq-vvod');
  const text = String(gotovyi || vvod.value).trim();
  if (!text || nekomu()) return;
  if (pravka && komnata && !gotovyi){ pravit(pravka, text); return; }
  if (!gotovyi){ vvod.value = ''; rost(vvod); }
  atZakryt();
  const re = otvetNa;
  const telo = komnata ? { j: komnata, text } : uchitel() ? { u: komu, text } : { text, urok: urokSejchas() };
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

const FOTO_ZA_RAZ = 10;
/* пачка (D 04.11): кому и подпись — на момент выбора фото. Учитель открыл другого ученика посреди пачки —
   остальные не шлём никому. Не фото — пропускаем и говорим; сбой сети — говорим, сколько ушло */
async function poslatFotki(files){
  if (nekomu()) return;
  const dlya = kuda(), vvod = okno.querySelector('.vq-vvod');
  const vse = files.slice(0, FOTO_ZA_RAZ);
  let podpis = vvod.value.trim(), ushlo = 0, plohih = 0;
  if (podpis){ vvod.value = ''; rost(vvod); }
  for (const f of vse){
    if (dlya !== kuda() || !otkryto) break;
    /* учитель в беседе: видео и PDF уходят как есть, без сжатия (ТЗ 27) */
    const r = komnata && uchitel() && neFoto(f) ? await poslatFajl(f, dlya, podpis) : await poslatFoto(f, dlya, podpis);
    if (r === 'big-v' || r === 'big-f'){
      oshibka(r === 'big-v' ? 'Видео больше 50 МБ — не влезет. Обрежь его или пришли ссылкой.' : 'Файл больше 25 МБ — не влезет.');
      return;
    }
    if (r === 'ne-foto'){ plohih++; continue; }
    if (!r){
      if (vse.length > 1) oshibka(`Ушло ${ushlo} из ${vse.length} фото. Остальные прикрепи ещё раз.`);
      return;
    }
    ushlo++; podpis = '';
  }
  if (podpis && !vvod.value){ vvod.value = podpis; rost(vvod); }      // ни одно не ушло — подпись возвращаем в поле
  const net = [];
  if (plohih) net.push(plohih === 1 && vse.length === 1 ? 'Это не фото или оно слишком большое. Попробуй другое.' : `${plohih} из ${vse.length} — не фото или слишком большие, их пропустил.`);
  if (plohih && komnata && !uchitel()) net.push('В беседу можно присылать фото.');
  if (files.length > FOTO_ZA_RAZ) net.push(`За раз — до ${FOTO_ZA_RAZ} фото. Остальные прикрепи ещё раз.`);
  if (net.length) oshibka(net.join(' '));
}

async function poslatFoto(file, dlya, text){
  oshibka('');
  const blob = await szhat(file);
  if (!blob) return 'ne-foto';
  if (dlya !== kuda() || nekomu()) return false;   // пока фото сжималось, открыли другого ученика
  const vvod = okno.querySelector('.vq-vvod');
  const re = otvetNa;   // у пачки «ответ на» уходит с первым фото: otpravitVChat его сбрасывает
  const fd = new FormData();
  if (komnata){ fd.append('j', komnata); fd.append('file', blob, 'foto.jpg'); }
  else fd.append('photo', blob, 'foto.jpg');
  if (text) fd.append('text', text);
  if (re) fd.append('re', re);
  if (komnata) { /* беседа: кому — весь класс */ }
  else if (uchitel()) fd.append('u', komu);
  else if (urokSejchas()) fd.append('urok', urokSejchas());
  return otpravitVChat(fd, '', { text, re, ft: 'photo', preview: URL.createObjectURL(blob) }, () => {
    if (text && !vvod.value){ vvod.value = text; rost(vvod); }
  }).then(ok => ok && dlya === kuda());
}

async function otpravitVChat(body, tip, vid, vernut){
  oshibka('');
  const u = uchitel(), dlya = kuda(), b = komnata;
  const m = Object.assign({ who: ya(), ts: new Date().toISOString(), zhdet: true }, vid);
  otvetNa = 0; risovatOtvet();
  lenta.push(m); risovat(true);
  const tot = () => dlya === kuda();                   // всё ещё открыт тот же чат
  const ubrat = () => { lenta = lenta.filter(x => x !== m); if (tot()) risovat(); if (m.preview) URL.revokeObjectURL(m.preview); };
  const nazad = () => { ubrat(); if (tot()){ vernut(); if (vid.re){ otvetNa = vid.re; risovatOtvet(); } } };
  try {
    chatBase = await serverBase();
    const r = await timedFetch(chatBase + (b ? '/chat/beseda/send' : u ? '/chat/d/send' : '/chat/send'),
      { method: 'POST', cache: 'no-store', headers: zagolovki(tip), body }, vid.dolgo ? 600000 : 45000);   // видео — минуты
    if (r.status === 429){ nazad(); oshibka(b ? 'Много сообщений подряд. Подожди минуту.' : 'Много сообщений подряд. Подожди пару минут.'); return; }
    if (r.status === 401){ ubrat(); zabytKlyuch(); znachok(0); vhodEkran(); return; }
    if (b && (r.status === 403 || r.status === 404)){ nazad(); oshibka('Беседа сейчас недоступна. Обнови страницу.'); return; }
    if (b && r.status === 400 && vid.ft){ nazad(); oshibka(u ? 'Такой файл не подходит: можно фото, видео (MP4, MOV) или PDF.' : 'В беседу можно присылать фото.'); return; }
    if (b && r.status === 413){ nazad(); oshibka('Файл слишком большой.'); return; }
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
    return true;
  } catch (_) {
    baseP = null;
    nazad();
    oshibka(vid.preview ? 'Фото не отправилось. Проверь интернет и прикрепи ещё раз.'
                        : 'Не отправилось. Проверь интернет и нажми ещё раз.');
  }
}

/* ═════════════ БЕСЕДА КЛАССА (ТЗ 27, D 07.11.2026) ═════════════
   Дети класса и учитель в одной ленте. Сервер — vk_bot/beseda.py, вход тем же ключом чата. У каждого в беседе
   свой номер: строка журнала, учитель — 'd'; номеров Телеграма страница не видит.
   В сети — зелёная точка у аватарки: страница присылала знак за последнюю минуту (besedaPing раз в 25 с, пока видна).
   Прочитано — сообщение побывало на экране при открытой беседе (vidnoDo → seen). Учитель видит «Прочитали 4 из 6»
   и кто именно, ученик у своих — ✓✓ без имён. Уведомления в Телеграм шлёт сервер (одно на серию, ночью тихо, @имя — всегда). */
let komnata = '', besedy = [];                         // открытая беседа ('' — личный чат) и мои беседы с сервера
let bYa = '', bLyudi = [], bChit = {}, bProchli = 0, bChitVid = '', bPins = [], pinIdx = 0, bNmat = 0, bOprosy = {}, bOpOn = false, opGen = 0, bVidel = 0, otlozheno = false;
let bMoi = -1, bNovoeOt = 0;                           // до чего я дочитал при входе; с какого сообщения черта «Новые»
/* Выключатель один — на сервере (BESEDA, BESEDA_PROBA в .env). Проба: беседа видна только там, где открыли
   страницу с ?beseda=1; без пробы — всем, кому сервер её отдаёт. До ответа сервера — не показываем */
let besedaProba = true;
const besedaVidna = () => mem.get(BESEDA_KEY) === '1' || !besedaProba;
const kuda = () => (komnata ? 'b:' + komnata : komu);   // куда сейчас пишем: беседа или ученик (у учителя)
const nekomu = () => uchitel() && !komu && !komnata;
function bSbros(){ bYa = ''; bLyudi = []; bChit = {}; bProchli = 0; bChitVid = ''; bPins = []; pinIdx = 0; bNmat = 0; bOprosy = {}; bVidel = 0; otlozheno = false; bMoi = -1; bNovoeOt = 0; }
const fileUrl = name => `${chatBase}/chat/beseda/file/${encodeURIComponent(name)}?j=${encodeURIComponent(komnata)}&k=${encodeURIComponent(chatKey())}`;
const neFoto = f => /^video\//.test(f.type) || f.type === 'application/pdf' || /\.(pdf|mp4|mov|webm)$/i.test(f.name || '');
const bChel = w => bLyudi.find(p => p.w === w);
const imyaKogo = (w, n) => { const p = bChel(w); return p ? p.n : (n || 'Ученик'); };
const imyaPervoe = n => String(n || '').trim().split(/\s+/)[0] || '';
function cvet(w){ let h = 0; for (const c of String(w)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return CVETA[h % CVETA.length]; }
function avatar(w, imya, on, mal){
  const vnutri = w === 'd' ? blok('vq-ava-blok') : esc([...String(imya || '?').trim()][0] || '?');
  return `<span class="vq-bava${mal ? ' mal' : ''}" style="background:${w === 'd' ? '#3b1a07' : cvet(w)}">${vnutri}${on ? '<i class="vq-on"></i>' : ''}</span>`;
}
/* «был в сети»: только что · 20 мин назад · в 15:31 · вчера · 03.11 */
function bylKogda(p, dlinno){
  if (!p.vhod) return 'нет входа';
  if (!p.byl) return 'не заходил';
  const t = new Date(p.byl), min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const dp = denPodpis(t);
  if (dp === 'Сегодня') return (dlinno ? 'сегодня ' : '') + 'в ' + vremya(t);
  if (dp === 'Вчера') return 'вчера' + (dlinno ? ' в ' + vremya(t) : '');
  return `${String(t.getDate()).padStart(2, '0')}.${String(t.getMonth() + 1).padStart(2, '0')}`;
}

/* мои беседы и сколько в них нового — раз в 25 с, пока страница видна (заодно сервер знает, что я в сети) */
let pingIdet = null;
function besedaPing(sejchas){
  if (!chatKey() || (document.hidden && !sejchas)) return Promise.resolve();
  if (!pingIdet) pingIdet = besedaPingRaz().finally(() => { pingIdet = null; });
  return pingIdet;                                     // уже спрашиваем — ждём тот же ответ
}
async function besedaPingRaz(){
  try {
    const base = await serverBase();
    /* v=1 — на этом устройстве открыта проба (?beseda=1): в пробе сервер отвечает и пишет «в сети» только таким */
    const r = await timedFetch(base + '/chat/beseda/ping' + (mem.get(BESEDA_KEY) === '1' ? '?v=1' : ''), { method: 'POST', cache: 'no-store', headers: zagolovki() }, 15000);
    if (!r.ok) return;                                 // 401 — с ключом разберётся личный чат; 404 — сервер без беседы
    const d = await r.json();
    const bylo = JSON.stringify(besedy);
    besedaProba = d.proba !== false;
    besedy = besedaVidna() ? (d.rooms || []).map(b => (otkryto && b.j === komnata ? Object.assign(b, { novyh: 0, upom: false }) : b)) : [];
    if (JSON.stringify(besedy) !== bylo){
      besedaZnachok(); risovatKomnaty();
      if (uchitel()) risovatLyudi();
    }
    if (komnata && otkryto && !besedy.some(b => b.j === komnata)) vybratKomnatu('');   // беседу выключили
  } catch (_) { baseP = null; }
}
/* цифра на «?» у ученика — непрочитанное в беседе; у учителя на «?» — как раньше (ждут ответа), беседа — на кружке */
function besedaZnachok(){
  const n = uchitel() ? 0 : besedy.reduce((a, b) => a + (otkryto && b.j === komnata ? 0 : b.novyh), 0);
  if (!uchitel()) znachok(n);
  if (String(n) !== (knopka.getAttribute('data-bn') || '0')){
    knopka.setAttribute('data-bn', String(n));
    knopka.classList.add('vq-tik'); knopka.classList.remove('vq-tik');   // Дневник перерисует значок на вкладке «Чат»
  }
}

/* ученик: «Беседа класса» и «Учитель» над лентой; заголовок, подсказка в поле и что можно прикрепить */
function risovatKomnaty(){
  if (!okno || !okno.classList.contains('vq-chat')) return;
  const u = uchitel(), est = besedaVidna() && besedy.length > 0;
  const box = okno.querySelector('.vq-komnaty');
  if (box){
    box.hidden = !est;
    if (est){
      const b = besedy[0], otv = knopka.classList.contains('est-otvet');
      box.innerHTML = `<button type="button" role="tab" data-vq="komnata" data-j="${esc(b.j)}" aria-selected="${!!komnata}"${komnata ? ' class="on"' : ''}>👥 Беседа класса${!komnata && b.novyh ? `<u>${b.novyh > 99 ? '99+' : b.novyh}</u>` : ''}</button>`
        + `<button type="button" role="tab" data-vq="komnata" data-j="" aria-selected="${!komnata}"${komnata ? '' : ' class="on"'}>✉️ Учитель${komnata && otv ? '<u>1</u>' : ''}</button>`;
    }
  }
  const h = okno.querySelector('#vq-h');
  if (h && !u) h.textContent = est ? 'Чат' : 'Чат с учителем';
  const vvod = okno.querySelector('.vq-vvod'), file = okno.querySelector('.vq-file'), skr = okno.querySelector('.vq-skrepka');
  if (vvod){
    vvod.placeholder = komnata ? 'Написать классу…' : (u ? 'Ответ ученику…' : 'Напиши сообщение…');
    vvod.setAttribute('aria-label', komnata ? 'Сообщение в беседу класса' : (u ? 'Ответ ученику' : 'Сообщение учителю'));
  }
  if (file) file.accept = komnata && u ? 'image/*,video/*,application/pdf,.pdf' : 'image/*';
  if (skr) skr.setAttribute('aria-label', komnata && u ? 'Прикрепить фото, видео или PDF' : 'Прикрепить фото');
  okno.classList.toggle('vq-v-besede', !!komnata);
  risovatSostav(); risovatPin();
}

function vybratKomnatu(j){
  if (j && !besedy.some(b => b.j === j)) return;
  if (!okno) return;
  menuZakryt(); atZakryt();
  const ov = okno.querySelector('.vq-ktookno'); if (ov) ov.remove();
  komnata = j || ''; mem.set(KOMNATA_KEY, komnata ? 'b' : '');
  if (komnata && uchitel()) komu = 0;
  lenta = []; lastId = 0; rv = -1; reakcii = {}; otvetNa = 0; if (pravka) bezPravki(true); pokolenie++;
  bSbros();
  oshibka(''); risovatOtvet(); risovatKomnaty();
  if (uchitel()) risovatLyudi();
  zapustitTaimer();
  const pole = okno.querySelector('.vq-pole'), box = okno.querySelector('.vq-lenta');
  if (uchitel() && !komnata){                          // из беседы обратно к ученикам — первого по списку
    pole.hidden = true; box.innerHTML = '<div class="vq-pusto">Загружаю…</div>';
    if (lyudi.length) vybrat(lyudi[0].u); else spisokTyanut(true);
    return;
  }
  pole.hidden = false;
  box.innerHTML = '<div class="vq-pusto">Загружаю…</div>';
  tyanut(true);
  besedaZnachok();
}

/* до какого сообщения человек дочитал: самое позднее из тех, что сейчас на экране (выше — он уже пролистал) */
function vidnoDo(){
  const box = okno && okno.querySelector('.vq-lenta');
  if (!box || !otkryto || document.hidden) return bVidel;
  const r0 = box.getBoundingClientRect();
  box.querySelectorAll('.vq-msg[data-mid]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < r0.bottom - 16 && r.bottom > r0.top + 16) bVidel = Math.max(bVidel, +el.dataset.mid || 0);
  });
  return bVidel;
}

async function tyanutB(pervyi){
  if ((tyanu && !pervyi) || !chatKey()) return;
  const j = komnata, pok = pokolenie;
  const tot = () => pok === pokolenie && komnata === j;
  tyanu = true;
  try {
    chatBase = await serverBase();
    const seen = vidnoDo();
    const og = opGen;                                   // голос, отданный после этого запроса, ответ не затирает
    const r = await timedFetch(`${chatBase}/chat/beseda/history?j=${encodeURIComponent(j)}&after=${lastId}&open=1&rv=${rv}${seen ? '&seen=' + seen : ''}`,
      { cache: 'no-store', headers: zagolovki() }, 15000);
    if (!tot()) return;
    if (r.status === 401){
      zabytKlyuch();
      if (chatKey()){ setTimeout(() => tyanut(true), 0); return; }
      komnata = ''; znachok(0); vhodEkran(); return;
    }
    if (r.status === 403 || r.status === 404){ besedy = besedy.filter(b => b.j !== j); vybratKomnatu(''); return; }
    const d = await r.json();
    if (!tot()) return;
    bYa = d.ya || bYa;
    if (bMoi < 0 && 'moi' in d){                       // первый ответ: с какого сообщения начинается новое для меня
      bMoi = d.moi;
      const n = (d.msgs || []).find(m => m.id > bMoi && m.w !== bYa);
      bNovoeOt = n ? n.id : 0;
    }
    let novoe = false;
    const msgs = (d.msgs || []).filter(m => m.id > lastId).map(m => Object.assign(m, { who: m.w }));
    if (msgs.length){
      lastId = msgs[msgs.length - 1].id;
      lenta = lenta.filter(m => !m.zhdet).concat(msgs, lenta.filter(m => m.zhdet));
      novoe = true;
    }
    if (d.dels){
      const del = new Map(d.dels);
      lenta.forEach(m => { if (m.id && del.has(m.id) && !m.del){ m.del = del.get(m.id); ['text', 'f', 'ft', 'fn', 're'].forEach(k => delete m[k]); novoe = true; } });
      if (pravka && del.has(pravka)) bezPravki(true);
    }
    if (d.reak){
      reakcii = {};
      d.reak.forEach(([id, w, e]) => { (reakcii[id] = reakcii[id] || {})[w] = e; });
      novoe = true;
    }
    if ('pins' in d || 'pin' in d){
      const stare = new Set(bPins.map(p => p.id)), bylo = (bPins[pinIdx % (bPins.length || 1)] || {}).id;
      bPins = (d.pins || (d.pin ? [d.pin] : [])).map(p => Object.assign(p, { who: p.w }));
      const nov = bPins.findIndex(p => !stare.has(p.id)), i = bPins.findIndex(p => p.id === bylo);
      pinIdx = stare.size && nov >= 0 ? nov : i >= 0 ? i : 0;   // появился новый закреп — показываем его; снят показанный — первый
      risovatPin();
    }
    if ('nmat' in d) bNmat = d.nmat || 0;
    bOpOn = !!d.op;
    let opStaroe = false;
    if (d.oprosy){
      if (og === opGen){ bOprosy = {}; d.oprosy.forEach(o => { bOprosy[o.id] = o; }); novoe = true; }
      else opStaroe = true;                            // пока шёл запрос, человек проголосовал — опросы перечитаем
    }
    if (d.eds){                                        // автор поправил текст — у всех новый, с подписью «изменено»
      const ed = new Map(d.eds);
      lenta.forEach(m => { if (m.id && ed.has(m.id) && !m.del && (m.text !== ed.get(m.id) || !m.ed)){ m.text = ed.get(m.id); m.ed = 1; novoe = true; } });
    }
    rv = opStaroe ? -1 : d.rv; estReakcii = true;
    bLyudi = d.lyudi || bLyudi;
    risovatSostav();
    const chit = JSON.stringify([d.chit, d.prochli]);
    const chitNovoe = chit !== bChitVid;
    bChitVid = chit; bChit = d.chit || {}; bProchli = d.prochli || 0;
    if (pervyi || novoe || otlozheno) risovat(pervyi);
    else if (chitNovoe) obnovitChit();                 // кто-то дочитал — меняем только подписи, ленту не трогаем
    const b = besedy.find(x => x.j === j);
    if (b && (b.novyh || b.upom)){ b.novyh = 0; b.upom = false; besedaZnachok(); risovatKomnaty(); if (uchitel()) risovatLyudi(); }
    if (pervyi) oshibka('');
    if (pervyi) setTimeout(() => { if (tot()) tyanut(false); }, 400);   // первая отрисовка — сразу отметить прочитанное
    if (d.more) setTimeout(() => { if (tot()) tyanut(false); }, 50);    // страница спала, а класс писал — догоняем дальше
  } catch (_) {
    baseP = null;
    if (pervyi) oshibka('Не получилось загрузить беседу. Проверь интернет.');
  } finally { tyanu = false; }
}

/* «Прочитали 4 из 6» — под сообщениями учителя; считаем по тому, кто до какого сообщения дочитал */
function chitTekst(id, avtor){
  const lyudi = bLyudi.filter(p => p.w !== avtor);
  const n = lyudi.filter(p => (bChit[p.w] || 0) >= id).length;
  return n >= lyudi.length && lyudi.length ? 'Прочитали все ✓' : `Прочитали ${n} из ${lyudi.length}`;
}
const galki = id => (bProchli >= id ? '✓✓' : '✓');
function obnovitChit(){
  if (!okno) return;
  okno.querySelectorAll('.vq-chit[data-id]').forEach(b => { b.textContent = chitTekst(+b.dataset.id, b.dataset.avtor); });
  okno.querySelectorAll('.vq-gal[data-id]').forEach(g => { g.textContent = galki(+g.dataset.id); g.classList.toggle('vse', bProchli >= +g.dataset.id); });
}

/* @Имя в тексте — жирным (кого позвали) */
function tekstHtml(t){
  return esc(t).replace(/(^|[^\w@])(@[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё-]*)/g, '$1<b class="vq-zov">$2</b>');
}
function reakciiB(m){
  const r = m.id && reakcii[m.id];
  if (!r) return '';
  const gr = {};
  Object.keys(r).forEach(w => { (gr[r[w]] = gr[r[w]] || []).push(w); });
  const moya = r[ya()] || '';
  const h = Object.keys(gr).map(e => `<button type="button" class="vq-rb${e === moya ? ' moya' : ''}" data-vq="reakb" data-id="${m.id}" data-e="${esc(e)}" title="${esc(gr[e].map(w => (w === ya() ? 'Ты' : imyaKogo(w))).join(', '))}">${esc(e)}${gr[e].length > 1 ? `<i>${gr[e].length}</i>` : ''}</button>`).join('');
  return h ? `<div class="vq-reak">${h}</div>` : '';
}

function risovatB(vniz){
  const box = okno && okno.querySelector('.vq-lenta');
  if (!box) return;
  /* смотрит видео — ленту не перерисовываем (видео бы остановилось); догоним, когда поставит на паузу */
  if (!vniz && [...box.querySelectorAll('video')].some(v => !v.paused)){ otlozheno = true; return; }
  otlozheno = false;
  menuZakryt();
  const bylVnizu = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  if (!lenta.length){
    box.innerHTML = `<div class="vq-pusto">${uchitel() ? 'В беседе пока пусто. Напиши классу первым — ученикам придёт уведомление в Телеграм.' : 'В беседе пока пусто. Напиши классу первым!'}</div>`;
    return;
  }
  let den = '', html = '', prev = null;
  albomy(lenta).forEach(g => {
    const m = g[0], d = new Date(m.ts), konec = new Date(g[g.length - 1].ts);
    const dp = denPodpis(d);
    if (dp !== den){ den = dp; html += `<div class="vq-den">${dp}</div>`; prev = null; }
    const moe = m.who === ya();
    const nach = !prev || prev.who !== m.who || d - new Date(prev.ts) > 600000;   // новый автор или пауза 10 минут — снова имя
    prev = g[g.length - 1];
    const mid = Math.max(...g.map(x => x.id || 0));
    if (bNovoeOt && g.some(x => x.id === bNovoeOt)){ html += '<div class="vq-novye">Новые сообщения</div>'; prev = null; }
    const p = bChel(m.who), imya = m.who === 'd' ? 'Учитель' : imyaKogo(m.who, m.n);
    /* точка «в сети» — только в полосе над лентой (D 07.11): у каждого сообщения она рябит */
    const ava = moe ? '' : (nach ? avatar(m.who, imya, false) : '<span class="vq-bava pusto"></span>');
    if (m.del){
      html += `<div class="vq-ryad ${moe ? 'moe' : 'ego'}">${ava}<div class="vq-msg vq-udal ${moe ? 'moe' : 'ego'}"${mid ? ` data-mid="${mid}"` : ''}>${m.del === 'd' ? 'Удалено учителем' : 'Сообщение удалено'}</div></div>`;
      return;
    }
    const fotki = g.map(x => x.preview || (x.ft === 'photo' && x.f ? fileUrl(x.f) : '')).filter(Boolean);
    const zhdet = g.some(x => x.zhdet);
    const img = src => `<img src="${esc(src)}" alt="Фото" data-vq="uvelichit">`;
    let fajl = '';
    if (m.ft === 'video') fajl = m.f ? `<video src="${esc(fileUrl(m.f))}#t=0.1" controls playsinline preload="metadata"></video>` : '<div class="vq-fajl">🎬 видео</div>';
    else if (m.ft === 'file') fajl = m.f ? `<a class="vq-fajl" data-vq="fajl" href="${esc(fileUrl(m.f))}" target="_blank" rel="noopener">📄 <span>${esc(m.fn || 'Файл')}</span></a>` : `<div class="vq-fajl">📄 <span>${esc(m.fn || 'Файл')}</span></div>`;
    const niz = zhdet ? 'отправляю…' : (m.ed ? '<span class="vq-ed">изменено</span> ' : '') + vremya(konec) + (moe && !uchitel() && mid ? ` <span class="vq-gal${bProchli >= mid ? ' vse' : ''}" data-id="${mid}">${galki(mid)}</span>` : '');
    const chit = uchitel() && m.who === 'd' && mid && !zhdet
      ? `<button type="button" class="vq-chit" data-vq="kto" data-id="${mid}" data-avtor="d">${chitTekst(mid, 'd')}</button>` : '';
    html += `<div class="vq-ryad ${moe ? 'moe' : 'ego'}${nach ? ' nach' : ''}">${ava}<div class="vq-msg ${moe ? 'moe' : 'ego'}${m.who === 'd' && !moe ? ' uch' : ''}${zhdet ? ' zhdet' : ''}${fotki.length > 1 ? ' alb' : ''}${m.ft === 'video' ? ' vid' : ''}${m.ft === 'opros' ? ' op' : ''}"${m.id ? ` data-vq="menu" data-id="${m.id}"` : ''}${mid ? ` data-mid="${mid}"` : ''}${g.length > 1 ? ` data-ids="${g.map(x => x.id || '').join(' ')}"` : ''}>
      ${!moe && nach ? `<div class="vq-avtor${m.who === 'd' ? ' uch' : ''}"${m.who === 'd' ? '' : ` style="color:${cvet(m.who)}"`}>${esc(imya)}</div>` : ''}
      ${m.re ? citata(m.re) : ''}
      ${fotki.length > 1 ? `<div class="vq-alb${fotki.length % 2 ? ' nechet' : ''}">${fotki.map(img).join('')}</div>` : fotki.map(img).join('')}${fajl}
      ${m.ft === 'opros' ? oprosHtml(m) : m.text ? `<div class="t">${tekstHtml(m.text)}</div>` : ''}
      <div class="vr">${niz}</div>${reakciiB(m)}${chit}</div></div>`;
  });
  box.innerHTML = html;
  box.querySelectorAll('video').forEach(v => {
    v.addEventListener('click', e => e.stopPropagation());              // нажатие по видео — играть, а не меню
    ['pause', 'ended'].forEach(ev => v.addEventListener(ev, () => { if (otlozheno) setTimeout(() => risovat(), 300); }));
  });
  /* первый заход: к первому непрочитанному (черта «Новые сообщения»), иначе — вниз, как было */
  const yakor = vniz && !bVidel && box.querySelector('.vq-novye');
  const kNovomu = () => { box.scrollTop += yakor.getBoundingClientRect().top - box.getBoundingClientRect().top - 8; };
  if (yakor || vniz || bylVnizu){
    const k = yakor ? kNovomu : () => { box.scrollTop = box.scrollHeight; };
    k();
    box.querySelectorAll('img, video').forEach(i => i.addEventListener(i.tagName === 'IMG' ? 'load' : 'loadedmetadata', k, { once: true }));
  }
}

/* кто в беседе: аватарки с зелёной точкой и «был …» — над лентой */
function risovatSostav(){
  const box = okno && okno.querySelector('.vq-sostav');
  if (!box) return;
  box.hidden = !komnata || !bLyudi.length;
  if (box.hidden){ box._v = ''; return; }
  /* себя в полосе не показываем (D 07.11: «ученик сам себя не видит») — и в счёте «в сети» только другие */
  const drugie = bLyudi.filter(p => p.w !== bYa);
  const on = drugie.filter(p => p.on).length;
  const vid = JSON.stringify([bYa, bNmat > 0, drugie.map(p => [p.w, p.n, p.on, bylKogda(p)])]);
  if (vid === box._v) return;
  box._v = vid;
  const sdvig = (box.querySelector('.vq-sostav-r') || {}).scrollLeft || 0;
  const kto = drugie.filter(p => p.on).map(p => imyaPervoe(p.n)).join(', ');
  /* у учителя на телефоне над лентой уже кружки учеников — здесь одна строка, нажал — аватарки (стиль .vq-sostav) */
  /* «📎 Материалы» — справа в той же строке и только когда есть что показать (D 07.11) */
  box.innerHTML = `<div class="vq-sostav-h"><button type="button" class="vq-sostav-t" data-vq="sostav" aria-expanded="${box.classList.contains('raskryt')}"><i class="vq-on"></i>в сети: <b>${on}</b> из ${drugie.length}${kto ? `<span class="kto"> · ${esc(kto)}</span>` : ''}<span class="str">›</span></button>`
    + (bNmat > 0 ? '<button type="button" class="vq-mat-b" data-vq="mat">📎 Материалы</button>' : '') + '</div><div class="vq-sostav-r">'
    + drugie.map(p => `<div class="vq-sost${p.on ? ' on' : ''}${p.vhod ? '' : ' net'}" title="${esc(p.n)} — ${p.on ? 'в сети' : esc(bylKogda(p, true))}">${avatar(p.w, p.n, p.on)}<span class="i">${esc(imyaPervoe(p.n))}</span><span class="s">${p.on ? 'в сети' : esc(bylKogda(p))}</span></div>`).join('')
    + '</div>';
  box.querySelector('.vq-sostav-r').scrollLeft = sdvig;
}

function risovatPin(){
  const box = okno && okno.querySelector('.vq-pin');
  if (!box) return;
  /* несколько закрепов (D 07.11): виден один, нажал — к сообщению и следующий; «2 из 3» — сколько их */
  const n = bPins.length, pin = n && bPins[pinIdx % n];
  box.hidden = !komnata || !pin;
  box.innerHTML = box.hidden ? '' : `<button type="button" class="vq-pin-t" data-vq="k-soobshcheniyu" data-id="${pin.id}"><b>📌 Закреплено${n > 1 ? ` · ${pinIdx % n + 1} из ${n}` : ''}</b><span>${esc(kratko(pin))}</span></button>`
    + (uchitel() ? '<button type="button" class="vq-pin-x" data-vq="pin-x" aria-label="Открепить">✕</button>' : '');
}

/* меню сообщения в беседе: удалить своё (учитель — любое), закрепить и «кто прочитал» — учитель */
function menuBesedy(id){
  if (!komnata) return '';
  const m = lenta.find(x => x.id === id);
  if (!m || m.del) return '';
  const moe = m.who === ya() && m.text && m.ft !== 'opros' && (uchitel() || Date.now() - new Date(m.ts) < 864e5);   // ученик — в течение суток
  const op = uchitel() && m.ft === 'opros' && bOprosy[id] && !bOprosy[id].closed;
  return (op ? '<button type="button" class="vq-menu-o" data-stop>⏹ Завершить опрос</button>' : '')
    + (moe ? '<button type="button" class="vq-menu-o" data-red>✏️ Изменить</button>' : '')
    + (uchitel() ? `<button type="button" class="vq-menu-o" data-pin>📌 ${bPins.some(p => p.id === id) ? 'Открепить' : 'Закрепить'}</button>
    <button type="button" class="vq-menu-o" data-kto>👁 Кто прочитал</button>` : '')
    + (uchitel() || m.who === ya() ? '<button type="button" class="vq-menu-o vq-menu-del" data-del>🗑 Удалить</button>' : '');
}

async function postB(adres, telo){
  const base = await serverBase();
  return timedFetch(base + adres, { method: 'POST', cache: 'no-store', headers: zagolovki('application/json'),
    body: JSON.stringify(Object.assign({ j: komnata }, telo)) }, 15000);
}
async function udalit(ids){
  if (!ids.length || !confirm(ids.length > 1 ? 'Удалить эти фото у всех?' : 'Удалить сообщение у всех?')) return;
  try {
    for (const id of ids){
      const r = await postB('/chat/beseda/del', { id });
      if (!r.ok && r.status !== 404) throw new Error('HTTP ' + r.status);
    }
    rv = -1; tyanut(false);                            // удалённое придёт с сервера
  } catch (_) { baseP = null; oshibka('Не удалилось. Попробуй ещё раз.'); }
}
async function zakrepit(id, on){
  try {
    const r = await postB('/chat/beseda/pin', { id, on: on ? 1 : 0 });
    if (r.status === 409){ const d = await r.json().catch(() => ({})); oshibka(`Закрепов уже ${d.max || 'много'} — открепи старый.`); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    rv = -1; tyanut(false);
  } catch (_) { baseP = null; oshibka('Не получилось. Попробуй ещё раз.'); }
}

/* правка своего сообщения (D 07.11): текст в поле, над полем «✏️ Изменить», отправка — сохранить */
function nachatPravku(id){
  const m = lenta.find(x => x.id === id);
  if (!m || !m.text) return;
  const vvod = okno.querySelector('.vq-vvod');
  if (!pravka) vvod.dataset.chernovik = vvod.value;    // что набирал до правки — вернём после
  pravka = id; otvetNa = 0;
  vvod.value = m.text; rost(vvod); risovatOtvet();
  vvod.focus({ preventScroll: true });
  vvod.setSelectionRange(vvod.value.length, vvod.value.length);
}
function bezPravki(vernut){
  const vvod = okno && okno.querySelector('.vq-vvod');
  pravka = 0; risovatOtvet();
  if (vvod){ vvod.value = vernut ? vvod.dataset.chernovik || '' : ''; delete vvod.dataset.chernovik; rost(vvod); }
}
async function pravit(id, text){
  const m = lenta.find(x => x.id === id);
  bezPravki(false);
  if (!m || text === m.text) return;
  const bylo = [m.text, m.ed];
  m.text = text; m.ed = 1; risovat();                  // сразу на экране, сервер подтвердит
  try {
    const r = await postB('/chat/beseda/edit', { id, text });
    if (r.status === 409){ throw Object.assign(new Error('pozdno'), { pozdno: true }); }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    oshibka(''); rv = -1;
  } catch (e) {
    [m.text, m.ed] = bylo; risovat();
    const vvod = okno && okno.querySelector('.vq-vvod');
    if (vvod && !vvod.value){                          // набранное не теряем: сбой — снова правка, поздно — уйдёт новым
      if (!e.pozdno){ vvod.dataset.chernovik = ''; pravka = id; }
      vvod.value = text; rost(vvod); risovatOtvet();
    }
    if (!e.pozdno) baseP = null;
    oshibka(e.pozdno ? 'Изменить можно только в первые сутки — отправь новым сообщением.' : 'Не сохранилось. Попробуй ещё раз.');
  }
}

/* «Кто прочитал» — только учителю: прочитали (со временем и реакцией) и не прочитали; «Напомнить» — им в Телеграм */
async function ktoProchital(id){
  if (!uchitel() || !komnata || !okno) return;
  menuZakryt();
  let ov = okno.querySelector('.vq-ktookno');
  if (!ov){ ov = document.createElement('div'); ov.className = 'vq-ktookno'; okno.appendChild(ov); }
  const shapka = '<div class="vq-kto-h"><b>Кто прочитал</b><button type="button" class="vq-x" data-vq="kto-x" aria-label="Закрыть">✕</button></div>';
  ov.innerHTML = shapka + '<div class="vq-pusto">Загружаю…</div>';
  try {
    const base = await serverBase();
    const r = await timedFetch(`${base}/chat/beseda/kto?j=${encodeURIComponent(komnata)}&id=${id}`, { cache: 'no-store', headers: zagolovki() }, 15000);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (!ov.isConnected) return;
    const ryad = (x, pravo) => `<div class="vq-kto-r">${avatar(x.w, x.n, false, true)}<span class="n">${esc(x.n)}</span>${pravo}</div>`;
    const mozhno = d.net.filter(x => x.vhod).length;
    ov.innerHTML = shapka + `<div class="vq-kto-telo">
      <div class="vq-kto-sec">Прочитали · ${d.chitali.length}</div>
      ${d.chitali.length ? d.chitali.map(x => ryad(x, `${x.e ? `<span class="e">${esc(x.e)}</span>` : ''}<span class="t">${x.at ? esc(bylKogda({ vhod: true, byl: x.at }, true)) : ''}</span>`)).join('') : '<p class="vq-kto-0">Пока никто</p>'}
      <div class="vq-kto-sec">Не прочитали · ${d.net.length}</div>
      ${d.net.length ? d.net.map(x => ryad(x, x.vhod ? '' : '<span class="t">нет входа</span>')).join('') : '<p class="vq-kto-0">Все прочитали 🎉</p>'}
      ${mozhno ? `<button type="button" class="vq-send vq-nap" data-vq="napomnit" data-id="${id}"${d.tiho ? ' disabled' : ''}>Напомнить в Телеграме</button>
        <p class="vq-note">${d.tiho ? 'Ночью не напоминаем — утром можно.' : d.nap ? 'Уже напоминал ' + esc(bylKogda({ vhod: true, byl: d.nap }, true)) + '. Снова — через час.' : 'Придёт тем, кто не прочитал: ' + mozhno + '.'}</p>` : ''}
    </div>`;
  } catch (_) {
    baseP = null;
    if (ov.isConnected) ov.innerHTML = shapka + '<div class="vq-pusto">Не получилось загрузить. Проверь интернет.</div>';
  }
}
/* ═══ ОПРОСЫ (D 07.11): учитель спрашивает, варианты — текст, число или картинка; ученик нажимает свой вариант ═══
   Итог полосками ученик видит, когда проголосовал или опрос завершён; учитель — всегда и поимённо. */
function oprosHtml(m){
  const o = bOprosy[m.id];
  const shapka = `<div class="vq-op-h">📊 Опрос</div><div class="vq-op-q">${tekstHtml(m.text || '')}</div>`;
  if (!o) return shapka;
  const vsego = o.n.reduce((a, b) => a + b, 0), u = uchitel();
  const vidno = u || o.moj !== null || o.closed;
  const v = o.v.map((x, i) => {
    const pr = vsego ? Math.round(o.n[i] * 100 / vsego) : 0, moj = o.moj === i;
    const golos = !o.closed && !u, tag = golos ? 'button' : 'div';
    return `<${tag}${golos ? ` type="button" data-vq="golos" data-id="${m.id}" data-n="${i}"` : ''} class="vq-op-v${moj ? ' moj' : ''}${x.f ? ' kart' : ''}">
      ${vidno ? `<i class="bar" style="width:${pr}%"></i>` : ''}
      ${x.f ? `<img src="${esc(fileUrl(x.f))}" alt="Картинка варианта — нажми, чтобы увеличить" loading="lazy" data-vq="uvelichit">` : ''}
      <span class="t">${moj ? '✓ ' : ''}${esc(x.t)}</span>${vidno ? `<span class="pr">${o.n[i]} · ${pr}%</span>` : ''}</${tag}>`
      + (u && o.kto && o.kto[i].length ? `<div class="vq-op-kto">${esc(o.kto[i].join(', '))}</div>` : '');
  }).join('');
  const niz = o.closed ? `Опрос завершён · голосов: ${vsego}` : u ? (vsego ? `Голосов: ${vsego}` : 'Пока никто не выбрал')
    : o.moj === null ? 'Нажми свой вариант' : `Голосов: ${vsego} · передумал — нажми другой`;
  return shapka + `<div class="vq-op-sp">${v}</div><div class="vq-op-niz">${niz}</div>`;
}
async function golosovat(id, n){
  const o = bOprosy[id];
  if (!o || o.closed || uchitel() || !(n >= 0)) return;
  opGen++;
  const bylo = { n: o.n.slice(), moj: o.moj };
  const novyj = o.moj === n ? -1 : n;                  // нажал свой — голос снят
  if (o.moj !== null) o.n[o.moj]--;
  if (novyj >= 0) o.n[novyj]++;
  o.moj = novyj >= 0 ? novyj : null;
  risovat();
  try {
    const r = await postB('/chat/beseda/golos', { id, n: novyj });
    if (r.status === 409){ Object.assign(o, bylo, { closed: true }); risovat(); oshibka('Опрос уже завершён.'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    oshibka(''); rv = -1;
  } catch (_) { Object.assign(o, bylo); risovat(); baseP = null; oshibka('Голос не сохранился. Попробуй ещё раз.'); }
}
async function zavershitOpros(id){
  if (!confirm('Завершить опрос? Голосовать больше будет нельзя.')) return;
  try {
    const r = await postB('/chat/beseda/opros_stop', { id });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    rv = -1; tyanut(false);
  } catch (_) { baseP = null; oshibka('Не получилось. Попробуй ещё раз.'); }
}

/* скрепка учителя в беседе: «Фото, видео или файл» / «Опрос» */
function skrepkaMenu(el){
  const bylo = mn && mn.dataset.skr;
  menuZakryt();
  if (bylo) return;
  mn = document.createElement('div');
  mn.className = 'vq-menu'; mn.dataset.skr = '1';
  mn.innerHTML = '<button type="button" class="vq-menu-o" data-f>📎 Фото, видео или файл</button><button type="button" class="vq-menu-o" data-op>📊 Опрос</button>';
  document.body.appendChild(mn);
  const r = el.getBoundingClientRect(), h = mn.offsetHeight;
  mn.style.left = Math.max(8, Math.min(r.left, innerWidth - mn.offsetWidth - 8)) + 'px';
  mn.style.top = Math.max(8, r.top - h - 6) + 'px';
  mn.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b) return;
    menuZakryt();
    if ('f' in b.dataset) okno.querySelector('.vq-file').click(); else noviyOpros();
  });
}

/* лист «Новый опрос»: вопрос, варианты (текст и/или картинка), быстрые наборы «1 2 3 4», «Да / Нет», «А Б В Г» */
let opV = [];
function opSbrosKart(){ opV.forEach(v => { if (v.url) URL.revokeObjectURL(v.url); }); }
function noviyOpros(){
  if (!komnata || !uchitel() || !okno) return;
  const staryj = okno.querySelector('.vq-ktookno'); if (staryj) staryj.remove();   // свой лист заново: слушатели — один раз
  const ov = document.createElement('div'); ov.className = 'vq-ktookno'; okno.appendChild(ov);
  opSbrosKart(); opV = [{ t: '' }, { t: '' }];
  ov.innerHTML = `<div class="vq-kto-h"><b>Новый опрос</b><button type="button" class="vq-x" data-vq="kto-x" aria-label="Закрыть">✕</button></div>
    <div class="vq-kto-telo vq-opf">
      <textarea class="vq-op-in vq-op-vopr" rows="2" maxlength="300" placeholder="Вопрос классу"></textarea>
      <div class="vq-op-bystro"><button type="button" data-vq="op-gotovo" data-v="1|2|3|4">1 2 3 4</button><button type="button" data-vq="op-gotovo" data-v="Да|Нет">Да / Нет</button><button type="button" data-vq="op-gotovo" data-v="А|Б|В|Г">А Б В Г</button></div>
      <div class="vq-op-varianty"></div>
      <button type="button" class="vq-op-plus" data-vq="op-plus">＋ Вариант</button>
      <input type="file" class="vq-op-file" accept="image/*" hidden>
      <p class="vq-err vq-op-err" hidden></p>
      <button type="button" class="vq-send" data-vq="op-go">Отправить опрос</button>
    </div>`;
  ov.addEventListener('input', e => { if (e.target.matches('.vq-op-t')) opV[+e.target.dataset.i].t = e.target.value; });
  ov.querySelector('.vq-op-file').addEventListener('change', async e => {
    const f = (e.target.files || [])[0], i = +ov.dataset.ki;
    e.target.value = '';
    if (!f || !opV[i]) return;
    const b = await szhat(f);
    if (!b){ opOshibka(ov, 'Это не картинка. Выбери фото.'); return; }
    if (opV[i].url) URL.revokeObjectURL(opV[i].url);
    opV[i].file = b; opV[i].url = URL.createObjectURL(b);
    risovatOpV(ov);
  });
  risovatOpV(ov);
  ov.querySelector('.vq-op-vopr').focus({ preventScroll: true });
}
function risovatOpV(ov){
  ov.querySelector('.vq-op-varianty').innerHTML = opV.map((v, i) => `<div class="vq-op-r">
    <textarea class="vq-op-in vq-op-t" rows="1" maxlength="100" data-i="${i}" placeholder="Вариант ${i + 1}">${esc(v.t)}</textarea>
    <button type="button" class="vq-op-kn${v.url ? ' est' : ''}" data-vq="op-kart" data-i="${i}" aria-label="${v.url ? 'Убрать картинку' : 'Картинка к варианту'}">${v.url ? `<img src="${v.url}" alt="">` : '🖼'}</button>
    ${opV.length > 2 ? `<button type="button" class="vq-op-kn" data-vq="op-ubrat" data-i="${i}" aria-label="Убрать вариант">✕</button>` : ''}</div>`).join('');
  ov.querySelector('.vq-op-plus').hidden = opV.length >= 10;
}
function opOshibka(ov, t){ const e = ov.querySelector('.vq-op-err'); e.textContent = t; e.hidden = !t; }
async function oprosForma(a){
  const ov = a.closest('.vq-ktookno');
  if (!ov) return;
  const k = a.dataset.vq, i = +a.dataset.i;
  opOshibka(ov, '');
  if (k === 'op-gotovo'){
    if (opV.some(x => x.t.trim() || x.url) && !confirm('Заменить варианты на «' + a.textContent + '»?')) return;
    opSbrosKart(); opV = a.dataset.v.split('|').map(t => ({ t })); risovatOpV(ov);
  }
  else if (k === 'op-plus' && opV.length < 10){ opV.push({ t: '' }); risovatOpV(ov); ov.querySelector(`.vq-op-t[data-i="${opV.length - 1}"]`).focus(); }
  else if (k === 'op-ubrat' && opV.length > 2){ if (opV[i].url) URL.revokeObjectURL(opV[i].url); opV.splice(i, 1); risovatOpV(ov); }
  else if (k === 'op-kart'){
    if (opV[i].url){ URL.revokeObjectURL(opV[i].url); delete opV[i].url; delete opV[i].file; risovatOpV(ov); }
    else { ov.dataset.ki = i; ov.querySelector('.vq-op-file').click(); }
  }
  else if (k === 'op-go'){
    const q = ov.querySelector('.vq-op-vopr').value.trim();
    const v = opV.map(x => ({ t: x.t.trim(), file: x.file })).filter(x => x.t || x.file);
    if (!q){ opOshibka(ov, 'Напиши вопрос.'); return; }
    if (v.length < 2){ opOshibka(ov, 'Нужно хотя бы два варианта.'); return; }
    const fd = new FormData();
    fd.append('j', komnata); fd.append('q', q); fd.append('v', JSON.stringify(v.map(x => x.t)));
    v.forEach((x, n) => { if (x.file) fd.append('f' + n, x.file, 'v' + n + '.jpg'); });
    a.disabled = true; a.textContent = 'Отправляю…';
    try {
      const base = await serverBase();
      const r = await timedFetch(base + '/chat/beseda/opros', { method: 'POST', cache: 'no-store', headers: zagolovki(), body: fd }, 60000);
      if (r.status === 413 || r.status === 400){
        const e = (await r.json().catch(() => ({}))).error;
        a.disabled = false; a.textContent = 'Отправить опрос';
        opOshibka(ov, r.status === 413 || e === 'big' ? 'Картинки слишком большие. Убери одну или возьми поменьше.'
          : e === 'ne-tot' ? 'Одна из картинок не подходит. Нужно обычное фото.' : 'Проверь вопрос и варианты: у каждого — текст или картинка.');
        return;
      }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      opSbrosKart(); opV = [];
      ov.remove(); rv = -1; tyanut(false);
    } catch (_) {
      baseP = null; a.disabled = false; a.textContent = 'Отправить опрос';
      opOshibka(ov, 'Не отправилось. Проверь интернет и попробуй ещё раз.');
    }
  }
}

/* «📎 Материалы» (D 07.11): закрепы, файлы, видео и фото учителя одним листом — новые сверху */
async function materialy(){
  if (!komnata || !okno) return;
  menuZakryt();
  let ov = okno.querySelector('.vq-ktookno');
  if (!ov){ ov = document.createElement('div'); ov.className = 'vq-ktookno'; okno.appendChild(ov); }
  const shapka = '<div class="vq-kto-h"><b>Материалы</b><button type="button" class="vq-x" data-vq="kto-x" aria-label="Закрыть">✕</button></div>';
  ov.innerHTML = shapka + '<div class="vq-pusto">Загружаю…</div>';
  try {
    const base = await serverBase();
    const j = komnata;
    const r = await timedFetch(`${base}/chat/beseda/materialy?j=${encodeURIComponent(j)}`, { cache: 'no-store', headers: zagolovki() }, 15000);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (!ov.isConnected || komnata !== j) return;      // ссылки на файлы несут комнату — другая комната, лист не наш
    const kogda = m => `<em>${esc(denPodpis(new Date(m.ts)))}</em>`;
    const podpis = (m, net) => esc(m.text ? kratko(m) : net);
    const pins = d.pins.map(p => ({ ...p, who: p.w })), zakr = new Set(pins.map(p => p.id));
    const svoi = d.files.filter(m => !zakr.has(m.id));   // закреплённый файл — только в «Закреплено», без повтора
    const fajly = svoi.filter(m => m.ft === 'file'), video = svoi.filter(m => m.ft === 'video'), foto = svoi.filter(m => m.ft === 'photo');
    const sek = (t, n, h) => n ? `<div class="vq-kto-sec">${t} · ${n}</div>${h}` : '';
    const ssylka = (m, znak, imya) => `<a class="vq-fajl vq-mat-r" href="${esc(fileUrl(m.f))}" target="_blank" rel="noopener">${znak} <span>${imya}</span>${kogda(m)}</a>`;
    const telo = sek('📌 Закреплено', pins.length, pins.map(m => `<button type="button" class="vq-mat-pin" data-vq="k-soobshcheniyu" data-id="${m.id}"><span>${esc(kratko(m))}</span>${kogda(m)}${m.text ? `<div class="vq-mat-full">${tekstHtml(m.text)}</div>` : ''}</button>`).join(''))
      + sek('📄 Файлы', fajly.length, fajly.map(m => ssylka(m, '📄', esc(m.fn || 'Файл'))).join(''))
      + sek('🎬 Видео', video.length, video.map(m => ssylka(m, '🎬', podpis(m, 'Видео'))).join(''))
      + sek('📷 Фото', foto.length, `<div class="vq-mat-foto">${foto.map(m => `<img src="${esc(fileUrl(m.f))}" alt="${podpis(m, 'Фото')}" loading="lazy" data-vq="uvelichit">`).join('')}</div>`);
    ov.innerHTML = shapka + `<div class="vq-kto-telo">${telo || `<div class="vq-pusto">${uchitel() ? 'Пока пусто. Файлы, видео и фото, которые ты пришлёшь в беседу, и закреплённые сообщения соберутся здесь.' : 'Пока пусто. Здесь будут файлы и видео от учителя.'}</div>`}</div>`;
  } catch (_) {
    baseP = null;
    if (ov.isConnected) ov.innerHTML = shapka + '<div class="vq-pusto">Не получилось загрузить. Проверь интернет.</div>';
  }
}
async function napomnit(btn){
  btn.disabled = true; btn.textContent = 'Напоминаю…';
  const note = btn.nextElementSibling;
  try {
    const r = await postB('/chat/beseda/napomnit', { id: +btn.dataset.id });
    const d = await r.json().catch(() => ({}));
    if (r.ok){ btn.textContent = '✓ Напомнил'; if (note) note.textContent = 'Ушло: ' + d.vsego + '. Снова — через час.'; return; }
    btn.textContent = 'Напомнить в Телеграме';
    if (note) note.textContent = d.error === 'noch' ? 'Ночью не напоминаем — утром можно.' : d.error === 'rano' ? 'Уже напоминал недавно. Снова — через час.' : 'Не получилось. Попробуй ещё раз.';
    btn.disabled = d.error === 'noch' || d.error === 'rano';
  } catch (_) { baseP = null; btn.disabled = false; btn.textContent = 'Напомнить в Телеграме'; if (note) note.textContent = 'Не получилось. Проверь интернет.'; }
}

/* @ в поле — список, кого позвать (ему придёт уведомление, даже ночью) */
function atZakryt(){ const box = okno && okno.querySelector('.vq-at'); if (box){ box.hidden = true; box.innerHTML = ''; } }
function atProverit(){
  const vvod = okno && okno.querySelector('.vq-vvod'), box = okno && okno.querySelector('.vq-at');
  if (!komnata || !vvod || !box) return;
  const m = /(^|\s)@([^\s@]*)$/.exec(vvod.value.slice(0, vvod.selectionStart));
  if (!m){ atZakryt(); return; }
  const q = m[2].toLowerCase().replace(/ё/g, 'е');
  const kto = bLyudi.filter(p => p.w !== bYa && p.vhod && imyaPervoe(p.n).toLowerCase().replace(/ё/g, 'е').startsWith(q));
  if (!kto.length){ atZakryt(); return; }
  box.hidden = false;
  box.innerHTML = kto.map(p => `<button type="button" data-vq="at" data-imya="${esc(imyaPervoe(p.n))}">${avatar(p.w, p.n, p.on, true)}<span>${esc(p.n)}</span></button>`).join('');
}
function vstavitImya(imya){
  const vvod = okno.querySelector('.vq-vvod'), pos = vvod.selectionStart;
  const do_ = vvod.value.slice(0, pos).replace(/@([^\s@]*)$/, '@' + imya + ' ');
  vvod.value = do_ + vvod.value.slice(pos);
  vvod.focus(); vvod.setSelectionRange(do_.length, do_.length);
  rost(vvod); atZakryt();
}

/* учитель в беседе: видео (до 50 МБ) и PDF (до 25 МБ) — как есть, без сжатия */
async function poslatFajl(file, dlya, text){
  const video = /^video\//.test(file.type) || /\.(mp4|mov|webm)$/i.test(file.name || '');
  if (file.size > (video ? 50 : 25) * 1048576) return video ? 'big-v' : 'big-f';
  if (dlya !== kuda()) return false;
  const vvod = okno.querySelector('.vq-vvod');
  const re = otvetNa;
  const fd = new FormData();
  fd.append('j', komnata);
  fd.append('file', file, file.name || (video ? 'video.mp4' : 'file.pdf'));
  fd.append('fn', file.name || '');
  if (text) fd.append('text', text);
  if (re) fd.append('re', re);
  return otpravitVChat(fd, '', { text, re, ft: video ? 'video' : 'file', fn: file.name || '', dolgo: true }, () => {
    if (text && !vvod.value){ vvod.value = text; rost(vvod); }
  }).then(ok => ok && dlya === kuda());
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
/* беседа класса: «я в сети» и сколько нового — раз в 25 с, пока страница видна; вернулся на вкладку — сразу */
setInterval(besedaPing, 25000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) besedaPing(); });
besedaPing();
/* вернулся кнопкой «Назад» из Телеграма посреди входа — сразу поле для кода */
const nazad = ((performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {}).type === 'back_forward';
if (zovutVChat || (nazad && !chatKey() && nachatyiVhod())) otkryt();   // «Открыть чат» из бота: чат или вход
else estOtvet();
})();
