'use client';

import { useEffect, useState } from 'react';
import { repoStores } from '@/Stores/repoStores';
import { useSavedThesisStore } from '@/Stores/savedThesisStore';
import NotFound from '@/app/not-found';
import { PageLoader } from './loading';
import Link from 'next/link';
import {
  Eye,
  Download,
  Calendar,
  ArrowLeft,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import { Card } from './ui/card';
import axios from '@/lib/axios';

function ThesisDetail({ id }: { id: string }) {
  const {
    ThesisById,
    thesisData,
    loading,
    notFound,
    incrementDownloads,
    incrementSaves,
    decrementSaves,
  } = repoStores();

  const { saveStatusMap, checkSaveStatus, saveThesis, unsaveThesis } =
    useSavedThesisStore();

  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const [hasFetched, setHasFetched] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setHasFetched(false);

    ThesisById(id).finally(() => {
      if (!cancelled) setHasFetched(true);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Reset to first section whenever a new thesis loads
  useEffect(() => {
    setCurrentPage(0);
  }, [id, thesisData?.id]);

  useEffect(() => {
    if (id && saveStatusMap[id] === undefined) {
      checkSaveStatus(id);
    }
  }, [id, saveStatusMap, checkSaveStatus]);

  if (loading || !hasFetched) return <PageLoader />;
  if (notFound || !thesisData) return <NotFound />;

  const isEntrep =
    thesisData.course?.toLowerCase().includes('entrepreneurship');

  const sections = isEntrep
    ? [
        { title: 'Introduction', content: thesisData.entrep_intro },
        { title: 'Action Plan', content: thesisData.entrep_action_plan },
        {
          title: 'Market / Product Description',
          content: thesisData.entrep_market_product_description,
        },
        { title: 'Survey Result', content: thesisData.entrep_survey_result },
        { title: 'Target Market', content: thesisData.entrep_target_market },
        { title: 'Product', content: thesisData.entrep_product },
        { title: 'Production', content: thesisData.entrep_production },
      ]
    : [
        { title: 'Abstract', content: thesisData.thesis_abstract },
        { title: 'Introduction', content: thesisData.thesis_introduction },
        { title: 'Discussion', content: thesisData.thesis_discussion },
        { title: 'Conclusion', content: thesisData.thesis_conclusion },
        { title: 'References', content: thesisData.thesis_references },
      ];

  const totalPages = sections.length;
  const safePage = Math.min(currentPage, totalPages - 1);
  const activeSection = sections[safePage];

  function goToPage(page: number) {
    if (page < 0 || page > totalPages - 1) return;
    setCurrentPage(page);
  }

  function triggerAlert() {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  }

  async function handleToggleSave() {
    const isSaved = saveStatusMap[id];
    setIsSaving(true);
    const result = isSaved ? await unsaveThesis(id) : await saveThesis(id);
    setIsSaving(false);

    if (result.success) {
      isSaved ? decrementSaves(id) : incrementSaves(id);
    } else {
      triggerAlert();
    }
  }

  async function handleDownload(id: string, file_url: string) {
    try {
      setIsDownloading(true);
      setDownloadError(null);

      const res = await axios.get(
        `/repository/download/${id}?filename=${file_url}`,
        { validateStatus: () => true }
      );

      if (res.status === 429) {
        setDownloadError(
          res.data?.message || 'Too many downloads. Please try again later.'
        );
        return;
      }

      if (res.status < 200 || res.status >= 300) {
        setDownloadError('Download failed. Please try again.');
        return;
      }

      const { url } = res.data;

      const fileRes = await fetch(url);
      const blob = await fileRes.blob();

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file_url.split('/').pop() || 'thesis.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      incrementDownloads();
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError('Something went wrong. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }

  const initials = thesisData.author
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('');

  const isSaved = saveStatusMap[id] ?? false;

  return (
    <div className="w-full mx-auto sm:px-10 px-4 py-8">
      <div className="w-full">
        {/* Back */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 text-base text-amber-600 hover:text-amber-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to browse
        </Link>

        {/* Badges */}
        <div className="flex justify-between items-center gap-2 mb-3">
          <span className="bg-amber-100 text-amber-800 sm:text-sm text-xs font-medium px-3 py-1 rounded-full">
            {thesisData.course}
          </span>
          <span className="flex items-center gap-1 text-sm text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Published
          </span>
        </div>

        {/* Title + Save button */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="sm:text-3xl text-lg font-medium text-gray-900 leading-snug">
            {thesisData.title}
          </h1>

          <button
            onClick={handleToggleSave}
            disabled={isSaving}
            aria-label={isSaved ? 'Unsave thesis' : 'Save thesis'}
            className={`cursor-pointer shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isSaved
                ? 'bg-amber-600 border-amber-600 text-white hover:bg-amber-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-amber-600 hover:text-amber-600'
            }`}
          >
            <Bookmark
              className="w-4 h-4"
              fill={isSaved ? 'currentColor' : 'none'}
            />
            <span className="hidden sm:inline">
              {isSaved ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-base text-gray-500 pb-5 mb-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:text-xs text-[10px] rounded-full bg-amber-100 flex items-center justify-center font-medium text-amber-800">
              {initials}
            </div>
            <span className="font-medium sm:text-[17px] text-xs text-gray-800">
              {thesisData.author}
            </span>
          </div>

          <span className="text-gray-300">·</span>

          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(thesisData.issue_date).getFullYear()}
          </span>

          <span className="text-gray-300">·</span>

          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {thesisData.ThesisDataAnalytics?.[0]?.views ?? 0} views
          </span>

          <span className="text-gray-300">·</span>

          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {thesisData.ThesisDataAnalytics?.[0]?.downloads ?? 0} downloads
          </span>

          <span className="text-gray-300">·</span>

          <span className="flex items-center gap-1">
            <Bookmark className="w-4 h-4" />
            {thesisData.ThesisDataAnalytics?.[0]?.saves ?? 0} saves
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row gap-8 items-start w-full">
          <Card className="p-4 flex-1">
            {/* Section tabs (jump directly to a section) */}
            <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b">
              {sections.map(({ title }, idx) => (
                <button
                  key={title}
                  onClick={() => goToPage(idx)}
                  className={`cursor-pointer text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                    idx === safePage
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>

            {/* Active section content */}
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-2">
                {activeSection.title}
              </h2>
              <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line min-h-[8rem]">
                {activeSection.content ?? 'N/A'}
              </p>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-7 pt-4 border-t">
              <button
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 0}
                className="cursor-pointer flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-amber-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1.5">
                {sections.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToPage(idx)}
                    aria-label={`Go to page ${idx + 1}`}
                    className={`cursor-pointer rounded-full transition-all ${
                      idx === safePage
                        ? 'w-5 h-1.5 bg-amber-600'
                        : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages - 1}
                className="cursor-pointer flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-amber-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-600 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              {safePage + 1} of {totalPages}
            </p>
          </Card>

          {/* Sidebar */}
          <div className="flex flex-col gap-1 sm:w-80 w-full shrink-0">
            <Card className="border rounded-xl p-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                Details
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Department',
                    value: thesisData.course,
                  },
                  {
                    label: 'Year',
                    value: new Date(
                      thesisData.issue_date
                    ).getFullYear(),
                  },
                  {
                    label: 'Publish date',
                    value: new Date(
                      thesisData.issue_date
                    ).toLocaleDateString(),
                  },
                  {
                    label: 'Views',
                    value:
                      thesisData.ThesisDataAnalytics?.[0]?.views,
                  },
                  {
                    label: 'Downloads',
                    value:
                      thesisData.ThesisDataAnalytics?.[0]
                        ?.downloads,
                  },
                  {
                    label: 'Created',
                    value: new Date(
                      thesisData.created_at
                    ).toLocaleDateString(),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-0.5"
                  >
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      {label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {downloadError && (
              <div className="flex items-start gap-2 mt-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{downloadError}</span>
              </div>
            )}

            {thesisData.thesis_file_url && (
              <button
                onClick={() =>
                  handleDownload(
                    thesisData.id,
                    thesisData.thesis_file_url
                  )
                }
                disabled={isDownloading}
                className="cursor-pointer w-full flex items-center justify-center gap-2 mt-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-base font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                {isDownloading
                  ? 'Downloading...'
                  : 'Download full thesis'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md px-6 py-4 shadow-lg rounded-xl border border-red-500 bg-red-100">
          <div className="flex items-start gap-3">
            <CircleAlert className="text-red-500 w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-600 font-semibold">Login Required</p>
              <p className="text-red-600 text-xs">
                Log in to save this thesis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThesisDetail;