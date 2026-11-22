require('dotenv').config();
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Use WebSockets over port 443 so networks blocking port 5432 still work
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Creates the `analyses` table on startup if it doesn't exist
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS analyses (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(255),
      match_score INTEGER,
      report      JSONB,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Database ready: "analyses" table exists');
}

module.exports = { pool, initDb };