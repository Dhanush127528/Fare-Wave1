// Levenshtein distance algorithm to find the minimum number of single-character edits required to change one word into another
function getLevenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

// Autocorrects a misspelled station name to the closest valid station
function autoCorrectStation(input, validStations) {
  if (!input) return null;
  
  let closestStation = null;
  let minDistance = Infinity;
  
  for (const station of validStations) {
    const dist = getLevenshteinDistance(input.toLowerCase(), station.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      closestStation = station;
    }
  }
  
  // Only auto-correct if the spelling is reasonably close (allows 3-4 typos depending on word length)
  const maxAllowedTypos = Math.max(3, Math.floor(input.length * 0.4));
  
  if (minDistance <= maxAllowedTypos) {
    return closestStation;
  }
  
  return null; // Word is completely unrecognized
}

module.exports = {
  autoCorrectStation
};
