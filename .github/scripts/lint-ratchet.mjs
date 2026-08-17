#!/usr/bin/env node
/**
 * Lint ratchet (VGC-273).
 *
 * CI lint used to run with `continue-on-error: true` and no visibility, so a
 * pre-existing pile of errors was invisible and there was nothing stopping it
 * from growing. Making lint fully blocking today is not viable — the
 * outstanding errors are react-hooks correctness rules that need real
 * per-component behavioural fixes.
 *
 * So instead: read eslint's JSON report, print the count prominently, and exit
 * non-zero if the error count EXCEEDS the committed baseline. Existing debt
 * passes; one new error fails the build. The baseline can only be lowered.
 *
 * Usage: node .github/scripts/lint-ratchet.mjs [report.json]
 * Env:   LINT_ERROR_BASELINE — max tolerated errors (default 0)
 */
import { readFileSync, appendFileSync } from "node:fs";

const reportPath = process.argv[2] ?? "eslint-report.json";
const baseline = Number.parseInt(process.env.LINT_ERROR_BASELINE ?? "0", 10);

if (!Number.isInteger(baseline) || baseline < 0) {
  console.error(`lint-ratchet: LINT_ERROR_BASELINE must be a non-negative integer, got "${process.env.LINT_ERROR_BASELINE}"`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(readFileSync(reportPath, "utf8"));
} catch (e) {
  // A missing/!unparseable report means eslint itself failed to run. Fail loudly
  // rather than reporting a reassuring zero.
  console.error(`lint-ratchet: could not read eslint report at "${reportPath}": ${e.message}`);
  process.exit(1);
}

let errorCount = 0;
let warningCount = 0;
const byRule = new Map();
const byFile = new Map();

for (const file of report) {
  for (const m of file.messages) {
    if (m.severity !== 2) {
      warningCount++;
      continue;
    }
    errorCount++;
    const rule = m.ruleId ?? "(no rule)";
    byRule.set(rule, (byRule.get(rule) ?? 0) + 1);
    const rel = file.filePath.replace(`${process.cwd()}/`, "");
    byFile.set(rel, (byFile.get(rel) ?? 0) + 1);
  }
}

const topN = (map, n) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

const lines = [];
lines.push("");
lines.push("════════════════════════════════════════════════════");
lines.push(`  ESLint: ${errorCount} errors, ${warningCount} warnings`);
lines.push(`  Baseline: ${baseline} errors allowed`);
lines.push("════════════════════════════════════════════════════");

if (errorCount > 0) {
  lines.push("");
  lines.push("  Errors by rule:");
  for (const [rule, n] of topN(byRule, 10)) lines.push(`    ${String(n).padStart(4)}  ${rule}`);
  lines.push("");
  lines.push("  Worst files:");
  for (const [f, n] of topN(byFile, 10)) lines.push(`    ${String(n).padStart(4)}  ${f}`);
}
lines.push("");

const summary = lines.join("\n");
console.log(summary);

// Mirror into the GitHub Actions job summary so the count is visible from the
// run page without opening the log.
if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### ESLint\n\n\`\`\`\n${summary}\n\`\`\`\n`,
    );
  } catch {
    // Job summary is best-effort — never fail the build over it.
  }
}

if (errorCount > baseline) {
  console.error(
    `::error::ESLint introduced ${errorCount - baseline} new error(s): ${errorCount} found, baseline is ${baseline}. ` +
      `Fix them, or if you genuinely intended to raise the debt, raise LINT_ERROR_BASELINE in .github/workflows/ci.yml.`,
  );
  process.exit(1);
}

if (errorCount < baseline) {
  console.log(
    `::notice::ESLint debt is down to ${errorCount} (baseline ${baseline}). ` +
      `Lower LINT_ERROR_BASELINE to ${errorCount} in .github/workflows/ci.yml to lock the improvement in.`,
  );
}

console.log(`lint-ratchet: OK — ${errorCount} error(s), within baseline of ${baseline}.`);
