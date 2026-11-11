const express = require('express');
const axios = require('axios');
const { getParcelTracking, createPickupRequest } = require('../db');
require('dotenv').config();

const app = express();
app.use(express.json());

const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'anyarthu_free_token_2026';
const VIBER_AUTH_TOKEN = process.env.VIBER_AUTH_TOKEN;

app.get('/webhook/health', (req, res) => {
  res.json({ status: 'ok', service: 'Anyarthu Unified Webhook Backend' });
});

// Facebook Messenger Verification (GET Request)
app.get(['/webhook/messenger', '/api/messenger'], (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === FB_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Facebook Messenger Message Handler (POST Request)
app.post(['/webhook/messenger', '/api/messenger'], async (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    for (let entry of body.entry) {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        const text = event.message.text.trim();
        const upper = text.toUpperCase();

        if (upper.startsWith("AT-") || upper.startsWith("DX-") || upper.startsWith("TEST-")) {
          const parcel = await getParcelTracking(text);
          if (parcel) {
            const reply = `📦 ပါဆယ်နံပါတ်: ${parcel.tracking_number}\n` +
                          `👤 လက်ခံသူ: ${parcel.recipient_name}\n` +
                          `🚚 အခြေအနေ: ${parcel.status}\n` +
                          `🏢 လက်ရှိရုံး: ${parcel.current_hub_name || 'လမ်းခရီးတွင်'}\n` +
                          `📍 ပန်းတိုင်: ${parcel.destination_hub}`;
            await sendMessenger(senderId, reply);
          } else {
            await sendMessenger(senderId, `❌ နံပါတ် "${text}" အား စနစ်ထဲတွင် ရှာမတွေ့ပါ။ Tracking Number ကို ပြန်လည်စစ်ဆေးပေးပါရှင်။`);
          }
        } else {
          await sendMessenger(senderId, "မင်္ဂလာပါရှင်။ အညာသူ Express မှ ကြိုဆိုပါတယ်။ ပါဆယ်စစ်ဆေးရန် Tracking နံပါတ် (ဥပမာ- AT-2611-00492 သို့မဟုတ် TEST-001) ကို ရိုက်ပို့ပေးပါရှင်။");
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }
  return res.sendStatus(404);
});

async function sendMessenger(recipientId, text) {
  try {
    await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`, {
      recipient: { id: recipientId },
      message: { text }
    });
  } catch (err) {
    console.error('FB Send Error:', err.response?.data || err.message);
  }
}

// Viber Chatbot Webhook (POST Request)
app.post(['/webhook/viber', '/api/viber'], async (req, res) => {
  const body = req.body;
  if (body.event === 'message') {
    const senderId = body.sender.id;
    const text = body.message.text ? body.message.text.trim() : "";
    const upper = text.toUpperCase();

    if (upper.startsWith("AT-") || upper.startsWith("DX-") || upper.startsWith("TEST-")) {
      const parcel = await getParcelTracking(text);
      if (parcel) {
        const reply = `📦 ပါဆယ်နံပါတ်: ${parcel.tracking_number}\n` +
                      `👤 လက်ခံသူ: ${parcel.recipient_name}\n` +
                      `🚚 အခြေအနေ: ${parcel.status}\n` +
                      `🏢 လက်ရှိရုံး: ${parcel.current_hub_name || 'လမ်းခရီးတွင်'}\n` +
                      `📍 ပန်းတိုင်: ${parcel.destination_hub}`;
        await sendViber(senderId, reply);
      } else {
        await sendViber(senderId, `❌ နံပါတ် "${text}" အား စနစ်ထဲတွင် ရှာမတွေ့ပါရှင်။`);
      }
    } else {
      await sendViber(senderId, "မင်္ဂလာပါရှင်။ အညာသူ Express မှ ကြိုဆိုပါတယ်။ စစ်ဆေးလိုသော Tracking နံပါတ် (ဥပမာ- AT-2611-00492 သို့မဟုတ် TEST-001) ကို ရိုက်ပို့ပေးပါရှင်။");
    }
  }
  return res.status(200).send('OK');
});

async function sendViber(receiverId, text) {
  try {
    await axios.post('https://chatapi.viber.com/pa/send_message', {
      receiver: receiverId,
      type: 'text',
      text: text,
      sender: { name: "အညာသူ Express" }
    }, {
      headers: { 'X-Viber-Auth-Token': VIBER_AUTH_TOKEN }
    });
  } catch (err) {
    console.error('Viber Send Error:', err.response?.data || err.message);
  }
}

module.exports = app;