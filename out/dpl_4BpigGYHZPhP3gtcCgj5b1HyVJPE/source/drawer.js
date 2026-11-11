'use strict';
/* Staff / admin on phones: the sidebar becomes a slide-in drawer opened by the ☰ button */
(() => {
  const mq = matchMedia('(max-width:860px)');
  const shell = () => document.querySelector('.shell');
  const burgerBtn = () => document.querySelector('.bar .burger');

  function setOpen(open) {
    const s = shell(); if (!s) return;
    s.classList.toggle('mopen', open);
    document.documentElement.classList.toggle('drawer-lock', open);
    const b = burgerBtn();
    if (b) { b.setAttribute('aria-expanded', open); b.setAttribute('aria-label', t(open ? 'closeMenu' : 'openMenu')); }
    if (open) { const a = s.querySelector('.sidenav [aria-current=page]') || s.querySelector('.sidenav a'); if (a) setTimeout(() => a.focus({ preventScroll: true }), 320); }
  }

  // on phones the ☰ button opens/closes the drawer; on desktop it keeps collapsing the sidebar as before
  const desktopSide = Act.side;
  Act.side = (d, el) => {
    if (!mq.matches) return desktopSide(d, el);
    setOpen(!shell().classList.contains('mopen'));
  };

  // close: backdrop tap, menu link tap, Esc, or growing to desktop width
  document.addEventListener('click', e => {
    const s = shell(); if (!s || !s.classList.contains('mopen')) return;
    if (e.target === s || e.target.closest('.sidenav a, .userbox a')) setOpen(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && shell() && shell().classList.contains('mopen')) setOpen(false); });
  mq.addEventListener('change', () => setOpen(false));

  // after every render the drawer starts closed on phones
  const app = document.getElementById('app');
  const sync = () => {
    if (!mq.matches) return;
    document.documentElement.classList.remove('drawer-lock');
    const b = burgerBtn();
    if (b) { b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', t('openMenu')); }
  };
  new MutationObserver(sync).observe(app, { childList: true });
  sync();
})();
