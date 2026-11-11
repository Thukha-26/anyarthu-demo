'use strict';
/* ---------- accounts ---------- */
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function checkPw(u, pw) { return u.hash ? u.hash === await sha(u.salt + pw) : u.seedPw === pw; }
async function setPw(u, pw) { u.salt = uid(); u.hash = await sha(u.salt + pw); delete u.seedPw; }
function genPassword() { const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789', v = crypto.getRandomValues(new Uint32Array(10)); return [...v].map(x => c[x % c.length]).join(''); }
const pwField = (k, name, val = '', extra = '') => `<div class="field"><label for="f-${name}">${t(k)}</label><div class="pwbox"><input id="f-${name}" name="${name}" type="password" value="${esc(val)}" required minlength="8" autocomplete="off" ${extra}><button type="button" aria-label="${t('showPw')}" data-act="togglePw">${ic('eye', 19)}</button></div></div>`;
P.login = () => {
  const demo = db.users.filter(u => u.active && u.seedPw);
  return `<div class="wrap page"><div class="loginwrap stagger"><section class="card pad"><form data-form="login" class="stack" id="loginForm"><div class="row" style="flex-wrap:nowrap"><img src="logo.png" alt="" width="60" height="60" style="border-radius:50%"><h1 class="h1">${t('loginTitle')}</h1></div>${field('username', 'username', '', { req: true, attrs: 'autocomplete="username"' })}${pwField('password', 'password', '', 'autocomplete="current-password"').replace('minlength="8" autocomplete="off"', '')}<button class="btn gold wide">${ic('user', 18)}${t('enter')}</button></form></section>
  ${demo.length ? `<section class="stack" style="gap:10px"><div><h2 class="h2">${t('demoAccounts')}</h2><p class="muted">${t('loginDemoNew')}</p></div><div class="accs">${demo.map(u => `<button type="button" class="acc" data-act="demoFill" data-id="${u.id}">${tile(u.role === 'admin' ? 'shield' : u.role === 'staff' ? 'building' : 'truck', u.role === 'admin' ? 'gold' : u.role === 'staff' ? '' : 'teal')}<span><b>${esc(u.name)}</b><small>${t('r_' + u.role)} · ${esc(bName(u.branchId))}</small></span></button>`).join('')}</div></section>` : ''}</div></div>`;
};
P.profile = () => {
  const u = me();
  return `<div class="narrow stack stagger">${u.mustChange ? `<p class="note">${t('changeFirst')}</p>` : ''}<section class="card pad row" style="flex-wrap:nowrap">${tile(u.role === 'admin' ? 'shield' : u.role === 'staff' ? 'building' : 'truck', 'gold')}<div><b>${esc(u.name)}</b><div class="muted">@${esc(u.username)} · ${t('r_' + u.role)} · ${esc(bName(u.branchId))}</div></div></section>
  <section class="card pad"><form data-form="changePw" class="stack"><h2 class="h2">${t('changePw')}</h2>${pwField('curPassword', 'cur').replace('minlength="8"', '')}${pwField('newPassword', 'pw')}${pwField('confirmPassword', 'pw2')}<button class="btn gold">${ic('key', 18)}${t('changePw')}</button></form></section></div>`;
};
A.users = () => `<section class="card"><div class="head"><h2 class="h2">${t('a_users')} (${db.users.length})</h2><div class="row">${listSearch()}<button class="btn sm gold" data-act="userForm">${ic('plus', 17, 2.4)}${t('newAccount')}</button></div></div>
  ${db.users.map(u => `<div class="ucard r" data-s="${esc((u.name + ' ' + u.username + ' ' + u.phone).toLowerCase())}">${tile(u.role === 'admin' ? 'shield' : u.role === 'staff' ? 'building' : 'truck', u.role === 'admin' ? 'gold' : u.role === 'staff' ? '' : 'teal')}<div><b>${esc(u.name)}</b> <span class="chip gray">${t('r_' + u.role)}</span><div class="muted">@${esc(u.username)} · ${esc(bName(u.branchId))} · ${esc(u.phone)}</div></div>${sw('user', u.id, u.active)}<button class="btn sm line icon" aria-label="${t('resetPw')}" title="${t('resetPw')}" data-act="resetPw" data-id="${u.id}">${ic('key', 18)}</button><button class="btn sm line icon" aria-label="${t('edit')}" data-act="userForm" data-id="${u.id}">${ic('edit', 18)}</button><button class="btn sm danger icon" aria-label="${t('delUser')}" data-act="userDel" data-id="${u.id}">${ic('trash', 18)}</button></div>`).join('')}</section>`;
function showCred(u, pw, titleKey) {
  const text = `${t('username')}: ${u.username}\n${t('password')}: ${pw}`;
  openModal(`<div class="stack"><div class="check" style="width:68px;height:68px">${ic('check', 34, 2.6)}</div><h2 class="h2" style="text-align:center">${t(titleKey)}</h2><p class="muted">${t('accCreatedT')}</p><div class="cred"><div>${esc(u.name)} · ${t('r_' + u.role)}</div><div>${t('username')}: <b>${esc(u.username)}</b></div><div>${t('password')}: <b>${esc(pw)}</b></div></div><div class="row"><button class="btn gold" data-act="copy" data-v="${esc(text)}">${ic('copy', 17)}${t('copyAll')}</button><button class="btn line" data-act="closeModal">${t('cancel')}</button></div></div>`);
}
Object.assign(Act, {
  togglePw(d, el) { const i = el.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; },
  demoFill(d) { const u = db.users.find(x => x.id === d.id), f = $('#loginForm'); f.elements.username.value = u.username; f.elements.password.value = u.seedPw; f.requestSubmit(); },
  genPw(d, el) { const i = el.closest('form').elements.password; i.value = genPassword(); i.type = 'text'; },
  userForm(d) {
    const u = db.users.find(x => x.id === d.id), v = u || {};
    openModal(`<form data-form="user" class="stack"><h2 class="h2">${t(u ? 'editAccount' : 'newAccount')}</h2><input type="hidden" name="id" value="${esc(v.id || '')}">${field('name', 'name', v.name, { req: true })}<div class="g2">${field('username', 'username', v.username, { req: true, attrs: 'pattern="[a-z0-9._]{3,}" autocomplete="off"' })}${field('phone', 'phone', v.phone, { req: true, type: 'tel' })}</div>${u ? '' : `${pwField('password', 'password', genPassword())}<button type="button" class="btn sm line" data-act="genPw">${ic('retry', 16)}${t('genPw')}</button>`}<div class="g2">${select('role', 'role', ['admin', 'staff', 'delivery'].map(r => [r, t('r_' + r)]), v.role || 'staff')}${select('branch', 'branchId', branchOpts(), v.branchId)}</div>${u ? '' : `<label class="sw"><input type="checkbox" name="mustChange" checked><span class="track"><span class="thumb"></span></span><span>${t('mustChange')}</span></label>`}${modalBtns()}</form>`);
  },
  resetPw(d) { const u = db.users.find(x => x.id === d.id); openModal(`<form data-form="resetPw" class="stack"><h2 class="h2">${t('resetPw')} · ${esc(u.name)}</h2><input type="hidden" name="id" value="${esc(u.id)}">${pwField('password', 'password', genPassword())}<button type="button" class="btn sm line" data-act="genPw">${ic('retry', 16)}${t('genPw')}</button>${modalBtns()}</form>`); },
  async delParcel(d) { if (!await askConfirm(t('confirmDelTitle'), d.no, t('delP'))) return; db.parcels = db.parcels.filter(p => p.no !== d.no); db.events = db.events.filter(e => e.no !== d.no); db.msgs = db.msgs.filter(m => m.no !== d.no); logIt('l_del', d.no); done(t('deleted')); },
  async branchDel(d) {
    if (db.users.some(u => u.branchId === d.id) || db.parcels.some(p => relevant(p, d.id))) return toast(t('inUse'), true);
    if (!await askConfirm(t('confirmDelTitle'), bName(d.id), t('delBranch'))) return; db.branches = db.branches.filter(b => b.id !== d.id); logIt('l_branch', d.id); done(t('deleted'));
  },
  async userDel(d) {
    const u = db.users.find(x => x.id === d.id);
    if (u.role === 'admin' && adminCount() < 2) return toast(t('lastAdmin'), true);
    if (d.id === me().id || db.events.some(e => e.userId === d.id) || db.parcels.some(p => p.assignedTo === d.id || p.pickupBy === d.id)) return toast(t('inUse'), true);
    if (!await askConfirm(t('confirmDelTitle'), u.name, t('delUser'))) return; db.users = db.users.filter(x => x.id !== d.id); logIt('l_user', u.name); done(t('deleted'));
  },
  async reset() { if (!await askConfirm(t('confirmResetTitle'), '', t('resetDemo'))) return; const sess = store.get('anyarthu-user'); db = seed(); if (!me() && sess) store.del('anyarthu-user'); done(); }
});
Object.assign(F, {
  async login(d) {
    const u = db.users.find(x => x.active && x.username === d.username.trim().toLowerCase());
    if (!u || !await checkPw(u, d.password)) { toast(t('badLogin'), true); const f = $('#loginForm'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); return; }
    store.set('anyarthu-user', u.id); location.hash = u.mustChange ? '#/profile' : homeOf(u);
  },
  async user(d) {
    let u = db.users.find(x => x.id === d.id);
    const name = d.username.trim().toLowerCase();
    if (db.users.some(x => x.username === name && x.id !== d.id)) return toast(t('usernameTaken'), true);
    if (u && u.role === 'admin' && d.role !== 'admin' && adminCount() < 2) return toast(t('lastAdmin'), true);
    const created = !u;
    if (created) { u = { id: 'u' + uid(), active: true, duty: true, mustChange: !!d.mustChange }; await setPw(u, d.password); db.users.push(u); }
    Object.assign(u, { name: d.name, username: name, phone: d.phone, role: d.role, branchId: d.branchId }); logIt('l_user', d.name); save(); render();
    if (created) showCred(u, d.password, 'accCreated'); else { closeModal(); toast(t('saved')); }
  },
  async resetPw(d) { const u = db.users.find(x => x.id === d.id); await setPw(u, d.password); u.mustChange = true; logIt('l_user', u.name); save(); showCred(u, d.password, 'pwChanged'); },
  async changePw(d) {
    const u = me();
    if (!await checkPw(u, d.cur)) return toast(t('pwWrong'), true);
    if (d.pw !== d.pw2) return toast(t('pwMismatch'), true);
    await setPw(u, d.pw); u.mustChange = false; logIt('l_user', u.name); save(); toast(t('pwChanged')); location.hash = homeOf(u);
  },
  msg(d) {
    const p = parcel(d.no), u = me();
    db.msgs.push({ id: uid(), no: p.no, userId: u.id, text: d.text, at: Date.now() });
    if (u.role === 'delivery') notify('b:' + (p.branchId || p.originId), 'n_chat', p.no);
    else [p.assignedTo, p.pickupBy].filter(x => x && x !== u.id).forEach(x => notify(x, 'n_chat', p.no));
    save(); Act.detail({ no: p.no }); const c = $('#modal .chat'); if (c) c.scrollTop = c.scrollHeight; const i = $('#modal [name=text]'); if (i) i.focus();
  },
  fail(d) {
    const p = parcel(d.no); if (!guard(p)) return;
    if (d.reason === 'no_answer') for (let i = noAnsCount(p), n = +d.calls || 0; i < n; i++) addCall(p, 'no_answer');
    p.failReason = d.reason; p.nextTry = d.nextTry || ''; p.fails = (p.fails || 0) + 1;
    move(p, 'failed', { note: d.reason });
    if (p.fails >= db.settings.maxFail) { startReturn(p); done(t('returnStarted')); } else done(t('updated'));
  }
});
Act.failForm = d => { const p = parcel(d.no), next = (p.fails || 0) + 1, last = next >= db.settings.maxFail; openModal(`<form data-form="fail" class="stack"><h2 class="h2">${t('markFail')} · ${esc(d.no)}</h2><input type="hidden" name="no" value="${esc(d.no)}"><p class="note">${t('failCount')} ${next}/${db.settings.maxFail}${last ? ' · ' + t('willReturn') : ''}</p>${select('reason', 'reason', reasonOpts(), 'no_answer', 'data-change="failReason"')}<div id="callsWrap">${field('callsMade', 'calls', Math.max(noAnsCount(p), 1), { req: true, type: 'number', attrs: 'min="1"' })}${callTimes(p)}</div>${last ? '' : field('nextTry', 'nextTry', '', { type: 'date' })}${modalBtns()}</form>`); };
Chg.failReason = el => { const w = $('#callsWrap'), on = el.value === 'no_answer'; w.hidden = !on; w.querySelector('input').required = on; };

/* ---------- confirm ---------- */
function askConfirm(title, entity, verb) {
  return new Promise(res => {
    const c = $('#confirm');
    c.innerHTML = `<div class="stack"><div class="row" style="flex-wrap:nowrap">${tile('alert', 'red')}<h2 class="h2">${esc(title)}</h2></div>${entity ? `<p><b>${esc(entity)}</b></p>` : ''}<p class="muted">${t('cannotUndo')}</p><div class="row"><button class="btn danger" data-c="1">${esc(verb)}</button><button class="btn line" data-c="0" autofocus>${t('cancel')}</button></div></div>`;
    const end = v => { c.removeEventListener('click', on); c.removeEventListener('close', cl); if (c.open) c.close(); res(v); };
    const on = e => { const b = e.target.closest('[data-c]'); if (b) end(b.dataset.c === '1'); };
    const cl = () => end(false);
    c.addEventListener('click', on); c.addEventListener('close', cl); c.showModal();
  });
}

/* ---------- connection: notifications, chat, internet ---------- */
function notify(to, key, no) { if (!to) return; db.notifs.unshift({ id: uid(), to, key, no: no || '', at: Date.now(), readBy: [] }); db.notifs = db.notifs.slice(0, 200); }
const myNotifs = () => { const u = me(); if (!u) return []; return db.notifs.filter(n => n.to === u.id || (n.to.startsWith('b:') && (u.role === 'admin' || (u.role === 'staff' && n.to === 'b:' + u.branchId)))); };
const unread = () => { const u = me(); return myNotifs().filter(n => !n.readBy.includes(u.id)).length; };
window.onMove = (p, s) => {
  if (s === 'failed') notify('b:' + p.branchId, 'n_failed', p.no);
  if (s === 'returning') { notify('b:' + p.branchId, 'n_return', p.no); if (p.destId !== p.branchId) notify('b:' + p.destId, 'n_return', p.no); }
  if (s === 'delivered') notify('b:' + p.originId, 'n_delivered', p.no);
  if (s === 'departed') notify('b:' + p.nextId, 'n_incoming', p.no);
  if (s === 'out_for_delivery') p.attempts = (p.attempts || 0) + 1;
};
const barExtras = () => { const n = unread(), on = navigator.onLine; return `<form data-form="gsearch" class="gs" role="search">${ic('search', 17)}<input name="q" required aria-label="${t('search')}" placeholder="${t('gsearch')}"></form><span class="net ${on ? '' : 'off'}" id="net"><i></i>${t(on ? 'online' : 'offline')}</span><button type="button" class="bell" data-act="notifs" aria-label="${t('notifications')}${n ? ' ' + n : ''}">${ic('bell', 21)}${n ? `<em>${n}</em>` : ''}</button>`; };
const NIC = { n_new: ['bell', 'gold'], n_assigned: ['send', 'teal'], n_pickup: ['box', 'gold'], n_failed: ['alert', 'red'], n_delivered: ['boxcheck', 'green'], n_incoming: ['truck', 'teal'], n_chat: ['chat', ''], n_return: ['retry', 'red'], n_noanswer: ['phoneoff', 'red'] };
Act.notifs = () => {
  const u = me(), list = myNotifs().slice(0, 40);
  openModal(`<div class="stack"><div class="row between"><h2 class="h2">${t('notifications')}</h2><button class="btn sm line icon" aria-label="${t('cancel')}" data-act="closeModal">${ic('x', 18)}</button></div><div>${list.map(n => `<button type="button" class="nitem ${n.readBy.includes(u.id) ? '' : 'new'}" ${n.no ? `data-act="detail" data-no="${esc(n.no)}"` : ''}>${tile(NIC[n.key][0], NIC[n.key][1], 20)}<span><b>${t(n.key)}</b><span class="muted" style="display:block">${esc(n.no)} · ${fmt(n.at)}</span></span></button>`).join('') || emptyBox()}</div></div>`, true);
  list.forEach(n => { if (!n.readBy.includes(u.id)) n.readBy.push(u.id); }); save();
  const b = $('.bell em'); if (b) b.remove();
};
function chatBlock(p) {
  const u = me(), list = db.msgs.filter(m => m.no === p.no);
  return `<section class="stack" style="gap:8px"><h3 class="h2">${t('chat')}</h3>${list.length ? `<div class="chat">${list.map(m => `<div class="bubble ${m.userId === u.id ? 'me' : ''}"><small>${esc(uName(m.userId))} · ${fmt(m.at)}</small>${esc(m.text)}</div>`).join('')}</div>` : ''}<form data-form="msg" class="row" style="flex-wrap:nowrap"><input type="hidden" name="no" value="${esc(p.no)}"><input class="inp" name="text" required aria-label="${t('chatPh')}" placeholder="${t('chatPh')}"><button class="btn sm gold" aria-label="${t('sendMsg')}">${ic('send', 17)}</button></form></section>`;
}
function netUpdate() { const el = $('#net'), on = navigator.onLine; if (el) { el.className = 'net ' + (on ? '' : 'off'); el.lastChild.textContent = t(on ? 'online' : 'offline'); } toast(t(on ? 'backOnline' : 'offline'), !on); }
addEventListener('online', netUpdate); addEventListener('offline', netUpdate);
const _assign = Chg.assign, _pickupBy = Chg.pickupBy;
Chg.assign = el => { _assign(el); if (el.value) { notify(el.value, 'n_assigned', el.dataset.no); save(); } };
Chg.pickupBy = el => { _pickupBy(el); if (el.value) { notify(el.value, 'n_pickup', el.dataset.no); save(); } };
addEventListener('storage', e => { if (e.key !== KEY || !me()) return; const b = $('.bell'); if (b && !$('#modal').open) { const n = unread(), em = $('em', b); if (n && !em) b.insertAdjacentHTML('beforeend', `<em>${n}</em>`); else if (em) em.textContent = n; } });

/* ---------- sidebar ---------- */
const sideClosed = () => store.get('anyarthu-side') === 'closed';
const burger = () => `<button type="button" class="burger" data-act="side" aria-expanded="${!sideClosed()}" aria-label="${t(sideClosed() ? 'openMenu' : 'closeMenu')}"><span></span><span></span><span></span></button>`;
Act.side = (d, el) => { const c = !sideClosed(); store.set('anyarthu-side', c ? 'closed' : 'open'); $('.shell').classList.toggle('closed', c); el.setAttribute('aria-expanded', !c); el.setAttribute('aria-label', t(c ? 'openMenu' : 'closeMenu')); };

/* ---------- staff extras ---------- */
function manifestView(data) {
  return `<section class="card"><div class="head"><h2 class="h2">${t('b_manifests')}</h2></div><div class="rows">${data.manifests.map(m => { const got = m.nos.filter(n => { const p = parcel(n); return p && p.nextId !== m.to; }).length; return `<div class="r">${tile('truck', 'teal', 21)}<div class="r-main"><b>${esc(m.id)}</b><div class="muted">${fmt(m.at)} · ${esc(m.vehicle || '-')} · ${esc(m.driver || '-')}</div></div><div class="r-route">${esc(bName(m.from))} ${ic('arrow', 14)} <b>${esc(bName(m.to))}</b></div><div class="r-st"><span class="chip">${t('received')} ${got}/${m.nos.length}</span></div><div class="r-act"><a class="btn sm line" href="#/manifest/${encodeURIComponent(m.id)}">${ic('print', 16)}${t('printManifest')}</a></div></div>`; }).join('') || emptyBox()}</div></section>`;
}
function todayView(data) {
  const c = s => data.today.filter(e => e.status === s).length;
  return `<div class="stats">${stat('box', 'blue', 't_collected', c('collected'))}${stat('inbox', 'teal', 't_at_branch', c('at_branch'))}${stat('truck', 'teal', 't_departed', c('departed'))}${stat('boxcheck', 'green', 't_delivered', c('delivered'))}${stat('alert', 'red', 't_failed', c('failed'))}</div><section class="card">${data.today.slice(0, 40).map(logLine).join('') || emptyBox()}</section>`;
}
P.manifest = id => {
  const m = db.manifests.find(x => x.id === decodeURIComponent(id || ''));
  if (!m) return `<p class="note">${t('noData')}</p>`;
  return `<div class="stack"><div class="row noprint" style="justify-content:center"><button class="btn gold" data-act="print">${ic('print', 18)}${t('printManifest')}</button><button class="btn line" data-act="back">${t('back')}</button></div><div class="manifest"><h2 class="h1">${esc(coName())}</h2><p><b>${esc(m.id)}</b> · ${fmt(m.at)}</p><p>${esc(bName(m.from))} → ${esc(bName(m.to))} · ${t('vehicle')}: ${esc(m.vehicle || '-')} · ${t('driver')}: ${esc(m.driver || '-')}</p><table class="mtable" style="margin-top:12px"><thead><tr><th>#</th><th>${t('trackNo')}</th><th>${t('receiver')}</th><th>${t('destBranch')}</th><th>${t('qty')}</th></tr></thead><tbody>${m.nos.map((n, i) => { const p = parcel(n) || {}; return `<tr><td>${i + 1}</td><td>${esc(n)}</td><td>${esc(p.receiver)}</td><td>${esc(bName(p.destId))}</td><td>${esc(p.qty)}</td></tr>`; }).join('')}</tbody></table></div></div>`;
};
document.addEventListener('input', e => {
  const el = e.target;
  if ('filter' in el.dataset) { const shown = $$('.r').filter(r => !r.hidden).length; let nr = $('#noresult'); if (!shown && !nr) { const h = $$('.r')[0]; if (h) h.parentElement.insertAdjacentHTML('beforeend', `<div class="noresult muted" id="noresult">${t('noResult')}</div>`); } else if (shown && nr) nr.remove(); }
  if (el.name === 'senderPhone' && el.closest('[data-form=newParcel]')) { const p = db.parcels.find(x => x.senderPhone === el.value.trim()); if (p && !el.form.elements.sender.value) el.form.elements.sender.value = p.sender; }
  if (el.name === 'receiverPhone' && el.closest('[data-form=newParcel]')) { const p = db.parcels.find(x => x.receiverPhone === el.value.trim()); if (p) { const f = el.form.elements; if (!f.receiver.value) f.receiver.value = p.receiver; if (!f.receiverAddr.value) f.receiverAddr.value = p.receiverAddr; } }
});

/* ---------- delivery ---------- */
const DTABS = [['pickup', 'box'], ['deliver', 'send'], ['open', 'inbox'], ['done', 'boxcheck'], ['problems', 'alert']];
function dData() {
  const u = me(), b = u.branchId, admin = u.role === 'admin', start = new Date().setHours(0, 0, 0, 0), mine = p => admin || p.assignedTo === u.id;
  const byRoute = l => l.sort((x, y) => (x.route ?? 1e9) - (y.route ?? 1e9));
  return {
    pickup: db.parcels.filter(p => p.status === 'accepted' && (admin ? p.pickupBy : p.pickupBy === u.id)),
    deliver: byRoute(db.parcels.filter(p => ['at_branch', 'out_for_delivery'].includes(p.status) && p.assignedTo && mine(p))),
    open: db.parcels.filter(p => p.status === 'at_branch' && !p.returning && !p.assignedTo && p.destId === p.branchId && (admin || p.branchId === b)),
    done: db.parcels.filter(p => p.status === 'delivered' && mine(p) && p.updatedAt >= start),
    problems: db.parcels.filter(p => p.status === 'failed' && p.assignedTo && mine(p))
  };
}
P.delivery = (tab = 'deliver') => {
  if (!DTABS.some(x => x[0] === tab)) tab = 'deliver';
  const d = dData(), u = me(), tabs = DTABS.filter(x => x[0] !== 'open' || can('self')), total = d.deliver.length + d.done.length, pct = total ? d.done.length / total : 0;
  const btn = (act, no, cls, icon, k) => `<button class="btn sm ${cls}" data-act="${act}" data-no="${esc(no)}">${ic(icon, 16)}${t(k)}</button>`;
  const job = (p, i) => {
    const pick = tab === 'pickup', ph = pick ? p.senderPhone : p.receiverPhone, name = pick ? p.sender : p.receiver, addr = pick ? `${p.pickupAddr}, ${p.township}` : p.receiverAddr;
    let acts = '';
    if (tab === 'pickup') acts = btn('dCollect', p.no, 'gold', 'box', 'collected');
    if (tab === 'open') acts = btn('takeJob', p.no, 'gold', 'hand', 'takeJob');
    if (tab === 'deliver') acts = p.status === 'at_branch' ? btn('dStart', p.no, 'gold', 'send', 'markOut') : btn('proofForm', p.no, 'gold', 'boxcheck', 'markDone') + (can('fail') ? btn('failForm', p.no, 'danger', 'alert', 'markFail') : '');
    if (tab === 'problems') acts = btn('dRetry', p.no, 'gold', 'retry', 'retryOut');
    return `<article class="card job"><div class="row between"><button type="button" class="link" data-act="detail" data-no="${esc(p.no)}">${esc(p.no)}</button><div class="row">${chip(p.status)}${tab === 'deliver' ? `<button class="btn sm line icon" aria-label="${t('moveUp')}" data-act="jobMove" data-no="${esc(p.no)}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>${ic('up', 17)}</button><button class="btn sm line icon" aria-label="${t('moveDown')}" data-act="jobMove" data-no="${esc(p.no)}" data-dir="1" ${i === d.deliver.length - 1 ? 'disabled' : ''}>${ic('down', 17)}</button>` : ''}</div></div><div class="row" style="flex-wrap:nowrap">${tile(pick ? 'box' : 'user', pick ? 'gold' : '')}<div style="min-width:0"><b>${esc(name)}</b><div class="muted">${esc(addr)}</div>${p.goods ? `<div class="muted">${esc(p.goods)}</div>` : ''}${p.fails ? `<div class="muted">${t('failCount')}: ${p.fails}/${db.settings.maxFail}</div>` : ''}${p.attempts ? `<div class="muted">${t('attempts')}: ${p.attempts}${p.nextTry ? ' · ' + t('nextTry') + ': ' + esc(p.nextTry) : ''}</div>` : ''}</div></div>
      ${tab === 'done' ? '' : `<div class="row"><a class="btn sm line" href="tel:${esc(ph)}">${ic('phone', 16)}${t('call')}</a><button class="btn sm line" data-act="logCall" data-r="no_answer" data-no="${esc(p.no)}">${ic('phoneoff', 16)}${t('c_no_answer')}${noAnsCount(p) ? ' (' + noAnsCount(p) + ')' : ''}</button><a class="btn sm line" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(addr)}">${ic('map', 16)}${t('map')}</a><button class="btn sm line" data-act="detail" data-no="${esc(p.no)}">${ic('chat', 16)}${t('openChat')}</button></div>`}${acts ? `<div class="row">${acts}</div>` : ''}</article>`;
  };
  const canStart = tab === 'deliver' && d.deliver.some(p => p.status === 'at_branch');
  return `<div class="stack stagger"><section class="card pad stack" style="gap:8px"><div class="row between"><b>${t('todayProgress')}: ${d.done.length}/${total}</b>${u.role === 'delivery' ? sw('duty', u.id, u.duty !== false, t(u.duty !== false ? 'onDuty' : 'offDuty')) : ''}</div><div class="meter"><u style="--v:${pct}"></u></div></section>
  <div class="stats">${stat('box', 'gold', 'd_pickup', d.pickup.length)}${stat('send', 'teal', 'd_deliver', d.deliver.length)}${stat('boxcheck', 'green', 'deliveredToday', d.done.length)}${stat('alert', 'red', 'd_problems', d.problems.length)}</div>
  <nav class="tabs" aria-label="Jobs">${tabs.map(([k, i]) => `<a href="#/delivery/${k}" ${k === tab ? 'aria-current="page"' : ''}>${ic(i, 16)}${t('d_' + k)}<em>${d[k].length}</em></a>`).join('')}</nav>
  ${canStart ? `<div><button class="btn gold" data-act="startAll">${ic('send', 17)}${t('startAll')}</button></div>` : ''}${d[tab].length ? `<div class="jobs">${d[tab].map(job).join('')}</div>` : `<div class="card">${emptyBox()}</div>`}</div>`;
};
Object.assign(Act, {
  jobMove(d) { const l = dData().deliver, i = l.findIndex(p => p.no === d.no), j = i + +d.dir; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; l.forEach((p, n) => p.route = n); save(); render(); },
  startAll() { dData().deliver.filter(p => p.status === 'at_branch').forEach(p => move(p, 'out_for_delivery', { branchId: p.branchId })); done(t('updated')); },
  dRetry(d) { const p = parcel(d.no); if (!guard(p)) return; p.failReason = ''; p.nextTry = ''; move(p, 'out_for_delivery', { branchId: p.branchId }); done(t('updated')); }
});
Sw.duty = (id, on, el) => { db.users.find(x => x.id === id).duty = on; const s = el.closest('.sw').lastElementChild; s.textContent = t(on ? 'onDuty' : 'offDuty'); };

/* ---------- field validation: on blur, clear on focus ---------- */
function clearErr(el) { el.removeAttribute('aria-invalid'); const n = el.closest('.field') && $('.ferr', el.closest('.field')); if (n) n.remove(); }
document.addEventListener('focusout', e => {
  const el = e.target; if (!el.matches || !el.matches('.field input, .field textarea') || el.checkValidity()) return;
  const box = el.closest('.field'); clearErr(el); el.setAttribute('aria-invalid', 'true');
  box.insertAdjacentHTML('beforeend', `<span class="ferr">${ic('alert', 13, 2.3)}${t(el.validity.valueMissing ? 'v_required' : el.name === 'username' ? 'usernameRule' : el.type === 'password' ? 'pwRule' : 'v_invalid')}</span>`);
});
document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('.field input, .field textarea')) clearErr(e.target); });
document.addEventListener('click', e => { const m = e.target; if (m.tagName === 'DIALOG' && m.id === 'modal') { const r = m.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) m.close(); } });
render();
