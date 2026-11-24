import { MEGA_BY_SLUG } from "@/lib/data/mega-pokemon";
import { homeSpriteUrl } from "@/lib/utils/sprite-slug";

/**
 * HOME sprite URL for a Mega guide's og:image.
 *
 * The route slug is "mega-garchomp" but Showdown names the sprite after the
 * data key, "garchomp-mega". Slugging the route param directly asked for
 * `home/mega-garchomp.png`, which 404s, so every card rendered without a sprite.
 */
export function megaGuideSpriteUrl(routeSlug: string): string {
  return homeSpriteUrl(MEGA_BY_SLUG.get(routeSlug)?.dataKey ?? routeSlug);
}
