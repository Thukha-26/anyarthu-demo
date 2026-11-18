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
          if (webhookEvent && webhookEvent.message && webhookEvent.message.text) {
            const senderId = webhookEvent.sender?.id;
            const userText = webhookEvent.message.text.trim();
            if (senderId && userText) {
              await handleFacebookMessage(senderId, userText);
            }
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

function formatTrackingReply(parcel, rawInput) {
  if (!parcel) {
    return `❌ ဘောင်ချာနံပါတ် "${rawInput}" ကို စနစ်ထဲတွင် ရှာမတွေ့ပါရှင်။\n\nနံပါတ် မှန်/မမှန် ပြန်လည်စစ်ဆေးပြီး ထပ်မံပေးပို့ပေးပါနော် 🙏`;
  }
  const trackingNo = parcel.tracking_number || rawInput;
  const receiver = parcel.recipient_name || 'လူကြီးမင်း';
  const status = parcel.status || 'စီစဉ်ဆောင်ရွက်ဆဲ';
  const currentHub = parcel.current_hub_name ? ` (${parcel.current_hub_name})` : '';
  const destHub = parcel.destination_hub || 'သတ်မှတ်မြို့';

  return `✨ အညာသူ Express ပါဆယ်အခြေအနေ\n\n` +
         `🔖 ဘောင်ချာနံပါတ်\n${trackingNo}\n\n` +
         `👤 လက်ခံမည့်သူ - ${receiver}\n` +
         `📍 ပို့ဆောင်မည့်မြို့ - ${destHub}\n\n` +
         `🚚 လက်ရှိအခြေအနေ\n✅ ${status}${currentHub}\n\n` +
         `🙏 ကျေးဇူးတင်ပါတယ်ရှင်။ အခြားပါဆယ် စစ်ဆေးလိုပါက ဘောင်ချာနံပါတ် ထပ်မံပေးပို့နိုင်ပါတယ်။`;
}

async function handleFacebookMessage(senderId, text) {
  let replyText = '';
  const cleanInput = text.trim();

  if (cleanInput === 'မင်္ဂလာပါ' || cleanInput.toLowerCase() === 'hi' || cleanInput.toLowerCase() === 'hello') {
    replyText = 'မင်္ဂလာပါရှင်။ အညာသူ Express မှ ကြိုဆိုပါတယ်။ ပါဆယ်စစ်ဆေးရန် Tracking နံပါတ် (ဥပမာ- TEST-001 သို့မဟုတ် AT-2611-00492) ကို ရိုက်ပို့ပေးပါရှင်။';
  } else {
    const parcel = await findParcelByTracking(cleanInput);
    replyText = formatTrackingReply(parcel, cleanInput);
  }

  await sendFacebookMessage(senderId, replyText);
}

async function handleViberMessage(senderId, text) {
  let replyText = '';
  const cleanInput = text.trim();

  if (cleanInput === 'မင်္ဂလာပါ' || cleanInput.toLowerCase() === 'hi') {
    replyText = 'မင်္ဂလာပါရှင်။ အညာသူ Express Tracking Bot မှ ကြိုဆိုပါတယ်။ ပါဆယ်စစ်ဆေးရန် Tracking နံပါတ် ရိုက်ထည့်ပေးပါရှင်။';
  } else {
    const parcel = await findParcelByTracking(cleanInput);
    replyText = formatTrackingReply(parcel, cleanInput);
  }

  await sendViberMessage(senderId, replyText);
}

async function sendFacebookMessage(recipientId, text) {
  if (!FB_PAGE_ACCESS_TOKEN) return;
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text: text }
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
