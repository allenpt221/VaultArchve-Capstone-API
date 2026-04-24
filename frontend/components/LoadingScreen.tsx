"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Block scroll when loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    // ✅ fixed + inset-0 + z-50 + bg-white to cover everything
    <div className="fixed inset-0 z-60 bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-9 h-9 rounded-full border-[3px] border-amber-100 border-t-amber-500 animate-spin" />
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium">VaultArchive</span>
        <span className="text-xs text-muted-foreground animate-pulse">please wait...</span>
      </div>
    </div>
  );
}