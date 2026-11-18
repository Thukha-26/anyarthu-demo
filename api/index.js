const express = require('express');
const axios = require('axios');
const path = require('path');

let db;
try {
  db = require('../db');
} catch (e) {
  try {
    db = require('./db');
  } catch (err) {
    console.warn('Database module could not be loaded directly:', err.message);
  }
}

const app = express();
app.use(express.json());

const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'anyarthu_free_token_2026';
const VIBER_AUTH_TOKEN = process.env.VIBER_AUTH_TOKEN;

// Quick Reply ခလုတ် (၃) ခု
const MAIN_QUICK_REPLIES = [
  { content_type: 'text', title: '🏢 ရုံးခွဲလိပ်စာ', payload: 'MENU_BRANCHES' },
  { content_type: 'text', title: '📦 Parcel အခြေအနေ', payload: 'MENU_TRACKING' },
  { content_type: 'text', title: '👤 Admin နဲ့ပြောမယ်', payload: 'MENU_ADMIN' }
];

// ရုံးခွဲလိပ်စာများ
const BRANCH_ADDRESSES_TEXT =
  `🏢 အညာသူ Express ရုံးခွဲလိပ်စာများ\n\n` +
  `📍 ရန်ကုန် ဗဟို Hub\n` +
  `လိပ်စာ - [ရန်ကုန် ရုံးခွဲလိပ်စာ ထည့်ရန်]\n` +
  `ဖုန်း - 09-111111111\n\n` +
  `📍 မန္တလေး ရုံးခွဲ\n` +
  `လိပ်စာ - [မန္တလေး ရုံးခွဲလိပ်စာ ထည့်ရန်]\n` +
  `ဖုန်း - 09-222222222\n\n` +
  `📍 တောင်ကြီး ရုံးခွဲ\n` +
  `လိပ်စာ - [တောင်ကြီး ရုံးခွဲလိပ်စာ ထည့်ရန်]\n` +
  `ဖုန်း - 09-333333333\n\n` +
  `⏰ ရုံးချိန် - နံနက် ၈:၃၀ မှ ညနေ ၅:၃၀ ထိ`;

