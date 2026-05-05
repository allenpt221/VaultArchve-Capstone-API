'use client'
import { repoStores } from '@/Stores/repoStores'
import {
  ChartNoAxesCombined,
  BookOpen,
  Eye,
  TrendingUp,
  Download,
  ChevronRight,
  ChevronLeft,
  Search,
} from 'lucide-react'
import { TableActions } from '../Usabletable'
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ThesisEditModal from '../Modal/ThesisEditModal'

function DataAnalytics({ isCollapsed }: { isCollapsed: boolean }) {
  const {
    repository,
    currentPage,
    totalPages,
    getPageRepository,
    dataAnalytics,
    viewsDownloads
  } = repoStores()

  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedThesis, setSelectedThesis] = useState<typeof repository[0] | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      getPageRepository(1, 10)
      viewsDownloads()
      setIsLoading(false)
    }
    load()
  }, [])

  async function handlePageChange(page: number) {
    setIsLoading(true)
    getPageRepository(page, 10)
    setIsLoading(false)
  }

  const totalViews = dataAnalytics?.reduce((sum, item) => sum + (Number(item.views) || 0), 0) ?? 0
  const totalDownloads = dataAnalytics?.reduce((sum, item) => sum + (Number(item.downloads) || 0), 0) ?? 0

  const mostViewedAnalytic = dataAnalytics?.reduce((top, item) =>
    (Number(item.views) || 0) > (Number(top?.views) || 0) ? item : top
  , dataAnalytics[0]) ?? null

  const mostViewed = repository.find(r => r.id === mostViewedAnalytic?.thesis_id) ?? null
  const mostViewedCount = mostViewedAnalytic?.views ?? 0

  const stats = [
    {
      icon: <BookOpen className="w-4 h-4" style={{ color: '#185FA5' }} />,
      iconBg: '#E6F1FB',
      value: dataAnalytics.length,
      label: 'Total thesis',
      badge: 'Repository',
      badgeBg: '#E6F1FB',
      badgeColor: '#0C447C',
    },
    {
      icon: <Eye className="w-4 h-4" style={{ color: '#3B6D11' }} />,
      iconBg: '#EAF3DE',
      value: totalViews.toLocaleString(),
      label: 'Total views',
      badge: 'All time',
      badgeBg: '#EAF3DE',
      badgeColor: '#27500A',
    },
    {
      icon: <Download className="w-4 h-4" style={{ color: '#534AB7' }} />,
      iconBg: '#EEEDFE',
      value: totalDownloads.toLocaleString(),
      label: 'Total downloads',
      badge: 'All time',
      badgeBg: '#EEEDFE',
      badgeColor: '#3C3489',
    },
    {
      icon: <TrendingUp className="w-4 h-4" style={{ color: '#BA7517' }} />,
      iconBg: '#FAEEDA',
      value: mostViewedCount?.toLocaleString() ?? '0',
      label: mostViewed?.title ?? '—',
      badge: 'Most viewed',
      badgeBg: '#FAEEDA',
      badgeColor: '#633806',
    },
  ]

  const filteredRepository = repository.filter((item) => {
    const q = search.toLowerCase()
    return (
      item.title?.toLowerCase().includes(q) ||
      item.author?.toLowerCase().includes(q) ||
      item.course?.toLowerCase().includes(q) ||
      String(item.id)?.toLowerCase().includes(q)
    )
  })

  const courseColorMap: Record<string, { bg: string; color: string }> = {
    CS:     { bg: '#E6F1FB', color: '#0C447C' },
    IT:     { bg: '#E6F1FB', color: '#0C447C' },
    EE:     { bg: '#E6F1FB', color: '#0C447C' },
    EnvSci: { bg: '#EAF3DE', color: '#27500A' },
    Marine: { bg: '#EAF3DE', color: '#27500A' },
    Nutr:   { bg: '#EAF3DE', color: '#27500A' },
    Edu:    { bg: '#EEEDFE', color: '#3C3489' },
    Law:    { bg: '#EEEDFE', color: '#3C3489' },
    HRM:    { bg: '#EEEDFE', color: '#3C3489' },
    PolSci: { bg: '#FAEEDA', color: '#633806' },
    Med:    { bg: '#FAEEDA', color: '#633806' },
    FA:     { bg: '#FAEEDA', color: '#633806' },
  }

  function getCourseStyle(course: string) {
    return courseColorMap[course] ?? { bg: '#F1EFE8', color: '#444441' }
  }

  return (
    <div
      className="p-5 space-y-5"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#FAEEDA' }}
        >
          <ChartNoAxesCombined className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight">
            Data Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every view, download, and submission — tracked and organized in one place.
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 ${
          isCollapsed ? 'lg:grid-cols-4' : 'lg:grid-cols-2'
        }`}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border rounded-xl p-4 flex flex-col gap-2.5 bg-white dark:bg-background"
            style={{ borderColor: 'rgba(0,0,0,0.08)' }}
          >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: stat.iconBg }}
                >
                  {stat.icon}
                </div>
                <span className="text-2xl font-medium leading-none">
                  {stat.value}
                </span>
                <span
                  className="text-xs text-muted-foreground leading-snug"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '160px',
                  }}
                  title={stat.label}
                >
                  {stat.label}
                </span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full self-start font-medium"
                  style={{
                    background: stat.badgeBg,
                    color: stat.badgeColor,
                  }}
                >
                  {stat.badge}
                </span>
          </div>
        ))}
      </div>

      {/* ── Table Section ── */}
      <div>
        <p
          className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3"
          style={{ letterSpacing: '0.07em' }}
        >
          Manage Thesis
        </p>

        <div
          className="border rounded-xl overflow-hidden bg-white dark:bg-background"
          style={{ borderColor: 'rgba(0,0,0,0.08)' }}
        >
          {/* Table toolbar */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap"
            style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search thesis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg w-full border bg-transparent outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  borderColor: 'rgba(0,0,0,0.12)',
                  minWidth: '200px',
                }}
              />
            </div>
          </div>

          {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow
                    className="hover:bg-transparent"
                    style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}
                  >
                    {[
                      'Thesis ID',
                      'Title',
                      'Abstract',
                      'Author',
                      'Date',
                      'Course',
                      'Introduction',
                      'Discussion',
                      'Conclusion',
                      'References',
                      'filename',
                      'Actions'
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                        style={{
                          letterSpacing: '0.05em',
                          fontSize: '11px',
                          background: 'rgba(0,0,0,0.02)',
                        }}
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRepository.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center py-10 text-sm text-muted-foreground"
                      >
                        No thesis found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredRepository.map((item) => (
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
                          filename={item.thesis_file_name}
                          isOpen={() => setSelectedThesis(item)}
                        />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-4 px-4 py-3"
              style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)' }}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-sm font-medium
                           disabled:opacity-35 disabled:cursor-not-allowed
                           hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800
                           transition-colors dark:hover:bg-amber-950 dark:hover:text-amber-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  borderColor: 'rgba(0,0,0,0.12)',
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <span className="text-xs text-muted-foreground min-w-[80px] text-center">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-sm font-medium
                           disabled:opacity-35 disabled:cursor-not-allowed
                           hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800
                           transition-colors dark:hover:bg-amber-950 dark:hover:text-amber-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  borderColor: 'rgba(0,0,0,0.12)',
                }}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedThesis && (
        <ThesisEditModal
          isOpen={!!selectedThesis}
          onClose={() => setSelectedThesis(null)}
          id={selectedThesis.id}
          title={selectedThesis.title}
          author={selectedThesis.author}
          issue_date={selectedThesis.issue_date}
          course={selectedThesis.course}
          abstract={selectedThesis.abstract}
          introduction={selectedThesis.introduction}
          discussion={selectedThesis.discussion}
          conclusion={selectedThesis.conclusion}
          references={selectedThesis.references}
          file_url={selectedThesis.thesis_file_name}
        />
      )}
    </div>
  )
}

export default DataAnalytics