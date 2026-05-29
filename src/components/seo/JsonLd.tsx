export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape </script> to prevent HTML injection from user-controlled values
  // (e.g. creatorName containing "</script>"). JSON is still valid — the
  // escape is transparent to JSON parsers, which decode \/ as /.
  const safe = JSON.stringify(data).replace(/<\/script>/gi, "<\\/script>");
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
        applicationCategory: "SportsApplication",
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

export interface ArticleJsonLdProps {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
}

export function ArticleJsonLd(props: ArticleJsonLdProps) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: props.headline,
        description: props.description,
        url: props.url,
        datePublished: props.datePublished,
        dateModified: props.dateModified,
        ...(props.authorName && { author: { "@type": "Person", name: props.authorName } }),
        publisher: {
          "@type": "Organization",
          name: "VGC Team Report",
          url: "https://pokemonvgcteamreport.com",
          logo: {
            "@type": "ImageObject",
            url: "https://pokemonvgcteamreport.com/icon-512.png",
          },
        },
      }}
    />
  );
}

export function SportsTeamJsonLd({
  teamName,
  species,
  url,
}: {
  teamName: string;
  species: string[];
  url: string;
}) {
  if (species.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SportsTeam",
        name: teamName,
        sport: "Pokémon Video Game Championship (VGC)",
        url,
        member: species.map((name) => ({ "@type": "Person", name })),
      }}
    />
  );
}

export function FAQPageJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is a VGC team report?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A VGC team report is a detailed breakdown of a competitive Pokemon Video Game Championship (VGC) team. It includes each Pokemon's build (moves, item, EVs, nature), the team's overall strategy, matchup plans against common threats, damage calculations, and speed tier comparisons. Coaches and players share these reports to document and analyze their tournament teams.",
            },
          },
          {
            "@type": "Question",
            name: "How do I share a VGC team report?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "After building your team report on VGC Team Report, click the Share button in the top navigation bar. You can create a permanent public link that anyone can view, or keep it private and share a direct edit link with collaborators. Public reports are also listed on the Explore page for the community to discover.",
            },
          },
          {
            "@type": "Question",
            name: "What is Pokemon Champions Regulation M-A?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Pokemon Champions Regulation M-A (Reg M-A) is a competitive VGC format that re-introduces Mega Evolutions alongside modern Pokemon. Teams can include two restricted legendaries and Mega Pokemon, creating a unique format distinct from the standard Scarlet & Violet regulation sets. VGC Team Report fully supports building and sharing team reports in this format.",
            },
          },
          {
            "@type": "Question",
            name: "How do I import a PokePaste into VGC Team Report?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "On the VGC Team Report homepage, paste your team's Showdown-format text (or a pokepast.es URL) into the import box and click Analyze. The tool will automatically parse your team's Pokemon, moves, items, EVs, IVs, and natures. You can also import directly from a PokePaste link by pasting the URL into the input field.",
            },
          },
          {
            "@type": "Question",
            name: "Is VGC Team Report free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, VGC Team Report is completely free to use. You can build, analyze, and share team reports without an account. Creating a free account unlocks additional features like saving reports permanently, real-time collaboration with teammates, version history, and publishing your report to the community Explore page.",
            },
          },
        ],
      }}
    />
  );
}
