"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Bookmark,
  Users,
  Calendar,
  MoveRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSavedThesisStore } from "@/Stores/savedThesisStore";

const LIMIT = 10;

function formatText(text: string) {
  if (!text) return text;
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function SavedThesisPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const {
    savedThesis,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    isUnsaving,
    error,
    fetchSavedThesis,
    unsaveThesis,
  } = useSavedThesisStore();


  useEffect(() => {
    fetchSavedThesis(page, LIMIT);
  }, [page, fetchSavedThesis]);

  const handleUnsave = async (thesisId: string) => {
    await unsaveThesis(thesisId);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setPage(currentPage + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#0B1C33" }}>
            Saved Thesis
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount > 0
              ? `${totalCount} saved ${totalCount === 1 ? "thesis" : "theses"}`
              : "Theses you've bookmarked for later"}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-2/3 mb-3" />
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : savedThesis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bookmark className="w-10 h-10 text-gray-300 mb-3" />
            <h2 className="text-lg font-semibold text-gray-700">
              No saved thesis yet
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Browse the repository and save a thesis to find it here later.
            </p>
            <Link href="/browse">
              <Button
                className="mt-5"
                style={{ backgroundColor: "#0B1C33", color: "white" }}
              >
                Browse Thesis
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {savedThesis.map((item) => {
              const thesis = item.Thesis;
              const analytics = thesis?.ThesisDataAnalytics?.[0];
              const isClickable = true;

              const handleClick = () => {
                router.push(`/browse/${thesis.id}`);
              };

              const handleSaveClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                handleUnsave(thesis.id);
              };

              return (
                <div
                  key={item.id}
                  onClick={handleClick}
                  className={`group border hover:shadow-lg hover:border-amber-400 p-4 rounded-lg shadow 
                  flex flex-col gap-2
                  ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-70 pointer-events-none"}`}
                >
                  <div className="flex justify-between">
                    <span className="bg-amber-300/40 px-3 py-0.5 rounded-full">
                      <p className="sm:text-xs text-[10px] text-black/90">
                        {formatText(thesis.course)}
                      </p>
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="flex gap-1 text-xs items-center text-black/60">
                        <Eye size={14} />
                        {analytics?.views ?? 0}
                      </span>

                      <button
                        onClick={handleSaveClick}
                        disabled={isUnsaving}
                        className="flex items-center gap-1 text-xs text-black/60 hover:text-amber-400 transition-colors cursor-pointer"
                        aria-label="Unsave thesis"
                      >
                        <Bookmark size={14} className="fill-amber-400 text-amber-400" />
                        {analytics?.saves ?? 0}
                      </button>
                    </div>
                  </div>

                  <p className="font-semibold text-base group-hover:text-amber-400">
                    {thesis.title}
                  </p>

                  <div className="flex gap-2">
                    <span className="flex gap-2 items-center text-black/70">
                      <Users size={14} />
                      <p className="text-xs">
                        {thesis.author ? formatText(thesis.author) : "N/a"}
                      </p>
                    </span>
                    <span className="flex gap-2 items-center text-black/70">
                      <Calendar size={14} />
                      <p className="text-xs">
                        {thesis.issue_date
                          ? new Date(thesis.issue_date).getFullYear()
                          : "N/a"}
                      </p>
                    </span>
                  </div>

                  <div className="text-sm text-black/60 line-clamp-4">
                    {thesis.abstract}
                  </div>

                  <span className="text-amber-400 font-semibold text-sm flex items-center gap-2 mt-auto pt-1">
                    Read More <MoveRight size={14} />
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && savedThesis.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <button
                className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-500 hover:text-black transition-colors"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
                className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-500 hover:text-black transition-colors"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedThesisPage;