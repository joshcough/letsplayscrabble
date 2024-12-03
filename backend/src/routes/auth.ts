// src/routes/auth.ts
import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

const router = express.Router();

interface LoginRequest {
  username: string;
  password: string;
}

interface AdminUser {
  username: string;
  password_hash: string;
}

// Your database connection
const db: Pool = require("../config/database").pool;

const loginHandler: RequestHandler = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { username, password } = req.body;

  try {
    const result = await db.query<AdminUser>(
      "SELECT * FROM admin_users WHERE username = $1",
      [username],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET!, {
      expiresIn: "24h",
    });

    res.json({ token });
    return;
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
    return;
  }
};

router.post("/login", loginHandler);

export default router;
