"use client";
import type { ShareableState } from "@/lib/sharing/url-codec";
export function CollaborationConflict({ local, remote, onResolve }: { local: ShareableState; remote: ShareableState; onResolve: (choice: "local" | "remote") => void }) {
  function downloadLocal() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(local, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "vgc-unsaved-edits.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section role="alert" className="mx-auto my-3 max-w-5xl space-y-3 rounded-xl border-2 border-accent bg-surface p-4">
    <h2 className="font-bold">A teammate saved a newer version</h2><p className="text-sm text-text-secondary">Your edits are still here. Autosave is paused until you choose which version to keep. Keeping yours will replace the newer report after another version check.</p>
    <details><summary className="min-h-11 cursor-pointer py-3 font-semibold focus-visible:ring-2 focus-visible:ring-accent">Compare versions</summary><div className="grid gap-3 sm:grid-cols-2">{[["Your unsaved version", local], ["Server version", remote]].map(([title, state]) => <div key={title as string}><h3 className="text-sm font-semibold">{title as string}</h3><pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-surface-alt p-3 text-xs whitespace-pre-wrap break-words">{JSON.stringify(state, null, 2)}</pre></div>)}</div></details>
    <div className="flex flex-wrap gap-2"><button onClick={downloadLocal} className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-accent">Download my edits</button><button onClick={() => onResolve("remote")} className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-accent">Use teammate version</button><button onClick={() => onResolve("local")} className="min-h-11 rounded-lg bg-text-primary px-3 text-sm font-semibold text-background focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Keep my version</button></div>
  </section>;
}
