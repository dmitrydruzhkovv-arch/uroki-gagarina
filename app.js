/* ════════════════════════════════════════════════════════════════
   app.js — ученический сайт, версия 2 (16.09.2026).
   Данные — data.js / raspisanie.js / plan.js / covers.js, здесь только подача.
   Прежняя версия (лента + calendar.js) — в _сайт/_старая_версия_2026-09-16/.

   Страница — три части, у каждой свой фон:
     1) тёмная шапка: календарь + день;
     2) домашка: ОДНА ближайшая крупно, остальные маленькими — листаются вбок;
     3) витрина уроков: полка на предмет, большие карточки с кнопками.
   Цвет предмета задаётся классом k-<id>, все оттенки — в proto.css.
   ════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const $ = s => document.querySelector(s);
const esc = t => String(t == null ? '' : t)
  .replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* пути к материалам и обложкам — от корня сайта */
const LIVE = '';
const COVER_BASE = '';

const KOROTKO = { geometriya:'среда', algebra:'вторник и пятница', veroyatnost:'понедельник' };

/* ── даты ── */
const MES   = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MES_I = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MES_K = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const DNI   = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
const DNI_K = ['вс','пн','вт','ср','чт','пт','сб'];
const DAY = 86400000;
const polnoch = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const TODAY = polnoch(new Date());
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dow = d => d.getDay() === 0 ? 7 : d.getDay();
const minut = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const skl = (n, a, b, c) => { const f = n % 10, s = n % 100; return (s >= 11 && s <= 14) ? c : f === 1 ? a : (f >= 2 && f <= 4) ? b : c; };

function dateOf(str){
  const m = /^(\d{1,2})\.(\d{1,2})$/.exec(String(str || '').trim());
  if (!m) return null;
  const years = (DATA.site.year || '').match(/\d{4}/g) || [];
  const y = +(+m[2] >= 9 ? years[0] : years[1]) || new Date().getFullYear();
  return new Date(y, +m[2] - 1, +m[1]);
}
const kDatu = d => {                                   /* «к пятнице, 18 сентября» */
  const n = DNI[d.getDay()];
  const v = n === 'среда' ? 'среде' : n.endsWith('а') ? n.slice(0,-1) + 'е' : n.endsWith('е') ? n : n + 'у';
  return `к ${v}, ${d.getDate()} ${MES[d.getMonth()]}`;
};
const kKratko = d => `к ${DNI_K[d.getDay()]}, ${d.getDate()} ${MES_K[d.getMonth()]}`;
function cherez(d){
  const left = Math.round((d - TODAY) / DAY);
  if (left < 0)  return { t:'уже сдавали', v:'late' };
  if (left === 0) return { t:'сегодня', v:'hot' };
  if (left === 1) return { t:'завтра', v:'hot' };
  return { t:`через ${left} ${skl(left, 'день', 'дня', 'дней')}`, v:'calm' };
}

/* ── уроки плоским списком, свежие первыми ── */
const KURS = Object.fromEntries(DATA.kursy.map(k => [k.id, k]));
const UROKI = DATA.kursy
  .flatMap(k => (k.uroki || []).map(u => ({ ...u, kurs:k, dt:dateOf(u.date) })))
  .filter(u => u.dt)
  .sort((a, b) => (b.dt - a.dt) || (b.n - a.n));
const najti = (kid, n) => UROKI.find(u => u.kurs.id === kid && String(u.n) === String(n));

/* ── галочки: тот же ключ, что у боевого сайта — отметки не теряются при переезде ── */
const GALKI = 'dz-gotovo';
let galki = {};
try { galki = JSON.parse(localStorage.getItem(GALKI) || '{}') || {}; } catch (_) {}
const kg = (u, s) => `${u.kurs.id}|${u.n}|${s}`;

/* ═════════════════ ДОМАШКА: данные ═════════════════ */
function zadaniya(u){
  const dz = u.dz || {}, out = [];
  const grp = (ic, t, pod, items) => items && items.length && out.push({ ic, t, pod, items });
  grp('📄', 'На распечатке', dz.printLabel, (dz.print || []).map(s => ({ s })));
  grp('📖', 'Выучить', '', (dz.uchit || []).map(s => ({ s })));
  grp('✍️', 'В тетради', '', (dz.tetrad || []).map(s => ({ s })));
  grp('📘', 'Из учебника', '', (dz.book || []).map(x => ({
    s:`№ ${x.no}${x.bukvy ? ' (' + x.bukvy + ')' : ''}`, no:x.no, bukvy:x.bukvy, what:x.what })));
  grp('🩹', 'Кого не было на уроке', 'сделать ещё и эти', (dz.bolel || []).map(x => ({
    s:`№ ${x.no}${x.bukvy ? ' (' + x.bukvy + ')' : ''}`, no:x.no, bukvy:x.bukvy, what:x.what })));
  grp('⭐', 'Кому мало', 'по желанию', (dz.extra || []).map(x => ({
    s:`№ ${x.no}${x.bukvy ? ' (' + x.bukvy + ')' : ''}`, no:x.no, bukvy:x.bukvy, extra:true })));
  return out;
}

