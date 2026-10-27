(function () {
  'use strict';
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- первый экран и заголовки: только если не просили «меньше движения» ---------- */
  if (!calm) {
    document.documentElement.classList.add('js-anim');
    var h1 = document.querySelector('.hero__title');
    if (h1) {
      h1.innerHTML = h1.innerHTML.split(/<br\s*\/?>/i).map(function (l, i) {
        return '<span class="ln"><span style="--i:' + i + '">' + l + '</span></span>';
      }).join('');
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add('ready'); }); });

    // в карточках проявляются только метка и заголовок — сами карточки и так наезжают
    var heads = [].slice.call(document.querySelectorAll('.sec .tag, .sec h2, .band .tag, .band h2, .steps__head .tag, .steps__head h2'));
    heads.forEach(function (el) {
      el.classList.add('rv');
      if (el.tagName === 'H2') el.style.setProperty('--d', '.12s');
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (list) {
        list.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.2 });
      heads.forEach(function (el) { io.observe(el); });
    } else heads.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- сумма в калькуляторе вспыхивает при пересчёте ---------- */
  var sum = document.getElementById('resSum');
  if (sum && 'MutationObserver' in window) {
    var tm;
    new MutationObserver(function () {
      sum.classList.add('flash'); clearTimeout(tm);
      tm = setTimeout(function () { sum.classList.remove('flash'); }, 350);
    }).observe(sum, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- лента «9 ошибок» ---------- */
  var mis = document.getElementById('mis');
  if (!mis) return;
  var cards = [].slice.call(mis.children), total = cards.length;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  // стрелки и счётчик — в строку заголовка
  var bar = document.createElement('div');
  bar.className = 'misbar';
  bar.innerHTML = '<span class="misbar__n"><b>01</b> / ' + pad(total) + '</span><span class="misbar__line"><i></i></span>';
  mis.parentNode.querySelectorAll('.mis__btn').forEach(function (b) { bar.appendChild(b); });   // кнопки листают в main.js
  mis.parentNode.querySelector('.head2').appendChild(bar);
  var num = bar.querySelector('b'), line = bar.querySelector('i');

  // лента до правого края окна, карточки по ширине экрана: видно ~3,4 (планшет ~2,3), последняя обрезана
  function sizeCards() {
    var vw = document.documentElement.clientWidth;
    var p = mis.parentNode, pr = p.getBoundingClientRect().right - parseFloat(getComputedStyle(p).paddingRight);
    mis.style.marginRight = -(vw - pr) + 'px';
    if (vw <= 640) { mis.style.removeProperty('--cw'); return; }
    var gap = parseFloat(getComputedStyle(mis).columnGap) || 16, n = vw > 980 ? 3.4 : 2.3;
    var w = Math.max(240, Math.min(520, (vw - mis.getBoundingClientRect().left - Math.floor(n) * gap) / n));
    mis.style.setProperty('--cw', w.toFixed(1) + 'px');
  }
  function step() { return cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(mis).columnGap) || 16); }

  // счётчик — карточки, видимые целиком: «01–03 / 09», на телефоне «01 / 09»
  function upd() {
    var box = mis.getBoundingClientRect(), right = Math.min(box.right, document.documentElement.clientWidth);
    var first = 0, last = 0;
    cards.forEach(function (c, i) {
      var r = c.getBoundingClientRect();
      if (r.left >= box.left - 2 && r.right <= right + 2) { if (!first) first = i + 1; last = i + 1; }
    });
    if (!first) first = last = Math.min(total, Math.round(mis.scrollLeft / step()) + 1);
    num.textContent = first === last ? pad(first) : pad(first) + '–' + pad(last);
    line.style.transform = 'scaleX(' + (last / total) + ')';
  }
  sizeCards(); upd();
  mis.addEventListener('scroll', upd, { passive: true });
  window.addEventListener('resize', function () { sizeCards(); upd(); });
  window.addEventListener('load', function () { sizeCards(); upd(); });
  if ('ResizeObserver' in window) new ResizeObserver(upd).observe(mis);

  // перетаскивание мышкой (на телефоне и так работает свайп)
  var down = false, sx = 0, sl = 0, moved = false;
  mis.querySelectorAll('img').forEach(function (i) { i.draggable = false; });
  mis.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; sx = e.clientX; sl = mis.scrollLeft;
    mis.classList.add('drag');
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - sx;
    if (Math.abs(dx) > 4) moved = true;
    mis.scrollLeft = sl - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!down) return;
    down = false;
    mis.classList.remove('drag');
    mis.scrollTo({ left: Math.round(mis.scrollLeft / step()) * step(), behavior: 'smooth' });
  });
  mis.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  // один раз качнуть ленту при первом показе
  if (!calm && 'IntersectionObserver' in window) {
    var once = new IntersectionObserver(function (list) {
      if (!list[0].isIntersecting) return;
      once.disconnect();
      setTimeout(function () { if (mis.scrollLeft < 4) mis.classList.add('nudge'); }, 700);
    }, { threshold: 0.6 });
    once.observe(mis);
    mis.addEventListener('animationend', function () { mis.classList.remove('nudge'); });
  }
})();
