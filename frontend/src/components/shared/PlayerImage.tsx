import React from "react";
import * as Domain from "@shared/types/domain";
import { getPlayerImageUrl, formatPlayerName } from "../../utils/playerUtils";

interface PlayerImageProps {
  player: Domain.Player;
  tournamentDataUrl: string;
  className?: string;
  placeholderClassName?: string;
}

/**
 * Displays a player's image with proper fallback logic:
 * 1. First tries tournament file photo (player.photo)
 * 2. Falls back to CrossTables photo (player.xtData.photourl)
 * 3. Final fallback to placeholder with player's initials
 */
const PlayerImage: React.FC<PlayerImageProps> = ({
  player,
  tournamentDataUrl,
  className = "w-36 h-36 rounded-2xl object-cover",
  placeholderClassName = "w-36 h-36 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg",
}) => {
  const [imageError, setImageError] = React.useState(false);
  const hasImage = player.photo || player.xtData?.photourl;

  const getInitials = () => {
    const name = formatPlayerName(player.name);
    return name.split(' ').map(n => n.charAt(0)).join('');
  };

  if (!hasImage || imageError) {
    return (
      <div className={placeholderClassName}>
        {getInitials()}
      </div>
    );
  }

  return (
    <img
      src={getPlayerImageUrl(tournamentDataUrl, player.photo || undefined, player.xtData?.photourl)}
      alt={formatPlayerName(player.name)}
      className={className}
      onError={() => setImageError(true)}
    />
  );
};

export default PlayerImage;