function zadanieHTML(u, it){
  const g = kg(u, it.s), on = !!galki[g];
  const tekst = it.no
    ? `<span class="no">№ ${esc(it.no)}</span>${it.bukvy ? `<span class="bk">${esc(it.bukvy)}</span>` : ''}${it.what ? `<span class="what">${esc(it.what)}</span>` : ''}`
    : esc(it.s);
  return `<div class="task${on ? ' done' : ''}${it.extra ? ' extra' : ''}" data-g="${esc(g)}" role="checkbox" aria-checked="${on}" tabindex="0">
    <span class="box" aria-hidden="true"></span><span class="tx">${tekst}</span></div>`;
}

function dzTelo(u){
  const dz = u.dz || {};
  return zadaniya(u).map(gr => `
    <div class="dz-grp">
      <div class="dz-h">${gr.ic} ${esc(gr.t)}${gr.pod ? `<span class="pod">${esc(gr.pod)}</span>` : ''}</div>
      ${gr.items.map(it => zadanieHTML(u, it)).join('')}
      ${gr.t === 'На распечатке' && dz.printNote ? `<div class="dz-note">${esc(dz.printNote)}</div>` : ''}
    </div>`).join('');
}

function schet(u){
  const vse = zadaniya(u).filter(g => g.t !== 'Кому мало').flatMap(g => g.items);
  return { vsego: vse.length, sdelano: vse.filter(it => galki[kg(u, it.s)]).length };
}

function dzText(u){
  const due = dateOf(u.dz && u.dz.due);
  const out = [`${u.kurs.name} — ${u.title}`];
  if (due) out.push(kDatu(due).replace(/^к/, 'К'));
  zadaniya(u).forEach(g => {
    out.push('', g.t + (g.pod ? ` (${g.pod})` : '') + ':');
    g.items.forEach(it => out.push('  — ' + it.s + (it.what ? ' — ' + it.what : '')));
  });
  return out.join('\n');
}

/* ═════════════════ РАСПИСАНИЕ ═════════════════ */
const RASP = typeof RASPISANIE !== 'undefined' ? RASPISANIE : null;
const PLANA = typeof PLAN !== 'undefined' ? PLAN : null;
const raspDnya = d => (RASP && RASP.dni[dow(d)]) || [];
const matDnya = d => raspDnya(d).filter(x => x.vid === 'math');

function pro(d){
  if (!PLANA) return {};
  const s = iso(d);
  const k = (PLANA.kanikuly || []).find(x => s >= x.ot && s <= x.do);
  if (k) return { off: k.name + ' каникулы' };
  if ((PLANA.prazdniki || []).includes(s)) return { off: 'Выходной' };
  return { sobytie: (PLANA.sobytiya || {})[s] || '' };
}

function tik(){
  const n = new Date();
  $('#clock').textContent = [n.getHours(), n.getMinutes(), n.getSeconds()].map(x => String(x).padStart(2,'0')).join(':');
  setTimeout(tik, 1000 - n.getMilliseconds() + 5);
}

/* ═════════════════ КАЛЕНДАРЬ ═════════════════ */
let mesyac = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
let vybran = TODAY;

const sdatVDen = d => UROKI.filter(u => u.dz && u.dz.due && +dateOf(u.dz.due) === +polnoch(d));
const faktDnya = d => UROKI.filter(u => +u.dt === +polnoch(d)).sort((a, b) => a.n - b.n);

