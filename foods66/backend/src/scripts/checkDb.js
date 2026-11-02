import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_sLDKE9Y5ApXH@ep-long-paper-a12j3nym-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function checkLiveDatabase() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const t0 = Date.now();
    await client.connect();
    const latency = Date.now() - t0;

    console.log('========================================================');
    console.log('  🟢 LIVE NEON DATABASE STATUS: ONLINE & CONNECTED');
    console.log(`  ⏱️  Latency: ${latency} ms`);
    console.log(`  🌐 Host: ep-long-paper-a12j3nym-pooler.ap-southeast-1.aws.neon.tech`);
    console.log('========================================================\n');

    // List Tables and Row Counts
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📊 Active Tables & Row Counts:');
    for (const row of tablesRes.rows) {
      const countRes = await client.query(`SELECT count(*) FROM ${row.table_name}`);
      console.log(`   - ${row.table_name.padEnd(16)} : ${countRes.rows[0].count} records`);
    }

    // Sample Data
    console.log('\n🥗 Sample Food Items in Live Database:');
    const foods = await client.query('SELECT name, price, category, rating FROM foods LIMIT 5');
    console.table(foods.rows);

    console.log('👤 Registered Platform Users:');
    const users = await client.query('SELECT name, email, role, reward_points FROM users');
    console.table(users.rows);

    console.log('🎟️ Active Coupons:');
    const coupons = await client.query('SELECT code, discount_value, discount_type, active FROM coupons');
    console.table(coupons.rows);

    console.log('✅ Verification Completed: Live database is fully operational!\n');
  } catch (error) {
    console.error('❌ Database Connection Failed:', error.message || error);
  } finally {
    await client.end();
  }
}

checkLiveDatabase();
