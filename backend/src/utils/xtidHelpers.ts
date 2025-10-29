/**
 * Utility functions for handling embedded CrossTables IDs in tournament files
 */

/**
 * Strips CrossTables ID from player name if present
 * Examples:
 * "Tunnicliffe, Matthew:XT017175" -> "Tunnicliffe, Matthew"
 * "Josh Cough" -> "Josh Cough" (no change)
 */
export function stripXtidFromPlayerName(name: string): string {
  const xtidPattern = /:XT\d+$/;
  return name.replace(xtidPattern, '');
}

/**
 * Extracts CrossTables ID from etc.xtid field
 * Handles both single number and array formats
 * Examples:
 * [17175] -> 17175
 * 17175 -> 17175
 * null/undefined -> null
 */
export function extractXtidFromEtc(xtidValue: number | number[] | null | undefined): number | null {
  if (xtidValue === null || xtidValue === undefined) {
    return null;
  }

  if (Array.isArray(xtidValue)) {
    // If it's an array, take the first element (most common case)
    return xtidValue.length > 0 ? xtidValue[0] : null;
  }

  if (typeof xtidValue === 'number') {
    return xtidValue;
  }

  return null;
}

/**
 * Extracts CrossTables ID from player name if present
 * Examples:
 * "Tunnicliffe, Matthew:XT017175" -> 17175
 * "Josh Cough" -> null
 */
export function extractXtidFromPlayerName(name: string): number | null {
  const xtidMatch = name.match(/:XT(\d+)$/);
  return xtidMatch ? parseInt(xtidMatch[1], 10) : null;
}

/**
 * Gets the best available xtid from player data
 * Priority: etc.xtid -> extract from name -> null
 */
export function getBestXtid(name: string, etcXtid?: number | number[] | null): number | null {
  // First try to get from etc.xtid
  const xtidFromEtc = extractXtidFromEtc(etcXtid);
  if (xtidFromEtc !== null) {
    return xtidFromEtc;
  }

  // Fallback to extracting from name
  return extractXtidFromPlayerName(name);
}