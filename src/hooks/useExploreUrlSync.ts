"use client";

import { useState, useEffect } from "react";
import type { SearchCategory } from "@/components/explore/ExploreFilters";

export interface FilterState {
  query: string;
  sort: "newest" | "updated" | "popular" | "views";
  searchCategory: SearchCategory;
  regulation: string;
  eventType: string;
  archetype: string;
  species: string;
  placement: string;
  followingOnly: boolean;
}

export interface ExploreUrlSyncResult extends FilterState {
  setQuery: (v: string) => void;
  setSort: (v: "newest" | "updated" | "popular" | "views") => void;
  setSearchCategory: (v: SearchCategory) => void;
  setRegulation: (v: string) => void;
  setEventType: (v: string) => void;
  setArchetype: (v: string) => void;
  setSpecies: (v: string) => void;
  setPlacement: (v: string) => void;
  setFollowingOnly: (v: boolean) => void;
}

const DEFAULTS: FilterState = {
  query: "",
  sort: "newest",
  searchCategory: "all",
  regulation: "",
  eventType: "",
  archetype: "",
  species: "",
  placement: "",
  followingOnly: false,
};

/** Pure function — parses URLSearchParams string into FilterState */
export function parseFiltersFromUrl(searchString: string): FilterState {
  const params = new URLSearchParams(searchString);

  const sort = params.get("sort") as FilterState["sort"];
  const searchCategory = params.get("searchType") as SearchCategory;

  return {
    query: params.get("q") ?? DEFAULTS.query,
    sort: sort && ["newest", "updated", "popular", "views"].includes(sort) ? sort : DEFAULTS.sort,
    searchCategory:
      searchCategory && ["all", "pokemon", "tournament", "creator"].includes(searchCategory)
        ? searchCategory
        : DEFAULTS.searchCategory,
    regulation: params.get("regulation") ?? DEFAULTS.regulation,
    eventType: params.get("eventType") ?? DEFAULTS.eventType,
    archetype: params.get("archetype") ?? DEFAULTS.archetype,
    species: params.get("species") ?? DEFAULTS.species,
    placement: params.get("placement") ?? DEFAULTS.placement,
    followingOnly: params.get("following") === "1",
  };
}

/** Pure function — builds URLSearchParams string from FilterState (omits defaults) */
export function buildUrlSearch(filters: FilterState): string {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.sort !== DEFAULTS.sort) params.set("sort", filters.sort);
  if (filters.searchCategory !== DEFAULTS.searchCategory) params.set("searchType", filters.searchCategory);
  if (filters.regulation) params.set("regulation", filters.regulation);
  if (filters.eventType) params.set("eventType", filters.eventType);
  if (filters.archetype) params.set("archetype", filters.archetype);
  if (filters.species) params.set("species", filters.species);
  if (filters.placement) params.set("placement", filters.placement);
  if (filters.followingOnly) params.set("following", "1");

  return params.toString();
}

/**
 * Bidirectionally syncs explore filter state with browser URL search params.
 * - On mount: reads initial state from window.location.search
 * - On every state change: updates URL via replaceState (no history pollution)
 * - Only non-default values are written to the URL (clean URLs)
 */
export function useExploreUrlSync(): ExploreUrlSyncResult {
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    return parseFiltersFromUrl(window.location.search);
  });

  // Sync state -> URL on every filter change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = buildUrlSearch(filters);
    const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [filters]);

  const setQuery = (v: string) => setFilters((f) => ({ ...f, query: v }));
  const setSort = (v: FilterState["sort"]) => setFilters((f) => ({ ...f, sort: v }));
  const setSearchCategory = (v: SearchCategory) => setFilters((f) => ({ ...f, searchCategory: v }));
  const setRegulation = (v: string) => setFilters((f) => ({ ...f, regulation: v }));
  const setEventType = (v: string) => setFilters((f) => ({ ...f, eventType: v }));
  const setArchetype = (v: string) => setFilters((f) => ({ ...f, archetype: v }));
  const setSpecies = (v: string) => setFilters((f) => ({ ...f, species: v }));
  const setPlacement = (v: string) => setFilters((f) => ({ ...f, placement: v }));
  const setFollowingOnly = (v: boolean) => setFilters((f) => ({ ...f, followingOnly: v }));

  return {
    ...filters,
    setQuery,
    setSort,
    setSearchCategory,
    setRegulation,
    setEventType,
    setArchetype,
    setSpecies,
    setPlacement,
    setFollowingOnly,
  };
}
