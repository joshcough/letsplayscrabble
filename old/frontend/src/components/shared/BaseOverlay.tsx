import React from "react";
import { useParams } from "react-router-dom";

import * as Domain from "@shared/types/domain";

import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";
import { ApiService } from "../../services/interfaces";
import { DivisionScopedData, TournamentMetadata } from "../../types/broadcast";
import { LoadingErrorWrapper } from "./LoadingErrorWrapper";

// Helper to convert TournamentMetadata + Division into full Tournament shape
// This maintains backward compatibility with existing overlay code
function createTournamentFromDivisionData(data: DivisionScopedData): Domain.Tournament {
  return {
    id: data.tournament.id,
    name: data.tournament.name,
    city: data.tournament.city,
    year: data.tournament.year,
    lexicon: data.tournament.lexicon,
    longFormName: data.tournament.longFormName,
    dataUrl: data.tournament.dataUrl,
    theme: data.tournament.theme,
    transparentBackground: data.tournament.transparentBackground,
    divisions: [data.division],
  };
}

export interface BaseOverlayDataProps {
  tournament: Domain.Tournament;
  divisionData: Domain.Division;
  divisionName: string;
  currentMatch: Domain.CurrentMatch | null;
}

interface BaseOverlayProps {
  children: (props: BaseOverlayDataProps) => React.ReactNode;
  apiService: ApiService;
}

type RouteParams = {
  tournamentId?: string;
  divisionName?: string;
};

export const BaseOverlay: React.FC<BaseOverlayProps> = ({
  children,
  apiService,
}) => {
  const { tournamentId, divisionName } = useParams<RouteParams>();
  const shouldUseCurrentMatch = !tournamentId || !divisionName;

  console.log("🔧 BaseOverlay: Initializing", {
    tournamentId,
    divisionName,
    shouldUseCurrentMatch,
  });

  // Current match approach
  const {
    currentMatch,
    loading: matchLoading,
    error: matchError,
  } = useCurrentMatch(apiService);
  const currentMatchData = useTournamentData({
    tournamentId: currentMatch?.tournamentId,
    divisionId: currentMatch?.divisionId,
    apiService,
  });

  // URL params approach
  const urlParamsData = useTournamentData({
    useUrlParams: true,
    apiService,
  });

  // Choose which data to use (now DivisionScopedData instead of full Tournament)
  let divisionScopedData: DivisionScopedData | null;
  let loading: boolean;
  let fetchError: string | null;
  let finalDivisionName: string | undefined;
  let selectedDivisionId: number | null;

  if (shouldUseCurrentMatch) {
    console.log("🔄 BaseOverlay: Using current match data");
    divisionScopedData = currentMatchData.tournamentData;
    loading = matchLoading || currentMatchData.loading;
    fetchError = matchError || currentMatchData.fetchError;
    finalDivisionName = currentMatch?.divisionName || divisionScopedData?.division.name;
    selectedDivisionId = currentMatch?.divisionId || divisionScopedData?.division.id || null;
  } else {
    console.log("🔄 BaseOverlay: Using URL params data");
    divisionScopedData = urlParamsData.tournamentData;
    loading = urlParamsData.loading;
    fetchError = urlParamsData.fetchError;
    finalDivisionName = urlParamsData.divisionName;
    selectedDivisionId = urlParamsData.selectedDivisionId;
  }

  // Extract data for overlays from division-scoped data
  let tournament: Domain.Tournament | null = null;
  let divisionData: Domain.Division | null = null;

  if (divisionScopedData) {
    // Convert division-scoped data to tournament shape for backward compatibility
    tournament = createTournamentFromDivisionData(divisionScopedData);
    divisionData = divisionScopedData.division;
    finalDivisionName = divisionScopedData.division.name;
    selectedDivisionId = divisionScopedData.division.id;

    console.log("✅ BaseOverlay: Using division-scoped data", {
      tournamentName: divisionScopedData.tournament.name,
      divisionName: divisionScopedData.division.name,
      players: divisionScopedData.division.players.length,
      games: divisionScopedData.division.games.length,
    });
  }

  // Check if we have complete data
  const hasCompleteData = divisionData && tournament && finalDivisionName;

  console.log("🔍 BaseOverlay: Data status", {
    hasCompleteData,
    tournament: tournament?.name || "null",
    divisionData: divisionData
      ? `${divisionData.players.length} players, ${divisionData.games.length} games`
      : "null",
    finalDivisionName,
    loading,
    fetchError,
  });

  // Only show loading if we don't have data AND we're actually loading
  const shouldShowLoading = !hasCompleteData && loading;

  return (
    <LoadingErrorWrapper loading={shouldShowLoading} error={fetchError}>
      {hasCompleteData
        ? children({
            tournament: tournament!,
            divisionData: divisionData!,
            divisionName: finalDivisionName!,
            currentMatch,
          })
        : shouldShowLoading && <div className="text-black p-2">Loading...</div>}
    </LoadingErrorWrapper>
  );
};
