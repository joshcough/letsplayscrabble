import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import * as DB from "@shared/types/database";
import BroadcastManager from "./BroadcastManager";
import { fetchTournament, fetchTournamentDivision } from "../utils/api";

interface UseTournamentDataProps {
  tournamentId?: number;
  divisionId?: number;
  useUrlParams?: boolean;
}

type RouteParams = {
  [key: string]: string | undefined;
  userId: string;
  tournamentId?: string;
  divisionName?: string;
};

export const useTournamentData = ({
  tournamentId: propTournamentId,
  divisionId: propDivisionId,
  useUrlParams = false,
}: UseTournamentDataProps) => {
  const {
    userId,
    tournamentId: urlTournamentId,
    divisionName,
  } = useParams<RouteParams>();

  const [tournamentData, setTournamentData] = useState<DB.Tournament | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(
    null,
  );

  const shouldUseUrlParams = useUrlParams && urlTournamentId && divisionName;
  const effectiveTournamentId = shouldUseUrlParams
    ? Number(urlTournamentId)
    : propTournamentId;

  const fetchTournamentData = async () => {
    if (!userId || !effectiveTournamentId) {
      setFetchError("Missing required parameters");
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      let tournament: DB.Tournament;
      let finalDivisionId: number | null = null;

      if (shouldUseUrlParams) {
        tournament = await fetchTournament(
          parseInt(userId),
          effectiveTournamentId,
        );
      } else if (propDivisionId) {
        tournament = await fetchTournamentDivision(
          parseInt(userId),
          effectiveTournamentId,
          propDivisionId,
        );
        finalDivisionId = propDivisionId;
      } else {
        tournament = await fetchTournament(
          parseInt(userId),
          effectiveTournamentId,
        );
      }

      if (shouldUseUrlParams && divisionName) {
        const divisionData = tournament.divisions.find(
          (d) => d.division.name.toUpperCase() === divisionName.toUpperCase(),
        );
        if (!divisionData) {
          throw new Error(`Division "${divisionName}" not found`);
        }
        finalDivisionId = divisionData.division.id;
      }

      setTournamentData(tournament);
      setSelectedDivisionId(finalDivisionId);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to fetch tournament data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && effectiveTournamentId) {
      if (shouldUseUrlParams || propTournamentId) {
        fetchTournamentData();
      }
    }
  }, [
    userId,
    effectiveTournamentId,
    propDivisionId,
    divisionName,
    shouldUseUrlParams,
  ]);

  useEffect(() => {
    if (!userId || !effectiveTournamentId) return;

    const cleanupGamesAdded = BroadcastManager.getInstance().onGamesAdded((data: any) => {
      console.log("🎮 useTournamentData received GamesAdded broadcast:", data);
      if (
        data.userId === parseInt(userId) &&
        data.tournamentId === effectiveTournamentId
      ) {
        console.log("✅ Matching tournament - refetching data!");
        fetchTournamentData();
      } else {
        console.log("⏭️ Different tournament - ignoring");
      }
    });

    return () => {
      cleanupGamesAdded();
    };
  }, [userId, effectiveTournamentId]);

  useEffect(() => {
    if (!userId || !effectiveTournamentId) return;

    const cleanupAdminUpdate = BroadcastManager.getInstance().onAdminPanelUpdate((data: any) => {
      console.log("🎮 useTournamentData received AdminPanelUpdate broadcast:", data);
      if (
        data.userId === parseInt(userId) &&
        data.tournamentId === effectiveTournamentId
      ) {
        console.log("✅ Matching tournament - refetching data!");
        fetchTournamentData();
      } else {
        console.log("⏭️ Different tournament - ignoring");
      }
    });

    return () => {
      cleanupAdminUpdate();
    };
  }, [userId, effectiveTournamentId]);

  const getDivisionData = (divisionId?: number) => {
    if (!tournamentData) return null;
    const targetDivisionId = divisionId || selectedDivisionId;
    if (!targetDivisionId) return null;
    return (
      tournamentData.divisions.find(
        (d) => d.division.id === targetDivisionId,
      ) || null
    );
  };

  const getDivisionName = (divisionId?: number) => {
    const divisionData = getDivisionData(divisionId);
    return (
      divisionData?.division.name ||
      (shouldUseUrlParams ? divisionName : undefined)
    );
  };

  return {
    tournamentData,
    getDivisionData,
    selectedDivisionId,
    divisionName: getDivisionName(),
    loading,
    fetchError,
    refetch: fetchTournamentData,
  };
};