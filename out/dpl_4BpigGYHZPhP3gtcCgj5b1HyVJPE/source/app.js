'use strict';
let cam = null, lastKey = '', prevLangI = LANGS.indexOf(lang);
const GUARD = { staff: ['admin', 'staff'], scan: ['admin', 'staff', 'delivery'], delivery: ['admin', 'delivery'], admin: ['admin'], label: ['admin', 'staff', 'delivery'], manifest: ['admin', 'staff'], invoice: ['admin', 'staff'], profile: ['admin', 'staff', 'delivery'] };
const PUBLIC = ['home', 'done', 'track', 'login', 'policy'];
const homeOf = u => u.role === 'delivery' ? '#/delivery' : u.role === 'admin' ? '#/admin' : '#/staff';
function stopCam() { if (cam) { const c = cam; cam = null; c.stop().catch(() => {}).then(() => { try { c.clear(); } catch (e) {} }); } }

const tools = () => `<div class="tools noprint"><div class="lang" id="langT" style="--i:${prevLangI}" role="group" aria-label="Language"><i></i>${[['my', 'မြန်မာ'], ['en', 'EN']].map(([l, x]) => `<button type="button" data-act="lang" data-v="${l}" aria-pressed="${lang === l}">${x}</button>`).join('')}</div>
  <button type="button" class="theme" data-act="mode" aria-label="${mode === 'dark' ? 'Light mode' : 'Dark mode'}">${ic('sun', 16)}${ic('moon', 16)}<i id="themeI">${ic(mode === 'dark' ? 'moon' : 'sun', 18, 2.2)}</i></button></div>`;
const brand = href => `<a class="brand" href="${href}"><img src="logo.png" alt="${esc(coName())}"><span><b>${esc(coName())}</b><small>${t('tagline')}</small></span></a>`;
function navItems(u) {
  const n = u.role === 'delivery' ? 0 : board(curBranch()).pickups.filter(p => p.status === 'requested').length;
  const out = [];
  if (u.role === 'admin') out.push(['admin/overview', 'chart', 'a_overview'], ['admin/revenue', 'money', 'a_revenue'], ['admin/rates', 'calc', 'a_rates']);
  if (u.role !== 'delivery') out.push(['staff', 'building', 'navBoard', n]);
  out.push(['scan', 'scan', 'navScan']);
  if (u.role !== 'staff') out.push(['delivery', 'truck', 'navDelivery']);
  if (u.role === 'admin') out.push(['admin/parcels', 'box', 'a_parcels'], ['admin/branches', 'pin', 'a_branches'], ['admin/users', 'users', 'a_users'], ['admin/perms', 'shield', 'a_perms'], ['admin/reports', 'report', 'a_reports'], ['admin/policy', 'note', 'a_policy'], ['admin/settings', 'settings', 'a_settings'], ['admin/audit', 'list', 'a_audit']);
  return out;
}
const TITLE = { staff: 'navBoard', scan: 'scanTitle', delivery: 'navDelivery', label: 'label', manifest: 'b_manifests', invoice: 'invoice', profile: 'profile' };

