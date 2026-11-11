'use strict';
const money = n => Math.round(n || 0).toLocaleString('en-US') + ' Ks';
const METHOD_IC = { road: 'truck', air: 'plane', sea: 'ship' };
const canPrice = () => { const u = me(); return u && u.role !== 'delivery'; };
const methodCards = v => `<fieldset style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:600;padding:0 0 6px">${t('method')}</legend><div class="modes-s">${METHODS.map(m => `<label class="mopt"><input type="radio" name="method" value="${m}" ${v === m ? 'checked' : ''}><span>${ic(METHOD_IC[m], 24)}${t('m_' + m)}</span></label>`).join('')}</div></fieldset>`;
const returnChip = p => p.returning && p.status !== 'returned' ? `<span class="chip red">${ic('retry', 13, 2.3)}${t('returnChip')}</span>` : '';
const priceChip = p => {
  if (!canPrice() || ['requested', 'cancelled'].includes(p.status)) return '';
  if (!p.price) return `<span class="chip gold">${ic('calc', 13, 2.3)}${t('noPrice')}</span>`;
  return `<span class="chip ${p.paid ? 'green' : 'gold'}">${money(p.price.total)} · ${t(p.paid ? 'paid' : 'unpaid')}</span>`;
};
const priceBtn = p => canPrice() && !['requested', 'cancelled', 'returned'].includes(p.status) ? `<button class="btn sm line" data-act="priceForm" data-no="${esc(p.no)}">${ic('calc', 16)}${t('calcBtn')}</button>` : '';

/* ---------- calls ---------- */
const noAnsCount = p => (p.calls || []).filter(c => c.r === 'no_answer').length;
function addCall(p, r) { const u = me(); (p.calls = p.calls || []).push({ r, at: Date.now(), userId: u ? u.id : null }); logIt('l_call', p.no + ' · ' + r); }
const callTimes = p => (p.calls || []).length ? `<ol class="muted" style="margin:6px 0 0;padding-left:20px">${p.calls.map(c => `<li>${fmt(c.at)} · ${t('c_' + c.r)} · ${esc(uName(c.userId))}</li>`).join('')}</ol>` : '';
function callBlock(p) {
  return `<section class="stack" style="gap:8px"><div class="row between"><h3 class="h2">${t('callLog')}</h3>${noAnsCount(p) ? `<span class="chip red">${ic('phoneoff', 13, 2.3)}${t('c_no_answer')} ${noAnsCount(p)} ${t('times')}</span>` : ''}</div><div class="row"><a class="btn sm line" href="tel:${esc(p.assignedTo ? p.receiverPhone : p.senderPhone)}">${ic('phone', 16)}${t('call')}</a>${['no_answer', 'answered', 'off'].map(r => `<button class="btn sm line" data-act="logCall" data-r="${r}" data-no="${esc(p.no)}">${t('c_' + r)}</button>`).join('')}</div>${callTimes(p)}</section>`;
}
Act.logCall = d => {
  const p = parcel(d.no); if (!guard(p)) return;
  addCall(p, d.r);
  if (d.r === 'no_answer' && noAnsCount(p) === 3) notify('b:' + (p.branchId || p.originId), 'n_noanswer', p.no);
  save(); toast(t('callLogged') + (d.r === 'no_answer' ? ' · ' + noAnsCount(p) + ' ' + t('times') : ''));
  if ($('#modal').open) Act.detail({ no: p.no }); else render();
};

/* ---------- return ---------- */
function startReturn(p) { p.returning = true; p.origDest = p.destId; p.destId = p.originId; p.assignedTo = ''; p.nextTry = ''; move(p, 'returning', { branchId: p.branchId }); p.status = 'at_branch'; }
Act.returned = d => { const p = parcel(d.no); if (!guard(p)) return; move(p, 'returned', { branchId: p.branchId }); done(t('updated')); };

