const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

// api/index.js မှ db.query ဖြင့် တိုက်ရိုက်ခေါ်ယူနိုင်ရန် သတ်မှတ်ချက်
const query = (text, params) => pool.query(text, params);

// ၁။ Tracking နံပါတ်ဖြင့် ပါဆယ်အချက်အလက် ရှာဖွေခြင်း
async function getParcelTracking(trackingNumber) {
  const queryText = `
    SELECT p.tracking_number, p.recipient_name, p.status, p.destination_hub,
           h.name as current_hub_name, p.updated_at
    FROM parcels p
    LEFT JOIN hubs h ON p.current_hub_id = h.id
    WHERE UPPER(TRIM(p.tracking_number)) = UPPER(TRIM($1))
    LIMIT 1;
  `;
  const res = await pool.query(queryText, [trackingNumber.trim()]);
  return res.rows[0] || null;
}

// ၂။ Chatbot မှတစ်ဆင့် Pickup ခေါ်ယူမှုကို Database ထဲသို့ သိမ်းဆည်းခြင်း
async function createPickupRequest(data) {
  const queryText = `
    INSERT INTO pickup_requests (sender_name, sender_phone, address, township, hub_id, item_qty, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
    RETURNING id;
  `;
  const res = await pool.query(queryText, [
    data.name,
    data.phone,
    data.address,
    data.township,
    data.hubId || 'YGN',
    data.qty || 1
  ]);
  return res.rows[0]?.id || null;
}

module.exports = {
  pool,
  query,
  getParcelTracking,
  createPickupRequest
};