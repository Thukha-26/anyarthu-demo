'use strict';
const LANGS = ['my', 'en'], KEY = 'anyarthu-db-v11', DEMO_PW = 'anyarthu2026', H = 36e5;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const uid = () => Math.random().toString(36).slice(2, 9);
const ALL_STATUS = ['requested', 'accepted', 'collected', 'at_branch', 'departed', 'out_for_delivery', 'delivered', 'failed', 'cancelled', 'returned'];
const TERMINAL = ['delivered', 'cancelled', 'returned'];
const ROUTES = [{ id: 'mm-th', from: 'mm', to: 'th', methods: ['road'] }, { id: 'mm-kr', from: 'mm', to: 'kr', methods: ['air'] }, { id: 'th-mm', from: 'th', to: 'mm', methods: ['air'] }, { id: 'mm-jp', from: 'mm', to: 'jp', methods: ['air'] }, { id: 'mm-tw', from: 'mm', to: 'tw', methods: ['air'] }, { id: 'mm-cn', from: 'mm', to: 'cn', methods: ['road', 'air'] }];
const METHODS = ['road', 'air', 'sea'], PAY = ['Cash', 'KBZPay', 'WavePay', 'AYA Pay', 'Bank'];
function calcPrice(i, s) {
  const r = s.rates[i.method], factor = ((s.routes || {})[i.route] || { factor: 1 }).factor, kg = +i.kg || 0, vol = (+i.l || 0) * (+i.w || 0) * (+i.h || 0) * (+i.qty || 1) / r.div;
  const tiers = (((s.routes || {})[i.route] || {}).tiers || []).slice().sort((a, b) => a[0] - b[0]);
  let chargeable = Math.ceil((i.type === 'bulky' ? Math.max(kg, vol) : kg) * 2) / 2;
  if (tiers.length && chargeable) chargeable = Math.max(chargeable, tiers[0][0]);
  const tier = tiers.filter(x => chargeable >= x[0]).pop(), rate = tier ? tier[1] : r[i.type] * factor;
  const sub = Math.max(chargeable * rate, chargeable ? s.minCharge : 0);
  return { vol: Math.round(vol * 100) / 100, chargeable, rate, tier: !!tier, suggest: Math.round(sub) };
}
const yymm = () => { const d = new Date(); return String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0'); };

/* two delivery riders per branch */
const RIDERS = [
  { id: 'u5', username: 'naing', name: 'ကိုနိုင်', phone: '09 555 555 555', branchId: 'b1' },
  { id: 'u9', username: 'minhtet', name: 'ကိုမင်းထက်', phone: '09 555 000 009', branchId: 'b1' },
  { id: 'u10', username: 'winnaing', name: 'ကိုဝင်းနိုင်', phone: '09 555 000 010', branchId: 'b2' },
  { id: 'u11', username: 'thantzin', name: 'ကိုသန့်ဇင်', phone: '09 555 000 011', branchId: 'b2' },
  { id: 'u13', username: 'saihtun', name: 'ကိုစိုင်းထွန်း', phone: '09 555 000 013', branchId: 'b3' },
  { id: 'u14', username: 'aungmyo', name: 'ကိုအောင်မျိုး', phone: '09 555 000 014', branchId: 'b3' },
  { id: 'u4', username: 'htet', name: 'ကိုထက် (ထိုင်းဘက်)', phone: '+66 00 000 0004', branchId: 'b4' },
  { id: 'u12', username: 'kyawzaw', name: 'ကိုကျော်ဇော (ထိုင်းဘက်)', phone: '+66 00 000 0012', branchId: 'b4' },
  { id: 'u15', username: 'somchai', name: 'Somchai', phone: '+66 00 000 0015', branchId: 'b4' },
  { id: 'u16', username: 'zawmin', name: 'ကိုဇော်မင်း (ကိုရီးယား)', phone: '+82 00 0000 0016', branchId: 'b5' },
  { id: 'u18', username: 'yehtut', name: 'ကိုရဲထွဋ် (ကိုရီးယား)', phone: '+82 00 0000 0018', branchId: 'b5' }
];

function seed() {
  const n = Date.now();
  const d = {
    seq: 490,
    settings: { name: 'အညာသူ Express Cargo Service', nameEn: 'Anyarthu Express Cargo Service', company: 'Aung Shining Star Co., Ltd', phone: '09 780 955 565', phone2: '09 782 478 466', phoneTh: '+66 063 586 1249', email: 'anyarthuexpresscargo@gmail.com', messenger: 'https://m.me/109122145568758', facebook: 'https://web.facebook.com/profile.php?id=100094118717190', tiktok: 'https://www.tiktok.com/@anyarthu881', address: 'အမှတ် (၇၇)၊ မြေညီထပ်၊ နံ့သာလမ်း၊ ဌာနရပ်ကွက်၊ အလုံမြို့နယ်၊ ရန်ကုန် (ဆင်မင်းဈေးမှတ်တိုင်မှဆင်းပါ)', addressEn: 'No. (77), Ground Floor, Nant Thar Street, Ahlone Township, Yangon', prefix: 'AT', pickupOpen: true, sound: true, sla: 24, requirePrice: true, maxFail: 2, policy: {},
      routes: { 'mm-th': { factor: 1, active: true, tiers: [[1, 7600]] }, 'mm-kr': { factor: 1, active: true, tiers: [[5, 34500], [10, 28000]], days: '5–7' }, 'th-mm': { factor: 1, active: true, thb: 300, days: '7' }, 'mm-jp': { factor: 2.5, active: false }, 'mm-tw': { factor: 2.5, active: false }, 'mm-cn': { factor: 2, active: false } },
      minCharge: 3000, rates: { road: { bulky: 7600, dense: 7600, div: 5000 }, air: { bulky: 34500, dense: 34500, div: 6000 }, sea: { bulky: 2500, dense: 1800, div: 4000 } } },
    perms: { staff_counter: true, staff_cancel: true, staff_export: true, staff_transfer: false, delivery_self: true, delivery_proof: true, delivery_fail: true },
    branches: [
      { id: 'b1', country: 'mm', my: 'ရန်ကုန် (ရုံးချုပ်)', en: 'Yangon (Head Office)', phone: '09 780 955 565', address: 'အမှတ် (၇၇)၊ မြေညီထပ်၊ နံ့သာလမ်း၊ ဌာနရပ်ကွက်၊ အလုံမြို့နယ်၊ ရန်ကုန် (ဆင်မင်းဈေးမှတ်တိုင်မှဆင်းပါ)', addressEn: 'No. (77), Ground Floor, Nant Thar Street, Ahlone Township, Yangon', active: true },
      { id: 'b2', country: 'mm', my: 'စစ်ကိုင်း ရုံးခွဲ', en: 'Sagaing Branch', phone: '09 782 478 466', address: 'နယ်မြေ (၇)၊ အနောက်မိုးဇာလမ်း၊ မိုးဇာရပ်ကွက်၊ စစ်ကိုင်းမြို့၊ စစ်ကိုင်းတိုင်းဒေသကြီး', addressEn: 'Ward (7), West Moe Zar Street, Moe Zar, Sagaing, Sagaing Region', active: true },
      { id: 'b3', country: 'mm', my: 'အောင်လံ ရုံးခွဲ', en: 'Aunglan Branch', phone: '09 782 478 466', address: 'အမှတ် (၄၃၃)/ပြည်လမ်း၊ အေးစေတီ၊ မမှာရုံရှေ့၊ သရက်တောရပ်ကွက်၊ အောင်လံမြို့', addressEn: 'No. (433), Pyay Road, Aye Zedi, Thayet Taw Ward, Aunglan', active: true },
      { id: 'b4', country: 'th', my: 'ထိုင်းဘက် (မဲဆောက်)', en: 'Thailand (Mae Sot)', phone: '+66 063 586 1249', address: 'မဲဆောက် (Mae Sot)၊ ထိုင်းနိုင်ငံ — ထိုင်းတစ်နိုင်ငံလုံး အိမ်အရောက်', addressEn: 'Mae Sot, Thailand — door-to-door anywhere in Thailand', active: true, partner: true },
      { id: 'b5', country: 'kr', my: 'ကိုရီးယားဘက် ပို့ဆောင်ရေး', en: 'Korea Delivery', phone: '—', address: 'South Korea — အိမ်အရောက် (ထပ်ပေးစရာမလို)', addressEn: 'South Korea — home delivery included', active: true, partner: true },
      { id: 'b6', country: 'jp', my: 'ဂျပန်ဘက် ပို့ဆောင်ရေး', en: 'Japan Delivery', phone: '—', address: 'Japan', active: true, partner: true },
      { id: 'b7', country: 'tw', my: 'ထိုင်ဝမ်ဘက် ပို့ဆောင်ရေး', en: 'Taiwan Delivery', phone: '—', address: 'Taiwan', active: true, partner: true },
      { id: 'b8', country: 'cn', my: 'တရုတ်ဘက် ပို့ဆောင်ရေး', en: 'China Delivery', phone: '—', address: 'China', active: true, partner: true }
    ],
    users: [
      { id: 'u1', username: 'admin', seedPw: DEMO_PW, duty: true, name: 'Admin (ရုံးချုပ်)', phone: '09 780 955 565', role: 'admin', branchId: 'b1', active: true },
      { id: 'u2', username: 'zaw', seedPw: DEMO_PW, duty: true, name: 'ကိုဇော် (ရန်ကုန်)', phone: '09 222 222 222', role: 'staff', branchId: 'b1', active: true },
      { id: 'u3', username: 'thida', seedPw: DEMO_PW, duty: true, name: 'မသီတာ (စစ်ကိုင်း)', phone: '09 333 333 333', role: 'staff', branchId: 'b2', active: true },
      { id: 'u6', username: 'khinlay', seedPw: DEMO_PW, duty: true, name: 'မခင်လေး (အောင်လံ)', phone: '09 666 666 666', role: 'staff', branchId: 'b3', active: true },
      { id: 'u7', username: 'maesot', seedPw: DEMO_PW, duty: true, name: 'မဲဆောက် Staff', phone: '+66 063 586 1249', role: 'staff', branchId: 'b4', active: true },
      { id: 'u8', username: 'korea', seedPw: DEMO_PW, duty: true, name: 'Korea Staff', phone: '+82 00 0000 0001', role: 'staff', branchId: 'b5', active: true },
      ...RIDERS.map(r => ({ ...r, seedPw: DEMO_PW, duty: true, role: 'delivery', active: true }))
    ], ridersV: 2,
    parcels: [], events: [], audit: [], msgs: [], notifs: [], manifests: [], mseq: 100
  };
  const mk = (sender, township, qty, receiver, originId, destId, extra, steps) => {
    const no = 'AT-' + yymm() + '-' + String(++d.seq).padStart(5, '0');
    const last = steps[steps.length - 1];
    d.parcels.unshift(Object.assign({ no, sender, senderPhone: '09 000 111 222', pickupAddr: 'အမှတ် ၁၂၊ ဗိုလ်ချုပ်လမ်း', township, qty, receiver, receiverPhone: '09 000 333 444', receiverAddr: 'အမှတ် ၂၀၊ ၇၃ လမ်း', originId, destId, branchId: last[1] || '', nextId: last[4] || '', status: last[0], assignedTo: '', pickupBy: '', source: 'web', method: 'road', route: 'mm-th', goods: 'အဝတ်အထည်၊ အစားအသောက်ခြောက်', createdAt: n - steps[0][2] * H, updatedAt: n - last[2] * H }, extra));
    steps.forEach(([status, branchId, h, userId, nextId, note]) => d.events.unshift({ id: uid(), no, status, branchId: branchId || '', nextId: nextId || '', note: note || '', userId: userId || null, at: n - h * H }));
  };
  mk('ဒေါ်ခင်', 'ဗဟန်း', 1, 'မသန်းသန်း', 'b1', 'b4', { assignedTo: 'u4', proof: { name: 'မသန်းသန်း', at: n - H } }, [['requested', '', 130], ['accepted', '', 129, 'u2'], ['collected', 'b1', 120, 'u2'], ['departed', 'b1', 110, 'u2', 'b4', 'နိုဝင်ဘာ ၃ ကား'], ['at_branch', 'b4', 20, 'u7'], ['out_for_delivery', 'b4', 6, 'u4'], ['delivered', 'b4', 1, 'u4']]);
  mk('မနီလာ', 'တာမွေ', 2, 'ကိုမြင့်', 'b1', 'b4', { assignedTo: 'u4' }, [['requested', '', 128], ['accepted', '', 127, 'u2'], ['collected', 'b1', 118, 'u2'], ['departed', 'b1', 110, 'u2', 'b4', 'နိုဝင်ဘာ ၃ ကား'], ['at_branch', 'b4', 20, 'u7'], ['out_for_delivery', 'b4', 2, 'u4']]);
  mk('မဖြိုး', 'အလုံ', 1, 'ကိုလွင်', 'b1', 'b4', { assignedTo: 'u12', failReason: 'no_answer' }, [['requested', '', 140], ['accepted', '', 139, 'u2'], ['collected', 'b1', 125, 'u2'], ['departed', 'b1', 110, 'u2', 'b4', 'နိုဝင်ဘာ ၃ ကား'], ['at_branch', 'b4', 20, 'u7'], ['out_for_delivery', 'b4', 8, 'u12'], ['failed', 'b4', 3, 'u12', '', 'no_answer']]);
  mk('မပိုးပိုး', 'စစ်ကိုင်း', 1, 'ကိုအောင်', 'b2', 'b4', {}, [['requested', '', 132], ['accepted', '', 131, 'u3'], ['collected', 'b2', 126, 'u3'], ['departed', 'b2', 110, 'u3', 'b4', 'နိုဝင်ဘာ ၃ ကား'], ['at_branch', 'b4', 18, 'u7']]);
  mk('ကိုဇော်ဝင်း', 'လှိုင်', 1, 'ကိုနိုင်လင်း', 'b1', 'b4', {}, [['requested', '', 30], ['accepted', '', 29, 'u2'], ['collected', 'b1', 26, 'u2'], ['departed', 'b1', 3, 'u2', 'b4', 'နိုဝင်ဘာ ၁၀ ကား']]);
  mk('မအိမ့်', 'စမ်းချောင်း', 3, 'မအေးအေး', 'b1', 'b5', { route: 'mm-kr', method: 'air', assignedTo: 'u16' }, [['requested', '', 60], ['accepted', '', 59, 'u2'], ['collected', 'b1', 54, 'u2'], ['departed', 'b1', 40, 'u2', 'b5', 'ကိုရီးယား လေယာဉ် (ကြာသပတေး)'], ['at_branch', 'b5', 6, 'u8'], ['out_for_delivery', 'b5', 2, 'u16']]);
  mk('ကိုလင်း', 'အောင်လံ', 2, 'မစု', 'b3', 'b5', { route: 'mm-kr', method: 'air' }, [['requested', '', 20], ['accepted', '', 19, 'u6'], ['collected', 'b3', 16, 'u6'], ['departed', 'b3', 2, 'u6', 'b5', 'ကိုရီးယား လေယာဉ် (အင်္ဂါ)']]);
  mk('မချို', 'ဒဂုံ', 1, 'ဦးကျော်', 'b1', 'b5', { route: 'mm-kr', method: 'air' }, [['requested', '', 9], ['accepted', '', 8, 'u2'], ['collected', 'b1', 4, 'u2']]);
  mk('မနန်း', 'ဒဂုံ', 2, 'ကိုကျော်', 'b1', 'b4', { pickupBy: 'u5' }, [['requested', '', 3], ['accepted', '', 2, 'u2']]);
  mk('မသီတာထွန်း', 'လှိုင်', 1, 'ဦးမြင့်', 'b1', 'b4', {}, [['requested', '', 0.8]]);
  mk('ကိုမင်းမင်း', 'စမ်းချောင်း', 2, 'မဖြူ', 'b1', 'b5', { route: 'mm-kr', method: 'air' }, [['requested', '', 0.3]]);
  mk('ဒေါ်မြ', 'စစ်ကိုင်း', 1, 'ကိုသူ', 'b2', 'b4', {}, [['requested', '', 0.5]]);
  const now = new Date();
  for (let m = 0; m < 6; m++) for (let i = 0, c = m ? 8 + m : 5; i < c; i++) {
    let at = new Date(now.getFullYear(), now.getMonth() - m, 1 + (i * 3) % 26, 10 + i % 7).getTime();
    if (at > n - 48 * H) at = n - (48 + i * 12) * H;
    const no = 'AT-' + yymm() + '-' + String(++d.seq).padStart(5, '0'), route = ['mm-th', 'mm-kr', 'mm-th', 'mm-th'][i % 4], method = route === 'mm-kr' ? 'air' : 'road', dest = route === 'mm-kr' ? 'b5' : 'b4';
    d.parcels.push({ no, sender: ['ဦးမောင်', 'မနှင်း', 'ကိုသန့်'][i % 3], senderPhone: '09 700 000 00' + (i % 5), pickupAddr: 'အမှတ် ၅', township: 'လှိုင်', qty: 1 + i % 3, receiver: 'မအိ', receiverPhone: '09 800 000 000', receiverAddr: 'အမှတ် ၉', originId: ['b1', 'b2', 'b1', 'b3'][i % 4], destId: dest, branchId: dest, nextId: '', status: 'delivered', assignedTo: 'u4', pickupBy: '', source: 'web', method, route, goods: '', createdAt: at, updatedAt: at + 30 * H, seedK: 3 + (i * 7) % 24 });
    d.events.push({ id: uid(), no, status: 'delivered', branchId: dest, nextId: '', note: '', userId: 'u4', at: at + 30 * H }, { id: uid(), no, status: 'requested', branchId: '', nextId: '', note: '', userId: null, at });
  }
  d.parcels.forEach((p, i) => {
    if (['requested', 'accepted', 'cancelled'].includes(p.status)) return;
    const type = i % 2 ? 'bulky' : 'dense', kg = p.seedK || 2 + (i * 5) % 15, c = calcPrice({ method: p.method, type, kg, l: 40, w: 30, h: 30, qty: p.qty, route: p.route }, d.settings);
    delete p.seedK;
    p.price = { method: p.method, type, kg, l: 40, w: 30, h: 30, ...c, extra: 0, discount: 0, total: c.suggest, told: true, by: 'u2', at: p.createdAt };
    if (p.status === 'delivered' || i % 3 === 0) { p.paid = true; p.payMethod = PAY[i % 5]; p.paidAt = p.status === 'delivered' ? p.updatedAt : p.createdAt; }
  });
  return d;
}
function load() { try { const r = store.get(KEY); if (r) return JSON.parse(r); } catch (e) {} const s = seed(); store.set(KEY, JSON.stringify(s)); return s; }
let db = load();
/* one-time upgrade for data saved before every branch had two riders; riders deleted later are not re-added */
if ((db.ridersV || 0) < 2) {
  RIDERS.forEach(r => { if (!db.users.some(u => u.id === r.id || u.username === r.username)) db.users.push({ ...r, seedPw: DEMO_PW, duty: true, role: 'delivery', active: true }); });
  db.ridersV = 2; save();
}
function save() { if (!store.set(KEY, JSON.stringify(db))) console.warn('storage full'); }

const me = () => db.users.find(u => u.id === store.get('anyarthu-user') && u.active) || null;
const parcel = no => db.parcels.find(p => p.no === no);
const can = k => { const u = me(); return !!u && (u.role === 'admin' || !!db.perms[u.role + '_' + k]); };
const isDelayed = p => !TERMINAL.includes(p.status) && Date.now() - p.updatedAt > db.settings.sla * H;
const nextNo = () => db.settings.prefix + '-' + yymm() + '-' + String(++db.seq).padStart(5, '0');
const logIt = (action, detail) => { const u = me(); db.audit.unshift({ at: Date.now(), userId: u ? u.id : null, action, detail }); db.audit = db.audit.slice(0, 400); };
function move(p, status, o = {}) {
  p.status = status; p.updatedAt = Date.now();
  if (o.branchId !== undefined) p.branchId = o.branchId;
  p.nextId = o.nextId || '';
  const u = me();
  db.events.unshift({ id: uid(), no: p.no, status, branchId: o.branchId !== undefined ? o.branchId : p.branchId, nextId: p.nextId, note: o.note || '', userId: u ? u.id : null, at: Date.now() });
  logIt('l_status', p.no + ' → ' + status);
  if (window.onMove) window.onMove(p, status);
}
const relevant = (p, b) => [p.originId, p.destId, p.branchId, p.nextId].includes(b);
const board = b => ({
  pickups: db.parcels.filter(p => ['requested', 'accepted'].includes(p.status) && p.originId === b),
  incoming: db.parcels.filter(p => p.status === 'departed' && p.nextId === b),
  inbranch: db.parcels.filter(p => ['collected', 'at_branch'].includes(p.status) && p.branchId === b),
  outgoing: db.parcels.filter(p => p.status === 'departed' && p.branchId === b),
  delivery: db.parcels.filter(p => p.status === 'out_for_delivery' && p.branchId === b),
  problems: db.parcels.filter(p => p.status === 'failed' && p.branchId === b),
  history: db.parcels.filter(p => TERMINAL.includes(p.status) && relevant(p, b)),
  pricing: db.parcels.filter(p => p.originId === b && !['requested', 'cancelled', 'returned'].includes(p.status) && (!p.price || !p.paid)),
  manifests: db.manifests.filter(m => m.from === b || m.to === b),
  today: db.events.filter(e => e.branchId === b && !e.internal && e.at >= new Date().setHours(0, 0, 0, 0))
});
