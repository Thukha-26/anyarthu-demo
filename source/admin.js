'use strict';
const A = {};
const ATABS = ['overview', 'revenue', 'rates', 'parcels', 'branches', 'users', 'perms', 'reports', 'policy', 'settings', 'audit'];
P.admin = (tab = 'overview') => `<div class="stack stagger">${(A[tab] || A.overview)()}</div>`;

A.overview = () => {
  const start = new Date().setHours(0, 0, 0, 0), ps = db.parcels, c = s => ps.filter(p => s.includes(p.status)).length;
  const today = ps.filter(p => p.status === 'delivered' && p.updatedAt >= start).length, delayed = ps.filter(isDelayed);
  const days = [...Array(7)].map((_, i) => { const s = start - (6 - i) * 24 * H, n = ps.filter(p => p.createdAt >= s && p.createdAt < s + 24 * H).length; return { s, n }; });
  const max = Math.max(1, ...days.map(d => d.n));
  const groups = [['g_pickup', c(['requested', 'accepted']), '#E7C468'], ['g_branch', c(['collected', 'at_branch']), '#3F53BE'], ['g_transit', c(['departed', 'out_for_delivery']), '#1F9E8F'], ['g_done', c(['delivered']), '#3F9E55'], ['g_problem', c(['failed', 'cancelled']), '#C8493A']];
  const total = groups.reduce((a, g) => a + g[1], 0) || 1, R = 54, L = 2 * Math.PI * R;
  let off = 0;
  const arcs = groups.map(([, n, col]) => { const len = n / total * L, h = `<circle r="${R}" cx="70" cy="70" stroke="${col}" stroke-dasharray="${len} ${L - len}" stroke-dashoffset="${-off}"/>`; off += len; return h; }).join('');
  return `<div class="stats">${stat('box', '', 'total', ps.length)}${stat('bell', 'gold', 'waiting', c(['requested', 'accepted']))}${stat('truck', 'teal', 'inTransit', c(['departed', 'out_for_delivery']))}${stat('boxcheck', 'green', 'deliveredToday', today)}${stat('clock', 'red', 'delayed', delayed.length)}${stat('money', 'green', 'monthRevenue', monthBilled(new Date().toISOString().slice(0, 7)))}${stat('retry', 'red', 'returningNow', ps.filter(p => p.returning && p.status !== 'returned').length)}${stat('users', '', 'activeUsers', db.users.filter(u => u.active).length)}</div>
  <div class="charts"><section class="card"><div class="head"><h2 class="h2">${t('last7')}</h2></div><div class="bars">${days.map((d, i) => `<div><b>${d.n}</b><u style="--h:${d.n / max * 100}%;animation-delay:${i * .07}s"></u>${dayLabel(d.s)}</div>`).join('')}</div></section>
  <section class="card"><div class="head"><h2 class="h2">${t('byStatus')}</h2></div><div class="donut"><svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="${t('byStatus')}">${arcs}</svg><div class="legend">${groups.map(([k, n, col]) => `<span><i style="background:${col}"></i>${t(k)}: <b>${n}</b></span>`).join('')}</div></div></section></div>
  <section class="card"><div class="head"><h2 class="h2">${t('perBranch')}</h2></div><div class="rows">${db.branches.map(b => { const d = board(b.id); return `<div class="r">${tile('building', b.active ? '' : 'gray', 21)}<div class="r-main"><b>${esc(b[lang] || b.my)}</b></div><div class="row"><span class="chip gold">${t('b_pickups')} ${d.pickups.length}</span><span class="chip teal">${t('b_incoming')} ${d.incoming.length}</span><span class="chip">${t('b_inbranch')} ${d.inbranch.length}</span><span class="chip red">${t('b_problems')} ${d.problems.length}</span></div><a class="btn sm line" href="#/staff" data-act="openBranch" data-id="${b.id}">${t('openBoard')}</a></div>`; }).join('')}</div></section>
  ${delayed.length ? `<section class="card"><div class="head"><h2 class="h2">${t('delayedList')}</h2></div><div class="rows">${delayed.map(p => row(p)).join('')}</div></section>` : ''}`;
};
A.parcels = () => {
  const list = db.parcels.filter(p => (!state.pfs || p.status === state.pfs) && (!state.pfb || p.branchId === state.pfb));
  return `<section class="card"><div class="head"><h2 class="h2">${t('a_parcels')} (${list.length})</h2><div class="row">${listSearch()}<button class="btn sm line" data-act="excelAll">${ic('download', 17)}Excel</button></div></div>
  <form data-form="pfilter" class="g2" style="padding:12px 18px">${select('status', 'pfs', [['', t('all')], ...statusOpts()], state.pfs, 'data-auto')}${select('branch', 'pfb', [['', t('all')], ...branchOpts()], state.pfb, 'data-auto')}</form>
  <div class="rows">${list.map(p => row(p, labelBtn(p))).join('') || emptyBox()}</div></section>`;
};
A.branches = () => `<section class="card"><div class="head"><h2 class="h2">${t('a_branches')}</h2><button class="btn sm gold" data-act="branchForm">${ic('plus', 17, 2.4)}${t('add')}</button></div>
  ${db.branches.map(b => `<div class="ucard">${tile('building', b.active ? '' : 'gray')}<div><b>${esc(b.my)}</b> · ${esc(b.en)}<div class="muted">${esc(b.address)} · ${esc(b.phone)} · ${t('a_users')} ${db.users.filter(u => u.branchId === b.id).length}</div></div>${sw('branch', b.id, b.active)}<button class="btn sm line icon" aria-label="${t('edit')}" data-act="branchForm" data-id="${b.id}">${ic('edit', 18)}</button><button class="btn sm danger icon" aria-label="${t('del')}" data-act="branchDel" data-id="${b.id}">${ic('trash', 18)}</button></div>`).join('')}</section>`;
