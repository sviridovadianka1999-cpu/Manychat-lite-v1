import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const sql = fs.readFileSync('sql/init.sql', 'utf8');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(sql);
await pool.end();
console.log('DB initialized');
