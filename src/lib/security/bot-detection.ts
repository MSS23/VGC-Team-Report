/**
 * Bot detection utilities for middleware-level blocking.
 *
 * Blocks known scraper/spam bots while allowing legitimate crawlers
 * (Google, Bing, etc.) and normal browser traffic through.
 */

// Known malicious or aggressive scraper bot patterns
const BLOCKED_BOT_PATTERNS = [
  // Generic scrapers
  /scrapy/i,
  /python-requests/i,
  /python-urllib/i,
  /go-http-client/i,
  /java\//i,
  /libwww-perl/i,
  /wget/i,
  /curl/i,
  /httpie/i,

  // SEO/data scrapers
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /megaindex/i,
  /blexbot/i,
  /exabot/i,
  /seznambot/i,

  // AI training scrapers
  /gptbot/i,
  /ccbot/i,
  /anthropic-ai/i,
  /claude-web/i,
  /bytespider/i,
  /petalbot/i,
  /amazonbot/i,

  // Aggressive crawlers
  /sogou/i,
  /yandexbot/i,
  /baiduspider/i,

  // Vulnerability scanners
  /nikto/i,
  /sqlmap/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /nuclei/i,

  // Headless browsers used for scraping
  /phantomjs/i,
  /headlesschrome(?!.*lighthouse)/i,
];

// Legitimate bots that should be allowed through
const ALLOWED_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /discordbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /slackbot/i,
  /applebot/i,
  /vercel/i,
  /lighthouse/i,
  /chrome-lighthouse/i,
  /pagespeed/i,
  /uptimerobot/i,
];

/**
 * Returns true if the user-agent should be BLOCKED.
 */
export function isBlockedBot(userAgent: string): boolean {
  if (!userAgent) return true; // Empty user-agent is suspicious

  // Allow known legitimate bots first
  if (ALLOWED_BOT_PATTERNS.some((pattern) => pattern.test(userAgent))) {
    return false;
  }

  // Block known bad bots
  if (BLOCKED_BOT_PATTERNS.some((pattern) => pattern.test(userAgent))) {
    return true;
  }

  return false;
}

/**
 * Additional heuristics for suspicious request patterns.
 * Returns true if the request looks like automated scraping.
 */
export function isSuspiciousRequest(request: Request): boolean {
  const headers = request.headers;

  // No Accept header at all — very unusual for browsers
  if (!headers.get("accept")) return true;

  // API route with no Referer or Origin from a non-browser
  // (Browsers always send these for same-origin fetch/XHR)
  const isApi = new URL(request.url).pathname.startsWith("/api");
  if (isApi) {
    const hasReferer = !!headers.get("referer");
    const hasOrigin = !!headers.get("origin");
    const hasSec = !!headers.get("sec-fetch-mode");
    // If none of these are present, it's likely not a browser
    if (!hasReferer && !hasOrigin && !hasSec) {
      // Allow Vercel cron and webhook endpoints
      const ua = headers.get("user-agent") ?? "";
      if (ua.includes("vercel-cron") || ua.includes("PostHog")) return false;
      return true;
    }
  }

  return false;
}
