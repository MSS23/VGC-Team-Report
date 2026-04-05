import type { Metadata } from "next";
import { PrivacyNavbar } from "./PrivacyNavbar";
import { PageFooter } from "@/components/layout/PageFooter";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "https://pokemonvgcteamreport.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PrivacyNavbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-text-tertiary mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-sm text-text-secondary leading-relaxed">

          {/* 1. Introduction / Data Controller */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">What is this Privacy Policy?</h2>
            <p>
              This Privacy Policy explains how <strong>VGC Team Report</strong>, operated by Manraj Sidhu
              (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), collects, uses, stores, and protects your personal data when you
              use our website at{" "}
              <a href="https://pokemonvgcteamreport.com" className="text-accent hover:underline">
                pokemonvgcteamreport.com
              </a>.
            </p>
            <p className="mt-3">
              VGC Team Report is a free community tool for competitive Pok&eacute;mon players. We are the
              data controller for the personal data we process and are committed to complying with the
              UK and EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
            </p>
            <p className="mt-3">
              If you have any questions about this policy or your data, contact us
              at{" "}
              <a href="mailto:privacy@pokemonvgcteamreport.com" className="text-accent hover:underline">
                privacy@pokemonvgcteamreport.com
              </a>.
            </p>
          </section>

          {/* 2. Data Categories + Legal Bases */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">What data do we collect?</h2>
            <p>We collect only the data necessary to provide and improve VGC Team Report. Below is each category of data, what it includes, and the legal basis under GDPR Article 6 for processing it.</p>

            <ul className="list-disc pl-5 mt-3 space-y-3">
              <li>
                <strong>Account data</strong> (email address, OAuth identity via Clerk) &mdash;
                Collected when you sign in. Used to link reports to your account and provide authentication.
                <br />
                <span className="text-text-tertiary">Legal basis: Art 6(1)(b) &mdash; necessary for contract performance (providing the service you signed up for).</span>
              </li>
              <li>
                <strong>Team report data</strong> (team pastes, notes, matchup plans) &mdash;
                Stored when you create or share a report so others can view it via its unique URL.
                <br />
                <span className="text-text-tertiary">Legal basis: Art 6(1)(b) &mdash; necessary for contract performance (delivering the core functionality you requested).</span>
              </li>
              <li>
                <strong>Analytics data</strong> (page views, feature usage, referrer, country via Vercel Analytics and PostHog) &mdash;
                Usage data collected to understand traffic patterns, feature adoption, and improve the app.
                PostHog analytics are linked to your account when signed in (identified profiles only) to provide
                a better experience; anonymous visitors are not tracked individually.
                <br />
                <span className="text-text-tertiary">Legal basis: Art 6(1)(f) &mdash; legitimate interest (understanding usage to improve the service); Art 6(1)(a) &mdash; consent when cookie consent is granted for non-essential analytics cookies.</span>
              </li>
              <li>
                <strong>Redis cache data</strong> (session tokens, rate-limit counters via Upstash) &mdash;
                Temporary data used to manage sessions and prevent abuse.
                <br />
                <span className="text-text-tertiary">Legal basis: Art 6(1)(b) &mdash; necessary for contract performance (maintaining your session and protecting the service).</span>
              </li>
              <li>
                <strong>Feedback submissions</strong> (bug reports, feature requests, ideas) &mdash;
                Collected when you voluntarily submit feedback through the app.
                <br />
                <span className="text-text-tertiary">Legal basis: Art 6(1)(f) &mdash; legitimate interest (improving the product based on user feedback).</span>
              </li>
              <li>
                <strong>Local storage data</strong> (drafts, preferences, edit tokens) &mdash;
                Stored in your browser&apos;s local storage. This data never leaves your device
                unless you choose to share a report. We do not process this data on our servers.
              </li>
            </ul>
          </section>

          {/* 3. Retention Periods */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">How long do we keep your data?</h2>
            <p>We retain your data only as long as necessary for the purposes described above. Here are the specific retention periods:</p>

            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Shared reports</strong> &mdash; Stored indefinitely while your account exists.
                Purged immediately when you delete your account.
              </li>
              <li>
                <strong>Account data</strong> &mdash; Held for the life of your account. Deleted within
                30 days of an account deletion request.
              </li>
              <li>
                <strong>Analytics data</strong> &mdash; Retained for 12 months by Vercel and PostHog.
                We do not store analytics data independently outside these services.
              </li>
              <li>
                <strong>Redis cache data</strong> &mdash; TTL-based, typically purged within 24 hours.
              </li>
              <li>
                <strong>Feedback submissions</strong> &mdash; Retained indefinitely for product improvement.
                Submitter identity is anonymised on account deletion (email and name nulled; feedback
                content preserved).
              </li>
              <li>
                <strong>Clerk authentication data</strong> &mdash; Deleted within 30 days of account deletion.
              </li>
            </ul>
          </section>

          {/* 4. Third-Party Processors */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Who do we share your data with?</h2>
            <p>
              We use the following third-party service providers (processors) to operate VGC Team Report.
              Each processor has signed a Data Processing Agreement (DPA) with Standard Contractual Clauses
              (SCCs) for EU-US data transfers.
            </p>

            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Clerk</strong> &mdash; Authentication and identity management.{" "}
                <a href="https://clerk.com/legal/dpa" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  View Clerk DPA
                </a>
              </li>
              <li>
                <strong>Vercel</strong> &mdash; Hosting, deployment, and web analytics.{" "}
                <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  View Vercel DPA
                </a>
              </li>
              <li>
                <strong>Neon</strong> &mdash; PostgreSQL database for storing shared reports and account data.{" "}
                <a href="https://neon.tech/dpa" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  View Neon DPA
                </a>
              </li>
              <li>
                <strong>Upstash</strong> &mdash; Redis cache for session management and rate limiting.{" "}
                <a href="https://upstash.com/trust/dpa.pdf" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  View Upstash DPA
                </a>
              </li>
              <li>
                <strong>PostHog</strong> &mdash; Product analytics and feature usage tracking (EU-hosted).{" "}
                <a href="https://posthog.com/dpa" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  View PostHog DPA
                </a>
              </li>
              <li>
                <strong>Pokemon Showdown</strong> &mdash; Sprite images are loaded client-side from
                play.pokemonshowdown.com. No personal data is transferred to this service.
              </li>
            </ul>

            <p className="mt-3">
              We do not share your personal data with any other third parties, advertisers, or data brokers.
            </p>
          </section>

          {/* 5. GDPR Rights */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">What are your rights?</h2>
            <p>
              Under GDPR, you have the following rights regarding your personal data. We will respond
              to all requests within 30 days.
            </p>

            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Right to access (Art 15)</strong> &mdash; Request a copy of the personal data we
                hold about you. Email{" "}
                <a href="mailto:privacy@pokemonvgcteamreport.com" className="text-accent hover:underline">
                  privacy@pokemonvgcteamreport.com
                </a>.
              </li>
              <li>
                <strong>Right to data portability (Art 20)</strong> &mdash; Export your data using the
                data export feature in your account dashboard.
              </li>
              <li>
                <strong>Right to erasure (Art 17)</strong> &mdash; Delete your account and all associated
                data using the account deletion feature in your account dashboard.
              </li>
              <li>
                <strong>Right to rectification (Art 16)</strong> &mdash; Update your information via your
                Clerk account settings, or email us to request corrections.
              </li>
              <li>
                <strong>Right to restrict processing (Art 18)</strong> &mdash; Contact us to request that
                we limit how we process your data.
              </li>
              <li>
                <strong>Right to object (Art 21)</strong> &mdash; Contact us to object to processing
                based on legitimate interest.
              </li>
              <li>
                <strong>Right to lodge a complaint</strong> &mdash; You have the right to lodge a complaint
                with a supervisory authority. In the UK, this is the Information Commissioner&apos;s Office
                (ICO) at{" "}
                <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  ico.org.uk
                </a>
                . EU residents may contact their local data protection authority.
              </li>
            </ul>
          </section>

          {/* 6. CCPA / Do Not Sell */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Do we sell your personal information? (CCPA)</h2>
            <p>
              VGC Team Report does not sell, rent, or trade your personal information to third parties.
              If you are a California resident, we affirm that we do not sell personal information as
              defined under the California Consumer Privacy Act (CCPA). The processors listed above act
              as service providers under CCPA &mdash; they process data on our behalf under written
              agreements and are prohibited from using your data for their own commercial purposes.
            </p>
          </section>

          {/* 7. Pokemon Trademark */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Pok&eacute;mon Trademark Notice</h2>
            <p>
              VGC Team Report is an independent fan project and is not affiliated with,
              endorsed by, or sponsored by The Pok&eacute;mon Company, Nintendo, Game Freak,
              or Creatures Inc. Pok&eacute;mon and all related names, characters, and imagery
              are trademarks and &copy; of their respective owners. This site is a free
              community tool for competitive Pok&eacute;mon players and does not generate revenue
              from Pok&eacute;mon intellectual property.
            </p>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Cookies</h2>
            <p>
              VGC Team Report uses a cookie consent system to manage your preferences. We use the
              following types of cookies:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Strictly necessary cookies</strong> &mdash; Authentication session cookies
                managed by Clerk. These are essential for the service to function and are exempt
                from consent requirements.
              </li>
              <li>
                <strong>Analytics cookies</strong> &mdash; Vercel Analytics and PostHog cookies are
                only set when you grant consent through our cookie banner. PostHog uses cookies to
                link page views into sessions and identify returning users. You can change your
                preferences at any time using the &quot;Cookie Settings&quot; link in the footer.
              </li>
            </ul>
          </section>

          {/* 9. Changes */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be reflected on this page
              with an updated &quot;Last updated&quot; date. We encourage you to review this page periodically.
              Continued use of VGC Team Report after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Contact</h2>
            <p>
              For any questions, concerns, or data rights requests related to this Privacy Policy, please
              contact us at{" "}
              <a href="mailto:privacy@pokemonvgcteamreport.com" className="text-accent hover:underline">
                privacy@pokemonvgcteamreport.com
              </a>.
            </p>
          </section>

        </div>
      </main>
      <PageFooter hideFeedback />
    </div>
  );
}
