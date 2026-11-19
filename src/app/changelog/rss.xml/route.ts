import { rssResponse } from "@/lib/changelog-public";

/** RSS feed of the public release notes (Turkish). */
export function GET() {
  return rssResponse("tr");
}
