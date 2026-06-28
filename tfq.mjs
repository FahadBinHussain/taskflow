import { neon } from '@neondatabase/serverless';
const url = process.env.TF_DB_URL;
const sql = neon(url);
const q = process.argv.slice(2).join(' ');
const rows = await sql.query(q);
console.log(JSON.stringify(rows));
