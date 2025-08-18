import React, { useState, useEffect } from "react";

import { Ping } from "@shared/types/websocket";

import {
  BaseOverlay,
  BaseOverlayDataProps,
} from "../../components/shared/BaseOverlay";
import BroadcastManager from "../../hooks/BroadcastManager";
import { ApiService } from "../../services/interfaces";

const PingOverlayPage: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const [pingData, setPingData] = useState<Ping | null>(null);
  const [lastMessageId, setLastMessageId] = useState<number>(0);
  const [missedMessages, setMissedMessages] = useState<number>(0);

  useEffect(() => {
    const cleanup = BroadcastManager.getInstance().onPing((data: Ping) => {
      console.log(`🏓 PingOverlayPage received messageId: ${data.messageId}`);

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
        <div className="p-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-md mx-auto mt-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🏓 Ping Test
            </h1>
          </div>

          <div className="space-y-4">
            {pingData ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-600">
                      Message ID
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {pingData.messageId}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-600">Time</div>
                    <div className="text-lg text-gray-800">
                      {new Date(pingData.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                Waiting for first ping...
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">
                  Missed Messages:
                </span>
                <span
                  className={`text-lg font-bold ${missedMessages > 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {missedMessages}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseOverlay>
  );
};

export default PingOverlayPage;
