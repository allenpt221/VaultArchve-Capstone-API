'use client';
import { useEffect } from 'react';
import { repoStores } from '@/Stores/repoStores';
import NotFound from '@/app/not-found';
import { PageLoader } from './loading';
import Link from 'next/link';
import { Eye, Download, Calendar, ArrowLeft } from 'lucide-react';

function ThesisDetail({ id }: { id: string }) {
  const { ThesisById, thesisData, loading, notFound, incrementDownloads } = repoStores();

  useEffect(() => { ThesisById(id); }, [id]);

if (loading) return <PageLoader />;
if (notFound || !thesisData) return <NotFound />;

function handleDownload(id: string, file_url: string) {
  window.open(
    `${process.env.NEXT_PUBLIC_API_URL}/api/repository/download/${id}?filename=${file_url}`,
    '_blank'
  );

  incrementDownloads();
}

  const sections = [
    { title: 'Abstract', content: thesisData.abstract },
    { title: 'Introduction', content: thesisData.introduction },
    { title: 'Discussion', content: thesisData.discussion },
    { title: 'Conclusion', content: thesisData.conclusion },
    { title: 'References', content: thesisData.references },
  ];

  const initials = thesisData.author
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="max-w-7xl mx-auto sm:px-4 px-5 py-8">

      {/* Back */}
      <Link
        href="/browse"
        className="inline-flex items-center gap-1.5 text-base text-amber-600 hover:text-amber-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to browse
      </Link>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-amber-100 text-amber-800 sm:text-sm text-xs font-medium px-3 py-1 rounded-full">
          {thesisData.course}
        </span>
        <span className="flex items-center gap-1 text-sm text-green-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Published
        </span>
      </div>

      {/* Title */}
      <h1 className="sm:text-3xl text-xl font-medium text-gray-900 mb-4 leading-snug">
        {thesisData.title}
      </h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-base text-gray-500 pb-5 mb-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-medium text-amber-800">
            {initials}
          </div>
          <span className="font-medium text-gray-800">{thesisData.author}</span>
        </div>
        <span className="text-gray-300">·</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {new Date(thesisData.issue_date).getFullYear()}
        </span>
        <span className="text-gray-300">·</span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {thesisData.views} views
        </span>
        <span className="text-gray-300">·</span>
        <span className="flex items-center gap-1">
          <Download className="w-4 h-4" />
          {thesisData.downloads ?? 0} downloads
        </span>
      </div>

      {/* Body + Sidebar */}
      <div className="flex flex-col-reverse md:grid md:grid-cols-[1fr_240px] gap-8 items-start">

        {/* Sections */}
        <div className="space-y-7">
          {sections.map(({ title, content }) => (
            <div key={title}>
              <h2 className="text-base font-medium text-gray-900 mb-2">{title}</h2>
              <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3">
          <div className="border rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">Details</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Department', value: thesisData.course },
                { label: 'Year', value: new Date(thesisData.issue_date).getFullYear() },
                { label: 'Issue date', value: new Date(thesisData.issue_date).toLocaleDateString() },
                { label: 'Views', value: thesisData.views },
                { label: 'Downloads', value: thesisData.downloads ?? 0 },
                { label: 'Created', value: new Date(thesisData.created_at).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs uppercase tracking-wide text-gray-400">{label}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {thesisData.thesis_file_url && (
            <button
              onClick={() => handleDownload(thesisData.id, thesisData.thesis_file_url)}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-base font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download full thesis
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default ThesisDetail;