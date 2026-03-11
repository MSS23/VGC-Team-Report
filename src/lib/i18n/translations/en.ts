const en = {
  // App title & meta
  appTitle: "VGC Team",
  appTitleAccent: "Report",
  appSubtitle: "Paste a Showdown export or PokePaste URL",

  // Input screen
  loadSample: "Load sample",
  fetchAndAnalyze: "Fetch & Analyze",
  analyzeTeam: "Analyze Team",
  fetching: "Fetching...",
  invalidFormat: "Invalid format. Paste a Showdown team export or PokePaste URL.",
  pokePaste: "PokePaste",
  builtBy: "Built by",
  privacy: "Privacy",

  // Navbar
  newTeam: "New Team",
  warnings: "warning",
  warningsPlural: "warnings",
  saved: "Saved",
  editing: "Editing",
  locked: "Locked",
  share: "Share",
  copied: "Copied!",
  updated: "Updated!",
  failed: "Failed",
  copying: "Copying...",
  saving: "Saving...",
  savedBang: "Saved!",
  reshare: "Re-share",
  editLink: "Edit Link",
  present: "Present",
  exit: "Exit",
  buildYourOwn: "Build Your Own",
  newShort: "New",
  dark: "Dark",
  light: "Light",

  // Team Overview
  tournamentInfo: "Tournament Info",
  eventNamePlaceholder: "Event name (e.g. EUIC 2025)",
  placementPlaceholder: "Placement",
  recordPlaceholder: "Record",
  rentalPlaceholder: "Rental",
  creatorNamePlaceholder: "Your name / alias (shown on report)",
  copy: "Copy",
  teamSummary: "Team Summary",
  noTeamSummary: "No team summary.",
  teamSummaryPlaceholder: "Summarize your team's overall strategy, win conditions, and key synergies...",
  teamMvp: "Team MVP",
  removeMvp: "Remove MVP",
  setAsMvp: "Set as MVP",
  builtWith: "Built with VGC Team Report by Manraj Sidhu",
  by: "by",

  // Pokemon Detail
  moves: "Moves",
  stats: "Stats",
  ivs: "IVs",
  notes: "Notes",
  aboutThisPokemon: "About This Pokemon",
  yourExplanation: "Your Explanation",
  noNotesYet: "No notes yet.",
  notesPlaceholder: "Explain {species}'s role, key matchups, how to use it...",
  notableCalcs: "Notable Calcs",
  noNotableCalcs: "No notable calcs added.",
  addDamageCalcsHint: "Add damage calcs, speed benchmarks, and other key numbers.",
  offensive: "Offensive",
  defensive: "Defensive",
  speedTier: "Speed Tier",

  // Pokemon Card
  rolePlaceholder: "Role (e.g. Spread Attacker)",

  // Speed Tier Chart
  teamAnalysis: "Team Analysis",
  speedTiersAndCoverage: "Speed tiers & type coverage",
  speedTiers: "Speed Tiers",
  base: "Base",
  itemBoosted: "Item boosted",
  benchmarks: "Benchmarks",
  tailwindDoublesBase: "Tailwind doubles base speed",

  // Matchup Sheet
  matchupSheet: "Matchup Sheet",
  matchup: "matchup",
  matchups: "matchups",
  noMatchupPlans: "No matchup plans yet",
  addOpponentHint: "Add an opponent team below to get started.",
  addMatchupPlan: "Add Matchup Plan",
  opponentLabelPlaceholder: 'Opponent label (e.g. "Round 1 - Sun Team")',
  pasteOpponentPlaceholder: "Paste opponent's Showdown team or a pokepast.es URL...",
  addPlan: "Add Plan",

  // Slide Nav
  prev: "Prev",
  next: "Next",
  hiddenFromViewers: "(hidden from viewers)",
  hidden: "Hidden",
  visible: "Visible",
  hideSlideTooltip: "Click to hide this slide from viewers when you share or present.",
  hiddenSlideTooltip: "This slide is hidden -- viewers won't see it when you share or present. Click to make it visible again.",

  // Hidden slide banner
  thisSlideIsHidden: "This slide is hidden",
  hiddenSlideDescription: "Viewers won't see it when you share or present. Click <strong>Hidden</strong> below to show it again.",
  showSlide: "Show slide",

  // Share toast
  publicLinkCopied: "Public link copied!",
  saveEditLink: "Save the edit link below to make changes later. Only you have this link.",
  copyEditLink: "Copy Edit Link",
  lostEditLink: "Lost your edit link on another device?",
  generateNewEditLink: "Generate a new edit link",
  oldEditLinkStops: "(old edit link will stop working).",

  // Error / 404
  somethingWentWrong: "Something went wrong",
  unexpectedError: "An unexpected error occurred. Try refreshing or go back to the home page.",
  tryAgain: "Try Again",
  goHome: "Go Home",
  pageNotFound: "Page Not Found",
  pageNotFoundDesc: "This page doesn't exist. The link may be broken or the report may have been removed.",
  failedToLoadShared: "Failed to load shared team",
  sharedLinkCorrupt: "The link may be corrupted or expired. Ask the creator for a new link.",
  loadingSharedTeam: "Loading shared team...",

  // Shortcuts
  keyboardShortcuts: "Keyboard Shortcuts",
  navigateSlides: "Navigate slides",
  toggleDarkMode: "Toggle dark mode",
  showHideShortcuts: "Show / hide shortcuts",
  toggleFullscreen: "Toggle fullscreen",
  exitPresentation: "Exit presentation",
  enterPresentation: "Enter presentation",
  swipeHint: "Use swipe gestures on mobile to navigate slides",
  clickOrEsc: "Click anywhere or press",
  toClose: "to close",

  // Walkthrough
  skipAll: "Skip all",
  done: "Done",
  of: "of",

  // Tour button
  takeATour: "Take a tour",

  // Language selector
  language: "Language",
  translationBeta: "Beta",

  // Overview label
  overview: "Overview",
  teamAnalysisLabel: "Team Analysis",
  matchupsLabel: "Matchups",
} as const;

export type TranslationKeys = { [K in keyof typeof en]: string };
export default en;
