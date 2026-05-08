"use client";

import { createContext, useContext } from "react";

/** Context to signal components they're rendering for print (use PNGs, not GIFs) */
export const PrintContext = createContext(false);
export function useIsPrintMode() { return useContext(PrintContext); }
