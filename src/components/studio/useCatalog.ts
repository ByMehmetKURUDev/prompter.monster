"use client";

import { useEffect, useState } from "react";
import { applyCatalog, type CatalogRow } from "@/lib/catalog";

/**
 * Loads the admin-managed catalog (/api/catalog) once and applies it to the shared data (experts, project types,
 * presets). `ready` flips to true even when the request fails, so the Studio never waits on it for long;
 * `version` changes when the catalog changed something, which re-renders the Studio.
 */
export function useCatalog(): { ready: boolean; version: number } {
  const [state, setState] = useState({ ready: false, version: 0 });
  useEffect(() => {
    let alive = true;
    const done = (changed: boolean) => alive && setState((s) => ({ ready: true, version: s.version + (changed ? 1 : 0) }));
    const timer = window.setTimeout(() => done(false), 2500); // never block the Studio on a slow request
    fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { rows?: CatalogRow[] } | null) => done(Array.isArray(j?.rows) ? applyCatalog(j!.rows!) : false))
      .catch(() => done(false))
      .finally(() => window.clearTimeout(timer));
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);
  return state;
}
