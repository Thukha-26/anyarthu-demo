'use strict';
/* Intro + motion layer: brand splash, hero entrance, flight arcs, scroll reveals, counters. */
(() => {
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const onHome = () => !location.hash || /^#\/?$/.test(location.hash);
  const html = document.documentElement;

  /* ---------- 1. brand splash (once per visit, home only) ---------- */
  // ?intro in the address (used by the Proposal's Demo buttons) always replays the intro
  const forceIntro = /[?&]intro(=|&|$)/.test(location.search);
  if (!RM && onHome() && (forceIntro || !ss.get('anyarthu-intro'))) {
    // mark the intro as seen only once it has played WITH sound (or the visitor skipped it);
    // a silent run (sound blocked) will replay next time, when the browser allows sound
    const seen = () => ss.set('anyarthu-intro', '1');
    html.classList.add('splashing');
    html.style.setProperty('--hd', '2.5s'); // hero entrance waits for the splash
    const my = lang === 'my', S = window.AnyarthuSting;
    /* cargo truck: container trailer + cab, wheels spin */
    const TRUCK = `<svg viewBox="0 0 150 58" aria-hidden="true">
      <rect class="tk-box" x="2" y="4" width="96" height="36" rx="3"/>
      <g class="tk-rib">${[14, 26, 38, 50, 62, 74, 86].map(x => `<line x1="${x}" y1="8" x2="${x}" y2="36"/>`).join('')}</g>
      <rect class="tk-band" x="2" y="18" width="96" height="6"/>
      <g class="tk-brand">
      <circle class="tk-badge" cx="26" cy="22" r="15.5"/>
      <image href="logo.png" x="11.5" y="7.5" width="29" height="29" style="clip-path:circle(46%)"/>
      <text class="tk-name" x="68" y="16.5" text-anchor="middle">ANYARTHU</text>
      <text class="tk-sub" x="68" y="33" text-anchor="middle">EXPRESS CARGO</text></g>
      <path class="tk-cab" d="M102 14h22c4 0 7 2 9 5l9 12c2 2 3 5 3 8v5H102z"/>
      <path class="tk-win" d="M110 18h13c2 0 4 1 5 3l6 9h-24z"/>
      <rect class="tk-chassis" x="2" y="40" width="143" height="5" rx="2"/>
      ${[[20], [38], [124]].map(([x]) => `<g class="tk-wheel" style="transform-origin:${x}px 48px"><circle cx="${x}" cy="48" r="8"/><circle class="hub" cx="${x}" cy="48" r="3"/><line x1="${x}" y1="41" x2="${x}" y2="55"/></g>`).join('')}
      <rect class="tk-light" x="143" y="33" width="4" height="4" rx="1"/>
    </svg>`;
    /* branded cargo plane (side view). flip = flies right-to-left; the logo and name stay readable */
    const PLANE = flip => {
      const X = x => flip ? 200 - x : x;
      const body = `<g ${flip ? 'transform="translate(200,0) scale(-1,1)"' : ''}>
        <path class="pl-wing-far" d="M112 34 L136 14 L146 14 L128 35 Z"/>
        <path class="pl-tail" d="M30 30 L14 4 L30 4 L56 29 Z"/>
        <path class="pl-stab" d="M26 37 L6 46 L18 47 L44 39 Z"/>
        <path class="pl-body" d="M18 36 C18 30 30 27 50 27 L166 27 C182 27 196 32 198 37 C196 42 182 46 166 46 L50 46 C30 46 18 42 18 36 Z"/>
        <rect class="pl-stripe" x="40" y="40" width="140" height="2.6" rx="1.3"/>
        <rect class="pl-stripe2" x="44" y="43" width="128" height="1.3" rx=".6"/>
        <path class="pl-cockpit" d="M176 31 L188 31 C191 32 193 34 194 36 L178 36 Z"/>
        ${[70, 80, 90, 100, 110, 120, 130, 140, 150, 160].map(x => `<circle class="pl-win" cx="${x}" cy="33.2" r="1.7"/>`).join('')}
        <path class="pl-wing" d="M104 41 L76 66 L90 66 L132 42 Z"/>
        <ellipse class="pl-engine" cx="100" cy="52" rx="10" ry="4.6"/>
        <ellipse class="pl-intake" cx="109.5" cy="52" rx="1.6" ry="3.6"/>
      </g>`;
      const brand = `<circle class="pl-badge" cx="${X(58)}" cy="36.5" r="7.6"/>
        <image href="logo.png" x="${X(58) - 6.8}" y="29.7" width="13.6" height="13.6" style="clip-path:circle(46%)"/>
        <text class="pl-name" x="${X(122)}" y="38.8" text-anchor="middle">ANYARTHU CARGO</text>`;
      return `<svg viewBox="0 0 200 70" aria-hidden="true">${body}${brand}</svg>`;
    };
    const SCENE = `<div class="sp-scene" aria-hidden="true">
      <div class="sp-sky">
        <span class="sp-plane-fly p1"><i class="sp-trail"></i>${PLANE(false)}</span>
        <span class="sp-plane-fly p2"><i class="sp-trail"></i>${PLANE(true)}</span>
      </div>
      <div class="sp-lane l1"><span class="sp-road"></span>
        <span class="sp-truck t1"><i class="sp-speed"></i>${TRUCK}</span>
        <span class="sp-truck t2"><i class="sp-speed"></i>${TRUCK}</span></div>
      <div class="sp-lane l2"><span class="sp-road"></span>
        <span class="sp-truck t3"><i class="sp-speed"></i>${TRUCK}</span></div>
    </div>`;
    let el = null, timer = 0, gone = false, swallow = false;
    const build = () => {
      const d = document.createElement('div');
      d.id = 'splash';
      d.innerHTML = `<div class="sp-glow"></div>${SCENE}
        <div class="sp-ring" aria-hidden="true"><svg viewBox="0 0 200 200"><circle class="sp-c1" cx="100" cy="100" r="92"/><circle class="sp-c2" cx="100" cy="100" r="80"/></svg>
          <img src="logo.png" alt=""><span class="sp-orbit"><span class="sp-plane">${ic('plane', 22, 2)}</span></span></div>
        <div class="sp-name">${my ? 'အညာသူ' : 'Anyarthu'} <b>Express Cargo</b></div>
        <div class="sp-tag">${my ? 'နိုင်ငံပေါင်း (၁၂) ကျော်ကို Door to Door' : 'Door-to-door to 12+ countries'}</div>
        <div class="sp-bar" aria-hidden="true"><i></i></div>`;
      document.body.appendChild(d);
      return d;
    };
    const end = () => {
      if (gone) return; gone = true; clearTimeout(timer);
      const d = el; d.classList.add('out');
      html.classList.remove('splashing'); html.classList.add('after-splash');
      setTimeout(() => { d.remove(); html.classList.remove('after-splash'); }, 2400);
    };
    const start = (withSound, holdMs) => {
      el = build();
      el.addEventListener('click', () => { if (swallow) { swallow = false; return; } seen(); end(); });
      if (withSound && S && S.play()) seen();
      timer = setTimeout(end, holdMs);
    };
    // replay the whole splash with sound after a tap (browsers only allow audio after a tap)
    // events that browsers accept as permission to play sound (iPhone: touchend / click, not touchstart)
    const GESTURES = ['touchend', 'mousedown', 'click', 'keydown'];
    const first = () => {
      GESTURES.forEach(t => removeEventListener(t, first, true));
      if (gone) return;
      swallow = true;                                      // this touch must not also skip the intro
      setTimeout(() => { swallow = false; }, 700);
      replayWithSound();
    };
    const arm = () => GESTURES.forEach(t => addEventListener(t, first, { capture: true, passive: true }));
    const replayWithSound = () => {
      if (!S) return end();
      S.unlock().then(ok => {
        if (!ok) { if (!gone) arm(); return; }            // not accepted as a tap for sound: wait for the next one
        clearTimeout(timer); el.remove();
        start(true, 2900);
        const hero = document.querySelector('.hero');
        if (hero) { hero.classList.remove('intro'); void hero.offsetWidth; hero.classList.add('intro'); }
      });
    };
    start(false, 2900);
    if (S) S.unlock().then(ok => {
      if (gone) return;
      if (ok) { if (S.play()) seen(); return; }           // sound allowed: play in sync with the visuals
      // blocked until the visitor touches the page: no prompt — keep the intro up a little longer,
      // and the first touch/key restarts it with sound
      clearTimeout(timer); timer = setTimeout(end, 3800);

      arm();
    });
  }

  /* ---------- 2. scroll progress + header state ---------- */
  const bar = document.createElement('div');
  bar.id = 'scrollbar'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
      const pub = document.querySelector('header.pub');
      if (pub) pub.classList.toggle('scrolled', scrollY > 12);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 3. hero: flight arcs, floating parcels, highlight, parallax ---------- */
  const ARCS = `<svg class="arcs" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="arcg" x1="0" x2="1"><stop offset="0" stop-color="#E7C468" stop-opacity="0"/><stop offset=".5" stop-color="#E7C468" stop-opacity=".9"/><stop offset="1" stop-color="#E7C468" stop-opacity="0"/></linearGradient></defs>
    ${[['M60 470 Q 330 230 640 420', 0], ['M120 520 Q 520 120 1040 300', 1.2], ['M40 380 Q 420 60 860 180', 2.4]].map(([d, k], i) => `<path id="arc${i}" class="arc" d="${d}" style="animation-delay:${.4 + i * .25}s"/>
    <g class="ap" style="animation-delay:${.9 + i * .25}s"><g><path d="M-9 -3 L9 0 L-9 3 L-6 0 Z" fill="#E7C468"/><animateMotion dur="${7 + i * 1.5}s" begin="${k}s" repeatCount="indefinite" rotate="auto"><mpath href="#arc${i}"/></animateMotion></g></g>`).join('')}
    ${[[60, 470], [640, 420], [1040, 300], [860, 180]].map(([x, y], i) => `<g class="pin" style="animation-delay:${.7 + i * .15}s"><circle cx="${x}" cy="${y}" r="5" fill="#E7C468"/><circle class="pulse" cx="${x}" cy="${y}" r="5" fill="none" stroke="#E7C468" stroke-width="2"/></g>`).join('')}
  </svg>`;
  const BOXES = Array.from({ length: 9 }, (_, i) => `<span class="pbox" style="--x:${(i * 11 + 5) % 96}%;--s:${10 + (i * 7) % 14}px;--t:${11 + (i * 3) % 9}s;--d:${-(i * 1.7)}s"></span>`).join('');

  /* 3D cargo boxes: x, y, size, float time, delay, parallax depth */
  const CUBES = `<div class="cubes" aria-hidden="true">${[[6, 70, 44, 7, 0, 26], [40, 12, 26, 6, -2, 14], [44, 62, 34, 8, -4, 20], [93, 66, 30, 6.5, -1, 18], [28, 86, 20, 5.5, -3, 10]]
    .map(([x, y, s, t, d, dp]) => `<span class="cube" style="--x:${x}%;--y:${y}%;--s:${s}px;--t:${t}s;--d:${d}s;--dp:${dp}"><i><b></b><b></b><b></b><b></b><b></b><b></b></i></span>`).join('')}</div>`;

  function enhanceHero(hero, fresh) {
    if (hero.dataset.fx) return;
    hero.dataset.fx = '1';
    hero.insertAdjacentHTML('afterbegin', ARCS + `<div class="pboxes" aria-hidden="true">${BOXES}</div>` + CUBES);
    const card = hero.querySelector('.formcard');
    if (card && !RM && matchMedia('(pointer:fine)').matches) {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--cx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
        card.style.setProperty('--cy', ((e.clientY - r.top) / r.height - .5).toFixed(3));
        card.classList.add('tilting');
      });
      card.addEventListener('pointerleave', () => { card.style.removeProperty('--cx'); card.style.removeProperty('--cy'); card.classList.remove('tilting'); });
    }
    const h1 = hero.querySelector('h1');
    if (h1 && !h1.querySelector('.hl')) h1.innerHTML = h1.innerHTML.replace(/(Door[ -]to[ -]Door|Door-to-door)/, '<span class="hl">$1</span>');
    if (fresh) hero.classList.add('intro');
    if (!RM && matchMedia('(pointer:fine)').matches) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        hero.style.setProperty('--mx', x.toFixed(3)); hero.style.setProperty('--my', y.toFixed(3));
      });
      hero.addEventListener('pointerleave', () => { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
    }
  }

  /* ---------- 4. reveals: stagger children, counters ---------- */
  const STAGGER = '.routes, .contacts, .infogrid, .branches, .modes, .trust, .lgrid, .steps';
  function countTo(el) {
    if (el.dataset.done) return; el.dataset.done = '1';
    const raw = el.textContent.trim(), m = raw.match(/^(\d+)(.*)$/);
    if (!m || RM) return;
    const to = +m[1], suf = m[2], t0 = performance.now(), dur = 1400;
    const step = n => { const k = Math.min(1, (n - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 4))); el.textContent = v + suf; if (k < 1) requestAnimationFrame(step); };
    el.textContent = '0' + suf; requestAnimationFrame(step);
  }
  let io;
  function observe(root) {
    if (!('IntersectionObserver' in window)) return;
    io = io || new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const t = e.target;
      t.classList.add('seen');
      if (t.matches('.trust')) t.querySelectorAll('.tstat b').forEach(countTo);
      io.unobserve(t);
    }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    root.querySelectorAll(STAGGER).forEach(g => {
      if (g.dataset.st) return; g.dataset.st = '1';
      g.classList.add('stg');
      [...g.children].forEach((c, i) => c.style.setProperty('--i', i));
      io.observe(g);
    });
    root.querySelectorAll('.sechead, .ptable, .calc, .lic, .askhead, .cta').forEach(el => { if (!el.dataset.ob) { el.dataset.ob = '1'; io.observe(el); } });
    if (RM) root.querySelectorAll('.stg, .sechead, .ptable').forEach(el => el.classList.add('seen'));
  }

  /* ---------- 5. run after every render ---------- */
  const app = document.getElementById('app');
  const enhance = () => {
    const hero = app.querySelector('.hero');
    if (hero) enhanceHero(hero, !!hero.closest('.enter'));
    observe(app);
    onScroll();
  };
  new MutationObserver(() => enhance()).observe(app, { childList: true });
  enhance();
})();
