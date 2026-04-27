'use client'
import { repoStores } from '@/Stores/repoStores'
import { ChartNoAxesCombined, BookOpen, Eye, TrendingUp, Download, ChevronRight, ChevronLeft } from 'lucide-react'
import { TableActions } from '../Usabletable';
import { ITEMS_PER_PAGE } from '@/app/Provider';
import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function DataAnalytics({ isCollapsed } : { isCollapsed: boolean}) {
  const {
    repository,
    currentPage,
    totalPages,
    getPageRepository,
  } = repoStores();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await getPageRepository(1, ITEMS_PER_PAGE);
      setIsLoading(false);
    };
    load();
  }, []);

  async function handlePageChange(page: number) {
    setIsLoading(true);
    await getPageRepository(page, ITEMS_PER_PAGE);
    setIsLoading(false);
  }

  const totalViews = repository.reduce((sum, repo) => sum + (Number(repo.views) || 0), 0);
  const totalDownloads = repository.reduce((sum, repo) => sum + (Number(repo.downloads) || 0), 0);
  const mostViewed = repository.length > 0
    ? repository.reduce((top, repo) => (Number(repo.views) || 0) > (Number(top.views) || 0) ? repo : top)
    : null;

  const stats = [
    {
      icon: <BookOpen className="w-4 h-4" style={{ color: '#185FA5' }} />,
      iconBg: '#E6F1FB',
      value: repository.length,
      label: 'Total thesis',
      badge: 'Repository',
      badgeBg: '#E6F1FB',
      badgeColor: '#185FA5',
    },
    {
      icon: <Eye className="w-4 h-4" style={{ color: '#3B6D11' }} />,
      iconBg: '#EAF3DE',
      value: totalViews,
      label: 'Total views',
      badge: 'All time',
      badgeBg: '#EAF3DE',
      badgeColor: '#3B6D11',
    },
    {
      icon: <Download className="w-4 h-4" style={{ color: '#7F77DD' }} />,
      iconBg: '#EEEDFE',
      value: totalDownloads.toLocaleString(),
      label: 'Total downloads',
      badge: 'All time',
      badgeBg: '#EEEDFE',
      badgeColor: '#534AB7',
    },
    {
      icon: <TrendingUp className="w-4 h-4" style={{ color: '#BA7517' }} />,
      iconBg: '#FAEEDA',
      value: mostViewed?.views?.toLocaleString() ?? '0',
      label: mostViewed?.title ?? '—',
      badge: 'Most viewed',
      badgeBg: '#FAEEDA',
      badgeColor: '#BA7517',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100">
          <ChartNoAxesCombined className="w-4 h-4 text-amber-600" />
        </div>
        <h1 className="text-xl font-medium">Data Analytics</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Track thesis submissions, views, and trends across the repository.
      </p>

      {/* Stat Cards */}
      <div className={`grid grid-cols-1 xl:grid-cols-4 ${isCollapsed ? "lg:grid-cols-4" : "lg:grid-cols-2" } md:grid-cols-2 gap-3`}>
        {stats.map((stat) => (
          <div key={stat.label} className="border rounded-xl p-4 flex flex-col gap-2 bg-white dark:bg-background">
            {isLoading ? (
              <>
                <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
              </>
            ) : (
              <>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: stat.iconBg }}
                >
                  {stat.icon}
                </div>
                <span className="text-2xl font-medium">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full self-start"
                  style={{ background: stat.badgeBg, color: stat.badgeColor }}
                >
                  {stat.badge}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className='border rounded shadow overflow-x-auto'>
        {isLoading ? (
          <div className="p-2 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 p-3 border-b animate-pulse">
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
                <div className="h-4 w-1/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/5 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <Table className=''>
              <TableHeader>
                <TableRow>
                  <TableHead>Thesis Id</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Author</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="text-right">Course</TableHead>
                  <TableHead className="text-right">Introduction</TableHead>
                  <TableHead className="text-right">Discussion</TableHead>
                  <TableHead className="text-right">Conclusion</TableHead>
                  <TableHead className="text-right">References</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repository.map((item) => (
                  <TableActions
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    author={item.author}
                    issue_date={item.issue_date}
                    course={item.course}
                    abstract={item.abstract}
                    introduction={item.introduction}
                    discussion={item.discussion}
                    conclusion={item.conclusion}
                    references={item.references}
                  />
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 p-3">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-500 hover:text-black transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>

                <span className="sm:text-sm text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-500 hover:text-black transition-colors"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DataAnalytics;