import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

// Link z Supabase pobierany z .env
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Wymagane dla Supabase, żeby pozwoliło na bezpieczne połączenie SSL
  }
});

// Test połączenia przy starcie
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Błąd połączenia z Supabase:', err);
  } else {
    console.log('✅ Połączono z bazą danych Supabase!');
  }
});

export default pool;