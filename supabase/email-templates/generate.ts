/**
 * Regenerates the Supabase Auth e-mail templates in this folder from src/lib/email/auth-templates.ts.
 *   npx tsx supabase/email-templates/generate.ts
 * Then paste each file into Supabase Dashboard → Authentication → Emails (subjects: subjects.json).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { AUTH_EMAIL_KINDS, goTemplate } from "../../src/lib/email/auth-templates";

const dir = join(process.cwd(), "supabase", "email-templates");
const subjects: Record<string, string> = {};
for (const kind of AUTH_EMAIL_KINDS) {
  const t = goTemplate(kind);
  writeFileSync(join(dir, `${kind}.html`), t.content);
  subjects[kind] = t.subject;
}
writeFileSync(join(dir, "subjects.json"), JSON.stringify(subjects, null, 2) + "\n");
console.log(`wrote ${AUTH_EMAIL_KINDS.length} templates + subjects.json to ${dir}`);
