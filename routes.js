'use strict';
Object.assign(I18N, {
route: ['လမ်းကြောင်း', 'Route'], routes: ['နိုင်ငံလမ်းကြောင်းများ', 'Country Routes'], byRoute: ['လမ်းကြောင်းအလိုက်', 'By Route'], factor: ['ဈေးမြှောက်ကိန်း', 'Price factor'], factorNote: ['ဈေးမြှောက်ကိန်းကို တစ် KG ဈေးနဲ့ မြှောက်ပါတယ်။ Toggle ပိတ်ရင် Customer Form မှာ မပေါ်တော့ပါ။', 'The factor multiplies the rate per KG. Turning a route off hides it from the customer form.'],
cn_mm: ['မြန်မာ', 'Myanmar'], cn_th: ['ထိုင်း', 'Thailand'], cn_jp: ['ဂျပန်', 'Japan'], routesTitle: ['နိုင်ငံတကာ လမ်းကြောင်းများ', 'International Routes'], routesLead: ['မြန်မာ၊ ထိုင်းနဲ့ ဂျပန်ကြား နှစ်ဖက်စလုံး ပို့ဆောင်ပေးပါတယ်။', 'We ship both ways between Myanmar, Thailand and Japan.'], chooseRoute: ['ဒီလမ်းကြောင်းနဲ့ ပို့မည်', 'Ship on this route'],
policy: ['မူဝါဒ', 'Policy'], policyTitle: ['ဝန်ဆောင်မှု မူဝါဒ', 'Service Policy'], policyLead: ['ကုန်မပို့ခင် အောက်ပါအချက်များကို ဖတ်ရှုပေးပါ။', 'Please read these terms before sending your cargo.'], a_policy: ['Policy ပြင်ရန်', 'Edit Policy'], policyHelp: ['လက်ရှိရွေးထားတဲ့ ဘာသာစကားအတွက် ပြင်ပါတယ်။ တစ်ကြောင်းကို တစ်ချက်အဖြစ် ပြပါမယ်။', 'Edits apply to the selected language. Each line appears as one point.']
});
const COUNTRY_CODE = { mm: 'MM', th: 'TH', jp: 'JP' };
const routeOf = id => ROUTES.find(r => r.id === id) || ROUTES[0];
const routeText = id => { const r = routeOf(id); return r.from === 'mm' && r.to === 'mm' ? t('cn_mm') : t('cn_' + r.from) + ' → ' + t('cn_' + r.to); };
const activeRoutes = () => ROUTES.filter(r => db.settings.routes[r.id].active);
const isIntl = p => { const r = routeOf(p.route); return r.from !== r.to; };
const intlChip = p => isIntl(p) ? `<span class="chip teal">${ic('plane', 13, 2.2)}${routeText(p.route)}</span>` : '';
const routeBar = p => isIntl(p) ? `<div class="routebar">${intlChip(p)}</div>` : '';
function routeSelect(val, counter) {
  const u = me(), c = counter && u ? (db.branches.find(b => b.id === curBranch()) || {}).country || 'mm' : '';
  const list = activeRoutes().filter(r => !c || r.from === c);
  const v = val || (list[0] || {}).id;
  return select('route', 'route', list.map(r => [r.id, routeText(r.id)]), v, 'data-change="routeForm"');
}
function applyRoute(f) {
  if (!f || !f.elements.route) return;
  const r = routeOf(f.elements.route.value), el = f.elements;
  const fill = (s, c) => { if (s) s.innerHTML = options(branchOpts(c), ''); };
  if (f.dataset.form === 'pickup') fill(el.originId, r.from);
  if (f.dataset.form !== 'price') fill(el.destId, r.to);
  const radios = $$('input[name=method]', f); radios.forEach(i => { i.disabled = !r.methods.includes(i.value); });
  const cur = radios.find(i => i.checked);
  if (!cur || cur.disabled) { const n = radios.find(i => !i.disabled); if (n) n.checked = true; }
}
Chg.routeForm = el => applyRoute(el.form);
const _newParcel = Act.newParcel;
Act.newParcel = () => { _newParcel(); applyRoute($('#modal form')); };
Act.pickRoute = d => { const f = $('[data-form=pickup]'); if (!f) return; f.dataset.step = 1; f.elements.route.value = d.id; applyRoute(f); window.scrollTo({ top: 0 }); const i = $('#f-sender'); if (i) i.focus({ preventScroll: true }); };
function routesSection() {
  const intl = activeRoutes().filter(r => r.from !== r.to);
  if (!intl.length) return '';
  return `<section class="sec tight"><div class="wrap"><div class="sechead rv"><h2>${t('routesTitle')}</h2><p>${t('routesLead')}</p></div><div class="routes">${intl.map((r, n) => `<button type="button" class="rcard rv" style="transition-delay:${n * .08}s" data-act="pickRoute" data-id="${r.id}"><div class="rline"><span class="cc">${COUNTRY_CODE[r.from]}</span><span class="path"><svg class="ln" viewBox="0 0 100 30" preserveAspectRatio="none" fill="none" aria-hidden="true"><path class="dash" d="M2 15H98" stroke="var(--field)" stroke-width="2"/></svg><span class="pl" style="animation-delay:${n * .5}s">${ic('plane', 24, 1.8)}</span></span><span class="cc to">${COUNTRY_CODE[r.to]}</span></div><div><h3 class="h2">${t('cn_' + r.from)} → ${t('cn_' + r.to)}</h3><div class="row" style="margin-top:6px">${r.methods.map(m => `<span class="chip">${ic(METHOD_IC[m], 13, 2.3)}${t('m_' + m)}</span>`).join('')}</div></div><span style="font-weight:700;color:var(--link);display:inline-flex;gap:6px;align-items:center">${t('chooseRoute')}${ic('arrow', 16, 2.3)}</span></button>`).join('')}</div></div></section>`;
}

