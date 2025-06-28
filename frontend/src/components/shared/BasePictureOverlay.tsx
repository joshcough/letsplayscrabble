import React from "react";
import { PlayerStats } from "@shared/types/tournament";
import { SortType } from "../../utils/pictureOverlayUtils";
import PictureOverlayCurrentMatch from "../overlay/PictureOverlayCurrentMatch";
import PictureOverlayUrl from "../overlay/PictureOverlayUrl";

interface BasePictureOverlayProps {
  title: string;
  sortType: SortType;
  renderPlayerContent: (player: PlayerStats) => React.ReactNode;
  useCurrentMatch?: boolean; // true for current match, false for URL params
}

export const BasePictureOverlay: React.FC<BasePictureOverlayProps> = ({
  title,
  sortType,
  renderPlayerContent,
  useCurrentMatch = true
}) => {
  if (useCurrentMatch) {
    return (
      <PictureOverlayCurrentMatch
        title={title}
        sortType={sortType}
        renderPlayerContent={renderPlayerContent}
      />
    );
  } else {
    return (
      <PictureOverlayUrl
        title={title}
        sortType={sortType}
        renderPlayerContent={renderPlayerContent}
      />
    );
  }
};