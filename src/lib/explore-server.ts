import { cache } from "react";
import { exploreStats, type ExploreStats } from "./explore";

/**
 * Counter of one Keşfet filter page (type or expert), cached per request: the page's generateMetadata (robots)
 * and ExploreView (header counter) share one explore_stats_v4 call. Primitive arguments, because React's cache
 * compares arguments by identity.
 */
export const filterStats = cache(
  (type: string | null, expert: string | null): Promise<ExploreStats> =>
    exploreStats({ type: type ?? undefined, expert: expert ?? undefined }),
);
