/* EKG Group — motion layer (dependency-free)
   Signature: animated transmission-grid hero canvas (nodes + traveling power pulses).
   Plus scroll reveals, subtle parallax, count-up stats, scroll-progress line.
   Degrades cleanly: respects prefers-reduced-motion and ?noanim. */
(function () {
  window.__ekgMotion = 'v49';
  var html = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var noanim = location.search.indexOf('noanim') > -1;

  /* ---------- scroll reveals ---------- */
  if (noanim || reduce || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }

  /* ---------- horizontal rails: drag-to-scroll with momentum ---------- */
  ['strip', 'pressrail'].forEach(function strip(id) {
    var s = document.getElementById(id);
    if (!s) return;
    var down = false, startX = 0, scrollStart = 0, vel = 0, lastX = 0, lastT = 0, raf;
    s.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;              // touch uses native scroll
      down = true; s.classList.add('grabbing');
      startX = e.clientX; scrollStart = s.scrollLeft;
      lastX = e.clientX; lastT = performance.now(); vel = 0;
      cancelAnimationFrame(raf);
      try { s.setPointerCapture(e.pointerId); } catch (_) {}
    });
    s.addEventListener('pointermove', function (e) {
      if (!down) return;
      s.scrollLeft = scrollStart - (e.clientX - startX);
      var now = performance.now();
      vel = (e.clientX - lastX) / Math.max(1, now - lastT) * 16;
      lastX = e.clientX; lastT = now;
    });
    function up() {
      if (!down) return;
      down = false; s.classList.remove('grabbing');
      if (reduce || noanim) return;                        // no momentum glide under reduced motion
      var v = vel;
      (function glide() {
        v *= 0.94;
        if (Math.abs(v) > 0.4) { s.scrollLeft -= v; raf = requestAnimationFrame(glide); }
      })();
    }
    s.addEventListener('pointerup', up);
    s.addEventListener('pointercancel', up);
    s.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); s.scrollLeft += e.deltaY; }
    }, { passive: false });
  });

  /* ---------- before/after comparator ---------- */
  (function compare() {
    var c = document.getElementById('cmp');
    if (!c) return;
    var pos = 50, drag = false;
    function set(p) {
      pos = Math.max(4, Math.min(96, p));
      c.style.setProperty('--pos', pos + '%');
      c.setAttribute('aria-valuenow', Math.round(pos));
    }
    function fromEvent(e) {
      var r = c.getBoundingClientRect();
      set((e.clientX - r.left) / r.width * 100);
    }
    c.addEventListener('pointerdown', function (e) { drag = true; try { c.setPointerCapture(e.pointerId); } catch (_) {} fromEvent(e); });
    c.addEventListener('pointermove', function (e) { if (drag) fromEvent(e); });
    c.addEventListener('pointerup', function () { drag = false; });
    c.addEventListener('pointercancel', function () { drag = false; });
    c.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { set(pos - 4); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { set(pos + 4); e.preventDefault(); }
    });
  })();

  /* ---------- portfolio lightbox galleries ---------- */
  (function lightbox() {
    var cards = document.querySelectorAll('.pcard[data-gallery], .df-media[data-gallery]');
    if (!cards.length) return;
    var lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Image gallery');
    lb.innerHTML = '<img alt=""><div class="lbcap"><span class="t"></span><span class="n"></span></div>' +
      '<button class="lbx" aria-label="Close">&#215;</button>' +
      '<button class="lbp" aria-label="Previous">&#8592;</button>' +
      '<button class="lbn" aria-label="Next">&#8594;</button>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), capT = lb.querySelector('.t'), capN = lb.querySelector('.n');
    var bx = lb.querySelector('.lbx'), bp = lb.querySelector('.lbp'), bn = lb.querySelector('.lbn');
    var list = [], idx = 0, title = '';
    function show(i) {
      idx = (i + list.length) % list.length;
      img.src = list[idx];
      capT.textContent = title;
      capN.textContent = list.length > 1 ? (idx + 1) + ' / ' + list.length : '';
      bp.style.display = bn.style.display = list.length > 1 ? 'flex' : 'none';
    }
    function openLb(l, t) { list = l; title = t; show(0); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    cards.forEach(function (c) {
      var l = c.getAttribute('data-gallery').split('|');
      var h3 = c.querySelector('h3') || (c.closest('.df-in') ? c.closest('.df-in').querySelector('h3') : null);
      var t = h3 ? h3.textContent.replace(/\.$/, '') : '';
      var ph = c.classList.contains('df-media') ? c : c.querySelector('.ph');
      if (!ph) return;
      if (l.length > 1 && !c.querySelector('.glbadge')) {
        var b = document.createElement('span');
        b.className = 'glbadge';
        b.textContent = l.length + ' photos';
        ph.appendChild(b);
      }
      ph.addEventListener('click', function () { openLb(l, t); });
    });
    bx.addEventListener('click', closeLb);
    bp.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    bn.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
    var sx = null;
    lb.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    lb.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 60 && list.length > 1) show(idx + (dx < 0 ? 1 : -1));
    });
  })();

  /* ---------- responsible accordion ---------- */
  (function acc() {
    var root = document.getElementById('acc');
    if (!root) return;
    root.querySelectorAll('.acchead').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.parentElement;
        var wasOpen = item.hasAttribute('data-open');
        root.querySelectorAll('.accitem[data-open]').forEach(function (o) {
          o.removeAttribute('data-open');
          o.querySelector('.acchead').setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) { item.setAttribute('data-open', '1'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  })();

  if (noanim || reduce) { html.classList.add('hero-in'); return; }
  html.classList.add('motion-ready');
  requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.add('hero-in'); }); });

  /* ============================================================
     Transmission-grid hero canvas
     A field of nodes joined by nearby edges; blue pulses travel
     the edges like power/data on a grid. Calm, premium, subtle.
     ============================================================ */
  function makeGrid(cvId, BLUE, density, coreColor) {
    var cv = document.getElementById(cvId);
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W, H, DPR, nodes = [], edges = [], pulses = [];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      var host = cv.parentElement;
      W = host.clientWidth; H = host.clientHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }

    function build() {
      nodes = []; edges = []; pulses = [];   // reset in-flight pulses so they never point at stale node indices
      var target = Math.round((W * H) / density);     // density
      target = Math.max(26, Math.min(80, target));
      for (var i = 0; i < target; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
          r: Math.random() * 1.4 + 0.6
        });
      }
      var maxD = Math.min(W, H) * 0.22;              // link radius
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxD) edges.push({ a: a, b: b, base: d });
        }
      }
    }

    function spawnPulse() {
      if (!edges.length || pulses.length > 14) return;
      var e = edges[(Math.random() * edges.length) | 0];
      pulses.push({ e: e, t: 0, sp: 0.006 + Math.random() * 0.01 });
    }

    var last = 0;
    function frame(ts) {
      requestAnimationFrame(frame);
      if (ts - last < 16) return; last = ts;
      ctx.clearRect(0, 0, W, H);

      // drift nodes
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
      // edges (fade with distance)
      var maxD = Math.min(W, H) * 0.22;
      for (var j = 0; j < edges.length; j++) {
        var e = edges[j], na = nodes[e.a], nb = nodes[e.b];
        if (!na || !nb) continue;
        var dx = na.x - nb.x, dy = na.y - nb.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d > maxD) continue;
        var al = (1 - d / maxD) * 0.20;   // slightly stronger hairlines on light paper
        ctx.strokeStyle = 'rgba(' + BLUE + ',' + al.toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
      }
      // nodes
      for (var k = 0; k < nodes.length; k++) {
        var nn = nodes[k];
        ctx.fillStyle = 'rgba(' + BLUE + ',0.5)';
        ctx.beginPath(); ctx.arc(nn.x, nn.y, nn.r, 0, 6.2832); ctx.fill();
      }
      // pulses travelling along edges
      if (Math.random() < 0.09) spawnPulse();
      for (var p = pulses.length - 1; p >= 0; p--) {
        var pu = pulses[p]; pu.t += pu.sp;
        if (pu.t >= 1) { pulses.splice(p, 1); continue; }
        var A = nodes[pu.e.a], B = nodes[pu.e.b];
        if (!A || !B) { pulses.splice(p, 1); continue; }
        var x = A.x + (B.x - A.x) * pu.t, y = A.y + (B.y - A.y) * pu.t;
        var glow = ctx.createRadialGradient(x, y, 0, x, y, 7);
        glow.addColorStop(0, 'rgba(' + BLUE + ',0.9)');
        glow.addColorStop(1, 'rgba(' + BLUE + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.fill();
        ctx.fillStyle = coreColor;
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.2832); ctx.fill();
      }
    }

    resize();
    window.addEventListener('resize', function () { clearTimeout(cv._t); cv._t = setTimeout(resize, 180); });
    requestAnimationFrame(frame);
  }
  makeGrid('gridcanvas', '51,102,255', 26000, 'rgba(30,58,192,0.95)');   // blue on paper
  makeGrid('ctacanvas', '255,255,255', 34000, 'rgba(255,255,255,0.95)'); // white on the blue band

  /* ---------- subtle pointer tilt on development cards ---------- */
  if (window.matchMedia && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.devcard').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(1200px) rotateX(' + (-py * 2.6).toFixed(2) +
          'deg) rotateY(' + (px * 2.6).toFixed(2) + 'deg) translateY(-3px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- count-up stats ---------- */
  var counters = [];
  document.querySelectorAll('.project-stats .num, .ticker .tv, .kv-stats .v, .figrow .fn, .metaline .mv')
    .forEach(function (el) {
      var tn = el.firstChild;
      if (!tn || tn.nodeType !== 3) return;
      var mm = /^(\d+)(\D*)$/.exec(tn.nodeValue.trim());   // leading integer + non-numeric tail only
      if (!mm) return;
      var suffix = mm[2] || '';
      counters.push({ el: el, tn: tn, target: parseInt(mm[1], 10), suffix: suffix, state: 0 });
      tn.nodeValue = '0' + suffix;
    });
  function countUp(c) {
    c.state = 1; var start = null, dur = 1100;
    (function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur), eased = 1 - Math.pow(1 - p, 3);
      c.tn.nodeValue = Math.round(eased * c.target) + c.suffix;
      if (p < 1) requestAnimationFrame(step); else { c.tn.nodeValue = c.target + c.suffix; c.state = 2; }
    })();
  }

  /* ---------- progress line + parallax + counters ---------- */
  var bar = document.createElement('div'); bar.className = 'progress'; document.body.appendChild(bar);
  var pars = [].map.call(document.querySelectorAll('.par'), function (w) {
    return { w: w, img: w.querySelector('img'), amt: parseFloat(w.getAttribute('data-par')) || 22 };
  });
  var vh = window.innerHeight;
  function onScroll() {
    var st = window.scrollY || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - vh;
    bar.style.width = (h > 0 ? (st / h * 100) : 0) + '%';
    for (var i = 0; i < pars.length; i++) {
      var p = pars[i]; if (!p.img) continue;
      var r = p.w.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      var prog = (r.top + r.height / 2 - vh / 2) / vh;
      p.img.style.transform = 'translate3d(0,' + (-prog * p.amt).toFixed(1) + 'px,0) scale(1.12)';
    }
    for (var j = 0; j < counters.length; j++) {
      var c = counters[j]; if (c.state) continue;
      var cr = c.el.getBoundingClientRect();
      if (cr.bottom <= 0) { c.tn.nodeValue = c.target + c.suffix; c.state = 2; }
      else if (cr.top < vh * 0.96) { countUp(c); }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); });
  onScroll();
  setTimeout(onScroll, 1150);   // hero ticker counts up as the hero entrance settles

  /* ---------- portfolio: sector filter ---------- */
  (function pfilter() {
    var bar = document.getElementById('pfilter');
    if (!bar) return;
    var sectors = document.querySelectorAll('.psector[data-sector]');
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.pf');
      if (!btn) return;
      bar.querySelectorAll('.pf').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var f = btn.getAttribute('data-f');
      sectors.forEach(function (sec) {
        var show = f === 'all' || sec.getAttribute('data-sector') === f;
        if (show) {
          sec.style.display = '';
          requestAnimationFrame(function () { requestAnimationFrame(function () { sec.classList.remove('fout'); }); });
        } else {
          sec.classList.add('fout');
          setTimeout(function () { if (sec.classList.contains('fout')) sec.style.display = 'none'; }, 380);
        }
      });
    });
  })();

  /* ---------- portfolio: gallery-count badges ---------- */
  (function gcounts() {
    document.querySelectorAll('.pcard[data-gallery]').forEach(function (card) {
      var n = card.getAttribute('data-gallery').split('|').length;
      if (n < 2) return;
      var ph = card.querySelector('.ph');
      if (!ph || ph.querySelector('.gcount')) return;
      var b = document.createElement('span');
      b.className = 'gcount';
      b.innerHTML = n + ' photos <span class="gc-arr">&#8599;</span>';
      ph.appendChild(b);
    });
  })();
})();