function render() {
  stopCam();
  document.documentElement.lang = lang; document.documentElement.dataset.theme = mode;
  const [page = '', a] = location.hash.replace(/^#\/?/, '').split('/');
  const name = page || 'home', u = me(), key = name + '/' + (a || ''), entering = key !== lastKey;
  if (GUARD[name] && !u) { location.hash = '#/login'; return; }
  if (name === 'login' && u) { location.hash = homeOf(u); return; }
  if (entering) { sel.clear(); closeModal(); }
  lastKey = key;
  const root = $('#app');
  document.title = coName();
  if (PUBLIC.includes(name)) {
    root.innerHTML = `<header class="pub noprint"><div class="wrap">${brand('#/')}<nav class="links" aria-label="Main"><a href="#/"${name === 'home' ? ' aria-current="page"' : ''}>${ic('home', 18)}<span>${t('home')}</span></a><a href="#/track"${name === 'track' ? ' aria-current="page"' : ''}>${ic('search', 18)}<span>${t('track')}</span></a><a href="#/policy"${name === 'policy' ? ' aria-current="page"' : ''} aria-label="${t('policy')}">${ic('shield', 18)}<span>${t('policy')}</span></a>${u ? `<a href="${homeOf(u)}">${ic('chart', 18)}<span>${t('dashboard')}</span></a>` : `<a href="#/login"${name === 'login' ? ' aria-current="page"' : ''}>${ic('user', 18)}<span>${t('login')}</span></a>`}</nav>${tools()}</div></header><div class="${entering ? 'enter' : ''}">${P[name](a)}</div><div class="demo noprint">${t('demoNote')}</div>`;
    if (name === 'home') { reveal(); if (!entering) $$('.rv').forEach(e => e.classList.add('in')); }
    if (entering) window.scrollTo(0, 0);
  } else {
    const denied = GUARD[name] && !GUARD[name].includes(u.role);
    const items = navItems(u), cur = name === 'admin' ? 'admin/' + (ATABS.includes(a) ? a : 'overview') : name;
    const title = name === 'admin' ? t('a_' + (ATABS.includes(a) ? a : 'overview')) : t(TITLE[name] || 'navBoard');
    root.innerHTML = `<div class="shell ${sideClosed() ? 'closed' : ''}"><aside class="side noprint">${brand(homeOf(u))}<nav class="sidenav" aria-label="Main">${items.map(([h, i, k, n]) => `<a href="#/${h}" ${h === cur ? 'aria-current="page"' : ''}>${ic(i, 20)}<span>${t(k)}</span>${n ? `<span class="badge-n">${n}</span>` : ''}</a>`).join('')}</nav>
      <div class="userbox">${tile(u.role === 'admin' ? 'shield' : u.role === 'staff' ? 'building' : 'truck', 'gold', 19)}<a href="#/profile" class="who"><b>${esc(u.name)}</b><small>${t('r_' + u.role)} · ${esc(bName(u.branchId))}</small></a><button type="button" aria-label="${t('logout')}" title="${t('logout')}" data-act="logout">${ic('logout', 20)}</button></div></aside>
      <div class="col"><div class="bar noprint"><div class="row" style="flex-wrap:nowrap;min-width:0">${burger()}<a class="barlogo" href="${homeOf(u)}" aria-label="${esc(coName())}"><img src="logo.png" alt=""></a><h1>${esc(title)}</h1></div><div class="row">${barExtras()}${tools()}<button type="button" class="btn sm line icon mobile-out" aria-label="${t('logout')}" data-act="logout">${ic('logout', 18)}</button></div></div><main class="page ${entering ? 'enter' : ''}">${denied ? `<p class="note">${t('noAccess')}</p>` : (P[name] || P.staff)(a)}</main></div></div>`;
  }
  $$('.barcode').forEach(s => { if (window.JsBarcode) try { JsBarcode(s, s.dataset.v, { format: 'CODE128', height: 56, width: 2, fontSize: 18, margin: 0 }); } catch (e) {} });
  if (entering) countUp(root);
  const lt = $('#langT'), idx = LANGS.indexOf(lang);
  if (lt && prevLangI !== idx) { requestAnimationFrame(() => requestAnimationFrame(() => lt.style.setProperty('--i', idx))); prevLangI = idx; }
  if (name === 'scan' && $('#f-no')) $('#f-no').focus();
  updateBulk();
}
function updateBulk() { const b = $('#bulk'); if (!b) return; $('#bulkN').textContent = sel.size; b.classList.toggle('show', sel.size > 0); }
addEventListener('hashchange', render);
addEventListener('storage', e => {
  if (e.key !== KEY) return;
  const count = () => db.parcels.filter(p => p.status === 'requested').length, before = count(); db = load();
  const u = me();
  if (count() > before && u && u.role !== 'delivery') { toast(t('newToast')); beep(); }
  const a = document.activeElement, scanning = location.hash.startsWith('#/scan');
  if (!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) && !$('#modal').open && !scanning && !sel.size) render();
});

