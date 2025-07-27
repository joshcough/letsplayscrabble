import axios from "axios";
import fs from "fs/promises";

import { TournamentData } from "@shared/types/scrabbleFileFormat";

export async function loadTournamentFile(
  source: string,
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

    return data as TournamentData;
  } catch (error) {
    console.error("Error loading tournament file:", error);
    throw error;
  }
}
