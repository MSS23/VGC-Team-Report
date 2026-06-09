import type { Metadata } from "next";

import { PageFooter } from "@/components/layout/PageFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of use for VGC Team Report — a free community tool for sharing competitive Pokemon VGC team reports. Permitted uses, ownership, liability, and account terms.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/terms" },
  openGraph: {
    title: "Terms of Service — VGC Team Report",
    description:
      "Terms of use for VGC Team Report — a free community tool for sharing competitive Pokemon VGC team reports.",
    url: "https://pokemonvgcteamreport.com/terms",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service — VGC Team Report",
    description:
      "Terms of use for VGC Team Report — a free community tool for sharing competitive Pokemon VGC team reports.",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-text-tertiary mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">What is this site?</h2>
            <p>
              VGC Team Report is a free, community tool for competitive Pok&eacute;mon VGC players
              to build, document, and share team reports. The site is operated by Manraj Sidhu as a
              personal project with no commercial intent. By using the site you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">What can you use this site for?</h2>
            <p className="mb-3">You are welcome to use VGC Team Report for its intended purpose:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Sharing competitive Pok&eacute;mon teams and team reports</li>
              <li>Viewing and learning from other players&apos; reports</li>
              <li>Using the explore, filter, and analysis tools</li>
            </ul>
            <p className="mt-3 mb-3">The following uses are not permitted:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Scraping or automated bulk access without prior written permission</li>
              <li>Submitting content that is abusive, defamatory, or illegal</li>
              <li>Attempting to access other users&apos; private data or accounts</li>
              <li>Using the site to harass, threaten, or intimidate other players</li>
            </ul>
            <p className="mt-3">
              We reserve the right to remove content or suspend accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Who owns your content?</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>You retain full ownership</strong> of the team reports and notes you create.
                We do not claim any ownership of your competitive team builds.
              </li>
              <li>
                By sharing a report you grant VGC Team Report a non-exclusive, royalty-free license
                to host, display, and transmit that content to other users.
              </li>
              <li>
                You can delete your shared reports at any time, which removes them from public access.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Pok&eacute;mon trademark notice</h2>
            <p>
              VGC Team Report is an independent fan project and is not affiliated with,
              endorsed by, or sponsored by The Pok&eacute;mon Company, Nintendo, Game Freak,
              or Creatures Inc. Pok&eacute;mon and all related names, characters, and imagery
              are trademarks and &copy; of their respective owners. This site is a free
              community tool for competitive Pok&eacute;mon players and does not generate revenue
              from Pok&eacute;mon intellectual property. All Pok&eacute;mon sprite images are sourced
              from Pok&eacute;mon Showdown (play.pokemonshowdown.com) and used under fair use for
              non-commercial, educational and competitive gaming purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">What is our liability?</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                The site is provided <strong>&ldquo;as-is&rdquo;</strong> with no warranties of any
                kind, whether express or implied.
              </li>
              <li>
                Maximum liability to any user is <strong>$0.00</strong> &mdash; this is a free service
                with no paid tier.
              </li>
              <li>
                We are not liable for loss of team data, service interruptions, or any indirect,
                incidental, or consequential damages.
              </li>
              <li>
                <strong>Backups:</strong> while we take reasonable care with your data, you should
                keep local copies of important team builds.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Can accounts be terminated?</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                We may suspend or terminate accounts that violate these terms, with reasonable
                notice where practical.
              </li>
              <li>
                You may delete your own account at any time from your dashboard.
              </li>
              <li>
                On account deletion all your data is permanently removed from our systems.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Which law governs these terms?</h2>
            <p>
              These terms are governed by the laws of England and Wales. Any disputes arising from
              these terms or your use of the site are subject to the exclusive jurisdiction of the
              courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Changes will be reflected on this page
              with an updated date. Continued use of the site after a change constitutes acceptance
              of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Contact</h2>
            <p>
              For questions about these terms, reach us at{" "}
              <a href="mailto:privacy@pokemonvgcteamreport.com" className="text-accent hover:underline">
                privacy@pokemonvgcteamreport.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <PageFooter hideFeedback />
    </div>
  );
}
