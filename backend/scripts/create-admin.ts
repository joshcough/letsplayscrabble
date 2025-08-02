// backend/scripts/create-admin.ts
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import { pool } from "../src/config/database";

dotenv.config();

async function createAdmin(username: string, password: string): Promise<void> {
  if (!username || !password) {
    console.error("Usage: ts-node create-admin.ts <username> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)",
      [username, passwordHash],
    );

    console.log("Admin user created successfully");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    await pool.end();
    process.exit(1);
  }
}

// Usage: ts-node scripts/create-admin.ts username password
createAdmin(process.argv[2], process.argv[3]);