function risovatKalendar(){
  const pervoe = new Date(mesyac.getFullYear(), mesyac.getMonth(), 1);
  const start = new Date(pervoe.getTime() - ((pervoe.getDay() + 6) % 7) * DAY);
  let kletki = '';
  for (let i = 0; i < 42; i++){
    const d = new Date(start.getTime() + i * DAY);
    if (i >= 35 && d.getMonth() !== mesyac.getMonth()) break;
    const svoy = d.getMonth() === mesyac.getMonth();
    const p = pro(d);
    const kurs = (svoy && !p.off) ? (matDnya(d)[0] || {}).kurs : null;
    const cls = ['den'];
    if (!svoy) cls.push('chuzhoy');
    if (kurs) cls.push('math', 'k-' + kurs);
    if (p.off && svoy) cls.push('off');
    if (+d === +TODAY) cls.push('today');
    if (+d === +vybran) cls.push('sel');
    if (svoy && sdatVDen(d).length) cls.push('due');
    kletki += `<button class="${cls.join(' ')}" data-d="${iso(d)}"
      aria-label="${d.getDate()} ${MES[d.getMonth()]}${kurs ? ', ' + KURS[kurs].name : ''}">
      <span class="num">${d.getDate()}</span>${kurs ? `<span class="lbl">${esc(KURS[kurs].name)}</span>` : ''}</button>`;
  }
  $('#cal').innerHTML = `
    <div class="cal-h">
      <div class="cal-m">${MES_I[mesyac.getMonth()]} <span>${mesyac.getFullYear()}</span></div>
      <div class="cal-nav">
        ${(mesyac.getMonth() !== TODAY.getMonth()) ? '<button class="to-today" data-m="0">Сегодня</button>' : ''}
        <button class="arr" data-m="-1" aria-label="Предыдущий месяц">‹</button>
        <button class="arr" data-m="1" aria-label="Следующий месяц">›</button>
      </div>
    </div>
    <div class="dw">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x => `<span>${x}</span>`).join('')}</div>
    <div class="grid">${kletki}</div>`;
}

/* ═════════════════ ДЕНЬ СПРАВА ═════════════════ */
let denVes = false;
function risovatDen(){
  const d = vybran, p = pro(d);
  const zag = `<div class="day-h"><span>${DNI[d.getDay()]}</span>${d.getDate()} ${MES[d.getMonth()]}</div>`;
  if (p.off){ $('#day').innerHTML = zag + `<div class="empty-day">${esc(p.off)} — уроков нет</div>`; return; }
  const den = raspDnya(d).filter(x => x.vid !== 'per');
  if (!den.length){ $('#day').innerHTML = zag + `<div class="empty-day">Уроков нет — отдыхаем 🌿</div>`; return; }

  const seychas = +d === +TODAY ? new Date().getHours() * 60 + new Date().getMinutes() : -1;
  const fakt = faktDnya(d);
  const plan = PLANA ? (PLANA.dni || []).filter(x => x.d === iso(d)) : [];

  const bloki = [];
  den.forEach(x => {
    const last = bloki[bloki.length - 1];
    if (x.vid === 'math' && last && last.math && last.kurs === x.kurs) last.do = x.do, last.n++;
    else bloki.push(x.vid === 'math' ? { math:true, kurs:x.kurs, ot:x.ot, do:x.do, n:1 } : { ...x });
  });

  const sdvig = {};
  const rows = bloki.map(b => {
    const idet = seychas >= minut(b.ot) && seychas < minut(b.do);
    const proshlo = seychas >= minut(b.do);
    if (!b.math){
      return `<div class="row other${idet ? ' now' : ''}${proshlo ? ' past' : ''}">
        <span class="t mono">${esc(b.ot)}</span><span class="ik">${b.ik || '·'}</span><span class="nm">${esc(b.chto)}</span></div>`;
    }
    /* блоку достаются «свои» уроки по порядку: урок до завтрака и после — разные темы */
    const s0 = sdvig[b.kurs] || 0; sdvig[b.kurs] = s0 + b.n;
    const f = fakt.filter(u => u.kurs.id === b.kurs).slice(s0, s0 + b.n);
    const pl = f.length ? [] : plan.filter(x => x.kurs === b.kurs).slice(s0, s0 + b.n);
    const prodolzhenie = !f.length && s0 && fakt.some(u => u.kurs.id === b.kurs);
    const temy = prodolzhenie ? `<div class="topic plan">продолжение урока</div>`
      : f.length ? f.map(u => `<button class="topic" data-open="${u.kurs.id}|${u.n}">${esc(u.title)} <b>→</b></button>`).join('')
      : pl.length ? pl.map(x => `<div class="topic plan">${esc(x.tema)} <em>по плану</em></div>`).join('')
      : `<div class="topic plan"><em>тема появится после урока</em></div>`;
    return `<div class="row math k-${b.kurs}${idet ? ' now' : ''}${proshlo ? ' past' : ''}">
      <div class="m-top"><span class="nm">${esc(KURS[b.kurs].name)}</span>
        <span class="t mono">${esc(b.ot)}—${esc(b.do)}</span>${idet ? '<span class="live">идёт</span>' : ''}</div>
      ${temy}</div>`;
  }).join('');

  const sdat = sdatVDen(d);
  const blokSdat = sdat.length ? `<div class="hand">
      <div class="hand-h">${+d >= +TODAY ? '📌 Сдать в этот день' : 'Сдавали в этот день'}</div>
      ${sdat.map(u => { const c = schet(u); return `<button class="hand-i k-${u.kurs.id}" data-open="${u.kurs.id}|${u.n}">
        <i></i><span>${esc(u.title)}</span><b class="mono">${c.sdelano}/${c.vsego}</b></button>`; }).join('')}
    </div>` : '';

  $('#day').innerHTML = zag + blokSdat +
    `<div class="rows${denVes ? ' open' : ''}">${rows}</div>
     <button class="whole" data-whole>${denVes ? 'Только математика ▴' : 'Весь день ▾'}</button>` +
    (p.sobytie ? `<div class="event">🎭 ${esc(p.sobytie)}</div>` : '');
}

