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

export function HowToSchema({ steps }: { steps: HowToStep[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to Create a VGC Team Report",
        description: "Step-by-step guide to building and sharing a competitive Pokemon VGC team report.",
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
 * Emits a schema.org BreadcrumbList JSON-LD script.
 * Pass items in order from root to current page, e.g.:
 *   [{ name: "Home", url: "https://pokemonvgcteamreport.com" },
 *    { name: "Explore", url: "https://pokemonvgcteamreport.com/explore" }]
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
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
 * BreadcrumbList JSON-LD for SERP breadcrumb display.
 * Pass items in order from root → current page (e.g. [Home, Explore]).
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

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQPage JSON-LD. `items` is required on purpose: Google's structured-data
 * policy requires the Q&A to be visible on the page emitting it, so the
 * caller must own the questions it also renders. There used to be a
 * DEFAULT_FAQ_ITEMS fallback, which let the homepage publish FAQPage markup
 * for Q&A that was never rendered (VGC-317).
 */
export function FAQPageJsonLd({ items }: { items: FAQItem[] }) {
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
