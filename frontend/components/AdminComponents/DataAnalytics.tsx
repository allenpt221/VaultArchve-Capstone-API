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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Bookmark,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ThesisEditModal from '../Modal/ThesisEditModal'
import { EntrepTableActions } from '../ThesisEntrepTable'
import { TableActions } from '../ThesisTable'

const FILTER_TABS = [
  { key: 'All', label: 'All (BSA • BSPA • BSAIS)' },
  { key: 'Accountancy', label: 'Accountancy' },
  { key: 'Public Administration', label: 'Public Administration' },
  { key: 'Accounting Information System', label: 'Accounting Information System' },
  { key: 'Entrepreneurship', label: 'Entrepreneurship' },
] as const;

type FilterKey = typeof FILTER_TABS[number]['key']

const PAGE_SIZE = 8

const SORTABLE_FIELDS: Record<string, string> = {
  Title: 'title',
  Author: 'author',
  Date: 'issue_date',
}

type SortOrder = 'asc' | 'desc'

function DataAnalytics({ isCollapsed }: { isCollapsed: boolean }) {
  const {
    repository,
    masterRepository,
    FilteredThesis,
    dataAnalytics,
    viewsDownloads,
    getMasterRepository,
    deleteThesis,
  } = repoStores()

  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedThesis, setSelectedThesis] = useState<typeof repository[0] | null>(null)
  const [viewMode, setViewMode] = useState<FilterKey>('All')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<string>('issue_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleDelete = (id: string) => {
    return deleteThesis(id)
  }

  const handleSortClick = (header: string) => {
    const field = SORTABLE_FIELDS[header]
    if (!field) return
    if (field === sortField) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    viewsDownloads()
    getMasterRepository()
  }, [])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setPage(1)
      const department = viewMode === 'All' ? 'all' : viewMode
      FilteredThesis(debouncedSearch, 'all', department, sortField, sortOrder)
      setIsLoading(false)
    }
    load()
  }, [debouncedSearch, viewMode, sortField, sortOrder])

  const totalViews =
    dataAnalytics?.reduce((sum, item) => sum + (Number(item.views) || 0), 0) ?? 0
  const totalDownloads =
    dataAnalytics?.reduce((sum, item) => sum + (Number(item.downloads) || 0), 0) ?? 0
  const totalSaves =
    dataAnalytics?.reduce((sum, item) => sum + (Number(item.saves) || 0), 0) ?? 0

  const mostViewedAnalytic =
    dataAnalytics?.reduce(
      (top, item) => ((Number(item.views) || 0) > (Number(top?.views) || 0) ? item : top),
      dataAnalytics[0]
    ) ?? null

  const mostViewed = masterRepository.find((r) => r.id === mostViewedAnalytic?.thesis_id) ?? null
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
      icon: <Bookmark className="w-4 h-4" style={{ color: '#B0367A' }} />,
      iconBg: '#FCE8F1',
      value: totalSaves.toLocaleString(),
      label: 'Total saves',
      badge: 'All time',
      badgeBg: '#FCE8F1',
      badgeColor: '#7A1F51',
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

  const isEntrepView = viewMode === 'Entrepreneurship'

  const courseColorMap: Record<string, { bg: string; color: string }> = {
    'Accountancy':                   { bg: '#E6F1FB', color: '#0C447C' },
    'Public Administration':         { bg: '#EAF3DE', color: '#27500A' },
    'Accounting Information System': { bg: '#EEEDFE', color: '#3C3489' },
    'Entrepreneurship':              { bg: '#FAEEDA', color: '#633806' },
  }

  function getCourseStyle(course: string) {
    return courseColorMap[course] ?? { bg: '#F1EFE8', color: '#444441' }
  }

  const scopedRepository = useMemo(() => {
    if (viewMode === 'All') {
      return repository.filter((item) => item.course !== 'Entrepreneurship')
    }
    return repository
  }, [repository, viewMode])

  const totalPages = Math.max(1, Math.ceil(scopedRepository.length / PAGE_SIZE))

  const visibleRepository = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return scopedRepository.slice(start, start + PAGE_SIZE)
  }, [scopedRepository, page])

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
  }

  const headClass =
    'text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap'
  const headStyle: React.CSSProperties = {
    letterSpacing: '0.05em',
    fontSize: '11px',
    background: 'rgba(0,0,0,0.02)',
  }

  const SortableHead = ({ label }: { label: string }) => {
    const field = SORTABLE_FIELDS[label]
    const isSortable = Boolean(field)
    const isActive = isSortable && field === sortField

    return (
      <TableHead
        onClick={isSortable ? () => handleSortClick(label) : undefined}
        className={`${headClass} ${isSortable ? 'cursor-pointer select-none hover:text-foreground' : ''}`}
        style={headStyle}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isSortable &&
            (isActive ? (
              sortOrder === 'asc' ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-30" />
            ))}
        </span>
      </TableHead>
    )
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
          <h1 className="text-2xl font-bold leading-tight">Data Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every view, download, and submission — tracked and organized in one place.
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 ${
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
            <span className="text-2xl font-medium leading-none">{stat.value}</span>
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
              style={{ background: stat.badgeBg, color: stat.badgeColor }}
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
          {/* Toolbar */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap"
            style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center gap-3 sm:flex-row flex-col">
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

              <Select
                value={viewMode}
                onValueChange={(val) => setViewMode(val as FilterKey)}
              >
                <SelectTrigger
                  className="h-8 text-xs font-medium focus:ring-1 focus:ring-amber-400"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    borderColor: 'rgba(0,0,0,0.12)',
                    minWidth: '220px',
                    background:
                      viewMode !== 'All' ? getCourseStyle(viewMode).bg : undefined,
                    color:
                      viewMode !== 'All' ? getCourseStyle(viewMode).color : undefined,
                  }}
                >
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}
                >
                  {FILTER_TABS.map((tab) => (
                    <SelectItem key={tab.key} value={tab.key} className="text-xs">
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ENTREP TABLE — only shows when viewMode === 'Entrepreneurship' */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {isEntrepView && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow
                    className="hover:bg-transparent"
                    style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}
                  >
                    <TableHead className={headClass} style={headStyle}>Thesis ID</TableHead>
                    <SortableHead label="Title" />
                    <SortableHead label="Author" />
                    <SortableHead label="Date" />
                    <TableHead className={headClass} style={headStyle}>Course</TableHead>
                    <TableHead className={headClass} style={headStyle}>Introduction</TableHead>
                    <TableHead className={headClass} style={headStyle}>Action Plan</TableHead>
                    <TableHead className={headClass} style={headStyle}>Market</TableHead>
                    <TableHead className={headClass} style={headStyle}>Survey Result</TableHead>
                    <TableHead className={headClass} style={headStyle}>Target Market</TableHead>
                    <TableHead className={headClass} style={headStyle}>Product</TableHead>
                    <TableHead className={headClass} style={headStyle}>Production</TableHead>
                    <TableHead className={headClass} style={headStyle}>filename</TableHead>
                    <TableHead className={headClass} style={headStyle}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && visibleRepository.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-10 text-sm text-muted-foreground">
                        No thesis found matching your search.
                      </td>
                    </tr>
                  ) : (
                    visibleRepository.map((item) => (
                      <EntrepTableActions
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        author={item.author}
                        issue_date={item.issue_date}
                        course={item.course}
                        entrep_intro={item.entrep_intro}
                        entrep_action_plan={item.entrep_action_plan}
                        entrep_market_product_description={item.entrep_market_product_description}
                        entrep_survey_result={item.entrep_survey_result}
                        entrep_target_market={item.entrep_target_market}
                        entrep_product={item.entrep_product}
                        entrep_production={item.entrep_production}
                        filename={item.thesis_file_name}
                        isOpen={() => setSelectedThesis(item)}
                        DeleteThesis={handleDelete}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* STANDARD TABLE — hides when viewMode === 'Entrepreneurship'  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {!isEntrepView && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow
                    className="hover:bg-transparent"
                    style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}
                  >
                    <TableHead className={headClass} style={headStyle}>Thesis ID</TableHead>
                    <SortableHead label="Title" />
                    <TableHead className={headClass} style={headStyle}>Abstract</TableHead>
                    <SortableHead label="Author" />
                    <SortableHead label="Date" />
                    <TableHead className={headClass} style={headStyle}>Course</TableHead>
                    <TableHead className={headClass} style={headStyle}>Introduction</TableHead>
                    <TableHead className={headClass} style={headStyle}>Scope and Limitation</TableHead>
                    <TableHead className={headClass} style={headStyle}>Conclusion</TableHead>
                    <TableHead className={headClass} style={headStyle}>Recommendation</TableHead>
                    <TableHead className={headClass} style={headStyle}>filename</TableHead>
                    <TableHead className={headClass} style={headStyle}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && visibleRepository.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-10 text-sm text-muted-foreground">
                        No thesis found matching your search.
                      </td>
                    </tr>
                  ) : (
                    visibleRepository.map((item) => (
                      <TableActions
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        author={item.author}
                        issue_date={item.issue_date}
                        course={item.course}
                        abstract={item.thesis_abstract}
                        introduction={item.thesis_introduction}
                        scope_and_limitation={item.thesis_scope_and_limitation}
                        conclusion={item.thesis_conclusion}
                        recommendation={item.thesis_recommendation}
                        filename={item.thesis_file_name}
                        isOpen={() => setSelectedThesis(item)}
                        DeleteThesis={handleDelete}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && scopedRepository.length > 0 && (
            <div
              className="flex items-center justify-center gap-4 px-4 py-3"
              style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)' }}
            >
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
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
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
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
          abstract={selectedThesis.thesis_abstract}
          introduction={selectedThesis.thesis_introduction}
          scope_and_limitation={selectedThesis.thesis_scope_and_limitation}
          conclusion={selectedThesis.thesis_conclusion}
          recommendation={selectedThesis.thesis_recommendation}
          file_url={selectedThesis.thesis_file_name}
          entrep_intro={selectedThesis.entrep_intro}
          entrep_action_plan={selectedThesis.entrep_action_plan}
          entrep_market_product_description={selectedThesis.entrep_market_product_description}
          entrep_survey_result={selectedThesis.entrep_survey_result}
          entrep_target_market={selectedThesis.entrep_target_market}
          entrep_product={selectedThesis.entrep_product}
          entrep_production={selectedThesis.entrep_production}
        />
      )}
    </div>
  )
}

export default DataAnalytics