/* ── всплывашка у курсора: только там, где есть мышь ── */
function podskazka(){
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const pk = document.createElement('div');
  pk.className = 'tip'; document.body.appendChild(pk);
  let cur = null;
  $('#cal').addEventListener('mousemove', e => {
    const kl = e.target.closest('.den');
    const d = kl ? kl.dataset.d : null;
    if (d !== cur){
      cur = d;
      const html = d ? tipHTML(new Date(d + 'T00:00')) : '';
      pk.innerHTML = html; pk.classList.toggle('on', !!html);
    }
    if (!cur) return;
    const w = pk.offsetWidth, h = pk.offsetHeight;
    let x = e.clientX + 18, y = e.clientY + 18;
    if (x + w > innerWidth - 12) x = e.clientX - 18 - w;
    if (y + h > innerHeight - 12) y = innerHeight - 12 - h;
    pk.style.transform = `translate3d(${Math.max(12, x)}px,${Math.max(12, y)}px,0)`;
  });
  $('#cal').addEventListener('mouseleave', () => { cur = null; pk.classList.remove('on'); });
  addEventListener('scroll', () => { cur = null; pk.classList.remove('on'); }, { passive:true });
}
function tipHTML(d){
  if (pro(d).off) return '';
  const f = faktDnya(d), sd = sdatVDen(d);
  const plan = PLANA ? (PLANA.dni || []).filter(x => x.d === iso(d)) : [];
  if (!f.length && !sd.length && !plan.length) return '';
  let h = `<div class="tip-h">${DNI[d.getDay()]}, ${d.getDate()} ${MES[d.getMonth()]}</div>`;
  if (f.length) h += f.map(u => `<div class="tip-u k-${u.kurs.id}"><i></i>${esc(u.title)}</div>`).join('');
  else h += plan.map(x => `<div class="tip-u plan k-${x.kurs}"><i></i>${esc(x.tema)} <em>по плану</em></div>`).join('');
  f.filter(u => u.dz).forEach(u => {
    h += `<div class="tip-dz"><div class="tip-s">Задали · ${esc(kDatu(dateOf(u.dz.due)))}</div>` +
      zadaniya(u).map(g => g.items.map(it => `<div class="tip-li${galki[kg(u, it.s)] ? ' done' : ''}">${esc(it.s)}</div>`).join('')).join('') + `</div>`;
  });
  if (sd.length) h += `<div class="tip-s hot">📌 Сдать: ${sd.map(u => esc(u.title)).join('; ')}</div>`;
  return h;
}

/* ═════════════════ ДОМАШКА ═════════════════
   Одна ближайшая — крупно. Остальные — маленькие карточки сбоку,
   листаются вправо. Нажал на маленькую — она встаёт на место большой.
   Домашка «на сегодня» уходит, как только закончился урок, на котором её сдают. */
let fokus = null;

function aktualnye(){
  const now = new Date(), tek = now.getHours() * 60 + now.getMinutes();
  return UROKI.filter(u => {
    const due = u.dz && dateOf(u.dz.due);
    if (!due || due < TODAY) return false;
    if (+due > +TODAY) return true;
    const uroki = matDnya(due).filter(z => z.kurs === u.kurs.id);
    return !uroki.length || tek < minut(uroki[uroki.length - 1].do);
  }).sort((a, b) => dateOf(a.dz.due) - dateOf(b.dz.due));
}

function risovatZadano(){
  const list = aktualnye();
  const sec = $('#zadano');
  if (!list.length){
    sec.innerHTML = `<div class="sec-h"><h2>Домашка</h2></div><div class="all-done">Всё сдано. Можно выдохнуть 🎉</div>`;
    return;
  }
  const u = list.find(x => `${x.kurs.id}|${x.n}` === fokus) || list[0];
  const ostalnye = list.filter(x => x !== u);
  sec.innerHTML = `
    <div class="sec-h"><h2>Домашка</h2><span class="sec-sub">${ostalnye.length ? 'сначала ближайшая — остальное потом' : 'одна, и всё'}</span></div>
    <div class="dz-layout">
      ${bolshaya(u)}
      ${ostalnye.length ? `<div class="later">
        <div class="later-h">Потом <span>${ostalnye.length}</span></div>
        <div class="later-track">${ostalnye.map(malenkaya).join('')}</div>
      </div>` : ''}
    </div>`;
}