function guard(p) { if (!p) return false; if (!inScope(p)) { toast(t('wrongBranch'), true); return false; } return true; }
function done(msg) { save(); closeModal(); toast(msg || t('saved')); render(); }
const nosOf = d => d.no ? [d.no] : [...sel];

/* ---------- forms ---------- */
Object.assign(F, {
  track(d) { location.hash = '#/track/' + encodeURIComponent(d.no.trim().toUpperCase()); },
  pickup(d) {
    if (!db.settings.pickupOpen) return;
    const no = nextNo();
    db.parcels.unshift({ no, sender: d.sender, senderPhone: d.senderPhone, pickupAddr: d.pickupAddr, township: d.township, qty: +d.qty, receiver: d.receiver, receiverPhone: d.receiverPhone, receiverAddr: d.receiverAddr, originId: d.originId, destId: d.destId, branchId: '', nextId: '', status: 'requested', assignedTo: '', pickupBy: '', source: 'web', route: d.route || 'mm-th', method: d.method || 'road', goods: d.goods, estKg: d.estKg, createdAt: Date.now(), updatedAt: Date.now() });
    db.events.unshift({ id: uid(), no, status: 'requested', branchId: '', nextId: '', note: '', userId: null, at: Date.now() });
    logIt('l_request', no); notify('b:' + d.originId, 'n_new', no); save(); location.hash = '#/done/' + encodeURIComponent(no);
  },
  newParcel(d) {
    const b = curBranch(), no = nextNo();
    db.parcels.unshift({ no, sender: d.sender, senderPhone: d.senderPhone, pickupAddr: '-', township: '-', qty: +d.qty, receiver: d.receiver, receiverPhone: d.receiverPhone, receiverAddr: d.receiverAddr, originId: b, destId: d.destId, branchId: b, nextId: '', status: 'at_branch', assignedTo: '', pickupBy: '', source: 'counter', route: d.route || 'mm-th', method: d.method || 'road', goods: d.goods, createdAt: Date.now(), updatedAt: Date.now() });
    db.events.unshift({ id: uid(), no, status: 'at_branch', branchId: b, nextId: '', note: '', userId: me().id, at: Date.now() });
    logIt('l_counter', no); save(); closeModal(); toast(no); location.hash = '#/label/' + encodeURIComponent(no);
  },
  scan(d) { state.scanNext = d.next || ''; scanOne(d.no); },
  cancel(d) { const p = parcel(d.no); if (!guard(p)) return; move(p, 'cancelled', { note: d.reason }); done(); },
  dispatch(d) {
    const ok = []; let from = '';
    d.nos.split(',').forEach(no => { const p = parcel(no); if (p && db.settings.requirePrice && !p.price) { toast(no + ' · ' + t('needPrice'), true); return; } if (p && inScope(p) && ['collected', 'at_branch'].includes(p.status)) { from = p.branchId; move(p, 'departed', { branchId: p.branchId, nextId: d.next }); ok.push(no); } });
    if (ok.length) db.manifests.unshift({ id: 'MF-' + yymm() + '-' + (++db.mseq), from, to: d.next, nos: ok, vehicle: d.vehicle, driver: d.driver, userId: me().id, at: Date.now() });
    sel.clear(); done(t('updated'));
  },
  note(d) { const p = parcel(d.no); db.events.unshift({ id: uid(), no: p.no, status: p.status, branchId: p.branchId, nextId: '', note: d.note, userId: me().id, at: Date.now(), internal: true }); save(); Act.detail({ no: p.no }); toast(t('saved')); },
  fail(d) { const p = parcel(d.no); if (!guard(p)) return; p.failReason = d.reason; move(p, 'failed', { note: d.reason }); done(t('updated')); },
  async proof(d) {
    const p = parcel(d.no); if (!guard(p)) return;
    let photoUrl = '';
    if (d.photo && d.photo.size) { try { const bmp = await createImageBitmap(d.photo), k = Math.min(1, 360 / bmp.width), c = document.createElement('canvas'); c.width = bmp.width * k; c.height = bmp.height * k; c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); photoUrl = c.toDataURL('image/jpeg', .6); } catch (e) {} }
    p.proof = { name: d.name, at: Date.now(), photo: photoUrl }; move(p, 'delivered', { note: d.name }); beep(1200); done(t('updated'));
  },
  editParcel(d) {
    const p = parcel(d.no); if (!p) return;
    Object.assign(p, { receiver: d.receiver, receiverPhone: d.receiverPhone, receiverAddr: d.receiverAddr, destId: d.destId, assignedTo: d.assignedTo });
    if (d.status !== p.status) move(p, d.status, { branchId: p.branchId }); else logIt('l_edit', p.no);
    done();
  },
  transfer(d) { const p = parcel(d.no); if (!p) return; move(p, 'at_branch', { branchId: d.to, note: d.reason }); logIt('l_transfer', p.no + ' → ' + bName(d.to)); done(); },
  branch(d) { let b = db.branches.find(x => x.id === d.id); if (!b) { b = { id: 'b' + uid(), active: true }; db.branches.push(b); } Object.assign(b, { my: d.my, en: d.en, phone: d.phone, address: d.address }); logIt('l_branch', d.my); done(); },
  settings(d) { Object.assign(db.settings, { name: d.name, nameEn: d.nameEn, phone: d.phone, address: d.address, prefix: d.prefix.toUpperCase(), sla: +d.sla, maxFail: +d.maxFail }); logIt('l_settings', ''); done(); },
  pfilter(d) { state.pfs = d.pfs; state.pfb = d.pfb; render(); },
  report(d) { state.rFrom = d.rFrom; state.rTo = d.rTo; state.rBranch = d.rBranch; render(); }
});
const adminCount = () => db.users.filter(u => u.role === 'admin' && u.active).length;
document.addEventListener('submit', e => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); F[f.dataset.form](Object.fromEntries(new FormData(f))); });

