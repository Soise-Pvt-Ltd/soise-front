export type PaginationMeta = {
  limit: number;
  offset: number;
  /** Rows on the page that was just returned. */
  count: number;
  /** Every row matching the current filters. Absent on older responses. */
  total?: number;
};

/**
 * How many rows exist in total, across every page.
 *
 * Reading `count` as the total is what pinned every dashboard list on page
 * one: a full page always makes `offset + limit >= count` true, so Next was
 * disabled from the very first render and everything past the first 50 rows
 * was unreachable through the UI.
 *
 * Falls back to `count` purely so a backend that hasn't been deployed yet
 * degrades to the old behaviour rather than rendering NaN.
 */
export function totalRows(
  pagination: { count?: number; total?: number } | null | undefined,
): number {
  return pagination?.total ?? pagination?.count ?? 0;
}
