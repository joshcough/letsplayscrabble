// Register ts-node to handle TypeScript files
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
  },
});

require("dotenv").config({
  path: require("path").resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || "development"}`,
  ),
});

const config = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "scrabble_user",
      password: process.env.DB_PASSWORD || "scrabble_pass",
      database: process.env.DB_NAME || "scrabble_stats",
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./seeds",
    },
  },

  production: {
    client: "postgresql",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./seeds",
      extension: "ts",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

module.exports = config[process.env.NODE_ENV || "development"];
