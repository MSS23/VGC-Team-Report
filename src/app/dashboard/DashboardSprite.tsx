import { FallbackSprite } from "@/components/report/PokemonSprite";

export function DashboardSprite({ species }: { species: string }) {
  return <FallbackSprite species={species} size={36} className="w-7 h-7 sm:w-9 sm:h-9 object-contain" loading="lazy" />;
}
