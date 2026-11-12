const { Pool } = require('pg');
require('dotenv').config();

// SSL Certificate Chain စစ်ဆေးမှုကို ကျော်လွှားရန်
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
let poolConfig = {
  ssl: { rejectUnauthorized: false }
};

if (rawUrl) {
  try {
    const dbUrl = new URL(rawUrl);
    poolConfig.user = decodeURIComponent(dbUrl.username);
    poolConfig.password = decodeURIComponent(dbUrl.password);
    poolConfig.host = dbUrl.hostname;
    poolConfig.port = dbUrl.port ? parseInt(dbUrl.port, 10) : 5432;
    // Database name ကို သန့်ရှင်းစွာ ယူခြင်း (postgres)
    poolConfig.database = dbUrl.pathname.replace(/^\//, '') || 'postgres';
  } catch (e) {
    poolConfig.connectionString = rawUrl;
  }
}

const pool = new Pool(poolConfig);

const query = (text, params) => pool.query(text, params);

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
