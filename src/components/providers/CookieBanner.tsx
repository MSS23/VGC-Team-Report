"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { notifyConsentChange } from "@/lib/consent";

/**
 * Initialises vanilla-cookieconsent on mount.
 * Listens for the "open-cookie-settings" CustomEvent dispatched by PageFooter.
 * GDPR-compliant: Accept All and Reject All have equal visual weight.
 * No dark patterns: rejection is exactly one click from the initial banner.
 */
export function CookieBanner() {
  useEffect(() => {
    CookieConsent.run({
      cookie: {
        name: "cc_cookie",
        expiresAfterDays: 365,
      },
      guiOptions: {
        consentModal: {
          layout: "box inline",
          position: "bottom right",
          equalWeightButtons: true,
          flipButtons: false,
        },
        preferencesModal: {
          layout: "box",
          equalWeightButtons: true,
          flipButtons: false,
        },
      },
      onFirstConsent: ({ cookie }) => {
        const accepted = Array.isArray(cookie.categories) && cookie.categories.includes("analytics");
        notifyConsentChange(accepted);
      },
      onConsent: ({ cookie }) => {
        const accepted = Array.isArray(cookie.categories) && cookie.categories.includes("analytics");
        notifyConsentChange(accepted);
      },
      onChange: ({ cookie }) => {
        const accepted = Array.isArray(cookie.categories) && cookie.categories.includes("analytics");
        notifyConsentChange(accepted);
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          enabled: false,
          readOnly: false,
        },
      },
      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "Cookie preferences",
              description:
                'We use analytics cookies (PostHog, Microsoft Clarity) to understand how you use the app and fix bugs. <a href="/privacy" class="cc-link">Privacy Policy</a>',
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              showPreferencesBtn: "Manage preferences",
            },
            preferencesModal: {
              title: "Cookie preferences",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Reject all",
              savePreferencesBtn: "Save preferences",
              closeIconLabel: "Close",
              serviceCounterLabel: "Service|Services",
              sections: [
                {
                  title: "Strictly necessary",
                  description:
                    "These cookies are required for the site to function. They store your session and cannot be disabled.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics",
                  description:
                    "Help us understand how you use the app. Used by PostHog (product analytics) and Microsoft Clarity (session replay and heatmaps). No advertising.",
                  linkedCategory: "analytics",
                },
              ],
            },
          },
        },
      },
    });

    // Wire the "Cookie Settings" footer button to reopen the preferences modal
    const handleOpenSettings = () => CookieConsent.showPreferences();
    window.addEventListener("open-cookie-settings", handleOpenSettings);

    return () => {
      window.removeEventListener("open-cookie-settings", handleOpenSettings);
    };
  }, []);

  return null;
}
