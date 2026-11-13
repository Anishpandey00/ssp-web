// Combines the Task service's summary and the Quiz service's scores into the
// numbers the Dashboard and Progress pages show. `scores` is null when the
// Quiz service could not be reached: the task numbers are still returned.
export function combineProgress(summary, scores) {
  const totalTasks = summary.totalTasks;
  const completedTasks = summary.completedTasks;
  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    quizzesTaken: scores ? scores.length : 0,
    scores: scores || [],
    scoresUnavailable: !scores,
  };
}