/* ---------- policy ---------- */
const POLICY = [
  { id: 'terms', icon: 'shield', tone: 'gold', title: ['ဝန်ဆောင်မှုစည်းကမ်း', 'Service Terms'], body: ['Pickup တောင်းဆိုသူသည် ပေးထားသော အချက်အလက်များ မှန်ကန်ကြောင်း တာဝန်ယူရပါမည်။\nကုမ္ပဏီက ကုန်ပစ္စည်းကို လိုအပ်ပါက စစ်ဆေးနိုင်ပါသည်။\nစည်းကမ်းနှင့် မကိုက်ညီသော ကုန်ပစ္စည်းကို လက်မခံဘဲ ငြင်းပယ်နိုင်ပါသည်။', 'The person requesting pickup is responsible for providing correct information.\nThe company may inspect goods when required.\nGoods that do not meet these terms may be refused.'] },
  { id: 'banned', icon: 'alert', tone: 'red', title: ['ပို့ခွင့်မပြုသော ပစ္စည်းများ', 'Prohibited Items'], body: ['မူးယစ်ဆေးဝါး၊ လက်နက်နှင့် ပေါက်ကွဲစေတတ်သော ပစ္စည်းများ။\nမီးလောင်လွယ်သော အရည်နှင့် ဓာတုပစ္စည်းအန္တရာယ်ရှိသော ပစ္စည်းများ။\nတရားမဝင် ကုန်ပစ္စည်းနှင့် ပို့ကုန်/သွင်းကုန် ကန့်သတ်ထားသော ပစ္စည်းများ။', 'Narcotics, weapons and explosives.\nFlammable liquids and hazardous chemicals.\nIllegal goods and items restricted for import or export.'] },
  { id: 'pack', icon: 'box', tone: '', title: ['ထုပ်ပိုးခြင်း', 'Packaging'], body: ['ပို့သူသည် ကုန်ပစ္စည်းကို ခိုင်ခံ့စွာ ထုပ်ပိုးပေးရပါမည်။\nကွဲလွယ်သော ပစ္စည်းကို Pickup တောင်းဆိုချိန်တွင် ကြိုတင်ပြောကြားပေးပါ။', 'The sender must pack goods securely.\nPlease tell us about fragile items when requesting pickup.'] },
  { id: 'price', icon: 'calc', tone: 'gold', title: ['ဈေးနှုန်းတွက်ချက်ခြင်း', 'Pricing'], body: ['ကုန်ချိန်ပြီးနောက် Staff က ဈေးတွက်၍ Customer ကို ဖုန်းဖြင့် အကြောင်းကြားပါမည်။\nကုန်ပွကို အလေးချိန်အစစ်နှင့် ထုထည်အလေးချိန်တို့အနက် များသည်ကို ယူတွက်ပါသည်။\nကုန်ကျစ်ကို အလေးချိန်အစစ်ဖြင့် တွက်ပါသည်။\nလမ်းကြောင်းနှင့် ပို့ဆောင်နည်းအလိုက် ဈေးနှုန်းကွာခြားပါသည်။', 'After weighing, staff calculate the price and inform the customer by phone.\nBulky cargo is charged by the greater of actual and volume weight.\nDense cargo is charged by actual weight.\nPrices vary by route and shipping method.'] },
  { id: 'return', icon: 'retry', tone: 'red', title: ['ပို့မရခြင်းနှင့် Return', 'Failed Delivery and Return'], body: ['လက်ခံသူကို ဖုန်းဖြင့်ဆက်သွယ်၍ မရပါက ဖုန်းခေါ်ဆိုမှုကို မှတ်တမ်းတင်ပါမည်။\nပို့ဆောင်မှု {maxFail} ကြိမ် မအောင်မြင်ပါက ကုန်ပစ္စည်းကို ပို့သူရုံးသို့ ပြန်ပို့ပါမည်။\nReturn ပြန်ပို့ခနှင့် သိုလှောင်ခဆိုင်ရာ အသေးစိတ်: ရုံးသို့ မေးမြန်းပါ', 'Calls to a receiver who cannot be reached are recorded.\nAfter {maxFail} failed delivery attempts, goods are returned to the origin branch.\nReturn and storage fee details: please ask our office'] },
  { id: 'intl', icon: 'plane', tone: 'teal', title: ['နိုင်ငံတကာ ပို့ဆောင်ခြင်း', 'International Shipping'], body: ['မြန်မာ၊ ထိုင်း၊ ဂျပန် လမ်းကြောင်းများအတွက် အကောက်ခွန်နှင့် တရားဝင်စာရွက်စာတမ်း လိုအပ်နိုင်ပါသည်။\nအကောက်ခွန်ကြောင့် ကြန့်ကြာမှုများ ဖြစ်ပေါ်နိုင်ပါသည်။\nအကောက်ခွန်နှင့် အခွန်ကုန်ကျစရိတ် တာဝန်ယူမှု: ရုံးသို့ မေးမြန်းပါ', 'Routes between Myanmar, Thailand and Japan may require customs clearance and documents.\nCustoms processing can cause delays.\nResponsibility for customs duties and taxes: please ask our office'] },
  { id: 'claims', icon: 'note', tone: '', title: ['ပျက်စီး၊ ပျောက်ဆုံးမှု တောင်းဆိုခြင်း', 'Damage and Loss Claims'], body: ['Tracking Number နှင့်အတူ အနီးဆုံးရုံးကို ဆက်သွယ်ပေးပါ။\nတောင်းဆိုနိုင်သည့် ကာလ: ရုံးသို့ မေးမြန်းပါ\nလျော်ကြေးပမာဏ သတ်မှတ်ချက်: ရုံးသို့ မေးမြန်းပါ', 'Contact your nearest branch with the tracking number.\nClaim period: please ask our office\nCompensation limit: please ask our office'] },
  { id: 'privacy', icon: 'user', tone: 'teal', title: ['ကိုယ်ရေးအချက်အလက်', 'Privacy'], body: ['အမည်၊ ဖုန်းနှင့် လိပ်စာကို ပို့ဆောင်မှုအတွက်သာ အသုံးပြုပါသည်။\nTracking စာမျက်နှာတွင် ဖုန်းနံပါတ်နှင့် လိပ်စာကို မပြပါ။\nလိုအပ်သည့် ဝန်ထမ်းများသာ အချက်အလက်ကို ကြည့်ရှုနိုင်ပါသည်။', 'Names, phone numbers and addresses are used only for delivery.\nThe tracking page does not show phone numbers or addresses.\nOnly the staff who need this information can view it.'] }
];
const policyBody = s => { const o = db.settings.policy[s.id]; return ((o && o[lang]) || s.body[LANGS.indexOf(lang)]).replace(/\{maxFail\}/g, lang === 'my' ? mmNum(db.settings.maxFail) : db.settings.maxFail); };
P.policy = () => `<section class="polhero"><div class="wrap"><h1>${t('policyTitle')}</h1><p>${t('policyLead')}</p></div></section><div class="wrap" style="padding-bottom:50px"><div class="pols stagger">${POLICY.map(s => `<article class="card pol">${tile(s.icon, s.tone)}<h2 class="h2">${esc(s.title[LANGS.indexOf(lang)])}</h2><ul>${policyBody(s).split('\n').filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')}</ul></article>`).join('')}</div></div>`;
A.policy = () => `<section class="card pad"><form data-form="policy" class="stack"><p class="note">${t('policyHelp')}</p>${POLICY.map(s => `<div class="field"><label for="p-${s.id}">${esc(s.title[LANGS.indexOf(lang)])}</label><textarea id="p-${s.id}" name="${s.id}" rows="4">${esc(((db.settings.policy[s.id] || {})[lang]) || s.body[LANGS.indexOf(lang)])}</textarea></div>`).join('')}<div><button class="btn gold">${ic('check', 18, 2.4)}${t('save')}</button></div></form></section>`;
F.policy = d => { POLICY.forEach(s => { db.settings.policy[s.id] = db.settings.policy[s.id] || {}; db.settings.policy[s.id][lang] = d[s.id]; }); logIt('l_settings', 'policy'); done(); };
