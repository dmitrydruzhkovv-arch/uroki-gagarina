/* ════════════════════════════════════════════════════════════════
   app.js — сборка ленты уроков.
   Данные берёт из data.js (ручной файл), ничего не выдумывает.
   Правило порядка: свежий урок ВСЕГДА наверху — до него не листают.
   ════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const $  = s => document.querySelector(s);
const esc = t => String(t == null ? '' : t)
  .replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const MES = ['января','февраля','марта','апреля','мая','июня','июля','августа',
             'сентября','октября','ноября','декабря'];
const DNI = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
const ICON = { teoriya:'📘', live:'🎯', dz:'✏️', web:'🕹', pdf:'⤓' };

/* ── шапка ── */
$('#school').textContent = DATA.site.school + ' · ' + DATA.site.year;
$('#title').textContent  = DATA.site.title;
document.title = DATA.site.title + ' — ' + DATA.site.school;

/* ── дата урока: '11.09' → Date.
      Год берём из учебного: сентябрь—декабрь — первый, январь—август — второй. ── */
function dateOf(str){
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(String(str || '').trim());
  if (!m) return null;
  const d = +m[1], mo = +m[2];
  const years = (DATA.site.year || '').match(/\d{4}/g) || [];
  const y = +(mo >= 9 ? years[0] : years[1]) || new Date().getFullYear();
  const dt = new Date(y, mo - 1, d);
  return isNaN(dt) ? null : dt;
}
const dayName  = dt => dt ? DNI[dt.getDay()] : '';
const dateText = dt => dt ? dt.getDate() + ' ' + MES[dt.getMonth()] : '';

