import { unstable_cache, revalidateTag } from "next/cache";
import { fetchAllData } from "./data";
import type { SchedStackData } from "./parentvue/types";

const CACHE_TAG = "schedstack-data";

export const getCachedData: () => Promise<SchedStackData> = unstable_cache(
  async () => {
    return fetchAllData();
  },
  ["schedstack-assignments"],
  {
    tags: [CACHE_TAG],
    revalidate: 90000, // ~25 hours
  }
);

export async function invalidateCache(): Promise<void> {
  revalidateTag(CACHE_TAG, "default");
}
