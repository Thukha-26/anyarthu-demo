'use strict';
/* ---------- direct chat: one-to-one conversations between staff and delivery ---------- */
Object.assign(I18N, {
  navChat: ['Chat', 'Chat'], chatTitle: ['Staff နဲ့ Delivery Chat', 'Staff and Delivery Chat'],
  chatInbox: ['Messages', 'Messages'],
  chatDelivery: ['Delivery ဝန်ထမ်းများ', 'Delivery team'], chatStaff: ['ရုံးဝန်ထမ်းများ', 'Branch staff'],
  chatPick: ['စကားပြောရန် လူတစ်ယောက်ကို ရွေးပါ', 'Choose someone to chat with'],
  chatPickSub: ['ဘယ်ဘက်စာရင်းထဲက Staff သို့မဟုတ် Delivery တစ်ယောက်ကို နှိပ်ပြီး စကားပြောနိုင်ပါတယ်။', 'Tap a staff member or rider on the left to start a conversation.'],
  chatEmpty: ['Message မရှိသေးပါ', 'No messages yet'], chatEmptySub: ['ပထမဆုံး Message ကို ပို့လိုက်ပါ။', 'Send the first message to start.'],
  chatSearch: ['နာမည် ရှာရန်', 'Search name'], chatBack: ['နောက်သို့', 'Back'],
  chatNew: ['Message အသစ် ရောက်လာပါပြီ', 'New message'], chatOn: ['တာဝန်ဆင်းနေ', 'On duty'], chatOff: ['တာဝန်မဆင်း', 'Off duty'],
  chatToday: ['ယနေ့', 'Today'], chatYday: ['မနေ့က', 'Yesterday'], chatYou: ['သင်', 'You'], chatNone: ['မတွေ့ပါ', 'No one found'],
  chatQuick: [['ဟုတ်ကဲ့ 👍', 'လမ်းမှာပါ 🛵', 'ရောက်ပါပြီ ✅', 'ခဏစောင့်ပေးပါ ⏳', 'ဖုန်းမကိုင်ပါ 📵'], ['OK 👍', 'On my way 🛵', 'Arrived ✅', 'Please wait ⏳', 'No answer 📵']]
});
GUARD.chat = ['admin', 'staff', 'delivery'];
TITLE.chat = 'chatTitle';

const dmKey = (a, b) => [a, b].sort().join('|');
const dmUnread = (uid_, from) => db.msgs.filter(m => m.dm && m.to === uid_ && !m.read && (!from || m.userId === from)).length;
const roleIcon = r => r === 'delivery' ? 'truck' : r === 'admin' ? 'shield' : 'building';
const avatar = (x, s = 44) => `<span class="cav ${x.role}" style="--s:${s}px">${ic(roleIcon(x.role), Math.round(s * .44), 2)}<i class="${x.duty === false ? 'off' : ''}"></i></span>`;
const dayOf = at => new Date(at).setHours(0, 0, 0, 0);
const hhmm = at => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(at);
const fmtShort = at => dayOf(at) === dayOf(Date.now()) ? hhmm(at) : dayOf(at) === dayOf(Date.now() - 864e5) ? t('chatYday') : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(at);
const cDayLabel = at => dayOf(at) === dayOf(Date.now()) ? t('chatToday') : dayOf(at) === dayOf(Date.now() - 864e5) ? t('chatYday') : new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(at);
const quickReplies = () => I18N.chatQuick[LANGS.indexOf(lang)] || I18N.chatQuick[1];

/* who can talk to whom: staff/admin see delivery + other staff; delivery see staff/admin */
function chatContacts(u) {
  const others = db.users.filter(x => x.active && x.id !== u.id);
  const last = id => { const k = dmKey(u.id, id); let at = 0; db.msgs.forEach(m => { if (m.dm === k && m.at > at) at = m.at; }); return at; };
  const bi = id => { const i = db.branches.findIndex(b => b.id === id); return id === u.branchId ? -1 : i < 0 ? 99 : i; };
  /* recent conversations first, then own branch, then the other branches in order */
  const sort = list => list.map(x => ({ x, at: last(x.id) })).sort((a, b) => (b.at - a.at) || (bi(a.x.branchId) - bi(b.x.branchId)) || a.x.name.localeCompare(b.x.name)).map(o => o.x);
  const delivery = sort(others.filter(x => x.role === 'delivery'));
  const staff = sort(others.filter(x => x.role !== 'delivery'));
  return u.role === 'delivery' ? [['chatStaff', staff]] : [['chatDelivery', delivery], ['chatStaff', staff]];
}

