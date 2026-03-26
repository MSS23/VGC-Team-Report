export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or short symbol
  defaults: {
    summaryPlaceholder: string;
    hideMatchupSlides: boolean;
    hideSpeedTier: boolean;
  };
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "quick",
    name: "Quick Share",
    description: "Just the team and a summary",
    icon: "\u26A1",
    defaults: {
      summaryPlaceholder: "Share a quick overview of your team \u2014 how does it play?",
      hideMatchupSlides: true,
      hideSpeedTier: false,
    },
  },
  {
    id: "tournament",
    name: "Tournament Report",
    description: "Full report with matchups and game plans",
    icon: "\uD83C\uDFC6",
    defaults: {
      summaryPlaceholder: "Describe your team\u2019s strategy, how it performed, and key decisions you made throughout the tournament.",
      hideMatchupSlides: false,
      hideSpeedTier: false,
    },
  },
  {
    id: "guide",
    name: "Team Guide",
    description: "Educational breakdown with detailed calcs",
    icon: "\uD83D\uDCD6",
    defaults: {
      summaryPlaceholder: "Explain what this team does, how to pilot it, and what matchups to watch out for. Include EV spread reasoning and move choices.",
      hideMatchupSlides: true,
      hideSpeedTier: false,
    },
  },
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch",
    icon: "\uD83D\uDCDD",
    defaults: {
      summaryPlaceholder: "Describe your team strategy, how it plays, and any important details...",
      hideMatchupSlides: false,
      hideSpeedTier: false,
    },
  },
];

export function getTemplate(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}
