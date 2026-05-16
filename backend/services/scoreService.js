// ─── Calculate updated user average score ─────────────────────────────────────
// Called after every completed interview to keep user stats current
export const recalculateUserStats = (currentAvg, currentTotal, newScore) => {
  const newTotal = currentTotal + 1;
  // Incremental average formula: avoids re-fetching all past scores
  const newAvg = parseFloat(
    ((currentAvg * currentTotal + newScore) / newTotal).toFixed(2)
  );
  return { newAvg, newTotal };
};

// ─── Convert raw 0-10 score → percentage label ────────────────────────────────
export const scoreToLabel = (score) => {
  if (score >= 9)  return "Excellent";
  if (score >= 7)  return "Good";
  if (score >= 5)  return "Average";
  if (score >= 3)  return "Needs Work";
  return "Poor";
};
