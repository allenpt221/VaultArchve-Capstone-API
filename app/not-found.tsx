"use client";

import { Frown, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Animated icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-amber-100 dark:bg-amber-900/30 animate-pulse" />
          </div>
          <span className="relative flex items-center justify-center">
            <Frown className="h-24 w-24 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />
          </span>
        </div>

        {/* Error code */}
        <h1 className="mb-2 text-7xl font-bold bg-linear-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
          404
        </h1>
        
        {/* Message */}
        <p className="mb-2 text-2xl font-semibold text-gray-700 dark:text-gray-300">
          Page not found
        </p>
        <p className="mb-8 text-gray-500 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <Home className="h-5 w-5" />
            Return to Home
          </button>
          
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Go Back
          </button>
        </div>

      </div>
    </div>
  );
}