import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-8"
        >
          &larr; Back to app
        </Link>

        <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
        <p className="text-sm text-text-tertiary mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">What we collect</h2>
            <p>
              VGC Team Report collects minimal data to function. We do not require accounts
              or personal information to use the app.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5">
              <li>
                <strong>Team report data</strong> &mdash; When you share a report, its content
                (team paste, notes, matchup plans) is stored on our servers so others can view it.
              </li>
              <li>
                <strong>Analytics</strong> &mdash; We use Vercel Analytics to collect anonymous
                page view data (pages visited, referrer, country). No cookies are used and no
                personally identifiable information is collected.
              </li>
              <li>
                <strong>Local storage</strong> &mdash; Your drafts, preferences, and edit tokens
                are stored in your browser&apos;s local storage. This data never leaves your device
                unless you choose to share a report.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">How we use your data</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Shared reports are stored to make them accessible via their unique URL.</li>
              <li>Analytics data is used to understand overall usage patterns and improve the app.</li>
              <li>We do not sell, share, or transfer your data to third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Data retention</h2>
            <p>
              Shared reports are stored indefinitely unless manually deleted. Local storage
              data persists until you clear your browser data. Analytics data is retained
              according to Vercel&apos;s data retention policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Your rights</h2>
            <p>
              You can delete your local data at any time by clearing your browser storage.
              Since we don&apos;t collect personal information, there is no account data to request
              or delete. If you have questions, you can reach us via the project&apos;s GitHub repository.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Third-party services</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Vercel</strong> &mdash; Hosting and analytics.{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Privacy policy
                </a>
              </li>
              <li>
                <strong>Neon</strong> &mdash; Database hosting for shared reports.{" "}
                <a href="https://neon.tech/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Privacy policy
                </a>
              </li>
              <li>
                <strong>Pokemon Showdown</strong> &mdash; Sprite images are loaded from
                play.pokemonshowdown.com.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Changes</h2>
            <p>
              We may update this policy from time to time. Changes will be reflected on this page
              with an updated date.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