// 0. Message Box ဝင်တာနဲ့ ခလုတ်များ တန်းပေါ်စေရန် Messenger Profile ဖွင့်ပေးသည့် Endpoint
app.get('/webhook/setup-profile', async (req, res) => {
  if (!FB_PAGE_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'FB_PAGE_ACCESS_TOKEN မတွေ့ပါ' });
  }
  try {
    const profilePayload = {
      get_started: { payload: 'GET_STARTED' },
      greeting: [
        {
          locale: 'default',
          text: 'မင်္ဂလာပါ {{user_first_name}} 🙏 အညာသူ Express Cargo မှ ကြိုဆိုပါတယ်။ အောက်ပါခလုတ်များကို နှိပ်၍ စတင်အသုံးပြုနိုင်ပါတယ်ရှင်။'
        }
      ],
      ice_breakers: [
        {
          question: '🏢 ရုံးခွဲလိပ်စာ',
          payload: 'MENU_BRANCHES'
        },
        {
          question: '📦 Parcel အခြေအနေ',
          payload: 'MENU_TRACKING'
        },
        {
          question: '👤 Admin နဲ့ပြောမယ်',
          payload: 'MENU_ADMIN'
        }
      ],
      persistent_menu: [
        {
          locale: 'default',
          composer_input_disabled: false,
          call_to_actions: [
            { type: 'postback', title: '🏢 ရုံးခွဲလိပ်စာ', payload: 'MENU_BRANCHES' },
            { type: 'postback', title: '📦 Parcel အခြေအနေ', payload: 'MENU_TRACKING' },
            { type: 'postback', title: '👤 Admin နဲ့ပြောမယ်', payload: 'MENU_ADMIN' }
          ]
        }
      ]
    };

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/me/messenger_profile?access_token=${FB_PAGE_ACCESS_TOKEN}`,
      profilePayload
    );
    return res.status(200).json({
      success: true,
      message: 'Get Started, Ice Breakers နှင့် Persistent Menu များ အောင်မြင်စွာ ဖွင့်ပြီးပါပြီ!',
      meta_response: response.data
    });
  } catch (err) {
    console.error('Messenger Profile Setup Error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

// Website Frontend မှ ပါဆယ်ရှာဖွေရန် API Endpoint
app.get('/webhook/track', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const code = (req.query.code || '').trim();
  if (!code) {
    return res.status(400).json({ found: false, message: 'Tracking number ထည့်သွင်းပါ' });
  }
  const parcel = await findParcelByTracking(code);
  if (!parcel) {
    return res.status(404).json({ found: false, message: `နံပါတ် "${code}" အား ရှာမတွေ့ပါ` });
  }
  return res.status(200).json({ found: true, parcel });
});

// Website မှ Pickup / Parcel အသစ်တင်တိုင်း Supabase Database ထဲသို့ တိုက်ရိုက်သွင်းပေးသည့် API
app.post('/webhook/pickup-sync', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const queryFn = (db && db.query) ? db.query : (db && db.pool ? db.pool.query.bind(db.pool) : null);
  if (!queryFn) {
    return res.status(500).json({ success: false, message: 'Database query function not available' });
  }
  try {
    const d = req.body || {};
    const trackingNo = (d.no || '').trim().toUpperCase();
    const senderName = d.sender || 'Web Customer';
    const senderPhone = d.senderPhone || '-';
    const pickupAddr = d.pickupAddr || '-';
    const township = d.township || '-';
    const receiverName = d.receiver || 'လက်ခံသူ';
    const receiverPhone = d.receiverPhone || '-';
    const receiverAddr = d.receiverAddr || '-';
    const destHub = d.destName || d.destId || 'BKK';
    const originHub = (d.originId || 'YGN').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 10) || 'YGN';
    const originName = d.originName || originHub;
    const qty = parseInt(d.qty, 10) || 1;
    const statusText = d.statusText || 'စာရင်းသွင်းပြီး (Pickup စောင့်ဆိုင်းဆဲ)';

    await queryFn(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS sender_name VARCHAR(100)`).catch(() => {});
    await queryFn(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS recipient_address TEXT`).catch(() => {});
    await queryFn(`ALTER TABLE parcels ALTER COLUMN destination_hub TYPE TEXT`).catch(() => {});

    // Origin Hub ကို hubs ဇယားတွင် အလိုအလျောက် စစ်ဆေးထည့်သွင်းခြင်း (ထိုင်း/ကိုရီးယား Hub များအတွက်ပါ အဆင်ပြေစေရန်)
    await queryFn(
      `INSERT INTO hubs (id, name, city) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [originHub, originName, originName]
    );

    // 1. pickup_requests ဇယားထဲသို့ ထည့်သွင်းခြင်း
    await queryFn(
      `INSERT INTO pickup_requests (sender_name, sender_phone, address, township, hub_id, item_qty, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())`,
      [senderName, senderPhone, pickupAddr, township, originHub, qty]
    );

    // 2. parcels ဇယားထဲသို့ ကော်လံအသစ်များအပါအဝင် ထည့်သွင်းခြင်း
    if (trackingNo) {
      await queryFn(
        `INSERT INTO parcels (tracking_number, sender_name, recipient_name, recipient_phone, recipient_address, destination_hub, current_hub_id, status, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (tracking_number) DO UPDATE SET
           sender_name = EXCLUDED.sender_name,
           recipient_name = EXCLUDED.recipient_name,
           recipient_address = EXCLUDED.recipient_address,
           destination_hub = EXCLUDED.destination_hub,
           status = EXCLUDED.status,
           updated_at = NOW()`,
        [trackingNo, senderName, receiverName, receiverPhone, receiverAddr, destHub, originHub, statusText]
      );
    }

    return res.status(200).json({ success: true, trackingNo });
  } catch (err) {
    console.error('Pickup Sync Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Messenger Verification (GET)
app.get('/webhook/messenger', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      console.log('FB Webhook Verified successfully.');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// 2. Messenger Message Handler (POST)
app.post('/webhook/messenger', async (req, res) => {
  try {
    const body = req.body;
    if (body && body.object === 'page' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (!entry || !Array.isArray(entry.messaging)) continue;
        for (const webhookEvent of entry.messaging) {
          const senderId = webhookEvent.sender?.id;
          if (!senderId) continue;

          if (webhookEvent.message && webhookEvent.message.text) {
            const userText = webhookEvent.message.text.trim();
            const payload = webhookEvent.message.quick_reply?.payload || '';
            await handleFacebookMessage(senderId, userText, payload);
          } else if (webhookEvent.postback && webhookEvent.postback.payload) {
            await handleFacebookMessage(senderId, webhookEvent.postback.title || '', webhookEvent.postback.payload);
          }
        }
      }
    }
  } catch (err) {
    console.error('Messenger Webhook Error:', err);
  }
  return res.status(200).send('EVENT_RECEIVED');
});

// 3. Viber Webhook Handler (POST)
app.post('/webhook/viber', async (req, res) => {
  try {
    const body = req.body;
    if (body && body.event === 'webhook') {
      return res.status(200).send('OK');
    }
    if (body && body.event === 'message' && body.message && body.message.text) {
      const senderId = body.sender?.id;
      const userText = body.message.text.trim();
      if (senderId && userText) {
        await handleViberMessage(senderId, userText);
      }
    }
  } catch (err) {
    console.error('Viber Webhook Error:', err);
  }
  return res.status(200).send('OK');
});

// 4. Tracking Logic
async function findParcelByTracking(trackingNumber) {
  if (!db) return null;
  try {
    if (typeof db.getParcelTracking === 'function') {
      return await db.getParcelTracking(trackingNumber);
    }
    const cleanNo = trackingNumber.trim().toUpperCase();
    const queryText = `
      SELECT p.tracking_number, p.recipient_name, p.status, p.destination_hub,
             h.name as current_hub_name
      FROM parcels p
      LEFT JOIN hubs h ON p.current_hub_id = h.id
      WHERE UPPER(TRIM(p.tracking_number)) = $1
      LIMIT 1;
    `;
    const res = await db.query(queryText, [cleanNo]);
    return res.rows?.[0] || null;
  } catch (err) {
    console.error('Database Query Error:', err.message);
    return null;
  }
}

function formatTrackingReply(parcel, rawCode) {
  if (!parcel) {
    return `❌ ဘောင်ချာနံပါတ် "${rawCode}" ကို စနစ်ထဲတွင် ရှာမတွေ့ပါရှင်။\n\nကျေးဇူးပြု၍ နံပါတ် မှန်/မမှန် ပြန်လည်စစ်ဆေးပြီး ထပ်မံပေးပို့ပေးပါ။`;
  }

  const trackingNo = parcel.tracking_number || rawCode;
  const receiver = parcel.recipient_name || '-';
  const destHub = parcel.destination_hub || '-';
  const hubName = (parcel.current_hub_name || '').trim();

  // စာသားထဲတွင် ရုံးခွဲအမည် နှစ်ထပ်ပါနေပါက အလိုအလျောက် ရှင်းလင်းခြင်း
  let cleanStatus = (parcel.status || '').trim();
  if (hubName) {
    cleanStatus = cleanStatus.replace(`(${hubName})`, '').trim();
  }
  cleanStatus = cleanStatus.replace(/\(([^()]+)\)\s*\(\1\)/g, '($1)').trim();

  const updatedTime = parcel.updated_at
    ? new Date(parcel.updated_at).toLocaleString('en-GB', {
        timeZone: 'Asia/Yangon',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return [
    '✨ အညာသူ Express ပါဆယ်အခြေအနေ',
    '',
    `🔖 ဘောင်ချာနံပါတ် : ${trackingNo}`,
    `👤 လက်ခံမည့်သူ   : ${receiver}`,
    `📍 ပို့ဆောင်မည့်နေရာ : ${destHub}`,
    hubName ? `🏢 လက်ရှိရုံးခွဲ     : ${hubName}` : null,
    '',
    '🚚 လက်ရှိအခြေအနေ',
    `✅ ${cleanStatus}`,
    updatedTime ? `🕒 အချိန် : ${updatedTime}` : null,
    '',
    '🙏 ကျေးဇူးတင်ပါတယ်ရှင်။ အခြားဝန်ဆောင်မှုများအတွက် အောက်ပါခလုတ်များကို ရွေးချယ်နိုင်ပါတယ်။'
  ].filter(line => line !== null).join('\n');
}

async function handleFacebookMessage(senderId, text, payload = '') {
  const cleanInput = text.trim();
  const lowerInput = cleanInput.toLowerCase();

  // ၁။ Get Started / မင်္ဂလာပါ / Menu
  if (
    payload === 'GET_STARTED' ||
    cleanInput === 'မင်္ဂလာပါ' ||
    lowerInput === 'hi' ||
    lowerInput === 'hello' ||
    lowerInput === 'menu'
  ) {
    const welcomeText =
      `မင်္ဂလာပါရှင် 🙏 အညာသူ Express မှ ကြိုဆိုပါတယ်။\n\n` +
      `လူကြီးမင်း သိရှိလိုသည်များကို အောက်ပါခလုတ်များမှတစ်ဆင့် ရွေးချယ်နိုင်ပါတယ်ရှင် 👇`;
    await sendFacebookMessage(senderId, welcomeText, MAIN_QUICK_REPLIES);
    return;
  }

  // ၂။ ရုံးခွဲလိပ်စာ
  if (payload === 'MENU_BRANCHES' || cleanInput.includes('ရုံးခွဲလိပ်စာ')) {
    await sendFacebookMessage(senderId, BRANCH_ADDRESSES_TEXT, MAIN_QUICK_REPLIES);
    return;
  }

  // ၃။ Parcel အခြေအနေ
  if (payload === 'MENU_TRACKING' || cleanInput.includes('Parcel အခြေအနေ') || cleanInput.includes('ပါဆယ်အခြေအနေ')) {
    const trackPrompt =
      `📦 ပါဆယ်အခြေအနေ စစ်ဆေးရန် လူကြီးမင်း၏ ဘောင်ချာနံပါတ် ကို ရိုက်ထည့်ပေးပို့ပေးပါရှင် 🔖\n\n` +
      `(ဥပမာ - AT-2611-00492 သို့မဟုတ် TEST-001)`;
    await sendFacebookMessage(senderId, trackPrompt, MAIN_QUICK_REPLIES);
    return;
  }

  // ၄။ Admin နဲ့ပြောမယ်
  if (payload === 'MENU_ADMIN' || cleanInput.includes('Admin နဲ့ပြောမယ်')) {
    const adminText =
      `👤 Page Admin ထံ တိုက်ရိုက်ဆက်သွယ်ရန် စာရင်းသွင်းပေးထားပါတယ်ရှင်။\n\n` +
      `လူကြီးမင်း မေးမြန်းလိုသည့် အကြောင်းအရာကို ဤနေရာတွင် ရေးသားပေးပို့ထားနိုင်ပါတယ်။ Admin မှ အမြန်ဆုံး ပြန်လည်ဖြေကြားပေးပါမယ်ရှင် 🙏`;
    await sendFacebookMessage(senderId, adminText, MAIN_QUICK_REPLIES);
    return;
  }

  // ၅။ ဘောင်ချာနံပါတ် ရိုက်ပို့လာပါက ရှာဖွေပေးခြင်း
  const parcel = await findParcelByTracking(cleanInput);
  const replyText = formatTrackingReply(parcel, cleanInput);
  await sendFacebookMessage(senderId, replyText, MAIN_QUICK_REPLIES);
}

async function handleViberMessage(senderId, text) {
  let replyText = '';
  const cleanInput = text.trim();

  if (cleanInput === 'မင်္ဂလာပါ' || cleanInput.toLowerCase() === 'hi') {
    replyText = 'မင်္ဂလာပါရှင်။ အညာသူ Express Tracking Bot မှ ကြိုဆိုပါတယ်။ ပါဆယ်စစ်ဆေးရန် ဘောင်ချာနံပါတ် ရိုက်ထည့်ပေးပါရှင်။';
  } else if (cleanInput.includes('ရုံးခွဲလိပ်စာ')) {
    replyText = BRANCH_ADDRESSES_TEXT;
  } else {
    const parcel = await findParcelByTracking(cleanInput);
    replyText = formatTrackingReply(parcel, cleanInput);
  }

  await sendViberMessage(senderId, replyText);
}

async function sendFacebookMessage(recipientId, text, quickReplies = null) {
  if (!FB_PAGE_ACCESS_TOKEN) return;
  try {
    const messagePayload = { text: text };
    if (Array.isArray(quickReplies) && quickReplies.length > 0) {
      messagePayload.quick_replies = quickReplies;
    }

    await axios.post(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: messagePayload
      }
    );
    console.log(`FB message sent to ${recipientId}`);
  } catch (err) {
    console.error('Facebook Send Error:', err.response?.data || err.message);
  }
}

async function sendViberMessage(receiverId, text) {
  if (!VIBER_AUTH_TOKEN) return;
  try {
    await axios.post(
      'https://chatapi.viber.com/pa/send_message',
      {
        receiver: receiverId,
        type: 'text',
        text: text,
        sender: { name: 'အညာသူ Express' }
      },
      {
        headers: { 'X-Viber-Auth-Token': VIBER_AUTH_TOKEN }
      }
    );
    console.log(`Viber message sent to ${receiverId}`);
  } catch (err) {
    console.error('Viber Send Error:', err.response?.data || err.message);
  }
}

app.use(express.static(path.join(__dirname, '../')));

module.exports = app;





