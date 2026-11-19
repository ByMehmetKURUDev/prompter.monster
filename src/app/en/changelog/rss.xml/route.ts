import { rssResponse } from "@/lib/changelog-public";

/** RSS feed of the public release notes (English). */
export function GET() {
  return rssResponse("en");
}