/* полночь сегодняшнего дня — точка отсчёта для «эта неделя» и сроков */
const TODAY = (() => { const t = new Date(); t.setHours(0,0,0,0); return t; })();
const DAY = 86400000;
const monday = dt => {
  const m = new Date(dt); m.setHours(0,0,0,0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
};
const MON_NOW = monday(TODAY);

/* ── плоский список всех уроков, свежие первыми ── */
const KURS = {};
DATA.kursy.forEach(k => { KURS[k.id] = k; });

const UROKI = DATA.kursy
  .flatMap(k => (k.uroki || []).map(u => ({ ...u, kurs:k })))
  .filter(u => dateOf(u.date))
  .map(u => ({ ...u, dt:dateOf(u.date) }))
  .sort((a, b) => (b.dt - a.dt) || (b.n - a.n));

/* сдвоенная пара — два урока одного предмета в один день.
   Лента идёт сверху вниз от свежего, поэтому первый в списке — это второй урок пары. */
UROKI.forEach(u => {
  const same = UROKI.filter(x => x.kurs.id === u.kurs.id && +x.dt === +u.dt);
  if (same.length > 1) u.paraN = same.length - same.indexOf(u);
});

/* ── режим показа: лента уроков или программа года ── */
let rezhim = 'lenta';
try { if (localStorage.getItem('rezhim') === 'programma') rezhim = 'programma'; } catch (_) {}
if (typeof PLAN === 'undefined') rezhim = 'lenta';

if (typeof PLAN !== 'undefined'){
  $('#modes').innerHTML =
    `<button class="mode${rezhim === 'lenta' ? ' on' : ''}" data-m="lenta">Лента уроков</button>` +
    `<button class="mode${rezhim === 'programma' ? ' on' : ''}" data-m="programma">Программа года</button>`;
  $('#modes').addEventListener('click', e => {
    const b = e.target.closest('.mode'); if (!b) return;
    rezhim = b.dataset.m;
    document.querySelectorAll('.mode').forEach(m => m.classList.toggle('on', m === b));
    try { localStorage.setItem('rezhim', rezhim); } catch (_) {}
    render(vybor);
  });
}

/* ── три предмета: нажал один — остался он, нажал его же — снова все.
      Отдельная кнопка «Все» не нужна: её роль играет повторное нажатие. ── */
function risovatChipy(vyb){
  $('#filters').innerHTML = DATA.kursy.map(k =>
    `<button class="chip${vyb === 'all' || vyb === k.id ? ' on' : ''}"
       data-k="${esc(k.id)}" style="--c:var(--c-${esc(k.id)})">
       <i>${k.icon}</i><span>${esc(k.name)}</span>
       <b>${(k.uroki || []).length || 0}</b></button>`).join('');
}

/* ── заголовок недели ── */
function weekTitle(mon){
  const diff = Math.round((MON_NOW - mon) / DAY / 7);
  if (diff === 0) return { t:'Эта неделя', now:true };
  if (diff === 1) return { t:'Прошлая неделя', now:false };
  const end = new Date(mon.getTime() + 6 * DAY);
  const t = mon.getMonth() === end.getMonth()
    ? `${mon.getDate()}—${end.getDate()} ${MES[mon.getMonth()]}`
    : `${mon.getDate()} ${MES[mon.getMonth()]} — ${end.getDate()} ${MES[end.getMonth()]}`;
  return { t, now:false };
}

/* ── домашка ─────────────────────────────────────────── */

function nomerHTML(x){
  return `<div class="dz-no"><span class="head">` +
    `<span class="n">№ ${esc(x.no)}</span>` +
    (x.bukvy ? `<span class="b">(${esc(x.bukvy)})</span>` : '') +
    `</span>` +
    (x.what ? `<span class="w">${esc(x.what)}</span>` : '') +
    `</div>`;
}

function grpHTML(icon, title, note, inner){
  return `<div class="dz-grp"><h4>${icon} ${esc(title)}` +
    (note ? ` · ${esc(note)}` : '') + `</h4>${inner}</div>`;
}

function dzHTML(u){
  const dz = u.dz;
  if (!dz) return u.dzBook
    ? `<div class="dz-plain"><b>Домашка:</b> ${esc(u.dzBook)}</div>` : '';

  const due = dateOf(dz.due);
  let head = 'Домашняя работа';
  let badge = '';
  if (due){
    head = `К ${vinit(dayName(due))}, ${dateText(due)}`;
    const left = Math.round((due - TODAY) / DAY);
    if (left === 0)      badge = '<span class="soon">сегодня</span>';
    else if (left === 1) badge = '<span class="soon">завтра</span>';
    else if (left > 1 && left <= 3) badge = `<span class="soon">через ${left} дня</span>`;
  }

  let body = '';
  if (dz.print && dz.print.length){
    body += grpHTML('📄', 'На распечатке', dz.printLabel,
      dz.print.map(s => `<div class="dz-li">${esc(s)}</div>`).join('') +
      (dz.printNote ? `<div class="dz-note">${esc(dz.printNote)}</div>` : ''));
  }
  if (dz.uchit && dz.uchit.length){
    body += grpHTML('📖', 'Выучить', '',
      dz.uchit.map(s => `<div class="dz-li">${esc(s)}</div>`).join(''));
  }
  if (dz.tetrad && dz.tetrad.length){
    body += grpHTML('✍️', 'В тетради', '',
      dz.tetrad.map(s => `<div class="dz-li">${esc(s)}</div>`).join(''));
  }
  if (dz.book && dz.book.length){
    body += grpHTML('📘', 'Из учебника', '', dz.book.map(nomerHTML).join(''));
  }
  if (dz.extra && dz.extra.length){
    body += grpHTML('⭐', 'Кому мало', '',
      `<div class="dz-extra">${dz.extra.map(nomerHTML).join('')}</div>`);
  }
  if (!body) return '';

  return `<div class="dz">
    <div class="dz-due">📌 ${esc(head)}${badge}</div>
    ${body}
    <button class="dz-copy" data-copy="${esc(dzText(u))}">📋 Скопировать домашку</button>
  </div>`;
}

/* «пятница» → «пятнице»: срок читается как «к пятнице, 11 сентября» */
function vinit(d){
  if (!d) return d;
  if (d === 'среда') return 'среде';
  if (d.endsWith('а')) return d.slice(0, -1) + 'е';        // пятница → пятнице
  if (d.endsWith('е')) return d;                            // воскресенье
  return d + 'у';                                           // вторник → вторнику
}

/* домашка обычным текстом — для кнопки «скопировать» */
function dzText(u){
  const dz = u.dz;
  if (!dz) return u.dzBook || '';
  const due = dateOf(dz.due);
  const out = [`${u.kurs.name} — ${u.title}`];
  if (due) out.push(`К ${vinit(dayName(due))}, ${dateText(due)}`);
  if (dz.print && dz.print.length){
    out.push('', 'На распечатке' + (dz.printLabel ? ` (${dz.printLabel})` : '') + ':');
    dz.print.forEach(s => out.push('  — ' + s));
    if (dz.printNote) out.push('  ' + dz.printNote);
  }
  if (dz.uchit && dz.uchit.length){
    out.push('', 'Выучить:'); dz.uchit.forEach(s => out.push('  — ' + s));
  }
  if (dz.tetrad && dz.tetrad.length){
    out.push('', 'В тетради:'); dz.tetrad.forEach(s => out.push('  — ' + s));
  }
  if (dz.book && dz.book.length){
    out.push('', 'Из учебника:');
    dz.book.forEach(x => out.push(`  № ${x.no}${x.bukvy ? ' (' + x.bukvy + ')' : ''}` +
      (x.what ? ' — ' + x.what : '')));
  }
  if (dz.extra && dz.extra.length){
    out.push('', 'Кому мало: ' +
      dz.extra.map(x => `№ ${x.no}${x.bukvy ? ' (' + x.bukvy + ')' : ''}`).join(', '));
  }
  return out.join('\n');
}

/* ── карточка урока: дата на рельсе времени + лист справа ──
   Мелкие подписи убраны намеренно. Подпись, которую не читают,
   не помогает — она только сбивает взгляд с темы и домашки.
   У кнопок осталось название, параграф учебника уехал в подвал. */
const MES_KR = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
/* сокращения, а не обрезка слова: «пятница».slice(0,2) даёт «пя» */
const DNI_KR = ['вс','пн','вт','ср','чт','пт','сб'];

function urokHTML(u, i){
  const mats = (u.mat || []).map(m =>
    `<a class="mat ${esc(m.kind)}" href="${esc(m.out)}" target="_blank" rel="noopener">
       <span class="ic">${ICON[m.kind] || '📄'}</span>${esc(m.label)}</a>`).join('');

  const first = (u.mat || [])[0];
  const pic = u.cover ||
    (typeof COVERS !== 'undefined' ? COVERS[u.kurs.id + '-' + u.n] : '');
  const kadr = (pic && first)
    ? `<a class="kadr" href="${esc(first.out)}" target="_blank" rel="noopener"
          aria-label="Открыть: ${esc(first.label)}">
         <img src="${esc(pic)}" alt="" width="1240" height="500" decoding="async"
              loading="${i < 2 ? 'eager' : 'lazy'}"></a>`
    : '';

  return `<article class="urok" data-k="${esc(u.kurs.id)}" data-n="${esc(u.n)}"
      style="--c:var(--c-${esc(u.kurs.id)}); --i:${i}">
    <div class="rels">
      <div class="r-den">${esc(DNI_KR[u.dt.getDay()])}</div>
      <div class="r-chislo">${u.dt.getDate()}</div>
      <div class="r-mes">${esc(MES_KR[u.dt.getMonth()])}</div>
    </div>
    <div class="list">
      <div class="shapka">
        <span class="predmet">${esc(u.kurs.name)}</span>
        <span class="nomer">Урок ${esc(u.n)}</span>
      </div>
      <h3>${esc(u.title)}</h3>
      ${u.lead ? `<p class="lead">${esc(u.lead)}</p>` : ''}
      ${kadr}
      ${mats ? `<div class="mats">${mats}</div>`
             : `<div class="nomat">Урок вели по учебнику — своих материалов нет</div>`}
      ${dzHTML(u)}
      ${u.para ? `<div class="podval">${esc(u.para)}</div>` : ''}
    </div>
  </article>`;
}

/* ── лента: уроки, сгруппированные по неделям ── */
function render(filter){
  if (rezhim === 'programma'){
    $('#feed').innerHTML = programmaHTML(filter) ||
      '<div class="empty"><b>Программы пока нет</b>Соберите её: python3 _сайт/_gen_plan.py</div>';
    return;
  }
  const list = filter === 'all' ? UROKI : UROKI.filter(u => u.kurs.id === filter);

  if (!list.length){
    $('#feed').innerHTML = `<div class="empty"><b>Пока пусто</b>
      Уроки появятся здесь сразу после занятия — вместе с темой и домашкой</div>`;
    return;
  }

  let html = '', lastWeek = null, i = 0;
  for (const u of list){
    const mon = +monday(u.dt);
    if (mon !== lastWeek){
      const w = weekTitle(new Date(mon));
      html += `<div class="week-sep${w.now ? ' now' : ''}">${esc(w.t)}</div>`;
      lastWeek = mon;
    }
    html += urokHTML(u, i++);
  }
  $('#feed').innerHTML = html;
}

/* ── переключение фильтра ──
      Страницу наверх НЕ дёргаем: ученик читает урок в середине ленты,
      а экран уезжает в шапку — лишнее движение камерой. ── */
let vybor = 'all';
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  vybor = (vybor === b.dataset.k) ? 'all' : b.dataset.k;
  risovatChipy(vybor);
  render(vybor);
  try { localStorage.setItem('kurs', vybor); } catch (_) {}
});

