// Guard for the PUBLIC repo (CLAUDE.md §0, ADR 0008): blocks files and content that must never be committed.
//   node scripts/check-staged.mjs        → checks staged files (pre-commit hook), reading the STAGED content
//   node scripts/check-staged.mjs --all  → checks every tracked file at HEAD (CI)
// Exit code 1 = blocked.
import { execFileSync } from "node:child_process";

const all = process.argv.includes("--all");
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const files = (all ? git("ls-files") : git("diff", "--cached", "--name-only", "--diff-filter=ACMR"))
  .split("\n")
  .map((f) => f.trim())
  .filter(Boolean);

// Third-party skill bundles ship their own data files; they're reviewed when installed.
const vendored = (f) => f.startsWith(".agents/") || f.startsWith(".claude/skills/") && !f.startsWith(".claude/skills/ajv-lms/");
const isFixture = (f) => f.includes("/fixtures/");

const forbiddenPaths = [
  { test: (f) => f.startsWith("screens/"), why: "real student screenshots" },
  { test: (f) => /^\.env(\..+)?$/.test(f.split("/").pop()) && !f.endsWith(".env.example"), why: "secrets file" },
  { test: (f) => f.startsWith("data/private/"), why: "real student data folder" },
  { test: (f) => /\.(csv|xlsx?|ods|tsv)$/i.test(f) && !vendored(f) && !isFixture(f),
    why: "spreadsheet (may be a student roster); put fictional samples under a fixtures/ folder" },
  { test: (f) => /\.(sql\.gz|dump|backup|bak)$/i.test(f), why: "database dump" },
  { test: (f) => /\.(png|jpe?g|heic|webp|gif)$/i.test(f) && !f.startsWith("public/") && !f.startsWith("docs/") && !f.startsWith("src/app/") && !vendored(f),
    why: "image outside public/, docs/ or src/app/ (could be a screenshot with student data)" },
];

const secretPatterns = [
  { re: /postgres(?:ql)?:\/\/[^:\s"']+:(?!CHANGE_ME@|password@|ci@|\$\{)[^@\s"'()[\]^+*]{6,}@/, why: "database URL with a password" },
  { re: /BETTER_AUTH_SECRET\s*[=:]\s*["']?(?!generate-|ci-only-)[A-Za-z0-9+/=_-]{24,}/, why: "auth secret" },
  { re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, why: "private key" },
  { re: /\b(?:ghp|gho|github_pat|sk_live|rk_live|re)_[A-Za-z0-9_]{20,}/, why: "API token" },
];
// Real student numbers look like 20YY-NNNN with YY ≤ 89. Fictional ones use 2099-.
const studentNumber = /\b20[0-8]\d-(?!20\d\d\b)\d{4}\b/; // excludes school years like 2026-2027

const readContent = (f) => {
  try {
    return all ? git("show", `HEAD:${f}`) : git("show", `:${f}`); // staged copy, not the working tree
  } catch {
    return null;
  }
};

const problems = [];
for (const file of files) {
  const bad = forbiddenPaths.find((p) => p.test(file));
  if (bad) {
    problems.push(`${file}: ${bad.why}`);
    continue;
  }
  if (vendored(file) || /\.(png|jpe?g|ico|woff2?|pdf|lock)$/i.test(file) || file === "pnpm-lock.yaml") continue;
  const content = readContent(file);
  if (content == null || content.includes("\u0000")) continue; // deleted or binary
  for (const { re, why } of secretPatterns) if (re.test(content)) problems.push(`${file}: looks like it contains a ${why}`);
  const m = content.match(studentNumber);
  if (m && !isFixture(file)) problems.push(`${file}: "${m[0]}" looks like a real student number (use 2099-NNNN for fictional ones)`);
}

if (problems.length) {
  console.error("\n✖ Blocked: these must not go into the public repo (CLAUDE.md §0):\n");
  for (const p of problems) console.error(`  - ${p}`);
  if (!all) console.error("\nUnstage with: git restore --staged <file>\n");
  process.exit(1);
}
