import { Pool, PoolConfig } from "pg";

interface DatabaseConfig extends PoolConfig {
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

const isDevelopment = process.env.NODE_ENV !== "production";

const developmentConfig: DatabaseConfig = {
  user: "scrabble_user",
  password: "scrabble_pass",
  host: "localhost",
  database: "scrabble_stats",
  port: 5432,
};

const productionConfig: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
};

const pool = new Pool(isDevelopment ? developmentConfig : productionConfig);

pool.on("connect", () => {
  console.log(
    `Database connected successfully in ${process.env.NODE_ENV} mode`,
  );
});

pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export { pool };