/* ---------- pricing ---------- */
let pfDirty = false;
Act.priceForm = d => {
  const p = parcel(d.no), v = p.price || { method: p.method || 'road', type: 'bulky', kg: p.estKg || '', l: '', w: '', h: '', extra: 0, discount: 0, total: '', note: '', told: false };
  pfDirty = !!p.price;
  openModal(`<form data-form="price" id="pf" class="stack"><div class="row between"><h2 class="h2">${t('priceTitle')} · ${esc(p.no)}</h2><button type="button" class="btn sm line icon" aria-label="${t('cancel')}" data-act="closeModal">${ic('x', 18)}</button></div><input type="hidden" name="no" value="${esc(p.no)}"><input type="hidden" name="qty" value="${esc(p.qty)}">
  <div class="muted">${esc(p.sender)} · ${esc(p.goods || '-')} · ${t('qty')} ${esc(p.qty)}${p.estKg ? ' · ' + t('estKg') + ' ' + esc(p.estKg) : ''}</div>
  ${routeSelect(p.route || 'mm-th')}${methodCards(v.method)}
  <fieldset style="border:0;padding:0;margin:0"><legend style="font-size:14px;font-weight:600;padding:0 0 6px">${t('cargoType')}</legend><div class="modes-s tchoice">${['bulky', 'dense'].map(k => `<label class="mopt"><input type="radio" name="type" value="${k}" ${v.type === k ? 'checked' : ''}><span>${ic(k === 'bulky' ? 'box' : 'boxcheck', 22)}${t('c_' + k)}<small>${t('c_' + k + 'T')}</small></span></label>`).join('')}</div></fieldset>
  ${field('actualKg', 'kg', v.kg, { req: true, type: 'number', attrs: 'min="0.1" step="0.1"' })}
  <div class="g2">${['l', 'w', 'h'].map(k => field('dim' + k.toUpperCase(), k, v[k], { type: 'number', attrs: 'min="0" step="1"' })).join('')}</div>
  <div class="calcbox"><div><small>${t('volKg')}</small><b id="c-vol">0</b></div><div><small>${t('chargeable')}</small><b id="c-ch">0</b></div><div><small>${t('rate')}</small><b id="c-rate">0</b></div><div class="big"><small>${t('suggest')}</small><b id="c-sug">0</b></div></div>
  <div class="g2">${field('extra', 'extra', v.extra, { type: 'number', attrs: 'min="0" step="100"' })}${field('discount', 'discount', v.discount, { type: 'number', attrs: 'min="0" step="100"' })}</div>
  ${field('finalPrice', 'total', v.total, { req: true, type: 'number', attrs: 'min="0" step="50"' })}
  <label class="sw"><input type="checkbox" name="told" ${v.told ? 'checked' : ''}><span class="track"><span class="thumb"></span></span><span>${t('custTold')}</span></label>
  <div class="row"><a class="btn sm line" href="tel:${esc(p.senderPhone)}">${ic('phone', 16)}${t('call')}</a><button type="button" class="btn sm line" data-act="copyQuote" data-no="${esc(p.no)}">${ic('copy', 16)}${t('copyQuote')}</button></div>${modalBtns()}</form>`);
  applyRoute($('#pf')); recalc();
};
function pfValues() { return Object.fromEntries(new FormData($('#pf'))); }
function recalc() {
  const f = $('#pf'); if (!f) return;
  const d = pfValues(), c = calcPrice(d, db.settings);
  $('#c-vol').textContent = c.vol + ' kg'; $('#c-ch').textContent = c.chargeable + ' kg'; $('#c-rate').textContent = money(c.rate); $('#c-sug').textContent = money(c.suggest);
  if (!pfDirty) f.elements.total.value = Math.max(0, c.suggest + (+d.extra || 0) - (+d.discount || 0)) || '';
}
document.addEventListener('input', e => { if (!e.target.closest('#pf')) return; if (e.target.name === 'total') pfDirty = true; recalc(); });
document.addEventListener('change', e => { if (e.target.closest('#pf') && (e.target.type === 'radio' || e.target.name === 'route')) recalc(); });
Act.copyQuote = d => { const p = parcel(d.no), v = pfValues(), c = calcPrice(v, db.settings); copyText(`${coName()}\n${p.no}\n${t('m_' + v.method)} · ${t('c_' + v.type)} · ${c.chargeable} kg\n${t('quoteText')}: ${money(v.total)}`); };
F.price = d => {
  const p = parcel(d.no); if (!inScope(p)) return toast(t('wrongBranch'), true);
  const c = calcPrice(d, db.settings), u = me();
  p.method = d.method; p.route = d.route;
  p.price = { route: d.route, method: d.method, type: d.type, kg: +d.kg, l: +d.l || 0, w: +d.w || 0, h: +d.h || 0, ...c, extra: +d.extra || 0, discount: +d.discount || 0, total: +d.total, told: !!d.told, by: u.id, at: Date.now() };
  logIt('l_price', p.no + ' · ' + money(p.price.total)); done(t('priceSaved'));
};
Act.payForm = d => { const p = parcel(d.no); if (!p.price) return toast(t('needPrice'), true); openModal(`<form data-form="pay" class="stack"><h2 class="h2">${t('payTitle')} · ${esc(p.no)}</h2><input type="hidden" name="no" value="${esc(p.no)}"><p style="font-size:26px;font-weight:700">${money(p.price.total)}</p>${select('payMethod', 'payMethod', PAY.map(x => [x, x]), p.payMethod || 'Cash')}<div class="row"><button class="btn gold">${ic('money', 18)}${t('recordPay')}</button><button type="button" class="btn line" data-act="closeModal">${t('cancel')}</button></div></form>`); };
F.pay = d => { const p = parcel(d.no); p.paid = true; p.payMethod = d.payMethod; p.paidAt = Date.now(); logIt('l_pay', p.no + ' · ' + d.payMethod); done(t('saved')); };
Act.unpay = d => { const p = parcel(d.no); p.paid = false; p.paidAt = 0; logIt('l_pay', p.no + ' · unpaid'); save(); Act.detail(d); render(); };
function pricingBlock(p) {
  if (!canPrice() || ['requested', 'cancelled'].includes(p.status)) return '';
  const v = p.price, u = me();
  return `<section class="stack" style="gap:8px"><div class="row between"><h3 class="h2">${t('pricingInfo')}</h3>${priceChip(p)}</div>${v ? `<div class="kv"><div><small>${t('method')}</small><b>${t('m_' + v.method)}</b></div><div><small>${t('cargoType')}</small><b>${t('c_' + v.type)}</b></div><div><small>${t('actualKg')}</small><b>${v.kg}</b></div><div><small>${t('chargeable')}</small><b>${v.chargeable}</b></div><div><small>${t('finalPrice')}</small><b>${money(v.total)}</b></div><div><small>${t('custTold')}</small><b>${v.told ? '✓' : '-'}</b></div></div>` : ''}<div class="row">${p.status !== 'returned' ? `<button class="btn sm gold" data-act="priceForm" data-no="${esc(p.no)}">${ic('calc', 16)}${t('calcBtn')}</button>` : ''}${v && !p.paid ? `<button class="btn sm" data-act="payForm" data-no="${esc(p.no)}">${ic('money', 16)}${t('recordPay')}</button>` : ''}${v ? `<a class="btn sm line" href="#/invoice/${encodeURIComponent(p.no)}">${ic('print', 16)}${t('invoice')}</a>` : ''}${p.paid && u.role === 'admin' ? `<button class="btn sm line" data-act="unpay" data-no="${esc(p.no)}">${t('unpay')}</button>` : ''}</div></section>`;
}
const nextHint = p => { const k = p.returning && p.status !== 'returned' ? 'return' : p.status; return I18N['hint_' + k] ? `<div class="hint">${ic('arrow', 17, 2.3)}<span>${t('nextStep')}: ${t('hint_' + k)}</span></div>` : ''; };
P.invoice = no => {
  const p = parcel(decodeURIComponent(no || '')); if (!p || !p.price) return `<p class="note">${t('notFound')}</p>`;
  const v = p.price;
  return `<div class="stack"><div class="row noprint" style="justify-content:center"><button class="btn gold" data-act="print">${ic('print', 18)}${t('printInvoice')}</button><button class="btn line" data-act="back">${t('back')}</button></div><div class="invoice"><div class="row" style="flex-wrap:nowrap"><img src="logo.png" alt="" width="62" height="62"><div><h2>${esc(coName())}</h2><div style="font-size:13px">${esc(db.settings.phone)} · ${esc(bName(p.originId))}</div></div></div><p style="margin-top:12px"><b>${esc(p.no)}</b> · ${fmt(v.at)}</p><p>${t('from')}: ${esc(p.sender)} · ${t('to')}: ${esc(p.receiver)}, ${esc(bName(p.destId))}</p><table><tr><td>${t('method')}</td><td>${t('m_' + v.method)}</td></tr><tr><td>${t('cargoType')}</td><td>${t('c_' + v.type)}</td></tr><tr><td>${t('chargeable')}</td><td>${v.chargeable} kg</td></tr><tr><td>${t('rate')}</td><td>${money(v.rate)}</td></tr>${v.extra ? `<tr><td>${t('extra')}</td><td>${money(v.extra)}</td></tr>` : ''}${v.discount ? `<tr><td>${t('discount')}</td><td>-${money(v.discount)}</td></tr>` : ''}<tr class="tot"><td>${t('finalPrice')}</td><td>${money(v.total)}</td></tr><tr><td>${t('paidState')}</td><td>${p.paid ? esc(p.payMethod) + ' · ' + t('paid') : t('unpaid')}</td></tr></table></div></div>`;
};