/* ---------- actions ---------- */
const step = (no, s, o) => { const p = parcel(no); if (!guard(p)) return false; move(p, s, o); return true; };
const reasonOpts = () => ['no_answer', 'wrong_addr', 'refused', 'other'].map(k => [k, t('fr_' + k)]);
Object.assign(Act, {
  lang(d) { if (d.v === lang) return; lang = d.v; store.set('anyarthu-lang', lang); render(); },
  mode() { mode = mode === 'dark' ? 'light' : 'dark'; store.set('anyarthu-mode', mode); document.documentElement.dataset.theme = mode; const i = $('#themeI'); if (i) i.innerHTML = ic(mode === 'dark' ? 'moon' : 'sun', 18, 2.2); },
  logout() { store.del('anyarthu-user'); location.hash = '#/'; render(); },
  pickNext(d, el) { const f = el.closest('form'); for (const i of $$('[data-s="1"] [required]', f)) if (!i.reportValidity()) return; f.dataset.step = 2; },
  pickBack(d, el) { el.closest('form').dataset.step = 1; },
  toPickup(d, el, e) { e.preventDefault(); location.hash = '#/'; window.scrollTo(0, 0); const i = $('#f-sender'); if (i) i.focus(); },
  copy(d) { copyText(d.v); },
  back() { history.back(); },
  print() { window.print(); },
  closeModal,
  accept(d) { if (step(d.no, 'accepted')) { save(); render(); } },
  collect(d) { const p = parcel(d.no); if (step(d.no, 'collected', { branchId: p.originId })) { save(); render(); } },
  dCollect(d) { const p = parcel(d.no); if (step(d.no, 'collected', { branchId: p.originId })) { done(t('updated')); } },
  receive(d) { if (step(d.no, 'at_branch', { branchId: curBranch() })) { save(); toast(t('updated')); render(); } },
  retry(d) { const p = parcel(d.no); p.failReason = ''; if (step(d.no, 'at_branch', { branchId: p.branchId })) { save(); render(); } },
  dStart(d) { const p = parcel(d.no); if (step(d.no, 'out_for_delivery', { branchId: p.branchId })) done(t('updated')); },
  takeJob(d) { const p = parcel(d.no); if (!guard(p)) return; p.assignedTo = me().id; logIt('l_assign', p.no + ' → ' + me().name); done(); },
  cancelForm(d) { openModal(`<form data-form="cancel" class="stack"><h2 class="h2">${t('cancelOrder')} · ${esc(d.no)}</h2><input type="hidden" name="no" value="${esc(d.no)}">${field('reason', 'reason', '', { req: true, rows: 2 })}${modalBtns()}</form>`); },
  dispatchForm(d) {
    const nos = nosOf(d), first = parcel(nos[0]), b = first.branchId, list = branchOpts().filter(x => x[0] !== b);
    openModal(`<form data-form="dispatch" class="stack"><h2 class="h2">${t('dispatch')} · ${nos.length}</h2><input type="hidden" name="nos" value="${esc(nos.join(','))}">${select('nextBranch', 'next', list, first.destId)}<div class="g2">${field('vehicle', 'vehicle', '')}${field('driver', 'driver', '')}</div>${modalBtns()}</form>`);
  },
  bulkAccept() { sel.forEach(no => { const p = parcel(no); if (p && inScope(p) && p.status === 'requested') move(p, 'accepted'); }); sel.clear(); done(t('updated')); },
  bulkReceive() { sel.forEach(no => { const p = parcel(no); if (p && p.status === 'departed' && inScope(p)) move(p, 'at_branch', { branchId: curBranch() }); }); sel.clear(); done(t('updated')); },
  bulkLabels() { location.hash = '#/label/' + encodeURIComponent([...sel].join(',')); },
  bulkClear() { sel.clear(); $$('[data-sel],[data-selall]').forEach(c => c.checked = false); updateBulk(); },
  newParcel() { openModal(`<form data-form="newParcel" class="stack"><h2 class="h2">${t('newParcel')}</h2><div class="g2">${field('sender', 'sender', '', { req: true })}${field('senderPhone', 'senderPhone', '', { req: true, type: 'tel' })}${field('receiver', 'receiver', '', { req: true })}${field('receiverPhone', 'receiverPhone', '', { req: true, type: 'tel' })}</div>${field('receiverAddr', 'receiverAddr', '', { req: true })}${routeSelect('', true)}<div class="g2">${select('destBranch', 'destId', branchOpts(), '')}${field('qty', 'qty', 1, { req: true, type: 'number', attrs: 'min="1"' })}</div>${methodCards('road')}${field('goods', 'goods', '', { req: true })}${modalBtns()}</form>`); },
  proofForm(d) { const p = parcel(d.no); openModal(`<form data-form="proof" class="stack"><h2 class="h2">${t('markDone')} · ${esc(d.no)}</h2><input type="hidden" name="no" value="${esc(d.no)}">${field('receivedBy', 'name', p.receiver, { req: !!db.perms.delivery_proof })}<div class="field"><label for="f-photo">${t('photo')}</label><input id="f-photo" name="photo" type="file" accept="image/*" capture="environment"></div>${modalBtns()}</form>`); },
  failForm(d) { openModal(`<form data-form="fail" class="stack"><h2 class="h2">${t('markFail')} · ${esc(d.no)}</h2><input type="hidden" name="no" value="${esc(d.no)}">${select('reason', 'reason', reasonOpts(), 'no_answer')}${modalBtns()}</form>`); },
  detail(d) {
    const p = parcel(d.no), u = me(); if (!p) return;
    const ev = db.events.filter(e => e.no === p.no), admin = u.role === 'admin';
    openModal(`<div class="stack"><div class="row between"><h2 class="h2">${esc(p.no)}</h2><button class="btn sm line icon" aria-label="${t('cancel')}" data-act="closeModal">${ic('x', 18)}</button></div><div class="row">${chip(p.status)}${isDelayed(p) ? `<span class="chip red">${t('delayed')}</span>` : ''}</div>
      <div class="kv"><div><small>${t('sender')}</small><b>${esc(p.sender)}</b><a href="tel:${esc(p.senderPhone)}">${esc(p.senderPhone)}</a></div><div><small>${t('receiver')}</small><b>${esc(p.receiver)}</b><a href="tel:${esc(p.receiverPhone)}">${esc(p.receiverPhone)}</a></div><div><small>${t('pickupAddr')}</small><b>${esc(p.pickupAddr)}, ${esc(p.township)}</b></div><div><small>${t('receiverAddr')}</small><b>${esc(p.receiverAddr)}</b></div><div><small>${t('origin')}</small><b>${esc(bName(p.originId))}</b></div><div><small>${t('destBranch')}</small><b>${esc(bName(p.destId))}</b></div><div><small>${t('branch')}</small><b>${esc(bName(p.branchId)) || '-'}</b></div><div><small>${t('deliveryStaff')}</small><b>${esc(uName(p.assignedTo)) || '-'}</b></div></div>
      ${p.proof && p.proof.photo ? `<img class="proof" src="${p.proof.photo}" alt="${t('photo')}">` : ''}
      <div class="row">${labelBtn(p)}<button class="btn sm line" data-act="copy" data-v="${esc(trackUrl(p.no))}">${ic('copy', 16)}${t('copyLink')}</button>${admin ? `<button class="btn sm line" data-act="editParcel" data-no="${esc(p.no)}">${ic('edit', 16)}${t('edit')}</button>` : ''}${can('transfer') ? `<button class="btn sm line" data-act="transferForm" data-no="${esc(p.no)}">${ic('transfer', 16)}${t('transfer')}</button>` : ''}${admin ? `<button class="btn sm danger" data-act="delParcel" data-no="${esc(p.no)}">${ic('trash', 16)}${t('del')}</button>` : ''}</div>
      ${nextHint(p)}${pricingBlock(p)}${callBlock(p)}${chatBlock(p)}<form data-form="note" class="row" style="flex-wrap:nowrap"><input type="hidden" name="no" value="${esc(p.no)}"><input class="inp" name="note" required aria-label="${t('addNote')}" placeholder="${t('addNote')}"><button class="btn sm">${ic('plus', 17, 2.4)}</button></form>
      <ol class="tl">${ev.map((e, n) => `<li style="animation-delay:${n * .05}s">${tile(e.internal ? 'note' : STATUS[e.status][0], e.internal ? 'gray' : STATUS[e.status][1], 20)}<div><b>${e.internal ? esc(e.note) : t('s_' + e.status)}</b><span class="muted">${esc(whereText(e))} · ${fmt(e.at)} · ${esc(e.userId ? uName(e.userId) : t('customer'))}</span>${!e.internal && e.note ? `<div class="muted">${esc(I18N['fr_' + e.note] ? t('fr_' + e.note) : e.note)}</div>` : ''}</div></li>`).join('')}</ol></div>`, true);
  },
  editParcel(d) { const p = parcel(d.no); openModal(`<form data-form="editParcel" class="stack"><h2 class="h2">${t('editParcel')} · ${esc(p.no)}</h2><input type="hidden" name="no" value="${esc(p.no)}">${field('receiver', 'receiver', p.receiver, { req: true })}${field('receiverPhone', 'receiverPhone', p.receiverPhone, { req: true })}${field('receiverAddr', 'receiverAddr', p.receiverAddr, { req: true })}<div class="g2">${select('status', 'status', statusOpts(), p.status)}${select('destBranch', 'destId', branchOpts(), p.destId)}</div>${select('deliveryStaff', 'assignedTo', staffOpts('delivery'), p.assignedTo)}${modalBtns()}</form>`); },
  transferForm(d) { const p = parcel(d.no); openModal(`<form data-form="transfer" class="stack"><h2 class="h2">${t('transfer')} · ${esc(p.no)}</h2><input type="hidden" name="no" value="${esc(p.no)}">${select('nextBranch', 'to', branchOpts(), p.branchId)}${field('reason', 'reason', '', { req: true })}${modalBtns()}</form>`); },
  openBranch(d) { state.adminBranch = d.id; },
  branchForm(d) { const b = db.branches.find(x => x.id === d.id) || {}; openModal(`<form data-form="branch" class="stack"><h2 class="h2">${t('branchForm')}</h2><input type="hidden" name="id" value="${esc(b.id || '')}">${field('nameMy', 'my', b.my, { req: true })}${field('nameEn', 'en', b.en, { req: true })}${field('phone', 'phone', b.phone, { req: true, type: 'tel' })}${field('coAddr', 'address', b.address, { req: true })}${modalBtns()}</form>`); },
  excelBoard() { if (!can('export')) return; const d = board(curBranch()), m = new Map(); Object.values(d).flat().filter(p => p.status && p.createdAt).forEach(p => m.set(p.no, p)); xlsx(excelRows([...m.values()]), 'branch'); },
  excelAll() { xlsx(excelRows(db.parcels), 'parcels'); },
  excelReport() { xlsx(excelRows(reportData()), 'report'); },
  camera(d, el) {
    const lab = $('span', el);
    if (cam) { stopCam(); lab.textContent = t('camera'); return; }
    if (!window.Html5Qrcode) return toast(t('cameraErr'), true);
    const c = new Html5Qrcode('reader'); cam = c; lab.textContent = t('stopCamera');
    let last = 0, lastText = '';
    c.start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, text => { const n = Date.now(); if (text === lastText && n - last < 2500) return; last = n; lastText = text; const nx = $('[name=next]'); state.scanNext = nx ? nx.value : ''; scanOne(text); }, () => {}).catch(() => { cam = null; lab.textContent = t('camera'); toast(t('cameraErr'), true); });
  }
});
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) Act[b.dataset.act](b.dataset, b, e); });