A.perms = () => {
  const G = [['staff', [['counter', 'plus'], ['cancel', 'x'], ['export', 'download'], ['transfer', 'transfer']]], ['delivery', [['self', 'hand'], ['proof', 'boxcheck'], ['fail', 'alert']]]];
  return G.map(([r, keys]) => `<section class="card"><div class="head"><h2 class="h2">${t('r_' + r)}</h2></div>${keys.map(([k, i]) => `<div class="perm"><div>${tile(i, 'gold', 20)}<span>${t('p_' + r + '_' + k)}</span></div>${sw('perm', r + '_' + k, db.perms[r + '_' + k])}</div>`).join('')}</section>`).join('');
};
function reportData() {
  const from = state.rFrom ? new Date(state.rFrom + 'T00:00').getTime() : 0, to = state.rTo ? new Date(state.rTo + 'T23:59:59').getTime() : Infinity;
  return db.parcels.filter(p => p.createdAt >= from && p.createdAt <= to && (!state.rBranch || relevant(p, state.rBranch)));
}
A.reports = () => {
  if (!state.rFrom) { const d = new Date(Date.now() - 6 * 24 * H), n = new Date(), s = x => x.toISOString().slice(0, 10); state.rFrom = s(d); state.rTo = s(n); }
  const l = reportData(), c = s => l.filter(p => s.includes(p.status)).length;
  return `<section class="card pad"><form data-form="report" class="g2">${field('dateFrom', 'rFrom', state.rFrom, { type: 'date', attrs: 'data-auto' })}${field('dateTo', 'rTo', state.rTo, { type: 'date', attrs: 'data-auto' })}${select('branch', 'rBranch', [['', t('all')], ...branchOpts()], state.rBranch, 'data-auto')}</form></section>
  <div class="stats">${stat('box', '', 'total', l.length)}${stat('boxcheck', 'green', 's_delivered', c(['delivered']))}${stat('truck', 'teal', 'inTransit', c(['departed', 'out_for_delivery']))}${stat('alert', 'red', 's_failed', c(['failed']))}</div>
  <section class="card"><div class="head"><h2 class="h2">${t('a_reports')}</h2><button class="btn sm gold" data-act="excelReport">${ic('download', 17)}${t('exportExcel')}</button></div><div class="rows">${l.map(p => row(p)).join('') || emptyBox()}</div></section>`;
};
A.settings = () => {
  const s = db.settings;
  return `<section class="card"><div class="perm"><div>${tile('truck', 'gold', 20)}<span>${t('pickupOpen')}</span></div>${sw('setting', 'pickupOpen', s.pickupOpen)}</div><div class="perm"><div>${tile('bell', 'gold', 20)}<span>${t('soundAlert')}</span></div>${sw('setting', 'sound', s.sound)}</div><div class="perm"><div>${tile('calc', 'gold', 20)}<span>${t('requirePrice')}</span></div>${sw('setting', 'requirePrice', s.requirePrice)}</div></section>
  <section class="card pad"><form data-form="settings" class="stack">${field('coName', 'name', s.name, { req: true })}${field('coNameEn2', 'nameEn', s.nameEn, { req: true })}<div class="g2">${field('coPhone', 'phone', s.phone)}${field('prefix', 'prefix', s.prefix, { req: true, attrs: 'maxlength="4" pattern="[A-Za-z0-9]+"' })}${field('slaHours', 'sla', s.sla, { req: true, type: 'number', attrs: 'min="1"' })}${field('maxFail', 'maxFail', s.maxFail, { req: true, type: 'number', attrs: 'min="1" max="9"' })}</div>${field('coAddr', 'address', s.address)}<div class="row"><button class="btn gold">${ic('check', 18, 2.4)}${t('save')}</button><button type="button" class="btn danger" data-act="reset">${ic('retry', 17)}${t('resetDemo')}</button></div></form></section>`;
};
const auditRow = a => `<div class="logi">${tile('list', 'gray', 19)}<div style="flex:1;min-width:0"><b>${esc(a.userId ? uName(a.userId) : t('customer'))}</b> · ${t(a.action)}<div class="muted">${esc(a.detail)}</div></div><span class="muted">${fmt(a.at)}</span></div>`;
A.audit = () => `<section class="card">${db.audit.slice(0, 150).map(auditRow).join('') || emptyBox()}</section>`;