function bolshaya(u){
  const due = dateOf(u.dz.due), c = cherez(due), s = schet(u);
  const proc = s.vsego ? Math.round(s.sdelano / s.vsego * 100) : 0;
  return `<div class="dz-big k-${u.kurs.id}" data-card="${u.kurs.id}|${u.n}">
    <div class="big-top">
      <div class="big-when">${esc(kDatu(due).replace(/^к/, 'К'))}<span class="due-b ${c.v}">${esc(c.t)}</span></div>
      <div class="big-what">${u.kurs.icon} ${esc(u.kurs.name)} · ${esc(u.title)}</div>
    </div>
    <div class="big-body">${dzTelo(u)}</div>
    <div class="big-foot">
      <div class="prog"><div class="bar"><i style="width:${proc}%"></i></div><span class="bar-t mono">${s.sdelano} из ${s.vsego}</span></div>
      <button class="lnk" data-open="${u.kurs.id}|${u.n}">Материалы урока →</button>
      <button class="copy" data-copy="${esc(dzText(u))}" title="Скопировать домашку текстом">📋</button>
    </div>
  </div>`;
}

function malenkaya(u){
  const due = dateOf(u.dz.due), c = cherez(due), s = schet(u);
  return `<button class="dz-mini k-${u.kurs.id}" data-fokus="${u.kurs.id}|${u.n}">
    <span class="mini-top"><b>${esc(kKratko(due))}</b><em>${esc(c.t)}</em></span>
    <span class="mini-body">
      <span class="mini-kurs">${u.kurs.icon} ${esc(u.kurs.name)}</span>
      <span class="mini-title">${esc(u.title)}</span>
      <span class="mini-n mono">${s.sdelano ? `${s.sdelano} из ${s.vsego} готово` : `${s.vsego} ${skl(s.vsego, 'задание', 'задания', 'заданий')}`}</span>
    </span>
  </button>`;
}

/* ═════════════════ ВИТРИНА УРОКОВ ═════════════════ */
let vybor = 'all';
try { const s = localStorage.getItem('proto-kurs'); if (s && (s === 'all' || KURS[s])) vybor = s; } catch (_) {}

function risovatPredmety(){
  $('#subjects').innerHTML = DATA.kursy.map(k => `
    <button class="subj k-${k.id}${vybor === k.id ? ' on' : ''}${vybor !== 'all' && vybor !== k.id ? ' dim' : ''}" data-k="${k.id}" aria-pressed="${vybor === k.id}">
      <span class="s-ic">${k.icon}</span>
      <span class="s-tx"><b>${esc(k.name)}</b><em>${esc(KOROTKO[k.id] || '')}</em></span>
      <span class="s-n mono">${(k.uroki || []).length}</span>
    </button>`).join('');
}

function oblozhka(u){
  const pic = u.cover || (typeof COVERS !== 'undefined' ? COVERS[u.kurs.id + '-' + u.n] : '');
  return pic ? COVER_BASE + pic : '';
}

/* кнопки материалов на карточке:
   материал — яркая кнопка ↗, открывает PDF (тот же, что и обложка), рядом ⤓ скачать;
   живой чертёж и веб-домашка — подчёркнутая ссылка ↗ (только они бывают HTML) */
function knopki(u){
  let glavnye = '', ssylki = '';
  (u.mat || []).forEach(m => {
    const url = esc(LIVE + m.out), isPdf = /\.pdf$/i.test(m.out);
    if (m.kind === 'live' || m.kind === 'web'){
      ssylki += `<a class="a-live" href="${url}" target="_blank" rel="noopener" title="${esc(m.hint || '')}">${m.kind === 'web' ? '🕹' : '🎯'} ${esc(m.label)} ↗</a>`;
    } else {
      glavnye += `<span class="a-pair"><a class="a-main" href="${url}" target="_blank" rel="noopener" title="${esc(m.hint || '')}">${m.kind === 'dz' ? '✏️' : '📘'} ${esc(m.label)} ↗</a>` +
        (isPdf ? `<a class="a-dl" href="${url}" download title="Скачать PDF" aria-label="Скачать PDF">⤓</a>` : '') + `</span>`;
    }
  });
  if (!glavnye && !ssylki) return `<div class="a-none">Урок вели по учебнику</div>`;
  return `<div class="acts">${glavnye}</div>${ssylki ? `<div class="links">${ssylki}</div>` : ''}`;
}

