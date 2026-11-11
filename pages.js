'use strict';
const P = {};
const state = { adminBranch: '', scanMode: '', scanNext: '', board: 'pickups', rFrom: '', rTo: '', rBranch: '', pfs: '', pfb: '' };
const sel = new Set();
const photo = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=72`;
const PH = { truck: '1601584115197-04ecc0da31d7', air: '1436491865332-7a61a109cc05', sea: '1605745341112-85968b19335b', store: '1553413077-190dd305871c', boxes: '1586528116311-ad8dd3c8310d' };
const curBranch = () => { const u = me(); return u.role === 'admin' ? (state.adminBranch || (branchOpts()[0] || [''])[0]) : u.branchId; };
const inScope = p => { const u = me(); return u.role === 'admin' || relevant(p, u.branchId); };

/* ---------- public ---------- */
P.home = () => {
  const s = db.settings;
  return `<section class="hero"><img class="bg" src="${photo(PH.truck, 1800)}" alt=""><span class="shape sh1"></span><span class="shape sh2"></span>
  <div class="wrap in"><div><span class="eyebrow">${ic('truck', 17, 2.2)}${t('tagline')}</span><h1>${t('heroTitle')}</h1><p>${t('heroLead')}</p>
    <form data-form="track"><div class="trackbar"><input name="no" required aria-label="${t('trackNo')}" placeholder="${t('trackNo')}: ${esc(s.prefix)}-${yymm()}-00500"><button type="button" class="qrbtn" data-act="scanTrack" aria-label="${t('scanQr')}" title="${t('scanQr')}">${ic('qr', 21, 2)}</button><button class="btn gold">${ic('search', 18, 2.3)}${t('search')}</button></div></form>
    <div class="route" aria-hidden="true"><svg viewBox="0 0 540 74" preserveAspectRatio="none" fill="none"><path class="dash" d="M12 56 C 130 -6, 220 80, 330 30 S 480 16, 528 44" stroke="#E7C468" stroke-width="3" stroke-linecap="round"/></svg><span class="rider">${ic('truck', 23, 2)}</span></div>
  </div>
  <div class="formcard" id="pickup"><h2 class="h1">${t('pickupForm')}</h2>
  ${s.pickupOpen ? `<form data-form="pickup" data-step="1"><div class="fsteps"><span class="s1"><b>1</b>${t('sender')}</span><hr><span class="s2"><b>2</b>${t('receiver')}</span></div>
    <div class="fs stack" data-s="1" style="gap:12px">${routeSelect('mm-th')}<div class="g2">${field('sender', 'sender', '', { req: true })}${field('senderPhone', 'senderPhone', '', { req: true, type: 'tel' })}</div>${field('pickupAddr', 'pickupAddr', '', { req: true, rows: 2 })}<div class="g2">${field('township', 'township', '', { req: true })}${select('nearBranch', 'originId', branchOpts('mm'), '')}</div><button type="button" class="btn wide" data-act="pickNext">${t('next')}${ic('arrow', 18, 2.3)}</button></div>
    <div class="fs stack" data-s="2" style="gap:12px"><div class="g2">${field('receiver', 'receiver', '', { req: true })}${field('receiverPhone', 'receiverPhone', '', { req: true, type: 'tel' })}</div>${field('receiverAddr', 'receiverAddr', '', { req: true })}<div class="g2">${select('destBranch', 'destId', branchOpts('mm'), '')}${field('qty', 'qty', 1, { req: true, type: 'number', attrs: 'min="1"' })}</div>${methodCards('road')}<div class="g2">${field('goods', 'goods', '', { req: true })}${field('estKg', 'estKg', '', { type: 'number', attrs: 'min="0" step="0.5"' })}</div><p class="muted">${t('priceAfter')}</p><div class="row" style="flex-wrap:nowrap"><button type="button" class="btn line" data-act="pickBack">${t('back')}</button><button class="btn gold wide">${ic('truck', 19)}${t('requestPickup')}</button></div></div></form>` : `<p class="note" style="margin-top:12px">${t('pickupClosed')}</p>`}
  </div></div>
  <svg class="wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0 60C240 110 420 10 720 40s480 60 720 0v50H0z"/></svg></section>

  <section class="sec tight"><div class="wrap"><div class="sechead rv"><h2>${t('modesTitle')}</h2><p>${t('modesLead')}</p></div><div class="modes">
    ${[['truck', 'truck', 'road'], ['air', 'plane', 'air'], ['sea', 'ship', 'sea']].map(([p, i, k], n) => `<article class="mode rv" style="transition-delay:${n * .12}s"><img loading="lazy" src="${photo(PH[p], 800)}" alt="${t('md_' + k)}"><div>${tile(i)}<h3>${t('md_' + k)}</h3><p>${t('md_' + k + 'T')}</p></div></article>`).join('')}
  </div></div></section>

  ${routesSection()}
  ${window.brandSections ? brandSections() : ''}
  <section class="sec" style="background:var(--surface);transition:background .35s"><div class="wrap how"><div class="photo rv"><img loading="lazy" src="${photo(PH.store, 1000)}" alt="${t('howAlt')}"><div class="badge">${tile('scan', 'gold')}<span>${t('howBadge')}</span></div></div>
    <div class="rv"><div class="sechead"><h2>${t('howTitle')}</h2></div><ol class="steps">${[['bell', 'gold', 1], ['hand', 'blue', 2], ['scan', 'teal', 3], ['boxcheck', 'green', 4]].map(([i, c, n]) => `<li>${tile(i, c)}<div><h3>${t('h' + n)}</h3><p>${t('h' + n + 'T')}</p></div></li>`).join('')}</ol></div></div></section>

  <section class="sec"><div class="wrap"><div class="sechead rv"><h2>${t('ourBranches')}</h2><p>${t('ourBranchesT')}</p></div><div class="branches">${db.branches.filter(b => b.active && (!b.partner || b.country === 'th')).map((b, n) => `<article class="card bcard rv" style="transition-delay:${n * .08}s">${tile('pin', n % 2 ? 'gold' : '')}<h3 class="h2" style="margin-top:6px">${esc(b[lang] || b.my)}</h3><span class="muted">${esc((lang === 'en' && b.addressEn) || b.address)}</span><a href="${esc(telHref(b.phone))}" style="min-height:32px;display:inline-flex;gap:6px;align-items:center">${ic('phone', 15)}${esc(b.phone)}</a>${b.country === 'mm' ? `<a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(b.address.replace(/\s*\([^()]*\)\s*$/, ''))}" target="_blank" rel="noopener" style="min-height:32px;display:inline-flex;gap:6px;align-items:center">${ic('map', 15)}Google Map</a>` : ''}</article>`).join('')}</div></div></section>

  ${window.brandContact ? brandContact() : ''}
  <section class="wrap"><div class="cta rv"><img loading="lazy" src="${photo(PH.boxes, 1500)}" alt=""><div><h2>${t('ctaTitle')}</h2><a class="btn gold" href="#/" data-act="toPickup">${ic('truck', 19)}${t('requestPickup')}</a></div></div></section>
  <footer class="foot"><div class="wrap"><div class="brand"><img src="logo.png" alt=""><span><b>${esc(coName())}</b><small>${t('tagline')}</small></span></div><div class="row"><a href="#/policy" style="color:#fff;min-height:44px;display:inline-flex;align-items:center;gap:6px">${ic('shield', 16)}${t('policy')}</a>${s.facebook ? `<a href="${esc(s.facebook)}" target="_blank" rel="noopener" style="color:#fff;min-height:44px;display:inline-flex;align-items:center;gap:6px">${ic('user', 16)}Facebook Page</a>` : ''}${s.tiktok ? `<a href="${esc(s.tiktok)}" target="_blank" rel="noopener" style="color:#fff;min-height:44px;display:inline-flex;align-items:center;gap:6px">${ic('send', 16)}TikTok</a>` : ''}<span>${ic('phone', 16)} ${esc(s.phone)}</span><span>${ic('pin', 16)} ${esc((lang === 'en' && s.addressEn) || s.address)}</span>${s.company ? `<span>${ic('shield', 16)} ${esc(s.company)}</span>` : ''}</div></div></footer>`;
};
P.done = no => `<div class="wrap page"><div class="card pad narrow stack stagger" style="text-align:center"><div class="check"><svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg></div><h1 class="h1">${t('doneTitle')}</h1><p>${t('doneText')}</p><p style="font-size:32px;font-weight:700">${esc(no)}</p><div class="row" style="justify-content:center"><a class="btn gold" href="#/track/${encodeURIComponent(no)}">${ic('route', 19)}${t('viewTracking')}</a><button class="btn line" data-act="copy" data-v="${esc(no)}">${ic('copy', 18)}${t('copy')}</button></div></div></div>`;

const STEPS = ['requested', 'collected', 'departed', 'arrived', 'out_for_delivery', 'delivered'];
function stepIndex(p) {
  if (p.status === 'requested' || p.status === 'accepted') return 0;
  if (p.status === 'collected') return 1;
  if (p.status === 'delivered') return 5;
  if (p.status === 'out_for_delivery' || p.status === 'failed') return 4;
  if (p.status === 'at_branch') return p.branchId === p.destId ? 3 : (p.branchId === p.originId ? 1 : 2);
  return 2;
}
const whereText = e => e.status === 'departed' && e.nextId ? `${bName(e.branchId)} → ${bName(e.nextId)}` : bName(e.branchId);
P.track = no => {
  const v = no ? decodeURIComponent(no) : '', p = parcel(v);
  if (p) { let r = []; try { r = JSON.parse(store.get('anyarthu-recent') || '[]'); } catch (e) {} store.set('anyarthu-recent', JSON.stringify([p.no, ...r.filter(x => x !== p.no)].slice(0, 5))); }
  let recent = []; try { recent = JSON.parse(store.get('anyarthu-recent') || '[]'); } catch (e) {}
  const ev = p ? db.events.filter(e => e.no === p.no && !e.internal) : [], i = p ? stepIndex(p) : 0;
  const tone = p && (['failed', 'cancelled', 'returned'].includes(p.status) || p.returning ? 'red' : p.status === 'delivered' ? 'green' : '');
  return `<div class="wrap page"><div class="narrow stack stagger" style="max-width:760px"><div class="card pad"><form data-form="track" class="stack" style="gap:10px"><div class="row" style="flex-wrap:nowrap">${`<input class="inp ${v && !p ? 'shake' : ''}" name="no" value="${esc(v)}" required aria-label="${t('trackNo')}" placeholder="${t('trackNo')}">`}<button type="button" class="qrbtn line" data-act="scanTrack" aria-label="${t('scanQr')}" title="${t('scanQr')}">${ic('qr', 21, 2)}</button><button class="btn">${ic('search', 18, 2.3)}${t('search')}</button></div>${recent.length ? `<div class="recent">${recent.map(r => `<a href="#/track/${encodeURIComponent(r)}">${esc(r)}</a>`).join('')}</div>` : ''}</form></div>
  ${v && !p ? `<p class="note">${t('notFound')}</p>` : ''}
  ${p ? `<section class="card tcard"><div class="thead ${tone}"><small>${t('trackNo')}</small><div class="no">${esc(p.no)}</div><div class="now">${t(p.returning && p.status !== 'returned' ? 's_returning' : 's_' + p.status)}</div><span style="font-size:14px">${p.branchId ? ic('pin', 15) + ' ' + esc(bName(p.branchId)) + ' · ' : ''}${t('lastUpdate')}: ${fmt(ev[0].at)}</span></div>
    ${p.status !== 'cancelled' && !p.returning ? `<div class="prog" style="--p:${i / 5 * 100}%"><div class="pline"><div class="pfill"></div><div class="prail"><div class="ptruck">${ic(p.status === 'delivered' ? 'boxcheck' : 'truck', 22)}</div></div></div><div class="psteps">${STEPS.map((s, n) => `<div class="pstep ${n <= i ? 'on' : ''} ${n === i ? 'cur' : ''}"><i></i><span>${t('p_' + s)}</span></div>`).join('')}</div></div>` : ''}
    ${routeBar(p)}<div class="routebox"><div><small>${t('origin')}</small><b>${esc(bName(p.originId))}</b></div><span class="mid"></span>${ic('truck', 20)}<span class="mid"></span><div style="text-align:right"><small>${t('destBranch')}</small><b>${esc(bName(p.destId))}</b></div></div>
    ${p.proof ? `<div class="note" style="margin:0 24px 12px">${ic('boxcheck', 16)} ${t('receivedBy')}: <b>${esc(p.proof.name)}</b> · ${fmt(p.proof.at)}</div>` : ''}
    ${p.status === 'failed' && p.failReason ? `<div class="note" style="margin:0 24px 12px">${ic('alert', 16)} ${t('fr_' + p.failReason)}${noAnsCount(p) ? ' × ' + noAnsCount(p) : ''}</div>` : ''}
    ${p.branchId ? `<div class="row" style="margin:0 24px 12px"><a class="btn sm line" href="tel:${esc((db.branches.find(b => b.id === p.branchId) || {}).phone)}">${ic('phone', 16)}${esc(bName(p.branchId))}</a><span class="chip">${ic(METHOD_IC[p.method || 'road'], 13, 2.3)}${t('m_' + (p.method || 'road'))}</span></div>` : ''}
    <div class="pad" style="padding-top:8px"><div class="row between" style="margin-bottom:14px"><h2 class="h2">${t('history')}</h2><button class="btn sm line" data-act="copy" data-v="${esc(trackUrl(p.no))}">${ic('copy', 16)}${t('copyLink')}</button></div>
    <ol class="tl">${ev.map((e, n) => `<li style="animation-delay:${n * .07}s">${tile(STATUS[e.status][0], STATUS[e.status][1], 21)}<div><b>${t('s_' + e.status)}</b><span class="muted">${esc(whereText(e))}${whereText(e) ? ' · ' : ''}${fmt(e.at)}</span></div></li>`).join('')}</ol></div></section>` : ''}</div></div>`;
};
/* ---------- shared rows ---------- */
function row(p, actions = '', o = {}) {
  const [i, c] = STATUS[p.status];
  return `<div class="r" data-s="${esc([p.no, p.sender, p.receiver, p.senderPhone, p.receiverPhone, p.township].join(' ').toLowerCase())}">
    ${o.check ? `<label class="ck"><input type="checkbox" data-sel="${esc(p.no)}" aria-label="${esc(p.no)}" ${sel.has(p.no) ? 'checked' : ''}><span>${ic('check', 15, 3)}</span></label>` : ''}
    ${tile(i, c, 21)}<div class="r-main"><button type="button" class="link" data-act="detail" data-no="${esc(p.no)}">${esc(p.no)}</button><div class="muted">${esc(p.sender)} → ${esc(p.receiver)} · ${esc(p.qty)} · ${fmt(p.updatedAt)}</div></div>
    <div class="r-route">${esc(bName(p.originId))} ${ic('arrow', 14)} <b>${esc(bName(p.destId))}</b>${intlChip(p)}</div>
    <div class="r-st">${chip(p.status)}${returnChip(p)}${priceChip(p)}${isDelayed(p) ? `<span class="chip red">${ic('clock', 13, 2.3)}${t('delayed')}</span>` : ''}</div><div class="r-act">${priceBtn(p)}${actions}</div></div>`;
}
const listSearch = () => `<input class="inp" style="max-width:280px" data-filter aria-label="${t('search')}" placeholder="${t('search')}…">`;
const labelBtn = p => `<a class="btn sm line icon" aria-label="${t('label')}" title="${t('label')}" href="#/label/${encodeURIComponent(p.no)}">${ic('print', 18)}</a>`;

/* ---------- branch board ---------- */
const BTABS = [['pickups', 'bell'], ['pricing', 'calc'], ['incoming', 'inbox'], ['inbranch', 'building'], ['outgoing', 'truck'], ['delivery', 'send'], ['problems', 'alert'], ['history', 'list'], ['manifests', 'report'], ['today', 'chart']];
P.staff = (tab = 'pickups') => {
  if (!BTABS.some(x => x[0] === tab)) tab = 'pickups';
  const u = me(), b = curBranch(), data = board(b), list = data[tab], n = data.pickups.filter(p => p.status === 'requested').length;
  const check = ['pickups', 'incoming', 'inbranch'].includes(tab);
  const actions = p => {
    if (tab === 'pickups') return (p.status === 'requested' ? `<button class="btn sm" data-act="accept" data-no="${esc(p.no)}">${ic('check', 16, 2.4)}${t('accept')}</button>` : `<select class="inp small" aria-label="${t('pickupBy')}" data-change="pickupBy" data-no="${esc(p.no)}">${options(staffOpts('delivery', b), p.pickupBy)}</select><button class="btn sm gold" data-act="collect" data-no="${esc(p.no)}">${ic('box', 16)}${t('collected')}</button>`) + (can('cancel') ? `<button class="btn sm danger icon" aria-label="${t('cancelOrder')}" title="${t('cancelOrder')}" data-act="cancelForm" data-no="${esc(p.no)}">${ic('x', 18)}</button>` : '') + labelBtn(p);
    if (tab === 'incoming') return `<button class="btn sm gold" data-act="receive" data-no="${esc(p.no)}">${ic('inbox', 16)}${t('receive')}</button>`;
    if (tab === 'inbranch' && p.returning && p.destId === b) return `<button class="btn sm gold" data-act="returned" data-no="${esc(p.no)}">${ic('retry', 16)}${t('handBack')}</button>`;
    if (tab === 'inbranch') return (p.destId === b ? `<select class="inp small" aria-label="${t('deliveryStaff')}" data-change="assign" data-no="${esc(p.no)}">${options(staffOpts('delivery', b), p.assignedTo)}</select>` : `<button class="btn sm" data-act="dispatchForm" data-no="${esc(p.no)}">${ic('truck', 16)}${t('dispatch')}</button>`) + labelBtn(p);
    if (tab === 'delivery') return `<span class="chip">${ic('user', 13)}${esc(uName(p.assignedTo))}</span>`;
    if (tab === 'problems') return `<span class="chip red">${t('fr_' + (p.failReason || 'other'))}${noAnsCount(p) ? ' × ' + noAnsCount(p) : ''}</span><span class="chip gray">${t('failCount')} ${p.fails || 1}/${db.settings.maxFail}</span><button class="btn sm" data-act="retry" data-no="${esc(p.no)}">${ic('retry', 16)}${t('retry')}</button>${can('cancel') ? `<button class="btn sm danger icon" aria-label="${t('cancelOrder')}" data-act="cancelForm" data-no="${esc(p.no)}">${ic('x', 18)}</button>` : ''}`;
    return '';
  };
  const bulk = tab === 'pickups' ? `<button class="btn sm gold" data-act="bulkAccept">${t('accept')}</button>` : tab === 'incoming' ? `<button class="btn sm gold" data-act="bulkReceive">${t('receive')}</button>` : `<button class="btn sm gold" data-act="dispatchForm">${t('dispatch')}</button><button class="btn sm line" data-act="bulkLabels">${t('label')}</button>`;
  return `<div class="stack stagger">
    <div class="row between"><div class="row">${u.role === 'admin' ? `<select class="inp" style="width:auto" aria-label="${t('branch')}" data-change="adminBranch">${options(branchOpts(), b)}</select>` : `<span class="chip" style="font-size:14px;padding:8px 16px">${ic('building', 16)}${esc(bName(b))}</span>`}</div>
      <div class="row">${can('counter') ? `<button class="btn sm gold" data-act="newParcel">${ic('plus', 17, 2.4)}${t('newParcel')}</button>` : ''}<a class="btn sm" href="#/scan">${ic('scan', 17)}${t('navScan')}</a>${can('export') ? `<button class="btn sm line" data-act="excelBoard">${ic('download', 17)}Excel</button>` : ''}</div></div>
    ${n ? `<div class="alert" role="status"><span class="ring">${ic('bell', 22, 2.2)}</span>${t('newPickups')} ${n}</div>` : ''}
    <div class="stats">${stat('bell', 'gold', 'waiting', data.pickups.length)}${stat('inbox', 'teal', 'incomingCount', data.incoming.length)}${stat('building', '', 'atBranch', data.inbranch.length)}${stat('send', 'green', 'onDelivery', data.delivery.length)}</div>
    <nav class="tabs" aria-label="Board">${BTABS.map(([k, i]) => `<a href="#/staff/${k}" ${k === tab ? 'aria-current="page"' : ''}>${ic(i, 16)}${t('b_' + k)}<em>${data[k].length}</em></a>`).join('')}</nav>
    ${tab === 'today' ? todayView(data) : tab === 'manifests' ? manifestView(data) : `<section class="card"><div class="head"><div class="row">${check ? `<label class="ck"><input type="checkbox" data-selall aria-label="${t('all')}"><span>${ic('check', 15, 3)}</span></label>` : ''}<h2 class="h2">${t('b_' + tab)}</h2></div>${listSearch()}</div><div class="rows">${list.map((p, i) => row(p, actions(p), { check })).join('') || emptyBox()}</div></section>`}
    <div class="bulk" id="bulk"><span><b id="bulkN">0</b> ${t('selected')}</span>${bulk}<button class="btn sm line icon" aria-label="${t('cancel')}" data-act="bulkClear">${ic('x', 18)}</button></div></div>`;
};

/* ---------- scan ---------- */
const scanModes = () => { const r = me().role; return r === 'delivery' ? ['collect', 'out'] : ['receive', 'collect', 'dispatch', 'out']; };
const MODE_IC = { receive: 'inbox', collect: 'box', dispatch: 'truck', out: 'send' };
P.scan = () => {
  const u = me(), ms = scanModes(), b = curBranch();
  if (!ms.includes(state.scanMode)) state.scanMode = ms[0];
  const nexts = branchOpts().filter(x => x[0] !== b);
  return `<div class="narrow stack stagger"><section class="card pad"><form data-form="scan" class="stack"><div class="row between"><p class="muted" style="max-width:360px">${t('scanHelp')}</p>${u.role === 'admin' ? `<select class="inp" style="width:auto" aria-label="${t('branch')}" data-change="adminBranch">${options(branchOpts(), b)}</select>` : `<span class="chip" style="font-size:14px;padding:6px 14px">${ic('building', 16)}${esc(bName(b))}</span>`}</div>
    <div class="modes-s">${ms.map(m => `<label class="mopt"><input type="radio" name="mode" value="${m}" data-change="scanMode" ${state.scanMode === m ? 'checked' : ''}><span>${ic(MODE_IC[m], 24)}${t('sm_' + m)}</span></label>`).join('')}</div>
    <div id="nextWrap" ${state.scanMode === 'dispatch' ? '' : 'hidden'}>${select('nextBranch', 'next', nexts, state.scanNext)}</div>
    <div class="scanbox field"><label for="f-no">${t('trackNo')}</label><input id="f-no" name="no" required autocomplete="off"></div><button class="btn gold">${ic('check', 19, 2.5)}${t('update')}</button></form>
    <div id="reader" style="margin-top:14px"></div><button type="button" class="btn line wide" style="margin-top:12px" data-act="camera">${ic('camera', 19)}<span>${t('camera')}</span></button></section>
    <section class="card"><div class="head"><h2 class="h2">${t('recentScans')}</h2></div><div id="scan-log">${db.events.filter(e => e.userId === u.id).slice(0, 8).map(logLine).join('') || `<div class="muted pad" id="scan-empty">${t('noData')}</div>`}</div></section></div>`;
};
const logLine = e => `<div class="logi">${tile(STATUS[e.status][0], STATUS[e.status][1], 19)}<div style="flex:1;min-width:0"><b>${esc(e.no)}</b><div class="muted">${t('s_' + e.status)} · ${esc(bName(e.branchId))}</div></div><span class="muted">${fmt(e.at)}</span></div>`;
function scanOne(raw) {
  const no = String(raw).trim().toUpperCase(), p = parcel(no), b = curBranch(), m = state.scanMode, input = $('#f-no');
  const fail = k => { toast(no + ' · ' + t(k), true); beep(220); if (input) { input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); input.select(); } };
  if (!p) return fail('notFound');
  if (m === 'receive') { if (!((p.status === 'departed' && p.nextId === b) || (p.status === 'collected' && p.branchId === b))) return fail('wrongBranch'); move(p, 'at_branch', { branchId: b }); }
  else if (m === 'collect') { if (!(['requested', 'accepted'].includes(p.status) && p.originId === b)) return fail('wrongState'); move(p, 'collected', { branchId: b }); }
  else if (m === 'dispatch') { if (!(['collected', 'at_branch'].includes(p.status) && p.branchId === b)) return fail('wrongState'); if (db.settings.requirePrice && !p.price) return fail('needPrice'); if (!state.scanNext) return fail('chooseNext'); move(p, 'departed', { branchId: b, nextId: state.scanNext }); }
  else { if (!(p.status === 'at_branch' && p.branchId === b && p.destId === b && !p.returning)) return fail('wrongState'); if (me().role === 'delivery') p.assignedTo = me().id; move(p, 'out_for_delivery', { branchId: b }); }
  save(); beep();
  const box = $('#scan-log'), e = $('#scan-empty'); if (e) e.remove();
  if (box) box.insertAdjacentHTML('afterbegin', logLine(db.events[0]));
  toast(no + ' · ' + t('updated'));
  if (input) { input.value = ''; input.focus(); input.classList.remove('flash'); void input.offsetWidth; input.classList.add('flash'); }
}

/* ---------- labels ---------- */
function labelHTML(p) {
  return `<div class="label"><div style="font-weight:700">${esc(coName())}</div><div class="row" style="gap:16px;flex-wrap:nowrap"><div class="qr">${qrSvg(p.no)}</div><div><div style="font-size:12px">${t('to')}</div><div style="font-size:25px;font-weight:700;line-height:1.4">${esc(bName(p.destId))}</div><div style="font-size:12px">${t('qty')}: ${esc(p.qty)}${p.price ? ' · ' + esc(p.price.chargeable) + ' kg' : ''} · ${t('m_' + (p.method || 'road'))}</div></div></div><div><div style="font-size:12px">${t('receiver')}</div><b>${esc(p.receiver)} · ${esc(p.receiverPhone)}</b><div style="font-size:14px">${esc(p.receiverAddr)}</div></div><div><div style="font-size:12px">${t('from')}</div><b style="font-size:14px">${esc(p.sender)} · ${esc(p.senderPhone)}</b></div><div><svg class="barcode" data-v="${esc(p.no)}"></svg></div></div>`;
}
P.label = arg => {
  const list = decodeURIComponent(arg || '').split(',').map(parcel).filter(Boolean);
  if (!list.length) return `<p class="note">${t('notFound')}</p>`;
  return `<div class="stack"><div class="row noprint" style="justify-content:center"><button class="btn gold" data-act="print">${ic('print', 18)}${t('printLabel')}</button><button class="btn line" data-act="back">${t('back')}</button></div>${list.map(labelHTML).join('')}</div>`;
};