function chatList(u, sel) {
  return chatContacts(u).map(([k, list]) => `<div class="cgroup"><h3>${t(k)}<span>${list.length}</span></h3>${list.map(x => {
    const n = dmUnread(u.id, x.id), k2 = dmKey(u.id, x.id), lastMsg = db.msgs.filter(m => m.dm === k2).pop();
    const preview = lastMsg ? (lastMsg.userId === u.id ? `<b class="cyou">${t('chatYou')}:</b> ` : '') + esc(lastMsg.text) : esc(bName(x.branchId));
    return `<a class="citem ${x.id === sel ? 'on' : ''} ${n ? 'new' : ''}" href="#/chat/${x.id}" ${x.id === sel ? 'aria-current="true"' : ''} data-s="${esc((x.name + ' ' + x.username + ' ' + bName(x.branchId)).toLowerCase())}">${avatar(x)}<span class="cmain"><span class="ctop"><b>${esc(x.name)}</b>${lastMsg ? `<time>${fmtShort(lastMsg.at)}</time>` : ''}</span><span class="cbot"><small>${preview}</small>${n ? `<em>${n}</em>` : ''}</span></span></a>`;
  }).join('')}</div>`).join('') + `<p class="cnone muted" hidden>${t('chatNone')}</p>`;
}

/* messages grouped by day; consecutive messages from one sender within 5 min form one group */
const cShown = new Set();
function chatThread(u, other) {
  const k = dmKey(u.id, other.id), list = db.msgs.filter(m => m.dm === k);
  if (!list.length) return `<div class="cempty"><span class="cbig">${avatar(other, 76)}</span><b>${t('chatEmpty')}</b><span class="muted">${t('chatEmptySub')}</span></div>`;
  let html = '', day = 0;
  list.forEach((m, i) => {
    const prev = list[i - 1], next = list[i + 1], mine = m.userId === u.id;
    if (dayOf(m.at) !== day) { day = dayOf(m.at); html += `<div class="cday"><span>${cDayLabel(m.at)}</span></div>`; }
    const joinPrev = prev && prev.userId === m.userId && m.at - prev.at < 3e5 && dayOf(prev.at) === day;
    const joinNext = next && next.userId === m.userId && next.at - m.at < 3e5 && dayOf(next.at) === day;
    const fresh = cShown.size && !cShown.has(m.id); cShown.add(m.id);
    html += `<div class="cmsg ${mine ? 'me' : ''} ${joinPrev ? 'jp' : ''} ${joinNext ? 'jn' : ''} ${fresh ? 'fresh' : ''}"><p>${esc(m.text)}<span class="cmeta">${hhmm(m.at)}${mine ? `<span class="tick ${m.read ? 'read' : ''}">${m.read ? '✓✓' : '✓'}</span>` : ''}</span></p></div>`;
  });
  return html;
}
function markRead(u, otherId) { let ch = false; db.msgs.forEach(m => { if (m.dm && m.to === u.id && m.userId === otherId && !m.read) { m.read = true; ch = true; } }); if (ch) save(); }

