import React, { useState, useEffect } from "react";

import { Ping } from "@shared/types/websocket";

import {
  BaseOverlay,
  BaseOverlayDataProps,
} from "../../../components/shared/BaseOverlay";
import { BaseModernOverlay } from "../../../components/shared/BaseModernOverlay";
import BroadcastManager from "../../../hooks/BroadcastManager";
import { ApiService } from "../../../services/interfaces";
import { Theme } from "../../../types/theme";

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
    <BaseModernOverlay>
      {(theme, themeClasses) => (
        <BaseOverlay apiService={apiService}>
          {({ tournament, divisionData, divisionName }: BaseOverlayDataProps) => (
            <div className={`${theme.colors.pageBackground} min-h-screen flex items-center justify-center p-6`}>
              <div className={`${theme.colors.cardBackground} rounded-3xl p-8 border-2 ${theme.colors.primaryBorder} shadow-2xl ${theme.colors.shadowColor} max-w-md w-full`}>
                <div className="text-center mb-8">
                  <h1 className={`text-4xl font-bold ${theme.name === 'original' ? theme.colors.titleGradient : `text-transparent bg-clip-text bg-gradient-to-r ${theme.colors.titleGradient}`}`}>
                    🏓 Ping Test
                  </h1>
                </div>

                <div className="space-y-6">
                  {pingData ? (
                    <div className={`bg-gray-800/50 p-6 rounded-2xl border ${theme.colors.primaryBorder}`}>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className={`text-sm font-semibold ${theme.colors.textAccent} uppercase tracking-wider mb-2`}>
                            Message ID
                          </div>
                          <div className="text-3xl font-bold ${theme.colors.textPrimary}">
                            {pingData.messageId}
                          </div>
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${theme.colors.textAccent} uppercase tracking-wider mb-2`}>
                            Time
                          </div>
                          <div className="text-xl ${theme.colors.textPrimary}">
                            {new Date(pingData.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`bg-gray-800/50 p-6 rounded-2xl border ${theme.colors.primaryBorder} text-center`}>
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
      )}
    </BaseModernOverlay>
  );
};

export default PingModernOverlayPage;