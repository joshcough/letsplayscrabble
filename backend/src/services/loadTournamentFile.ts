import axios from "axios";
import fs from "fs/promises";

import { TournamentData } from "../types/scrabbleFileFormat";
import { crossTablesSync } from "./crossTablesSync";

export async function loadTournamentFile(
  source: string,
  skipSync: boolean = false,
): Promise<TournamentData> {
  try {
    let jsContent: string;

    // Check if it's a URL or local file
    if (source.startsWith("http")) {
      // Handle remote file
      const response = await axios.get(source, {
        timeout: 25000,
        transformResponse: [(data: string) => data],
      });
      jsContent = response.data;
    } else {
      // Handle local file
      jsContent = await fs.readFile(source, "utf-8");
    }

    // Create a new Function that returns the object portion
    const objectText = jsContent.substring(jsContent.indexOf("{"));
    const evaluator = new Function("return " + objectText);
    const data = evaluator();

    if (!data || !data.divisions) {
      throw new Error("Could not parse tournament data from the JS file.");
    }

    const tournamentData = data as TournamentData;
    
    if (!skipSync) {
      // Sync with cross-tables data for any players missing xtid
      console.log(`🔍 LoadTournamentFile: Checking tournament from ${source} for cross-tables sync...`);
      const syncedData = await crossTablesSync.syncTournamentWithCrossTablesData(tournamentData);
      return syncedData;
    } else {
      // Polling mode - skip sync, stay quiet
      return tournamentData;
    }
  } catch (error) {
    console.error("Error loading tournament file:", error);
    throw error;
  }
}
