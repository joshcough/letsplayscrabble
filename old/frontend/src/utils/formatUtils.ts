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

/**
 * Format a date string from YYYY-MM-DD to "MMM D, YYYY" format
 * Example: "2025-10-17" -> "Oct 17, 2025"
 */
export const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};
