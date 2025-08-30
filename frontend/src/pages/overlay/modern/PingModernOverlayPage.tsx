import React, { useState, useEffect } from "react";

import { Ping } from "@shared/types/websocket";

import {
  BaseOverlay,
  BaseOverlayDataProps,
} from "../../../components/shared/BaseOverlay";
import BroadcastManager from "../../../hooks/BroadcastManager";
import { ApiService } from "../../../services/interfaces";

const PingModernOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const [pingData, setPingData] = useState<Ping | null>(null);
  const [lastMessageId, setLastMessageId] = useState<number>(0);
  const [missedMessages, setMissedMessages] = useState<number>(0);

  useEffect(() => {
    const cleanup = BroadcastManager.getInstance().onPing((data: Ping) => {
      console.log(`🏓 PingModernOverlayPage received messageId: ${data.messageId}`);

      // Check for missed messages
      if (lastMessageId > 0 && data.messageId > lastMessageId + 1) {
        const missed = data.messageId - lastMessageId - 1;
        setMissedMessages((prev) => prev + missed);
      }

      setPingData(data);
      setLastMessageId(data.messageId);
    });

    return cleanup;
  }, [lastMessageId]);

  return (
    <BaseOverlay apiService={apiService}>
      {({ tournament, divisionData, divisionName }: BaseOverlayDataProps) => (
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center p-6">
          <div className="bg-gradient-to-br from-blue-900/50 to-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border-2 border-blue-400/50 shadow-2xl shadow-blue-400/10 max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                🏓 Ping Test
              </h1>
            </div>

            <div className="space-y-6">
              {pingData ? (
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-blue-400/30">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2">
                        Message ID
                      </div>
                      <div className="text-3xl font-bold text-white">
                        {pingData.messageId}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2">
                        Time
                      </div>
                      <div className="text-xl text-white">
                        {new Date(pingData.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 p-6 rounded-2xl border border-blue-400/30 text-center">
                  <div className="text-gray-400 animate-pulse">
                    Waiting for first ping...
                  </div>
                </div>
              )}

              <div className={`p-6 rounded-2xl border ${missedMessages > 0 ? 'bg-red-900/30 border-red-400/50' : 'bg-green-900/30 border-green-400/50'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-300">
                    Missed Messages:
                  </span>
                  <span className={`text-2xl font-bold ${missedMessages > 0 ? "text-red-400" : "text-green-400"}`}>
                    {missedMessages}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseOverlay>
  );
};

export default PingModernOverlayPage;