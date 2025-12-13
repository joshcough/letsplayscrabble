export const todayISOImpl = function() {
  // Match TypeScript version exactly: new Date().toISOString().split('T')[0]
  return new Date().toISOString().split('T')[0];
};

export const toLocaleDateStringImpl = function(dateStr) {
  // Match TypeScript: new Date(game.date).toLocaleDateString()
  return new Date(dateStr).toLocaleDateString();
};
