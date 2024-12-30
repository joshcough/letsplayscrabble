module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      database: 'scrabble_stats',
      user: 'scrabble_user',
      password: 'scrabble_pass',
      host: 'localhost'
    },
    migrations: {
      directory: './migrations'
    }
  },
  production: {
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations'
    }
  }
};