const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function getParcelTracking(trackingNumber) {
  const query = `
    SELECT p.tracking_number, p.recipient_name, p.status, p.destination_hub,
           h.name as current_hub_name, p.updated_at
    FROM parcels p
    LEFT JOIN hubs h ON p.current_hub_id = h.id
    WHERE UPPER(p.tracking_number) = UPPER($1)
    LIMIT 1;
  `;
  const res = await pool.query(query, [trackingNumber.trim()]);
  return res.rows[0] || null;
}

async function createPickupRequest(data) {
  const query = `
    INSERT INTO pickup_requests (sender_name, sender_phone, address, township, hub_id, item_qty, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
    RETURNING id;
  `;
  const res = await pool.query(query, [
    data.name,
    data.phone,
    data.address,
    data.township,
    data.hubId || 'YGN',
    data.qty || 1
  ]);
  return res.rows[0].id;
}

module.exports = {
  getParcelTracking,
  createPickupRequest
};