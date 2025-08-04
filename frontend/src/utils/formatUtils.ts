/**
 * Format a number with a + sign for positive values
 */
export const formatNumberWithSign = (value: number): string => {
  return value > 0 ? `+${value}` : value.toString();
};

// Helper function to get ordinal (1st, 2nd, 3rd, etc.)
export const getOrdinal = (num: number): string => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};
