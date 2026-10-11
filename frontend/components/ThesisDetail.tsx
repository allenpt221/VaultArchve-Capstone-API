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
  Bookmark,
  Loader2,
} from 'lucide-react';
import { Card } from './ui/card';
import axios from '@/lib/axios';

// "a, b, c" -> ["a", "b", "c"]
function parseKeywords(value?: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k && k.toLowerCase() !== 'null' && k !== 'N/A');
}

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

  useEffect(() => {
    if (id && saveStatusMap[id] === undefined) {
      checkSaveStatus(id);
    }
  }, [id, saveStatusMap, checkSaveStatus]);

  if (loading || !hasFetched) return <PageLoader />;
  if (notFound || !thesisData) return <NotFound />;

  const keywordList = parseKeywords(thesisData.keywords);

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

  const analytics = thesisData.ThesisDataAnalytics?.[0];
  const issueDate = new Date(thesisData.issue_date);

  const details = [
    { label: 'Department', value: thesisData.course },
    { label: 'Year', value: issueDate.getFullYear() },
    { label: 'Publish date', value: issueDate.toLocaleDateString() },
    {
      label: 'Created',
      value: new Date(thesisData.created_at).toLocaleDateString(),
    },
    { label: 'Views', value: analytics?.views ?? 0 },
    { label: 'Downloads', value: analytics?.downloads ?? 0 },
  ];

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-10 sm:py-10">
      {/* Back */}
      <Link
        href="/browse"
        className={`mb-6 inline-flex items-center gap-1.5 rounded-md text-base text-amber-600 transition-colors hover:text-amber-700 ${focusRing}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to browse
      </Link>

      {/* Badges */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 sm:text-sm">
          {thesisData.course}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-green-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
          Published
        </span>
      </div>

      {/* Title + Save button */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold leading-snug tracking-tight text-gray-900 sm:text-3xl">
          {thesisData.title}
        </h1>

        <button
          onClick={handleToggleSave}
          disabled={isSaving}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Unsave thesis' : 'Save thesis'}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
            isSaved
              ? 'border-amber-600 bg-amber-600 text-white hover:bg-amber-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-amber-600 hover:text-amber-600'
          }`}
        >
          <Bookmark
            className="h-4 w-4"
            fill={isSaved ? 'currentColor' : 'none'}
          />
          <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Meta */}
      <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-b pb-6 text-sm text-gray-500">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {thesisData.author}
          </span>
        </div>

        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {issueDate.getFullYear()}
        </span>

        <span className="flex items-center gap-1.5">
          <Eye className="h-4 w-4" />
          {analytics?.views ?? 0} views
        </span>

        <span className="flex items-center gap-1.5">
          <Download className="h-4 w-4" />
          {analytics?.downloads ?? 0} downloads
        </span>

        <span className="flex items-center gap-1.5">
          <Bookmark className="h-4 w-4" />
          {analytics?.saves ?? 0} saves
        </span>
      </div>

      {/* Body */}
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row lg:gap-8">
        <Card className="w-full min-w-0 flex-1 p-6 sm:p-8">
          {/* Abstract */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Abstract
            </h2>
            <p className="max-w-[72ch] whitespace-pre-line text-base leading-7 text-gray-600">
              {thesisData.thesis_abstract || 'N/A'}
            </p>
          </div>

          {/* Keywords */}
          <div className="mt-8 border-t pt-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Keywords
            </h2>

            {keywordList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywordList.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-base text-gray-400">N/A</p>
            )}
          </div>
        </Card>

        {/* Sidebar */}
        <div className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-6 lg:w-80">
          {thesisData.thesis_file_url && (
            <button
              onClick={() =>
                handleDownload(thesisData.id, thesisData.thesis_file_url)
              }
              disabled={isDownloading}
              className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-amber-700 active:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isDownloading ? 'Downloading...' : 'Download full thesis'}
            </button>
          )}

          {downloadError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{downloadError}</span>
            </div>
          )}

          <Card className="rounded-xl border p-5">
            <p className="mb-4 text-sm font-semibold text-gray-900">Details</p>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {details.map(({ label, value }) => (
                <div key={label} className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-xs text-gray-400">{label}</dt>
                  <dd className="truncate text-sm font-medium text-gray-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>

      {showAlert && (
        <div
          role="alert"
          className="fixed left-1/2 top-6 z-50 w-[90%] max-w-md -translate-x-1/2 rounded-xl border border-red-300 bg-red-50 px-5 py-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-red-600">Login Required</p>
              <p className="text-xs text-red-600">Log in to save this thesis.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThesisDetail;