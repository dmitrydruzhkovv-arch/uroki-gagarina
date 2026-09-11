/* ════════════════════════════════════════════════════════════════
   calendar.js — приборная панель класса в тёмном блоке сверху.

   Показывает день целиком, а не только математику: ученик приходит
   узнать свой день, а мой предмет — лишь две строки в нём. Поэтому
   расписание выводится всё, но математика выделена, а остальное идёт
   фоном — видно, что до неё ещё химия и английский.

   Четыре источника, каждый отвечает за своё:
     • raspisanie.js — полное расписание класса по дням недели;
     • data.js       — проведённые уроки и домашки со сроками;
     • plan.js       — темы будущих уроков, каникулы, праздники (из КТП);
     • часы браузера — «сейчас».

   Факт главнее плана: если урок заведён в data.js, тема берётся оттуда.
   Нет plan.js — календарь живёт без будущих тем и каникул.
   Нет raspisanie.js — остаются только уроки математики.
   ════════════════════════════════════════════════════════════════ */
window.Calendar = (() => {
'use strict';

let C = null;
const DAY = 86400000;
const DOW_KR = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const PLANA = typeof PLAN !== 'undefined' ? PLAN : null;
const RASP  = typeof RASPISANIE !== 'undefined' ? RASPISANIE : null;

const iso = d => d.getFullYear() + '-' +
  String(d.getMonth() + 1).padStart(2, '0') + '-' +
  String(d.getDate()).padStart(2, '0');

const polnoch = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const ponedelnik = d => {
  const m = polnoch(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
};
/* день недели 1=Пн … 7=Вс */
const dow = d => d.getDay() === 0 ? 7 : d.getDay();
const vMinuty = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const SEGODNYA = () => polnoch(new Date());

/* расписание дня и только уроки математики из него */
const raspDnya = d => (RASP && RASP.dni[dow(d)]) || [];
const matDnya  = d => raspDnya(d).filter(x => x.vid === 'math');

/* ── что за день: учебный, каникулы, праздник ── */
function pro(d){
  const s = iso(d);
  if (!PLANA) return {};
  const k = (PLANA.kanikuly || []).find(x => s >= x.ot && s <= x.do);
  if (k) return { kanikuly: k.name };
  if ((PLANA.prazdniki || []).includes(s)) return { prazdnik: true };
  return { sobytie: (PLANA.sobytiya || {})[s] || '' };
}

/* ── темы уроков математики этого дня: сначала факт, потом план ── */
function temyDnya(d){
  const mat = matDnya(d);
  const fakt = C.UROKI.filter(u => +polnoch(u.dt) === +polnoch(d));
  const plan = PLANA ? (PLANA.dni || []).filter(x => x.d === iso(d)) : [];
  /* лента идёт от свежего, а день читают сверху вниз */
  const poRastushchey = a => a.slice().sort((x, y) => x.n - y.n);

  return mat.map(z => {
    const mesto = mat.filter(x => x.kurs === z.kurs).indexOf(z);
    const f = poRastushchey(fakt.filter(u => u.kurs.id === z.kurs))[mesto];
    const p = plan.filter(x => x.kurs === z.kurs)[mesto];
    return { zvonok: z, fakt: f || null, plan: p || null, kursId: z.kurs };
  });
}

const sdatVDen = d => C.UROKI.filter(u => {
  const due = u.dz && u.dz.due && C.dateOf(u.dz.due);
  return due && +polnoch(due) === +polnoch(d);
});

/* ── статус «прямо сейчас» ── */
function seychas(){
  const now = new Date();
  const d = polnoch(now);
  const p = pro(d);
  if (p.kanikuly) return { txt: p.kanikuly + ' каникулы', vid:'off' };
  if (p.prazdnik) return { txt: 'Выходной — уроков нет', vid:'off' };

  const mat = matDnya(d);
  if (!mat.length) return { txt: 'Сегодня математики нет', vid:'off' };

  const tek = now.getHours() * 60 + now.getMinutes();
  const imya = id => (C.DATA.kursy.find(k => k.id === id) || {}).name || 'Математика';

  for (const z of mat){
    const a = vMinuty(z.ot), b = vMinuty(z.do);
    if (tek >= a && tek < b){
      const ost = b - tek;
      return { txt: `Идёт ${imya(z.kurs)} — до звонка ${ost} ${sklonMin(ost)}`, vid:'now' };
    }
    if (tek < a){
      const cherez = a - tek;
      return cherez <= 90
        ? { txt: `${imya(z.kurs)} через ${cherez} ${sklonMin(cherez)}`, vid:'soon' }
        : { txt: `${imya(z.kurs)} сегодня в ${z.ot}`, vid:'soon' };
    }
  }
  return { txt: 'Уроки математики на сегодня закончились', vid:'off' };
}

function sklonMin(n){
  const d = n % 10, s = n % 100;
  if (s >= 11 && s <= 14) return 'минут';
  if (d === 1) return 'минута';
  if (d >= 2 && d <= 4) return 'минуты';
  return 'минут';
}

/* ── следующий день с математикой ── */
function sleduyushchiy(ot){
  for (let i = 1; i <= 30; i++){
    const d = new Date(polnoch(ot).getTime() + i * DAY);
    const p = pro(d);
    if (p.kanikuly || p.prazdnik) continue;
    const mat = matDnya(d);
    if (!mat.length) continue;

    const k = C.DATA.kursy.find(x => x.id === mat[0].kurs) || {};
    const plan = PLANA
      ? (PLANA.dni || []).filter(x => x.d === iso(d) && x.kurs === mat[0].kurs) : [];
    return {
      kogda: i === 1 ? 'завтра' : `${C.dayName(d)}, ${C.dateText(d)}`,
      chto: (k.name || 'Математика') + (plan[0] ? ` — «${plan[0].tema}»` : '') + `, в ${mat[0].ot}`,
    };
  }
  return null;
}

/* ── состояние ── */
let mesyac = (() => { const d = SEGODNYA(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
let vybran = SEGODNYA();
const MES_R = ['январь','февраль','март','апрель','май','июнь',
               'июль','август','сентябрь','октябрь','ноябрь','декабрь'];

/* ── сетка месяца ──
   Неделю листать надоедает: чтобы дойти до конца четверти, надо ткнуть
   стрелку десять раз. Месяц виден целиком, и сразу понятно, когда
   контрольная и сколько ещё уроков до неё. */
function setkaMesyaca(){
  const pervoe = new Date(mesyac.getFullYear(), mesyac.getMonth(), 1);
  const start = ponedelnik(pervoe);
  const kletok = 42;                      /* 6 недель: любой месяц ложится целиком */
  let kletki = '', vsego = 0;

  for (let i = 0; i < kletok; i++){
    const d = new Date(start.getTime() + i * DAY);
    if (i >= 35 && d.getMonth() !== mesyac.getMonth()) break;
    vsego++;
    const svoy = d.getMonth() === mesyac.getMonth();
    const p = pro(d);
    /* в каникулы и праздники уроков нет — точки там врут */
    const mat = (svoy && !p.kanikuly && !p.prazdnik) ? matDnya(d) : [];
    const klass = ['den'];
    if (!svoy) klass.push('chuzhoy');
    if (+d === +SEGODNYA()) klass.push('segodnya');
    if (+d === +vybran) klass.push('vybran');
    if (svoy && (p.kanikuly || p.prazdnik)) klass.push('nerabochiy');

    const tochki = mat.map(z => `<i style="background:var(--c-${z.kurs})"></i>`).join('');
    kletki += `<button class="${klass.join(' ')}" data-d="${iso(d)}">
      <span class="dn mono">${d.getDate()}</span>
      <span class="tochki">${tochki}</span></button>`;
  }

  return `<div class="mesyac">
    <div class="m-shapka">
      <button class="strelka" data-m="-1" aria-label="Предыдущий месяц">‹</button>
      <div class="m-imya">${MES_R[mesyac.getMonth()]} <span>${mesyac.getFullYear()}</span></div>
      <button class="strelka" data-m="1" aria-label="Следующий месяц">›</button>
    </div>
    <div class="m-dni">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
      .map(x => `<span class="m-dw">${x}</span>`).join('')}</div>
    <div class="m-setka" style="--kletok:${vsego}">${kletki}</div>
  </div>`;
}

/* ── расписание выбранного дня ── */
function raspisanieHTML(){
  const d = vybran, esc = C.esc, p = pro(d);
  const zag = `${C.dayName(d)}, ${C.dateText(d)}`;

  if (p.kanikuly)
    return `<div class="raspis"><div class="raspis-h">${esc(zag)}</div>
      <div class="vyhodnoy">${esc(p.kanikuly)} каникулы — уроков нет</div></div>`;
  if (p.prazdnik)
    return `<div class="raspis"><div class="raspis-h">${esc(zag)}</div>
      <div class="vyhodnoy">Выходной — уроков нет</div></div>`;

  const den = raspDnya(d);
  if (!den.length)
    return `<div class="raspis"><div class="raspis-h">${esc(zag)}</div>
      <div class="vyhodnoy">Занятий в этот день нет</div></div>`;

  const temy = temyDnya(d);
  const seychasMin = (+d === +SEGODNYA())
    ? new Date().getHours() * 60 + new Date().getMinutes() : -1;
  let mestoMat = 0;

  /* Плитками в два столбца, а не строчками таблицы: список «время — предмет»
     читается как ведомость, в нём не за что зацепиться глазу.
     Мои уроки занимают всю ширину, у них есть ещё и тема. */
  const plitki = den
    .filter(x => x.vid !== 'per')          /* перемены дня не делают, а плиток добавляют втрое */
    .map(x => {
      const idet = seychasMin >= vMinuty(x.ot) && seychasMin < vMinuty(x.do);
      const proshlo = seychasMin >= vMinuty(x.do);
      const klass = ['plitka', 'p-' + x.vid];
      if (idet) klass.push('idet');
      if (proshlo) klass.push('proshlo');

      if (x.vid === 'math'){
        const t = temy[mestoMat++];
        const k = C.DATA.kursy.find(y => y.id === x.kurs) || {};
        const tema = t && t.fakt ? esc(t.fakt.title)
                   : t && t.plan ? esc(t.plan.tema) + ' <em>по плану</em>'
                   : '<em>тема появится после урока</em>';
        const go = t && t.fakt ? ` data-go="${esc(t.fakt.kurs.id)}|${esc(t.fakt.n)}"` : '';
        return `<div class="${klass.join(' ')}" style="--c:var(--c-${esc(x.kurs)})"${go}>
          <div class="p-verh">
            <span class="p-vremya mono">${esc(x.ot)}—${esc(x.do)}</span>
            ${idet ? '<span class="p-sejchas">идёт</span>' : ''}
          </div>
          <div class="p-imya">${esc(k.name || 'Математика')}</div>
          <div class="p-tema">${tema}</div></div>`;
      }
      return `<div class="${klass.join(' ')}">
        <span class="p-vremya mono">${esc(x.ot)}</span>
        <span class="p-imya">${x.ik ? `<b>${x.ik}</b>` : ''}${esc(x.chto)}</span>
        ${x.zametka ? `<span class="p-zam">${esc(x.zametka)}</span>` : ''}</div>`;
    }).join('');
  const stroki = `<div class="plitki">${plitki}</div>`;

  const sdat = sdatVDen(d);
  const budushchee = +d > +SEGODNYA();
  const blokSdat = sdat.length
    ? `<div class="sdat"><b>${budushchee ? 'Сдать в этот день' : 'Сдавали в этот день'}</b>` +
      sdat.map(u => `<div class="s" data-go="${esc(u.kurs.id)}|${esc(u.n)}">${esc(u.title)}</div>`).join('') +
      `</div>` : '';

  let hvost = '';
  if (p.sobytie) hvost += `<div class="dalshe">${esc(p.sobytie)}</div>`;
  if (+d === +SEGODNYA()){
    const sl = sleduyushchiy(d);
    if (sl) hvost += `<div class="dalshe">Дальше: <b>${esc(sl.kogda)}</b> — ${esc(sl.chto)}</div>`;
  }

  return `<div class="raspis">
    <div class="raspis-h">${esc(zag)}</div>
    ${stroki}${blokSdat}${hvost}
  </div>`;
}

const chasy = () => {
  const n = new Date();
  return [n.getHours(), n.getMinutes()].map(x => String(x).padStart(2, '0')).join(':');
};

function risovat(){
  const now = new Date();
  const s = seychas();
  const etot = mesyac.getMonth() === new Date().getMonth()
            && mesyac.getFullYear() === new Date().getFullYear();

  document.getElementById('cal').innerHTML = `
    <div class="segodnya">
      <div>
        <div class="sg-den">${C.esc(C.dayName(now))}</div>
        <div class="sg-data">${C.esc(C.dateText(now))}</div>
      </div>
      <div class="chasy mono" id="chasy">${chasy()}</div>
    </div>
    <div class="status ${s.vid}">${C.esc(s.txt)}</div>
    ${setkaMesyaca()}
    ${etot ? '' : '<button class="k-segodnya" data-m="0">↩ вернуться к сегодня</button>'}
    ${raspisanieHTML()}`;
}

function init(ctx){
  C = ctx;
  const korob = document.getElementById('cal');
  if (!korob) return;
  risovat();

  /* часы отдельно: перерисовывать панель раз в минуту незачем */
  setInterval(() => {
    const el = document.getElementById('chasy');
    if (el) el.textContent = chasy();
  }, 15000);
  setInterval(risovat, 60000);

  korob.addEventListener('click', e => {
    const nav = e.target.closest('.strelka, .k-segodnya');
    if (nav){
      const m = +nav.dataset.m;
      if (m === 0){
        const t = SEGODNYA();
        mesyac = new Date(t.getFullYear(), t.getMonth(), 1);
        vybran = t;
      } else mesyac = new Date(mesyac.getFullYear(), mesyac.getMonth() + m, 1);
      risovat();
      return;
    }
    const den = e.target.closest('.den');
    if (den){
      const [y, m, dd] = den.dataset.d.split('-').map(Number);
      vybran = new Date(y, m - 1, dd);
      /* ткнули в хвост соседнего месяца — переезжаем туда вместе с ним */
      if (m - 1 !== mesyac.getMonth()) mesyac = new Date(y, m - 1, 1);
      risovat();
      return;
    }
    const go = e.target.closest('[data-go]');
    if (go && C.perejti){
      const [kursId, n] = go.dataset.go.split('|');
      C.perejti(kursId, n);
    }
  });
}

return { init };
})();
