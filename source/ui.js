'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let lang = store.get('anyarthu-lang') === 'en' ? 'en' : 'my';
let mode = store.get('anyarthu-mode') || 'light';
const missing = window.__missing = new Set();
function t(k) { const v = I18N[k]; if (!v) { missing.add(k); return k; } return v[LANGS.indexOf(lang)] || v[1]; }
const F = {}, Act = {}, Sw = {}, Chg = {};

const ICON = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.8-4.8"/>',
  truck: '<path d="M5 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v11H9"/><path d="M14 10h3.6a1 1 0 0 1 .8.4l3.2 3.9a1 1 0 0 1 .4.8V17a1 1 0 0 1-1 1h-1"/><circle cx="7" cy="18" r="2.2"/><circle cx="17.5" cy="18" r="2.2"/><path d="M14 18h1.3"/>',
  plane: '<path d="M21 3.5c-1-.9-2.8-.5-4 .7L13.4 8 5.3 5.2 3.6 6.9l6.6 4.3-3.4 3.5-2.6-.5-1.3 1.3 3.6 2 2 3.6 1.3-1.3-.5-2.6 3.5-3.4 4.3 6.6 1.7-1.7-2.8-8.1 3.8-3.6c1.2-1.2 1.6-3 .7-4Z"/>',
  ship: '<path d="M12 3v7"/><path d="M8 5.5h8v5H8z"/><path d="M4 10.5h16l-2 8H6z"/><path d="M2 21c2 0 2-1.3 4-1.3S8 21 10 21s2-1.3 4-1.3 2 1.3 4 1.3 2-1.3 4-1.3"/>',
  box: '<path d="m12 3 8.5 4.6v8.8L12 21l-8.5-4.6V7.6z"/><path d="m3.7 7.7 8.3 4.5 8.3-4.5"/><path d="M12 12.2V21"/><path d="m7.8 5.3 8.4 4.6"/>',
  boxcheck: '<path d="M20.5 11V7.6L12 3 3.5 7.6v8.8L12 21l2-1.1"/><path d="m3.7 7.7 8.3 4.5 8.3-4.5"/><path d="M12 12.2V21"/><path d="m16 18.2 2.1 2.1 3.6-3.9"/>',
  pin: '<path d="M12 21.5s7-6.3 7-11.5a7 7 0 1 0-14 0c0 5.2 7 11.5 7 11.5Z"/><circle cx="12" cy="10" r="2.6"/>',
  scan: '<path d="M3.5 8V5.5a2 2 0 0 1 2-2H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16"/><path d="M7 12h10"/>',
  qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2"/><path d="M14 14h3v3h-3zM20.5 14v.01M20.5 20.5h-3.5M14 20.5v-.01"/>',
  users: '<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c.5-3.6 3.1-5.8 6.5-5.8s6 2.2 6.5 5.8"/><path d="M16 4.7a3.6 3.6 0 0 1 0 6.6M18.2 14.8c1.9.9 3 2.8 3.3 5.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-4 3.6-6.4 7.5-6.4s6.9 2.4 7.5 6.4"/>',
  building: '<path d="M4 21V5.5a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 15 5.5V21"/><path d="M15 10h3.5A1.5 1.5 0 0 1 20 11.5V21"/><path d="M2.5 21h19M8 8h3M8 12h3M8 16h3"/>',
  settings: '<path d="M4 7h9M18.5 7H20M4 17h1.5M11 17h9"/><circle cx="15.7" cy="7" r="2.6"/><circle cx="8.2" cy="17" r="2.6"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.8 3.1 8 7.5 9.5 4.4-1.5 7.5-4.7 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.3 10"/>',
  chart: '<path d="M4 3.5V20h16.5"/><path d="M8 16.5v-4M12.5 16.5v-9M17 16.5v-6"/>',
  report: '<path d="M6 3h8.5L19 7.5V21H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5M9 17v-3M12.5 17v-6M16 17v-2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.3l3.4 2"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14.5 7.5 3 3"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5M10 11v6M14 11v6"/>',
  print: '<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8.5" rx="2"/><path d="M7 14h10v6.5H7z"/>',
  download: '<path d="M12 3.5v11.5M7 10.5l5 5 5-5M4 20.5h16"/>',
  phone: '<path d="M6 3.5h3l1.6 4.2-2 1.5a12 12 0 0 0 6.2 6.2l1.5-2 4.2 1.6v3a2 2 0 0 1-2.2 2C10.5 19.4 4.6 13.5 4 5.7a2 2 0 0 1 2-2.2Z"/>',
  arrow: '<path d="M4 12h15.5M13.5 6l6 6-6 6"/>',
  inbox: '<path d="M3.5 13.5 6.3 5a1.5 1.5 0 0 1 1.4-1h8.6a1.5 1.5 0 0 1 1.4 1l2.8 8.5V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5"/>',
  send: '<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5-7.5-4z"/>',
  alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  bell: '<path d="M6 10a6 6 0 0 1 12 0c0 6 2.5 7 2.5 7h-17S6 16 6 10Z"/><path d="M10 20.5h4"/>',
  logout: '<path d="M9.5 20.5H5.5a1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.5-1.5h4M15.5 16.5 20 12l-4.5-4.5M20 12H9.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z"/>',
  camera: '<path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.8l1.5-2.5h5.4L16.2 7H19a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"/><circle cx="12" cy="13" r="3.5"/>',
  list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12M4 6v.01M4 12v.01M4 18v.01"/>',
  route: '<circle cx="6" cy="18.5" r="2.5"/><circle cx="18" cy="5.5" r="2.5"/><path d="M8.5 18.5H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5"/>',
  retry: '<path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5"/><path d="M4 3.5v5h5"/>',
  hand: '<path d="M2.5 14.5h3.5l3 1.5h4a1.7 1.7 0 0 1 0 3.5H9"/><path d="M13 16.5l5.3-2.3a1.7 1.7 0 0 1 1.4 3.1L12.5 21 6 19.5H2.5"/><rect x="9.5" y="3.5" width="8" height="8" rx="1.2"/><path d="M13.5 3.5v3"/>',
  map: '<path d="m3.5 6.5 5.5-2.5 6 2.5 5.5-2.5v14l-5.5 2.5-6-2.5-5.5 2.5z"/><path d="M9 4v14M15 6.5v14"/>',
  transfer: '<path d="M4 8h15.5M15 3.5 19.5 8 15 12.5M20 16H4.5M9 11.5 4.5 16 9 20.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  chat: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v10a1.5 1.5 0 0 1-1.5 1.5H10l-5 3.5V17A1 1 0 0 1 4 16z"/><path d="M8 9h8M8 12.5h5"/>',
  key: '<circle cx="8" cy="15.5" r="4.5"/><path d="m11.3 12.2 8.7-8.7M16 7.5l3 3M13.5 10l2 2"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15v2.5M8.5 18h.01M12 18h.01"/>',
  money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.7"/><path d="M6 9.5v.01M18 14.5v.01"/>',
  phoneoff: '<path d="M6 3.5h3l1.6 4.2-2 1.5a12 12 0 0 0 6.2 6.2l1.5-2 4.2 1.6v3a2 2 0 0 1-2.2 2C10.5 19.4 4.6 13.5 4 5.7a2 2 0 0 1 2-2.2Z"/><path d="m15.5 3.5 5 5M20.5 3.5l-5 5"/>',
  note: '<path d="M5 3.5h14A1.5 1.5 0 0 1 20.5 5v10L15 20.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5Z"/><path d="M15 20.5V15h5.5M8 9h8M8 13h4"/>'
};
const ic = (n, s = 20, w = 1.9) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;
const tile = (n, tone = '', s = 22) => `<span class="tile ${tone}">${ic(n, s)}</span>`;
const STATUS = { requested: ['bell', 'gold'], accepted: ['check', 'gold'], collected: ['box', 'blue'], at_branch: ['building', 'blue'], departed: ['truck', 'teal'], out_for_delivery: ['send', 'teal'], delivered: ['boxcheck', 'green'], failed: ['alert', 'red'], cancelled: ['x', 'gray'], returning: ['retry', 'red'], returned: ['retry', 'gray'] };
const chip = s => `<span class="chip ${STATUS[s][1]}">${ic(STATUS[s][0], 13, 2.3)}${t('s_' + s)}</span>`;
const bName = id => { const b = db.branches.find(x => x.id === id); return b ? (b[lang] || b.my) : ''; };
const uName = id => (db.users.find(x => x.id === id) || {}).name || '';
const coName = () => lang === 'my' ? db.settings.name : db.settings.nameEn;
const MM_MON = ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'ဩဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'];
const mmNum = v => String(v).replace(/\d/g, d => '၀၁၂၃၄၅၆၇၈၉'[d]);
const fmt = at => { if (lang !== 'my') return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(at); const d = new Date(at); return mmNum(d.getDate()) + ' ' + MM_MON[d.getMonth()] + '၊ ' + mmNum(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')); };
const dayLabel = at => { if (lang !== 'my') return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(at); const d = new Date(at); return mmNum(d.getDate()) + ' ' + MM_MON[d.getMonth()]; };
const field = (k, name, val = '', o = {}) => `<div class="field"><label for="f-${name}">${t(k)}</label>${o.rows ? `<textarea id="f-${name}" name="${name}" rows="${o.rows}" ${o.req ? 'required' : ''}>${esc(val)}</textarea>` : `<input id="f-${name}" name="${name}" type="${o.type || 'text'}" value="${esc(val)}" ${o.req ? 'required' : ''} ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.attrs || ''}>`}</div>`;
const options = (list, val) => list.map(([v, x]) => `<option value="${esc(v)}" ${String(v) === String(val ?? '') ? 'selected' : ''}>${esc(x)}</option>`).join('');
const select = (k, name, list, val, attrs = '') => `<div class="field"><label for="f-${name}">${t(k)}</label><select id="f-${name}" name="${name}" ${attrs}>${options(list, val)}</select></div>`;
const branchOpts = c => db.branches.filter(b => b.active && (!c || (b.country || 'mm') === c)).map(b => [b.id, b[lang] || b.my]);
const staffOpts = (role, b) => [['', t('none')], ...db.users.filter(u => u.role === role && u.active && (!b || u.branchId === b)).map(u => [u.id, u.name + (u.duty === false ? ' (Off)' : '')])];
const statusOpts = () => ALL_STATUS.map(s => [s, t('s_' + s)]);
const sw = (group, id, on, label = '') => `<label class="sw"><input type="checkbox" data-sw="${group}" data-id="${esc(id)}" ${on ? 'checked' : ''} aria-label="${esc(label || t('toggle'))}"><span class="track"><span class="thumb"></span></span>${label ? `<span>${esc(label)}</span>` : ''}</label>`;
const emptyBox = () => `<div class="pad muted" style="text-align:center">${ic('inbox', 34, 1.4)}<div>${t('noData')}</div></div>`;
function toast(msg, err) { const el = document.createElement('div'); el.className = 't' + (err ? ' err' : ''); el.innerHTML = ic(err ? 'alert' : 'check', 18, 2.4) + `<span>${esc(msg)}</span>`; $('#toast').append(el); setTimeout(() => el.remove(), 3400); }
function beep(f = 880) { if (!db.settings.sound) return; try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = f; g.gain.value = .14; o.start(); o.stop(c.currentTime + .2); } catch (e) {} }
function openModal(html, sheet) { const m = $('#modal'); m.className = sheet ? 'sheet' : ''; m.innerHTML = html; if (!m.open) m.showModal(); }
const closeModal = () => { if ($('#modal').open) $('#modal').close(); };
const modalBtns = () => `<div class="row"><button class="btn gold">${ic('check', 18, 2.4)}${t('save')}</button><button type="button" class="btn line" data-act="closeModal">${t('cancel')}</button></div>`;
function xlsx(rows, name) { if (!window.XLSX) return toast('Excel library not loaded', true); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Data'); XLSX.writeFile(wb, 'anyarthu-' + name + '-' + new Date().toISOString().slice(0, 10) + '.xlsx'); }
const excelRows = list => list.map(p => ({ [t('trackNo')]: p.no, [t('sender')]: p.sender, [t('senderPhone')]: p.senderPhone, [t('receiver')]: p.receiver, [t('receiverPhone')]: p.receiverPhone, [t('receiverAddr')]: p.receiverAddr, [t('origin')]: bName(p.originId), [t('destBranch')]: bName(p.destId), [t('branch')]: bName(p.branchId), [t('qty')]: p.qty, [t('method')]: t('m_' + (p.method || 'road')), [t('chargeable')]: p.price ? p.price.chargeable : '', [t('finalPrice')]: p.price ? p.price.total : '', [t('paidState')]: p.paid ? (p.payMethod || t('paid')) : t('unpaid'), [t('status')]: t('s_' + p.status), [t('deliveryStaff')]: uName(p.assignedTo), [t('time')]: new Date(p.createdAt).toLocaleString('en-GB') }));
function copyText(v) { const ok = () => toast(t('copied')); if (navigator.clipboard) navigator.clipboard.writeText(v).then(ok, () => toast(v)); else toast(v); }
const trackUrl = no => location.origin + location.pathname + '#/track/' + encodeURIComponent(no);
function qrSvg(text) { if (!window.qrcode) return ''; const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); }
function countUp(root) { $$('[data-count]', root).forEach(el => { const to = +el.dataset.count, t0 = performance.now(); if (!to) return; const step = n => { const k = Math.min(1, (n - t0) / 800); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US'); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }); }
function reveal() { const els = $$('.rv'); if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('in')); const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 }); els.forEach(e => io.observe(e)); }
const stat = (icon, tone, label, n) => `<div class="card stat">${tile(icon, tone)}<div><b data-count="${n}"${String(Math.round(+n || 0)).length > 5 ? ' class="long"' : ''}>${(+n || 0).toLocaleString('en-US')}</b><span>${t(label)}</span></div></div>`;
