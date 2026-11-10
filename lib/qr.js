/* QR-код для листка личных ссылок журнала (D 10.11): рисуется прямо в браузере — ключи учеников никуда не уходят.
   Байтовый режим, уровень коррекции M (до 15 % листа можно помять или залить), версии 1–10 (до 213 байт).
   zhQR(text) → { n: сторона в модулях, m: [строка][столбец] = true, если тёмный }; zhQR.svg(text) → <svg> с полем 4 модуля.
   Алгоритм — по ISO/IEC 18004; проверка — _стенд_журнала/проверка_qr.mjs (распознаёт macOS, как камера телефона). */
(function () {
  'use strict';
  // уровень M: [кодовых слов всего, слов коррекции на блок, блоков]; номер — версия
  var EC = [null, [26, 10, 1], [44, 16, 1], [70, 26, 1], [100, 18, 2], [134, 24, 2], [172, 16, 4], [196, 18, 4],
    [242, 22, 4], [292, 22, 5], [346, 26, 5]];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; }
    return z;
  }
  function rsDivisor(deg) {
    var r = [], root = 1, i, j;
    for (i = 0; i < deg - 1; i++) r.push(0);
    r.push(1);
    for (i = 0; i < deg; i++) {
      for (j = 0; j < deg; j++) { r[j] = gfMul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; }
      root = gfMul(root, 2);
    }
    return r;
  }
  function rsRem(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ r.shift(); r.push(0);
      for (var i = 0; i < div.length; i++) r[i] ^= gfMul(div[i], f);
    });
    return r;
  }
  function utf8(s) {
    var out = [], b = unescape(encodeURIComponent(String(s)));
    for (var i = 0; i < b.length; i++) out.push(b.charCodeAt(i));
    return out;
  }

  function encode(text) {
    var bytes = utf8(text), ver, cap;
    for (ver = 1; ver <= 10; ver++) {
      cap = EC[ver][0] - EC[ver][1] * EC[ver][2];   // байт данных
      if (4 + (ver < 10 ? 8 : 16) + bytes.length * 8 <= cap * 8) break;
    }
    if (ver > 10) throw new Error('qr: too long');
    // биты данных: режим «байты», длина, байты, конец, добивка
    var bits = [];
    var put = function (v, n) { for (var i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) { var v = 0; for (var k = 0; k < 8; k++) v = (v << 1) | bits[i + k]; data.push(v); }
    for (var pad = 0xec; data.length < cap; pad ^= 0xec ^ 0x11) data.push(pad);
    // блоки: короткие первыми, у длинных на байт данных больше
    var total = EC[ver][0], ecLen = EC[ver][1], nb = EC[ver][2], shortLen = Math.floor(total / nb) - ecLen,
      nShort = nb - total % nb, div = rsDivisor(ecLen), blocks = [], at = 0, b;
    for (b = 0; b < nb; b++) {
      var len = shortLen + (b < nShort ? 0 : 1), d = data.slice(at, at + len);
      at += len; blocks.push({ d: d, e: rsRem(d, div) });
    }
    var cw = [];
    for (i = 0; i <= shortLen; i++) blocks.forEach(function (x) { if (i < x.d.length) cw.push(x.d[i]); });
    for (i = 0; i < ecLen; i++) blocks.forEach(function (x) { cw.push(x.e[i]); });

    var n = ver * 4 + 17, m = [], fn = [], y, x;
    for (y = 0; y < n; y++) { m.push([]); fn.push([]); for (x = 0; x < n; x++) { m[y].push(false); fn[y].push(false); } }
    var set = function (x, y, dark) { m[y][x] = !!dark; fn[y][x] = true; };
    for (i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }   // полосы синхронизации
    [[3, 3], [n - 4, 3], [3, n - 4]].forEach(function (c) {                       // три «глаза» с белой каймой
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var xx = c[0] + dx, yy = c[1] + dy, dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (xx >= 0 && xx < n && yy >= 0 && yy < n) set(xx, yy, dist !== 2 && dist !== 4);
      }
    });
    var al = ALIGN[ver], na = al.length;
    for (i = 0; i < na; i++) for (var j = 0; j < na; j++) {                         // малые квадраты выравнивания
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++)
        set(al[i] + dx2, al[j] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1);
    }
    var fmt = function (mask) {                                                    // уровень M = 00, маска, BCH
      var d = mask, r = d, q;
      for (q = 0; q < 10; q++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var bt = ((d << 10) | r) ^ 0x5412, bit = function (k) { return (bt >>> k) & 1; };
      for (q = 0; q <= 5; q++) set(8, q, bit(q));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (q = 9; q < 15; q++) set(14 - q, 8, bit(q));
      for (q = 0; q < 8; q++) set(n - 1 - q, 8, bit(q));
      for (q = 8; q < 15; q++) set(8, n - 15 + q, bit(q));
      set(8, n - 8, true);
    };
    fmt(0);
    if (ver >= 7) {                                                                // номер версии — два блока 6×3
      var r = ver;
      for (i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      var vb = (ver << 12) | r;
      for (i = 0; i < 18; i++) { var bv = (vb >>> i) & 1, a = n - 11 + i % 3, c2 = Math.floor(i / 3); set(a, c2, bv); set(c2, a, bv); }
    }
    // данные змейкой по парам столбцов снизу вверх и обратно
    var bi = 0;
    for (var right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < n; vert++) for (var jj = 0; jj < 2; jj++) {
        x = right - jj;
        y = ((right + 1) & 2) === 0 ? n - 1 - vert : vert;
        if (!fn[y][x] && bi < cw.length * 8) { m[y][x] = ((cw[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1; bi++; }
      }
    }
    var MASK = [
      function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; },
      function (x) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
      function (x, y) { return x * y % 2 + x * y % 3 === 0; },
      function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; },
      function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }];
    var apply = function (k) {
      for (var yy = 0; yy < n; yy++) for (var xx = 0; xx < n; xx++) if (!fn[yy][xx] && MASK[k](xx, yy)) m[yy][xx] = !m[yy][xx];
    };
    var best = 0, bestP = Infinity;
    for (var k = 0; k < 8; k++) {                                                  // маска с наименьшим штрафом
      apply(k); fmt(k);
      var p = penalty(m, n);
      if (p < bestP) { bestP = p; best = k; }
      apply(k);                                                                    // XOR — сам себе обратный
    }
    apply(best); fmt(best);
    return { n: n, m: m };
  }

  // штраф маски (ISO 18004, 7.8.3): ряды одного цвета, квадраты 2×2, узор «глаза», перекос тёмного
  function penalty(m, n) {
    var p = 0, x, y, run, dark = 0;
    var line = function (get) {
      var s = 0, r = 1, i, str = '';
      for (i = 0; i < n; i++) {
        str += get(i) ? '1' : '0';
        if (i > 0 && get(i) === get(i - 1)) { r++; if (r === 5) s += 3; else if (r > 5) s++; } else r = 1;
      }
      var re = /(?=(10111010000|00001011101))/g;
      while (re.exec(str)) { s += 40; re.lastIndex++; }
      return s;
    };
    for (y = 0; y < n; y++) p += line(function (i) { return m[y][i]; });
    for (x = 0; x < n; x++) p += line(function (i) { return m[i][x]; });
    for (y = 0; y < n - 1; y++) for (x = 0; x < n - 1; x++) {
      run = m[y][x];
      if (run === m[y][x + 1] && run === m[y + 1][x] && run === m[y + 1][x + 1]) p += 3;
    }
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (m[y][x]) dark++;
    p += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
    return p;
  }

  function svg(text) {
    var q = encode(text), d = '', w = q.n + 8;
    for (var y = 0; y < q.n; y++) for (var x = 0; x < q.n; x++) if (q.m[y][x]) d += 'M' + (x + 4) + ' ' + (y + 4) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + w + '" shape-rendering="crispEdges">' +
      '<rect width="' + w + '" height="' + w + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  encode.svg = svg;
  if (typeof module === 'object' && module.exports) module.exports = encode;
  else window.zhQR = encode;
})();
