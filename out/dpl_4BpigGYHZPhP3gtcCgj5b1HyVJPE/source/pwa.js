'use strict';
/* PWA: register the service worker + friendly "install the app" notification */
(() => {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }

  const KEY = 'anyarthu-pwa-hide';
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const snoozed = () => { const t = +ls.get(KEY) || 0; return Date.now() - t < 5 * 864e5; };   // "later" hides it for 5 days
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios|android/i.test(navigator.userAgent);
  const my = () => (typeof lang !== 'undefined' ? lang : 'my') === 'my';
  let deferred = null, shown = false;

  const T = {
    title: () => my() ? 'အညာသူ App ကို ဖုန်းထဲ ထည့်ထားပါ' : 'Add the Anyarthu app to your phone',
    body: () => my() ? 'Tracking ကြည့်ရန်၊ ပစ္စည်းစာရင်းပို့ရန် Home Screen ကနေ တစ်ချက်နှိပ်ရုံပါပဲ။ အခမဲ့ · နေရာ မယူပါ။' : 'Track parcels and send your item list in one tap from your home screen. Free and tiny.',
    install: () => my() ? 'Install လုပ်မည်' : 'Install',
    later: () => my() ? 'နောက်မှ' : 'Later',
    ios: () => my() ? 'Safari အောက်ခြေက <b>မျှဝေရန်</b> ⬆️ ကိုနှိပ်ပြီး <b>“Add to Home Screen”</b> ကို ရွေးပါ။' : 'Tap <b>Share</b> ⬆️ in Safari, then choose <b>“Add to Home Screen”</b>.',
    got: () => my() ? 'သိပြီ' : 'Got it',
    done: () => my() ? 'အညာသူ App ထည့်ပြီးပါပြီ 🎉' : 'Anyarthu app installed 🎉'
  };

  function hide(el, snooze) {
    if (snooze) ls.set(KEY, Date.now());
    el.classList.remove('show');
    setTimeout(() => el.remove(), 500);
  }

  function showCard(mode) {
    if (shown || standalone() || snoozed()) return;
    shown = true;
    const el = document.createElement('div');
    el.className = 'pwa-card';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', T.title());
    el.innerHTML = `<button type="button" class="pwa-x" aria-label="${T.later()}">×</button>
      <div class="pwa-row"><img src="/icons/icon-192.png" alt="" width="54" height="54"><div><b>${T.title()}</b><p>${mode === 'ios' ? T.ios() : T.body()}</p></div></div>
      <div class="pwa-btns">${mode === 'ios'
        ? `<button type="button" class="btn gold sm pwa-ok">${T.got()}</button>`
        : `<button type="button" class="btn line sm pwa-later">${T.later()}</button><button type="button" class="btn gold sm pwa-go">${ic('download', 17, 2.3)}${T.install()}</button>`}</div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    el.querySelector('.pwa-x').onclick = () => hide(el, true);
    const later = el.querySelector('.pwa-later'); if (later) later.onclick = () => hide(el, true);
    const ok = el.querySelector('.pwa-ok'); if (ok) ok.onclick = () => hide(el, true);
    const go = el.querySelector('.pwa-go');
    if (go) go.onclick = async () => {
      if (!deferred) return hide(el, true);
      deferred.prompt();
      const choice = await deferred.userChoice.catch(() => ({}));
      deferred = null;
      hide(el, choice.outcome !== 'accepted');
    };
  }

  // wait until the splash has finished and the visitor has had a moment on the page
  const whenReady = fn => {
    const wait = () => document.getElementById('splash') ? setTimeout(wait, 600) : setTimeout(fn, 3500);
    wait();
  };

  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    whenReady(() => showCard('prompt'));
  });
  addEventListener('appinstalled', () => {
    deferred = null;
    const c = document.querySelector('.pwa-card'); if (c) hide(c, true);
    if (typeof toast === 'function') toast(T.done());
  });
  // iPhone / iPad Safari has no install prompt — show the "Add to Home Screen" steps instead
  if (isIOS && isSafari && !standalone()) whenReady(() => showCard('ios'));

  // for testing / demos: AnyarthuPWA.show() shows the card even without the browser prompt
  window.AnyarthuPWA = { show: mode => { shown = false; ls.set(KEY, ''); showCard(mode || (isIOS ? 'ios' : 'prompt')); } };
})();