function obloshkaHTML(u, cls){
  const mat = u.mat || [];
  // Обложка урока всегда открывает PDF — HTML только если PDF совсем нет (D, 16.09).
  const pic = oblozhka(u), first = mat.find(m => m.kind === 'pdf' || /\.pdf$/i.test(m.out)) || mat[0];
  const img = pic ? `<img src="${esc(pic)}" alt="" decoding="async">` : `<span class="ph">${u.kurs.icon}</span>`;
  const chipy = `<span class="c-date">${DNI_K[u.dt.getDay()]} · ${u.dt.getDate()} ${MES_K[u.dt.getMonth()]}</span>` +
    (+u.dt === +TODAY ? '<span class="c-new">сегодня</span>' : '');
  return first
    ? `<a class="${cls}" href="${esc(LIVE + first.out)}" target="_blank" rel="noopener" aria-label="Открыть: ${esc(first.label)}">${img}${chipy}</a>`
    : `<div class="${cls}">${img}${chipy}</div>`;
}

function dzChip(u){
  if (!u.dz) return '';
  const due = dateOf(u.dz.due), c = cherez(due);
  return `<button class="c-dz${c.v === 'late' ? ' old' : ''}" data-open="${u.kurs.id}|${u.n}">📌 ДЗ ${esc(kKratko(due))} <span>→</span></button>`;
}

function karta(u){
  return `<article class="card k-${u.kurs.id}">
    ${obloshkaHTML(u, 'c-pic')}
    <div class="c-body">
      <div class="c-n">Урок ${esc(u.n)}</div>
      <h3 class="c-title"><button data-open="${u.kurs.id}|${u.n}">${esc(u.title)}</button></h3>
      ${knopki(u)}
      ${dzChip(u)}
    </div>
  </article>`;
}

function glavnaya(u){
  return `<article class="feat k-${u.kurs.id}">
    ${obloshkaHTML(u, 'f-pic')}
    <div class="f-body">
      <div class="f-kick">Последний урок · урок ${esc(u.n)}</div>
      <h3 class="f-title">${esc(u.title)}</h3>
      ${u.lead ? `<p class="f-lead">${esc(u.lead)}</p>` : ''}
      ${knopki(u)}
      <div class="f-foot">${dzChip(u)}${u.para ? `<span class="f-para">📚 ${esc(u.para)}</span>` : ''}</div>
    </div>
  </article>`;
}

function risovatVitrinu(){
  const box = $('#store');
  if (vybor === 'all'){
    box.innerHTML = DATA.kursy.map(k => {
      const list = UROKI.filter(u => u.kurs.id === k.id);
      return `<section class="shelf k-${k.id}">
        <div class="sh-h">
          <span class="sh-ic">${k.icon}</span>
          <h3>${esc(k.name)}</h3>
          <span class="sh-n">${list.length} ${skl(list.length, 'урок', 'урока', 'уроков')}</span>
          <span class="sh-sp"></span>
          <button class="sh-arr" data-scroll="-1" aria-label="Назад">‹</button>
          <button class="sh-arr" data-scroll="1" aria-label="Вперёд">›</button>
          <button class="sh-all" data-k="${k.id}"><span class="dl-t">Учебники и все уроки →</span><span class="kr">Все →</span></button>
        </div>
        <div class="track">${list.map(karta).join('')}</div>
      </section>`;
    }).join('');
    return;
  }
  const k = KURS[vybor];
  const list = UROKI.filter(u => u.kurs.id === vybor);
  /* полка: учебники (PDF — скачать) и справочники (страница — открыть) из spravka курса */
  const polka = (k.spravka || []).map(s => {
    const pdf = /\.pdf$/i.test(s.out);
    return `<a class="book" href="${esc(s.out)}" target="_blank" rel="noopener">
      <span class="b-ic">${s.ic || '📖'}</span><span class="b-tx"><b>${esc(s.title)}</b><em>${esc(s.note || '')}</em></span>
      <span class="b-dl">${pdf ? `⤓<small>${esc(s.size || 'PDF')}</small>` : '↗'}</span></a>`;
  }).join('');

  box.innerHTML = `
    ${polka ? `<div class="books k-${vybor}">${polka}</div>` : ''}
    ${list[0] ? glavnaya(list[0]) : '<div class="all-done">Уроков пока не было</div>'}
    ${list.length > 1 ? `<div class="earlier-h">Раньше</div><div class="cards">${list.slice(1).map(karta).join('')}</div>` : ''}`;
}

