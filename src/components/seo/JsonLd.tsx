export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape every "<" to prevent HTML injection from user-controlled values
  // (e.g. creatorName containing "</script>" or "<!--"). The < escape
  // decodes back to "<" in JSON parsers, so the payload stays valid JSON-LD.
  const safe = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

/** WebSite schema with SearchAction for Google Sitelinks Searchbox */
export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "VGC Team Report",
        url: "https://pokemonvgcteamreport.com",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://pokemonvgcteamreport.com/explore?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export interface HowToStep {
  name: string;
  text: string;
}

/**
 * HowTo JSON-LD.
 *
 * `name` and `description` are per-page, not site-wide: two pages shipping a
 * HowTo with the identical name cannibalise each other in search. Pass the
 * name that matches the steps (and the visible copy those steps mirror) —
 * the defaults only describe the report-building flow.
 */
export function HowToSchema({
  steps,
  name = "How to Create a VGC Team Report",
  description = "Step-by-step guide to building and sharing a competitive Pokemon VGC team report.",
}: {
  steps: HowToStep[];
  name?: string;
  description?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name,
        description,
        step: steps.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.name,
          text: step.text,
        })),
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "VGC Team Report",
        url: "https://pokemonvgcteamreport.com",
        description: "The team report builder for VGC Pokemon players",
        logo: {
          "@type": "ImageObject",
          url: "https://pokemonvgcteamreport.com/icon-512.png",
          width: 512,
          height: 512,
        },
        sameAs: [
          "https://github.com/MSS23/VGC-Team-Report",
        ],
      }}
    />
  );
}

export interface SportsEventData {
  name: string;
  startDate: string;
  location: string;
  url: string;
  description?: string;
  eventStatus?: string;
}

export function SportsEventJsonLd({ events }: { events: SportsEventData[] }) {
  if (events.length === 0) return null;

  // Emit an array of SportsEvent nodes so Google can index each event individually
  const schemaData =
    events.length === 1
      ? {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: events[0].name,
          startDate: events[0].startDate,
          location: {
            "@type": "Place",
            name: events[0].location,
          },
          url: events[0].url,
          sport: "Pokémon Video Game Championship (VGC)",
          ...(events[0].description ? { description: events[0].description } : {}),
          eventStatus: events[0].eventStatus ?? "https://schema.org/EventScheduled",
          organizer: {
            "@type": "Organization",
            name: "The Pokémon Company International",
            url: "https://www.pokemon.com",
          },
        }
      : {
          "@context": "https://schema.org",
          "@graph": events.map((e) => ({
            "@type": "SportsEvent",
            name: e.name,
            startDate: e.startDate,
            location: {
              "@type": "Place",
              name: e.location,
            },
            url: e.url,
            sport: "Pokémon Video Game Championship (VGC)",
            ...(e.description ? { description: e.description } : {}),
            eventStatus: e.eventStatus ?? "https://schema.org/EventScheduled",
            organizer: {
              "@type": "Organization",
              name: "The Pokémon Company International",
              url: "https://www.pokemon.com",
            },
          })),
        };

  return <JsonLd data={schemaData as Record<string, unknown>} />;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * BreadcrumbList JSON-LD for SERP breadcrumb display.
 * Pass items in order from root → current page, e.g.:
 *   [{ name: "Home", url: "https://pokemonvgcteamreport.com" },
 *    { name: "Explore", url: "https://pokemonvgcteamreport.com/explore" }]
 *
 * This is the single implementation. There used to be a byte-identical
 * `BreadcrumbJsonLd` alongside it, which is now just an alias below.
 */
export function BreadcrumbListJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

/**
 * @deprecated Alias of {@link BreadcrumbListJsonLd}, kept so existing call
 * sites keep working. Import `BreadcrumbListJsonLd` in new code.
 */
export const BreadcrumbJsonLd = BreadcrumbListJsonLd;

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQPage JSON-LD.
 *
 * `items` is required and has no default on purpose. It used to fall back to a
 * built-in five-question list, which let "/" emit an FAQPage for copy that was
 * nowhere on the page — hidden structured data, i.e. a Google
 * structured-data policy violation. Only pass questions that the page also
 * renders visibly.
 */
export function FAQPageJsonLd({ items }: { items: FAQItem[] }) {
  if (items.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }}
    />
  );
}