/* ── копирование домашки ── */
document.addEventListener('click', e => {
  const b = e.target.closest('.dz-copy'); if (!b) return;
  const text = b.dataset.copy || '';
  const done = () => {
    b.classList.add('done');
    const was = b.textContent;
    b.textContent = '✓ Скопировано';
    setTimeout(() => { b.classList.remove('done'); b.textContent = was; }, 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done, fallback);
  } else fallback();

  function fallback(){
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (_) {}
    ta.remove();
  }
});

/* ── старт: восстановить последний выбор ── */
try {
  const saved = localStorage.getItem('kurs');
  if (saved && (saved === 'all' || KURS[saved])) vybor = saved;
} catch (_) {}
risovatChipy(vybor);
render(vybor);

/* ── учебники (секция прячется, пока список пуст) ── */
$('#books').innerHTML = !DATA.knigi.length ? '' : '<h2>Учебник</h2>' + DATA.knigi.map(b => `
  <a class="book" href="${esc(b.out)}" target="_blank" rel="noopener">
    <span class="ic">📗</span>
    <span><b>${esc(b.title)}</b><span>${esc(b.author)}</span><em>${esc(b.note)}</em></span>
  </a>`).join('');

/* ── подвал ── */
$('#foot').innerHTML =
  `<span>${esc(DATA.site.school)} · ${esc(DATA.site.year)}</span>` +
  (DATA.ktp ? `<a href="${esc(DATA.ktp.url)}" target="_blank" rel="noopener">${esc(DATA.ktp.label)} →</a>` : '');

/* календарь живёт отдельным файлом и подключается сам, если он есть */
if (window.Calendar) window.Calendar.init({
  DATA, UROKI, dateOf, dayName, dateText, esc, vinit,
  /* календарь просит ленту показать нужный урок */
  perejti(kursId, n){
    if (vybor !== 'all' && vybor !== kursId){
      vybor = 'all'; risovatChipy(vybor); render(vybor);
    }
    const lenta = document.querySelector('.mode[data-m="lenta"]');
    if (lenta && !lenta.classList.contains('on')) lenta.click();
    setTimeout(() => {
      const cel = document.querySelector(`.urok[data-k="${kursId}"][data-n="${n}"]`);
      if (!cel) return;
      cel.scrollIntoView({ behavior:'smooth', block:'center' });
      cel.classList.add('naveden');
      setTimeout(() => cel.classList.remove('naveden'), 2200);
    }, 80);
  },
});
})();
