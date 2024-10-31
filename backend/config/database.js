const { Pool } = require('pg');

const isDevelopment = process.env.NODE_ENV !== 'production';

const developmentConfig = {
  user: 'scrabble_user',
  password: 'scrabble_pass',
  host: 'localhost',
  database: 'scrabble_stats',
  port: 5432
};

const productionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(isDevelopment ? developmentConfig : productionConfig);

pool.on('connect', () => {
  console.log(`Database connected successfully in ${process.env.NODE_ENV} mode`);
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};