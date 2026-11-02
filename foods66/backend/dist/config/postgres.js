import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_sLDKE9Y5ApXH@ep-long-paper-a12j3nym-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
export const pgPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
export const connectPostgres = async () => {
    try {
        const client = await pgPool.connect();
        const res = await client.query('SELECT NOW() as current_time');
        client.release();
        console.log(`✅ Neon PostgreSQL live database connected successfully (${res.rows[0].current_time})`);
        return true;
    }
    catch (err) {
        console.error('⚠️ Neon PostgreSQL connection error:', err?.message || err);
        return false;
    }
};
export const pgQuery = async (text, params) => {
    return pgPool.query(text, params);
};
//# sourceMappingURL=postgres.js.map