/* ═════════════════ УРОК ПОВЕРХ СТРАНИЦЫ ═════════════════ */
function materialy(u){
  const html = (u.mat || []).map(m => {
    const url = LIVE + m.out;
    const isPdf = /\.pdf$/i.test(m.out);
    const ic = m.kind === 'live' ? '🎯' : m.kind === 'teoriya' ? '📘' : m.kind === 'web' ? '🕹' : '📄';
    return `<div class="mat">
      <span class="m-ic">${ic}</span>
      <span class="m-tx">
        ${isPdf
          ? `<a class="m-file" href="${esc(url)}" target="_blank" rel="noopener">${esc(m.label)}</a><span class="m-kind">PDF</span>`
          : `<a class="m-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(m.label)}<span aria-hidden="true"> ↗</span></a>`}
        ${m.hint ? `<small>${esc(m.hint)}</small>` : ''}
      </span>
      ${isPdf ? `<a class="dl" href="${esc(url)}" download title="Скачать PDF" aria-label="Скачать PDF">⤓</a>` : ''}
    </div>`;
  }).join('');
  return html || `<div class="nomat">Урок вели по учебнику — своих материалов нет</div>`;
}

function otkryt(kid, n, push = true){
  const u = najti(kid, n); if (!u) return;
  const pic = oblozhka(u);
  const svoi = UROKI.filter(x => x.kurs.id === kid).sort((a, b) => a.dt - b.dt || a.n - b.n);
  const idx = svoi.indexOf(u), prev = svoi[idx - 1], next = svoi[idx + 1];
  const due = u.dz && dateOf(u.dz.due);
  const c = due ? cherez(due) : null;

  const sh = $('#sheet');
  sh.className = 'sheet k-' + kid;
  sh.innerHTML = `
    <div class="sh-bar">
      <span class="sh-kurs">${u.kurs.icon} ${esc(u.kurs.name)} · урок ${esc(u.n)}</span>
      <button class="x" data-close aria-label="Закрыть">✕</button>
    </div>
    <div class="sh-scroll">
      ${pic ? `<div class="sh-pic"><img src="${esc(pic)}" alt=""></div>` : ''}
      <div class="sh-date">${DNI[u.dt.getDay()]}, ${u.dt.getDate()} ${MES[u.dt.getMonth()]}</div>
      <h2 class="sh-title">${esc(u.title)}</h2>
      ${u.lead ? `<p class="sh-lead">${esc(u.lead)}</p>` : ''}
      <div class="sh-sec">Материалы</div>
      <div class="mats">${materialy(u)}</div>
      ${u.dz ? `<div class="sh-dz">
        <div class="sh-dz-h"><span>📌 Домашка ${esc(kDatu(due))}</span><span class="due-b ${c.v}">${esc(c.t)}</span></div>
        ${dzTelo(u)}
        <button class="copy wide" data-copy="${esc(dzText(u))}">📋 Скопировать текстом</button>
      </div>` : ''}
      ${u.para ? `<div class="sh-para">📚 ${esc(u.para)}</div>` : ''}
    </div>
    <div class="sh-nav">
      ${prev ? `<button data-open="${kid}|${prev.n}">← ${esc(prev.title)}</button>` : '<span></span>'}
      ${next ? `<button data-open="${kid}|${next.n}">${esc(next.title)} →</button>` : '<span></span>'}
    </div>`;
  sh.querySelector('.sh-scroll').scrollTop = 0;
  $('#sheetBg').hidden = false;
  requestAnimationFrame(() => { document.body.classList.add('sheet-open'); sh.setAttribute('aria-hidden', 'false'); });
  if (push) history.replaceState(null, '', `#${kid}-${n}`);
  sh.querySelector('.x').focus({ preventScroll:true });
}
function zakryt(){
  document.body.classList.remove('sheet-open');
  $('#sheet').setAttribute('aria-hidden', 'true');
  setTimeout(() => { $('#sheetBg').hidden = true; }, 260);
  history.replaceState(null, '', location.pathname);
}

/* ═════════════════ СОБЫТИЯ ═════════════════ */
function perekluchit(g){
  if (galki[g]) delete galki[g]; else galki[g] = 1;
  try { localStorage.setItem(GALKI, JSON.stringify(galki)); } catch (_) {}
  const on = !!galki[g];
  document.querySelectorAll('.task[data-g]').forEach(el => {
    if (el.dataset.g !== g) return;
    el.classList.toggle('done', on); el.setAttribute('aria-checked', on);
  });
  /* полоска и счётчики — без перерисовки большой карточки, иначе прыгает экран */
  document.querySelectorAll('.dz-big').forEach(card => {
    const [kid, n] = card.dataset.card.split('|'), s = schet(najti(kid, n));
    card.querySelector('.bar i').style.width = (s.vsego ? s.sdelano / s.vsego * 100 : 0) + '%';
    card.querySelector('.bar-t').textContent = `${s.sdelano} из ${s.vsego}`;
  });
  risovatDen();
}

document.addEventListener('click', e => {
  const t = e.target;
  const task = t.closest('.task[data-g]');
  if (task){ perekluchit(task.dataset.g); return; }

  const cp = t.closest('[data-copy]');
  if (cp){
    const txt = cp.dataset.copy, was = cp.textContent;
    const ok = () => { cp.textContent = '✓'; cp.classList.add('ok'); setTimeout(() => { cp.textContent = was; cp.classList.remove('ok'); }, 1500); };
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(ok, ok);
    return;
  }

  const fk = t.closest('[data-fokus]');
  if (fk){ fokus = fk.dataset.fokus; risovatZadano(); return; }

  const op = t.closest('[data-open]');
  if (op){ const [k, n] = op.dataset.open.split('|'); otkryt(k, n); return; }

  if (t.closest('[data-close]') || t.id === 'sheetBg'){ zakryt(); return; }

  const sc = t.closest('[data-scroll]');
  if (sc){
    const tr = sc.closest('.shelf').querySelector('.track');
    tr.scrollBy({ left: +sc.dataset.scroll * tr.clientWidth * .8, behavior:'smooth' });
    return;
  }

  const nav = t.closest('#cal [data-m]');
  if (nav){
    const m = +nav.dataset.m;
    if (m === 0){ mesyac = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); vybran = TODAY; }
    else mesyac = new Date(mesyac.getFullYear(), mesyac.getMonth() + m, 1);
    risovatKalendar(); risovatDen(); return;
  }
  const den = t.closest('#cal .den');
  if (den){
    vybran = new Date(den.dataset.d + 'T00:00');
    if (vybran.getMonth() !== mesyac.getMonth()) mesyac = new Date(vybran.getFullYear(), vybran.getMonth(), 1);
    risovatKalendar(); risovatDen(); return;
  }
  const tm = t.closest('[data-tema]');
  if (tm){ postavitTemu(tm.dataset.tema); return; }

  if (t.closest('[data-whole]')){ denVes = !denVes; risovatDen(); return; }

  const sb = t.closest('[data-k]');
  if (sb){
    vybor = vybor === sb.dataset.k ? 'all' : sb.dataset.k;
    try { localStorage.setItem('proto-kurs', vybor); } catch (_) {}
    risovatPredmety(); risovatVitrinu();
    if (sb.classList.contains('sh-all')) document.querySelector('.zone-store').scrollIntoView({ behavior:'smooth' });
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('sheet-open')) zakryt();
  const task = e.target.closest && e.target.closest('.task[data-g]');
  if (task && (e.key === ' ' || e.key === 'Enter')){ e.preventDefault(); perekluchit(task.dataset.g); }
});

/* ═════════════════ ТЕМА ═════════════════
   Λ — дневная, D — ночная. Выбор живёт в браузере ученика. */
function postavitTemu(v){
  if (v === 'night') document.documentElement.dataset.theme = 'night';
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem('tema', v); } catch (_) {}
  pometitTemu();
}
function pometitTemu(){
  const night = document.documentElement.dataset.theme === 'night';
  document.querySelectorAll('[data-tema]').forEach(b =>
    b.setAttribute('aria-pressed', String((b.dataset.tema === 'night') === night)));
  const mc = document.querySelector('meta[name=theme-color]');
  if (mc) mc.content = night ? '#0a0510' : '#16131a';
}

