import express, { Router, RequestHandler } from "express";
import { Server as SocketIOServer } from "socket.io";

import * as Api from "../utils/apiHelpers";

export function cacheRoutes(io: SocketIOServer): Router {
  const router = express.Router();

  const clearTournamentCache: RequestHandler<
    {},
    Api.ApiResponse<{ message: string }>,
    {}
  > = Api.withErrorHandling(async (req, res) => {
    const userId = req.user!.id;
    
    console.log(`🧹 Cache clear requested by user ${userId}`);
    
    // Emit websocket event to trigger cache clearing in frontend
    io.emit("cache-clear-requested", {
      userId,
      timestamp: Date.now(),
    });
    
    console.log(`📢 Broadcasted cache-clear-requested event for user ${userId}`);
    
    res.json(Api.success({ message: "Tournament cache clear requested - all worker tabs will clear their caches" }));
  });

  router.post("/clear", clearTournamentCache);

  return router;
}