"use client";

import { useState } from "react";

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function ExpandableSection({ title, children, defaultOpen = false, className = "" }: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-full text-left"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {title}
      </button>
      {open && (
        <div className="mt-2 pl-5 text-sm text-text-secondary leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
