"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function ShareRedirect() {
  const params = useParams();

  useEffect(() => {
    window.location.replace(`/#id=${params.id}`);
  }, [params.id]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Loading shared team...</p>
      </div>
    </main>
  );
}
