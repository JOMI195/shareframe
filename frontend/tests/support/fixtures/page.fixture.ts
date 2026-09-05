export const emptyPage = { count: 0, next: null, previous: null, page: 1, results: [] };

export const makePage = <T>(results: T[], over: Record<string, unknown> = {}) => ({
  count: results.length,
  next: null,
  previous: null,
  page: 1,
  results,
  ...over,
});
