import React from "react";
import { useParams } from "react-router-dom";
import * as DB from "@shared/types/database";
import { CurrentMatch } from "@shared/types/currentMatch";
import { useCurrentMatch } from "../../hooks/useCurrentMatch";
import { useTournamentData } from "../../hooks/useTournamentData";
import { LoadingErrorWrapper } from "./LoadingErrorWrapper";

// Simplified tournament display data
export interface TournamentDisplayData {
  name: string;
  lexicon: string;
  data_url: string;
}

// Raw division data for overlays to calculate from
export interface DivisionData {
  division: DB.DivisionRow;
  players: DB.PlayerRow[];
  games: DB.GameRow[];
}

export interface BaseOverlayDataProps {
  tournament: TournamentDisplayData;
  divisionData: DivisionData;
  divisionName: string;
  currentMatch: CurrentMatch | null;
}

interface BaseOverlayProps {
  children: (props: BaseOverlayDataProps) => React.ReactNode;
}

type RouteParams = {
  tournamentId?: string;
  divisionName?: string;
};

export const BaseOverlay: React.FC<BaseOverlayProps> = ({ children }) => {
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
  } = useCurrentMatch();
  const currentMatchData = useTournamentData({
    tournamentId: currentMatch?.tournament_id,
    divisionId: currentMatch?.division_id,
  });

  // URL params approach
  const urlParamsData = useTournamentData({
    useUrlParams: true,
  });

  // Choose which data to use
  let tournamentData: DB.Tournament | null;
  let loading: boolean;
  let fetchError: string | null;
  let finalDivisionName: string | undefined;
  let selectedDivisionId: number | null;

  if (shouldUseCurrentMatch) {
    console.log("🔄 BaseOverlay: Using current match data");
    tournamentData = currentMatchData.tournamentData;
    loading = matchLoading || currentMatchData.loading;
    fetchError = matchError || currentMatchData.fetchError;
    finalDivisionName = currentMatch?.division_name;
    selectedDivisionId = currentMatch?.division_id || null;
    console.log("🔧 BaseOverlay: Raw tournament data", {
      currentMatchData_tournamentData: currentMatchData.tournamentData,
      currentMatchData_loading: currentMatchData.loading,
      currentMatch_divisionId: currentMatch?.division_id,
      selectedDivisionId,
    });
  } else {
    console.log("🔄 BaseOverlay: Using URL params data");
    tournamentData = urlParamsData.tournamentData;
    loading = urlParamsData.loading;
    fetchError = urlParamsData.fetchError;
    finalDivisionName = urlParamsData.divisionName;
    selectedDivisionId = urlParamsData.selectedDivisionId;
  }

  // Extract data for overlays
  let tournament: TournamentDisplayData | null = null;
  let divisionData: DivisionData | null = null;

  if (tournamentData && selectedDivisionId) {
    // Extract tournament display data
    tournament = {
      name: tournamentData.tournament.name,
      lexicon: tournamentData.tournament.lexicon,
      data_url: tournamentData.tournament.data_url,
    };

    // Get division-specific data
    const rawDivisionData = tournamentData.divisions.find(
      (d) => d.division.id === selectedDivisionId,
    );

    if (rawDivisionData) {
      console.log("✅ BaseOverlay: Found division data", {
        divisionName: rawDivisionData.division.name,
        players: rawDivisionData.players.length,
        games: rawDivisionData.games.length,
      });

      divisionData = {
        division: rawDivisionData.division,
        players: rawDivisionData.players,
        games: rawDivisionData.games,
      };

      // Use division name from data if we don't have it from other sources
      if (!finalDivisionName) {
        finalDivisionName = rawDivisionData.division.name;
      }
    } else {
      console.warn(
        "⚠️ BaseOverlay: Division not found in tournament data",
        selectedDivisionId,
      );
    }
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
