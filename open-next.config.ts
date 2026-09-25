import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default config: static pages are served from Workers Assets, dynamic routes
// (Studio API) run in the Worker. Add an incremental cache here when ISR is needed.
export default defineCloudflareConfig();
