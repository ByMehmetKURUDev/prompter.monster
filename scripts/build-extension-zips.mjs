#!/usr/bin/env node
/**
 * Builds the downloadable extension archives for /extensions into public/downloads/ (git-ignored).
 * Runs before `next build` and `next dev` (package.json), so the downloads always match the sources:
 *
 *   prompter-monster-chrome.zip   ← extension/          (top folder: prompter-monster-chrome/)
 *   prompter-monster-raycast.zip  ← raycast-extension/  (top folder: prompter-monster-raycast/, no node_modules)
 *
 * Dependency-free (node:zlib) and deterministic: entries are sorted and timestamps fixed, so the same
 * sources always give the same bytes.
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = join(ROOT, "public", "downloads");

const ARCHIVES = [
  { src: "extension", file: "prompter-monster-chrome.zip", folder: "prompter-monster-chrome", skip: [] },
  {
    src: "raycast-extension",
    file: "prompter-monster-raycast.zip",
    folder: "prompter-monster-raycast",
    // Build output, installed packages and local tooling state: the user runs `npm install` themselves.
    skip: ["node_modules", "dist", ".harnesskit", ".eslintcache", "raycast-env.d.ts"],
  },
];
const ALWAYS_SKIP = new Set([".DS_Store", "Thumbs.db", ".git"]);

// Fixed 2026-01-01 00:00 (MS-DOS date/time fields).
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
const DOS_TIME = 0;

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Files and folders under `dir`, depth-first in name order (folders as entries ending in "/"). */
function collect(dir, base, skip) {
  const entries = [];
  for (const name of readdirSync(dir).sort()) {
    if (ALWAYS_SKIP.has(name) || skip.includes(name)) continue;
    const path = join(dir, name);
    const rel = relative(base, path).split(sep).join("/");
    const st = statSync(path);
    if (st.isDirectory()) entries.push({ name: `${rel}/`, data: null }, ...collect(path, base, skip));
    else if (st.isFile()) entries.push({ name: rel, data: readFileSync(path) });
  }
  return entries;
}

/** A plain ZIP (deflate or store per file, UTF-8 names, Unix permissions 644/755). */
function zip(entries) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8");
    const isDir = e.data === null;
    const raw = isDir ? Buffer.alloc(0) : e.data;
    const deflated = isDir ? raw : deflateRawSync(raw, { level: 9 });
    const useDeflate = !isDir && deflated.length < raw.length;
    const body = useDeflate ? deflated : raw;
    const method = useDeflate ? 8 : 0;
    const crc = isDir ? 0 : crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed to extract (2.0)
    local.writeUInt16LE(0x0800, 6); // flags: UTF-8 file names
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, name, body);

    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0);
    head.writeUInt16LE((3 << 8) | 20, 4); // made by Unix, 2.0 (so permissions below apply)
    head.writeUInt16LE(20, 6);
    head.writeUInt16LE(0x0800, 8);
    head.writeUInt16LE(method, 10);
    head.writeUInt16LE(DOS_TIME, 12);
    head.writeUInt16LE(DOS_DATE, 14);
    head.writeUInt32LE(crc, 16);
    head.writeUInt32LE(body.length, 20);
    head.writeUInt32LE(raw.length, 24);
    head.writeUInt16LE(name.length, 28);
    // extra length, comment length, disk number, internal attributes: 0
    head.writeUInt32LE(isDir ? ((0o40755 << 16) | 0x10) >>> 0 : (0o100644 << 16) >>> 0, 38);
    head.writeUInt32LE(offset, 42);
    central.push(head, name);

    offset += local.length + name.length + body.length;
  }
  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, dir, end]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const a of ARCHIVES) {
  const base = join(ROOT, a.src);
  const files = collect(base, base, a.skip).map((e) => ({ ...e, name: `${a.folder}/${e.name}` }));
  if (!files.some((e) => e.data !== null)) throw new Error(`build-extension-zips: ${a.src}/ is empty`);
  const buf = zip([{ name: `${a.folder}/`, data: null }, ...files]);
  writeFileSync(join(OUT_DIR, a.file), buf);
  const count = files.filter((e) => e.data !== null).length;
  console.log(`extension zip: public/downloads/${a.file} (${count} files, ${(buf.length / 1024).toFixed(1)} KB)`);
}
