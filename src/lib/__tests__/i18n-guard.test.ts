/**
 * CI guard: verifies that strings extracted in VGC-166 are NOT hardcoded
 * in the component files they were extracted from. Prevents regression.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../../../");

function readSrc(relPath: string) {
  return readFileSync(resolve(ROOT, "src", relPath), "utf-8");
}

describe("i18n extraction guard (VGC-166)", () => {
  describe("TeamReport.tsx — redacted fields notice", () => {
    const content = readSrc("components/report/TeamReport.tsx");

    it('should not contain hardcoded "Some fields hidden by the creator."', () => {
      expect(content).not.toContain("Some fields hidden by the creator.");
    });

    it('should not contain hardcoded "are not shown on this public view."', () => {
      expect(content).not.toContain("are not shown on this public view.");
    });
  });

  describe("ChampionsContent.tsx — UI chrome strings", () => {
    const content = readSrc("app/champions/ChampionsContent.tsx");

    it('should not contain hardcoded "Champions Ready"', () => {
      expect(content).not.toContain('"Champions Ready"');
    });

    it('should not contain hardcoded "Build a Team Report"', () => {
      expect(content).not.toContain('"Build a Team Report"');
    });

    it('should not contain hardcoded "Explore Champions Teams"', () => {
      expect(content).not.toContain('"Explore Champions Teams"');
    });

    it('should not contain hardcoded "Featured Mega Evolutions"', () => {
      expect(content).not.toContain('"Featured Mega Evolutions"');
    });

    it('should not contain hardcoded "Coming Soon" as a string literal', () => {
      expect(content).not.toContain('"Coming Soon"');
    });

    it('should not contain hardcoded "Sprite unavailable"', () => {
      expect(content).not.toContain('"Sprite unavailable"');
    });

    it('should not contain hardcoded "Try this team"', () => {
      expect(content).not.toContain('"Try this team"');
    });

    it('should not contain hardcoded "Start Building"', () => {
      expect(content).not.toContain('"Start Building"');
    });
  });

  describe("en.ts — new keys present", () => {
    const content = readSrc("lib/i18n/translations/en.ts");

    const expectedKeys = [
      "redactedSomeHidden",
      "redactedNotShownSuffix",
      "redactedEvsSpreads",
      "redactedIvs",
      "redactedNature",
      "redactedHeldItems",
      "championsReady",
      "buildTeamReport",
      "exploreChampionsTeams",
      "featuredMegaEvolutions",
      "comingSoon",
      "spriteUnavailable",
      "sampleTeamsHeading",
      "sampleTeamsDesc",
      "tryThisTeam",
      "tablePlace",
      "tablePlayer",
      "tableTeam",
      "tableDetails",
      "viewLink",
      "readyForChampions",
      "startBuilding",
    ];

    for (const key of expectedKeys) {
      it(`en.ts should contain key "${key}"`, () => {
        expect(content).toContain(`${key}:`);
      });
    }
  });
});
