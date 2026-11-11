const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

// db.query ကို api/index.js မှ တိုက်ရိုက်ခေါ်သုံးနိုင်ရန် export လုပ်ပေးခြင်း
const query = (text, params) => pool.query(text, params);

async function getParcelTracking(trackingNumber) {
  const queryText = `
    SELECT p.tracking_number, p.recipient_name, p.status, p.destination_hub,
           h.name as current_hub_name, p.updated_at
    FROM parcels p
    LEFT JOIN hubs h ON p.current_hub_id = h.id
    WHERE UPPER(p.tracking_number) = UPPER($1)
    LIMIT 1;
  `;
  const res = await pool.query(queryText, [trackingNumber.trim()]);
  return res.rows[0] || null;
}

module.exports = {
  pool,
  query,
  getParcelTracking
};