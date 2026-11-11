const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

const query = (text, params) => pool.query(text, params);

// parcels ဇယားတွင် အမှန်တကယ်ရှိသော Column များကိုသာ တိကျစွာ ခေါ်ယူခြင်း
async function getParcelTracking(trackingNumber) {
  const queryText = `
    SELECT p.tracking_number, p.recipient_name, p.status, p.destination_hub,
           h.name as current_hub_name
    FROM parcels p
    LEFT JOIN hubs h ON p.current_hub_id = h.id
    WHERE UPPER(TRIM(p.tracking_number)) = UPPER(TRIM($1))
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