/* ═════════════════ ПОДВАЛ ═════════════════
   Подпись автора — DATA.site.avtor. Правила — отдельная страница pravila.html. */
const AVTOR = DATA.site.avtor || 'автор сайта';
$('#foot').innerHTML = `
  <div class="foot-l"><b>© ${new Date().getFullYear()} ${esc(AVTOR)}</b> · Математика с Ди и Леммой</div>
  <div class="foot-r">Материалы уроков, чертежи, карточки и оформление сайта — авторские.
    Копировать, выкладывать и использовать их где-либо ещё можно только с письменного разрешения автора.
    Учебники принадлежат издательствам и выложены только для учеников класса.</div>
  <div class="foot-links"><a href="pravila.html">Правила и конфиденциальность</a>${DATA.ktp ? `<a href="${esc(DATA.ktp.url)}" target="_blank" rel="noopener">${esc(DATA.ktp.label)} ↗</a>` : ''}</div>`;

/* кнопка «Программа года» в шапке — адрес из DATA.ktp (сайт планирования) */
if (DATA.ktp && DATA.ktp.url) $('#year').href = DATA.ktp.url;
else $('#year').remove();

/* ═════════════════ СТАРТ ═════════════════ */
pometitTemu();
tik();
setInterval(() => { risovatDen(); }, 60000);
risovatKalendar(); risovatDen(); podskazka();
risovatZadano();
risovatPredmety(); risovatVitrinu();
const hash = /^#([a-z]+)-(\d+)$/.exec(location.hash);
if (hash) otkryt(hash[1], hash[2], false);
})();
