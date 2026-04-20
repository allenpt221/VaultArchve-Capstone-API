"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide after page fully loads
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-9 h-9 rounded-full border-[3px] border-amber-100 border-t-amber-500 animate-spin" />
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium">VaultArchive</span>
        <span className="text-xs text-muted-foreground animate-pulse">please wait...</span>
      </div>
    </div>
  );
}