import { isCronAuthorized } from "@/lib/cron-auth";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

interface OutdatedPkg {
  name: string;
  current: string;
  latest: string;
  type: "patch" | "minor" | "major";
}

function classifyUpdate(current: string, latest: string): "patch" | "minor" | "major" {
  const c = current.replace(/^[\^~]/, "").split(".");
  const l = latest.split(".");
  if (c[0] !== l[0]) return "major";
  if (c[1] !== l[1]) return "minor";
  return "patch";
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const outdated: OutdatedPkg[] = [];

    // Check a sample of key dependencies against npm registry
    const keyDeps = Object.keys(deps).slice(0, 20); // limit to avoid rate limits

    for (const name of keyDeps) {
      try {
        const res = await fetch(`https://registry.npmjs.org/${name}/latest`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) continue;

        const data = await res.json();
        const current = deps[name].replace(/^[\^~]/, "");
        const latest = data.version;

        if (current !== latest) {
          outdated.push({
            name,
            current,
            latest,
            type: classifyUpdate(current, latest),
          });
        }
      } catch {
        // Skip packages that fail to resolve
      }
    }

    if (outdated.length > 0) {
      const major = outdated.filter((p) => p.type === "major");
      const minor = outdated.filter((p) => p.type === "minor");
      const patch = outdated.filter((p) => p.type === "patch");

      const sections: string[] = [];

      if (major.length > 0) {
        sections.push(`**Breaking (${major.length}):**\n${major.map((p) => `- \`${p.name}\` ${p.current} -> ${p.latest}`).join("\n")}`);
      }
      if (minor.length > 0) {
        sections.push(`**Minor (${minor.length}):**\n${minor.map((p) => `- \`${p.name}\` ${p.current} -> ${p.latest}`).join("\n")}`);
      }
      if (patch.length > 0) {
        sections.push(`**Patch (${patch.length}):**\n${patch.map((p) => `- \`${p.name}\` ${p.current} -> ${p.latest}`).join("\n")}`);
      }

      await postToBuildsChannel({
        title: `${outdated.length} Dependency Updates Available`,
        description: sections.join("\n\n") + "\n\nConsider creating a ticket for a dependency update batch.",
        color: major.length > 0 ? COLORS.warning : COLORS.info,
        footer: { text: "VGC Dependency Monitor" },
      });
    }

    return NextResponse.json({ ok: true, outdated: outdated.length });
  } catch (e) {
    console.error("Dependency check failed:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
