/**
 * Downloadable extensions shown on /extensions. The zips are built from extension/ and raycast-extension/
 * by scripts/build-extension-zips.mjs before every `next build` and `next dev` (public/downloads/, not in git),
 * so a download always matches the source in the repo.
 * Store links stay empty until a listing is live; the page then offers the store as the main button.
 */
import chromeManifest from "../../extension/manifest.json";

export const CHROME_EXTENSION = {
  version: chromeManifest.version,
  zip: "/downloads/prompter-monster-chrome.zip",
  folder: "prompter-monster-chrome",
  /** Chrome Web Store listing, once published. */
  storeUrl: "" as string,
};

export const RAYCAST_EXTENSION = {
  zip: "/downloads/prompter-monster-raycast.zip",
  folder: "prompter-monster-raycast",
  /** Raycast Store page (https://www.raycast.com/<author>/prompter-monster), once published. */
  storeUrl: "" as string,
  /** developers.raycast.com/basics/getting-started (November 2026). */
  minRaycast: "1.26",
  minNode: "22.14",
};

/** AI chat sites the Chrome extension recognises by name (extension/popup/popup.js#SITES). */
export const CHROME_EXTENSION_SITES = ["ChatGPT", "Claude", "Gemini", "Copilot", "Perplexity", "Le Chat", "Grok", "DeepSeek", "Poe"];