/* ---------- admin: revenue and rates ---------- */
const inMonth = (at, m) => new Date(at).toISOString().slice(0, 7) === m;
const monthBilled = m => db.parcels.filter(p => p.price && inMonth(p.createdAt, m)).reduce((a, p) => a + p.price.total, 0);
state.rMonth = new Date().toISOString().slice(0, 7); state.revBranch = '';
function monthList() { const b = state.revBranch; return db.parcels.filter(p => inMonth(p.createdAt, state.rMonth) && (!b || p.originId === b)); }
A.revenue = () => {
  const l = monthList(), priced = l.filter(p => p.price), billed = priced.reduce((a, p) => a + p.price.total, 0), got = priced.filter(p => p.paid).reduce((a, p) => a + p.price.total, 0), c = s => l.filter(p => p.status === s).length;
  const closed = c('delivered') + c('returned') + c('failed'), rate = closed ? Math.round(c('delivered') / closed * 100) : 0;
  const [Y, M] = state.rMonth.split('-').map(Number), months = [...Array(6)].map((_, i) => { const d = new Date(Date.UTC(Y, M - 6 + i, 1)), k = d.toISOString().slice(0, 7), n = db.parcels.filter(p => p.price && inMonth(p.createdAt, k) && (!state.revBranch || p.originId === state.revBranch)).reduce((a, p) => a + p.price.total, 0); return { k, n, lab: new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d) }; });
  const max = Math.max(1, ...months.map(x => x.n));
  const group = (keyFn, list) => { const m = {}; list.forEach(p => { const k = keyFn(p); m[k] = m[k] || { n: 0, sum: 0 }; m[k].n++; m[k].sum += p.price.total; }); return Object.entries(m).sort((a, b) => b[1].sum - a[1].sum); };
  const table = (head, rows) => `<div class="scrollx"><table class="rtable"><thead><tr><th>${head}</th><th>${t('orders')}</th><th>${t('billed')}</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.n}</td><td>${money(v.sum)}</td></tr>`).join('') || `<tr><td colspan="3" class="muted">${t('noData')}</td></tr>`}</tbody></table></div>`;
  return `<section class="card pad noprint"><form data-form="rev" class="g2">${field('month', 'rMonth', state.rMonth, { type: 'month', attrs: 'data-auto' })}${select('branch', 'revBranch', [['', t('all')], ...branchOpts()], state.revBranch, 'data-auto')}<div class="row" style="align-self:end"><button type="button" class="btn sm gold" data-act="excelMonth">${ic('download', 17)}${t('exportMonth')}</button><button type="button" class="btn sm line" data-act="print">${ic('print', 17)}${t('print')}</button></div></form></section>
  <div class="stats">${stat('box', '', 'orders', l.length)}${stat('boxcheck', 'green', 's_delivered', c('delivered'))}${stat('retry', 'red', 's_month_returned', c('returned'))}</div>
  <div class="stats"><div class="card stat">${tile('money', 'green')}<div><b style="font-size:22px">${money(billed)}</b><span>${t('billed')}</span></div></div><div class="card stat">${tile('check', 'teal')}<div><b style="font-size:22px">${money(got)}</b><span>${t('collected2')}</span></div></div><div class="card stat">${tile('clock', 'gold')}<div><b style="font-size:22px">${money(billed - got)}</b><span>${t('outstanding')}</span></div></div><div class="card stat">${tile('chart', '')}<div><b style="font-size:22px">${money(priced.length ? billed / priced.length : 0)}</b><span>${t('avgOrder')}</span></div></div><div class="card stat">${tile('shield', 'teal')}<div><b style="font-size:22px">${rate}%</b><span>${t('successRate')}</span></div></div></div>
  <section class="card"><div class="head"><h2 class="h2">${t('sixMonth')}</h2></div><div class="bars">${months.map((x, i) => `<div><b>${Math.round(x.n / 1000)}k</b><u style="--h:${x.n / max * 100}%;animation-delay:${i * .07}s"></u>${x.lab}</div>`).join('')}</div></section>
  <div class="charts"><section class="card"><div class="head"><h2 class="h2">${t('byMethod')}</h2></div>${table(t('method'), group(p => t('m_' + p.price.method), priced))}</section><section class="card"><div class="head"><h2 class="h2">${t('byBranch')}</h2></div>${table(t('branch'), group(p => bName(p.originId), priced))}</section><section class="card"><div class="head"><h2 class="h2">${t('byRoute')}</h2></div>${table(t('route'), group(p => routeText(p.route), priced))}</section></div>
  <section class="card"><div class="head"><h2 class="h2">${t('topCustomers')}</h2></div>${table(t('sender'), group(p => p.sender + ' · ' + p.senderPhone, priced).slice(0, 5))}</section>`;
};
F.rev = d => { state.rMonth = d.rMonth || state.rMonth; state.revBranch = d.revBranch; render(); };
Act.excelMonth = () => xlsx(excelRows(monthList()), 'month-' + state.rMonth);
A.rates = () => {
  const s = db.settings;
  return `<section class="card"><form data-form="rates"><div class="head"><h2 class="h2">${t('a_rates')}</h2><button class="btn sm gold">${ic('check', 17, 2.4)}${t('save')}</button></div><div class="scrollx"><table class="rtable"><thead><tr><th>${t('method')}</th><th>${t('c_bulky')} (Ks/KG)</th><th>${t('c_dense')} (Ks/KG)</th><th>${t('divisor')}</th></tr></thead><tbody>${METHODS.map(m => `<tr><td>${ic(METHOD_IC[m], 18)} ${t('m_' + m)}</td>${['bulky', 'dense', 'div'].map(k => `<td><input class="inp" type="number" min="1" required name="${m}_${k}" value="${s.rates[m][k]}" aria-label="${t('m_' + m)} ${k}"></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="pad g2">${field('minCharge', 'minCharge', s.minCharge, { req: true, type: 'number', attrs: 'min="0"' })}</div></form><p class="muted" style="padding:0 22px 20px">${t('ratesNote')}</p></section>
  <section class="card"><form data-form="routes"><div class="head"><h2 class="h2">${t('routes')}</h2><button class="btn sm gold">${ic('check', 17, 2.4)}${t('save')}</button></div>${ROUTES.map(r => `<div class="perm"><div>${tile(r.to === 'mm' && r.from === 'mm' ? 'truck' : 'plane', 'gold', 20)}<span>${routeText(r.id)}</span></div><div>${`<input class="inp small" style="width:96px" type="number" min="0.1" step="0.1" required name="f_${r.id}" value="${s.routes[r.id].factor}" aria-label="${t('factor')} ${routeText(r.id)}">`}${sw('route', r.id, s.routes[r.id].active)}</div></div>`).join('')}<p class="muted" style="padding:10px 22px 18px">${t('factorNote')}</p></form></section>`;
};
F.routes = d => { ROUTES.forEach(r => db.settings.routes[r.id].factor = +d['f_' + r.id]); logIt('l_settings', 'routes'); done(); };
Sw.route = (id, on) => { db.settings.routes[id].active = on; logIt('l_settings', id); };
F.rates = d => { METHODS.forEach(m => ['bulky', 'dense', 'div'].forEach(k => db.settings.rates[m][k] = +d[m + '_' + k])); db.settings.minCharge = +d.minCharge; logIt('l_settings', 'rates'); done(); };

/* ---------- flow helpers ---------- */
F.gsearch = d => { const q = d.q.trim().toUpperCase(), p = db.parcels.find(x => x.no === q && inScope(x)) || db.parcels.find(x => inScope(x) && (x.senderPhone === d.q.trim() || x.receiverPhone === d.q.trim())); if (p) Act.detail({ no: p.no }); else toast(t('notFound'), true); };
['accept', 'collect', 'receive', 'retry'].forEach(k => { const f = Act[k]; Act[k] = (d, el, e) => { const snap = JSON.stringify(db); f(d, el, e); const box = $('#toast'), n = document.createElement('div'); n.className = 't'; n.innerHTML = `${ic('check', 18, 2.4)}<span style="flex:1">${esc(t('updated'))}</span><button type="button" class="tbtn">${t('undo')}</button>`; $('button', n).onclick = () => { db = JSON.parse(snap); save(); n.remove(); toast(t('undone')); render(); }; box.append(n); setTimeout(() => n.remove(), 6000); }; });