/* ---------- switches and selects ---------- */
Object.assign(Sw, {
  branch(id, on) { const b = db.branches.find(x => x.id === id); b.active = on; logIt('l_branch', b.my); },
  user(id, on, el) { const u = db.users.find(x => x.id === id); if (!on && u.role === 'admin' && adminCount() < 2) { el.checked = true; return toast(t('lastAdmin'), true); } u.active = on; logIt('l_user', u.name); },
  perm(id, on) { db.perms[id] = on; logIt('l_perm', id); },
  setting(id, on) { db.settings[id] = on; logIt('l_settings', id); }
});
Object.assign(Chg, {
  assign(el) { const p = parcel(el.dataset.no); p.assignedTo = el.value; logIt('l_assign', p.no + ' → ' + uName(el.value)); save(); toast(t('saved')); },
  pickupBy(el) { const p = parcel(el.dataset.no); p.pickupBy = el.value; logIt('l_assign', p.no + ' → ' + uName(el.value)); save(); toast(t('saved')); },
  adminBranch(el) { state.adminBranch = el.value; state.scanNext = ''; render(); },
  scanMode(el) { state.scanMode = el.value; $('#nextWrap').hidden = el.value !== 'dispatch'; $('#f-no').focus(); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.sw) { Sw[el.dataset.sw](el.dataset.id, el.checked, el); save(); }
  if (el.dataset.change) Chg[el.dataset.change](el);
  if ('auto' in el.dataset) el.form.requestSubmit();
  if (el.dataset.sel) { el.checked ? sel.add(el.dataset.sel) : sel.delete(el.dataset.sel); updateBulk(); }
  if ('selall' in el.dataset) { $$('.r:not([hidden]) [data-sel]').forEach(c => { c.checked = el.checked; el.checked ? sel.add(c.dataset.sel) : sel.delete(c.dataset.sel); }); updateBulk(); }
});
document.addEventListener('input', e => { if ('filter' in e.target.dataset) { const q = e.target.value.trim().toLowerCase(); $$('.r').forEach(r => r.hidden = !r.dataset.s.includes(q)); } });