P.chat = a => {
  const u = me(), other = a && db.users.find(x => x.id === a && x.active && x.id !== u.id), total = dmUnread(u.id);
  if (other) markRead(u, other.id);
  cShown.clear();
  return `<section class="chatbox ${other ? 'open' : ''}">
    <aside class="clist"><div class="ctitle"><h2>${t('chatInbox')}</h2>${total ? `<span class="cpill">${total}</span>` : ''}</div>
      <label class="csearch">${ic('search', 17)}<input data-cfilter aria-label="${t('chatSearch')}" placeholder="${t('chatSearch')}"></label>
      <div class="cscroll" id="clist">${chatList(u, other && other.id)}</div></aside>
    <div class="cpane">${other ? `<header class="chead"><a class="cicon cback" href="#/chat" aria-label="${t('chatBack')}">${ic('arrow', 19, 2.2)}</a>${avatar(other, 46)}<span class="cmain"><b>${esc(other.name)}</b><small><span class="cdot ${other.duty === false ? 'off' : ''}"></span>${t(other.duty === false ? 'chatOff' : 'chatOn')} · ${t('r_' + other.role)} · ${esc(bName(other.branchId))}</small></span>${other.phone ? `<a class="cicon" href="tel:${esc(other.phone)}" aria-label="${t('call')}" title="${esc(other.phone)}">${ic('phone', 19)}</a>` : ''}</header>
      <div class="cmsgs" id="cmsgs" data-with="${other.id}">${chatThread(u, other)}</div>
      <div class="cfoot"><div class="cquick">${quickReplies().map(q => `<button type="button" data-act="dmQuick" data-v="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <form data-form="dm" class="csend"><input type="hidden" name="to" value="${other.id}"><input name="text" required autocomplete="off" aria-label="${t('chatPh')}" placeholder="${t('chatPh')}"><button aria-label="${t('sendMsg')}">${ic('send', 19, 2.2)}</button></form></div>`
      : `<div class="cempty cwelcome"><span class="cbig">${ic('chat', 38, 1.8)}</span><b>${t('chatPick')}</b><span class="muted">${t('chatPickSub')}</span></div>`}</div></section>`;
};

F.dm = d => {
  const u = me(), to = db.users.find(x => x.id === d.to), text = (d.text || '').trim();
  if (!u || !to || !text) return;
  db.msgs.push({ id: uid(), dm: dmKey(u.id, to.id), to: to.id, userId: u.id, text, at: Date.now(), read: false });
  save(); refreshChat(true);
  const i = $('.csend [name=text]'); if (i) { i.value = ''; i.focus(); }
};
Act.dmQuick = d => { const f = $('.csend'); if (f) F.dm({ to: f.elements.to.value, text: d.v }); };

/* update list + thread in place so the message being typed is kept */
function refreshChat(scroll) {
  const u = me(), box = $('#cmsgs'), list = $('#clist');
  if (!u || !list) return;
  if (box) {
    const other = db.users.find(x => x.id === box.dataset.with);
    if (other) { markRead(u, other.id); const atEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 80; box.innerHTML = chatThread(u, other); if (scroll || atEnd) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }); }
  }
  const q = ($('[data-cfilter]') || {}).value || '';
  list.innerHTML = chatList(u, box && box.dataset.with); applyCFilter(q);
  const n = dmUnread(u.id), tt = $('.ctitle'), pill = tt && $('.cpill', tt);
  if (tt) { if (n && pill) pill.textContent = n; else if (n) tt.insertAdjacentHTML('beforeend', `<span class="cpill">${n}</span>`); else if (pill) pill.remove(); }
  updateChatBadge();
}
const applyCFilter = q => {
  q = q.trim().toLowerCase();
  $$('#clist .cgroup').forEach(g => { let any = false; $$('.citem', g).forEach(r => { r.hidden = !r.dataset.s.includes(q); any = any || !r.hidden; }); g.hidden = !any; });
  const none = $('#clist .cnone'); if (none) none.hidden = !!$$('#clist .citem').find(r => !r.hidden);
};
function updateChatBadge() {
  const u = me(), a = $('.sidenav a[href="#/chat"]'); if (!u || !a) return;
  const n = dmUnread(u.id), em = $('.badge-n', a);
  if (n && em) em.textContent = n; else if (n) a.insertAdjacentHTML('beforeend', `<span class="badge-n">${n}</span>`); else if (em) em.remove();
}
document.addEventListener('input', e => { if ('cfilter' in e.target.dataset) applyCFilter(e.target.value); });

/* sidebar entry with unread badge */
const _navItems = navItems;
navItems = u => { const out = _navItems(u), n = dmUnread(u.id), i = out.findIndex(x => x[0] === 'scan'); out.splice(i < 0 ? out.length : i + 1, 0, ['chat', 'chat', 'navChat', n]); return out; };

/* scroll to newest after the page renders */
/* fill the space between the header and the bottom of the screen (or the mobile bottom nav) */
function fitChat() {
  const c = $('.chatbox'); if (!c) return;
  const below = innerWidth <= 860 ? (($('.side') || {}).offsetHeight || 0) + 12 : 24, top = c.getBoundingClientRect().top + scrollY;
  c.style.height = Math.max(420, innerHeight - top - below) + 'px';
}
addEventListener('resize', fitChat);
/* mobile bottom nav scrolls sideways: keep the current page's item in view */
function navIntoView() { const n = $('.sidenav'), a = n && $('a[aria-current=page]', n); if (a && n.scrollWidth > n.clientWidth) n.scrollLeft = a.offsetLeft - (n.clientWidth - a.offsetWidth) / 2; }
function chatAfter() { navIntoView(); fitChat(); const b = $('#cmsgs'); if (b) b.scrollTop = b.scrollHeight; if (location.hash.startsWith('#/chat/') && innerWidth > 860) { const i = $('.csend [name=text]'); if (i) i.focus({ preventScroll: true }); } }
const _render = render;
render = () => { _render(); chatAfter(); };
addEventListener('hashchange', chatAfter);
addEventListener('load', chatAfter);

/* live updates from other tabs/devices sharing this storage */
let dmSeen = (() => { const u = me(); return u ? dmUnread(u.id) : 0; })();
addEventListener('storage', e => {
  if (e.key !== KEY) return;
  const u = me(); if (!u) return;
  const n = dmUnread(u.id), box = $('#cmsgs'), viewing = box && db.msgs.some(m => m.dm && m.to === u.id && !m.read && m.userId === box.dataset.with);
  if (n > dmSeen && !viewing) { toast(t('chatNew')); beep(990); }
  if (location.hash.startsWith('#/chat')) refreshChat(); else updateChatBadge();
  dmSeen = dmUnread(u.id);
});
addEventListener('hashchange', () => { const u = me(); if (u) dmSeen = dmUnread(u.id); });
