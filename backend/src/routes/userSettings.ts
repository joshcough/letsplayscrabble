import express, { Request, Response, RequestHandler } from "express";

import { UserSettingsSuccessData, UpdateUserSettingsRequest } from "@shared/types/api";
import { Pool } from "pg";

import * as Api from "../utils/apiHelpers";

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

const db: Pool = require("../config/database").pool;

const getUserSettingsHandler: RequestHandler<
  {},
  Api.ApiResponse<UserSettingsSuccessData>
> = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json(Api.failure("User not authenticated"));
      return;
    }

    const result = await db.query(
      "SELECT theme FROM users WHERE id = $1",
      [userId]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      res.status(404).json(Api.failure("User not found"));
      return;
    }

    res.json(Api.success({
      theme: user.theme || "modern"
    }));
    return;
  } catch (error) {
    console.error("Get user settings error:", error);
    res.status(500).json(Api.failure("Server error"));
    return;
  }
};

const updateUserSettingsHandler: RequestHandler<
  {},
  Api.ApiResponse<UserSettingsSuccessData>,
  UpdateUserSettingsRequest
> = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { theme } = req.body;
    
    if (!userId) {
      res.status(401).json(Api.failure("User not authenticated"));
      return;
    }

    // Validate theme
    const validThemes = ["modern", "scrabble", "july4", "original"];
    if (!validThemes.includes(theme)) {
      res.status(400).json(Api.failure("Invalid theme"));
      return;
    }

    await db.query(
      "UPDATE users SET theme = $1 WHERE id = $2",
      [theme, userId]
    );

    res.json(Api.success({
      theme: theme
    }));
    return;
  } catch (error) {
    console.error("Update user settings error:", error);
    res.status(500).json(Api.failure("Server error"));
    return;
  }
};

router.get("/", getUserSettingsHandler);
router.put("/", updateUserSettingsHandler);

export default router;