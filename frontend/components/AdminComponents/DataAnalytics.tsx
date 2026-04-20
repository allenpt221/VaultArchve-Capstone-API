'use client'
import { repoStores } from '@/Stores/repoStores'
import { ChartNoAxesCombined, BookOpen, Eye, TrendingUp, Download } from 'lucide-react'

function DataAnalytics() {
    const { repository } = repoStores();
    const totalViews = repository.reduce((sum, repo) => sum + repo.views, 0);
    const totalDownloads = repository.reduce((sum, repo) => sum + (repo.downloads || 0), 0);
    const mostViewed = repository.reduce((top, repo) =>
    repo.views > top.views ? repo : top, repository[0]
    );

    console.log(totalDownloads)

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
    value: totalViews.toLocaleString(),
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
    value: mostViewed?.views.toLocaleString() ?? '0',
    label: mostViewed?.title ?? '—',
    badge: 'Most viewed',
    badgeBg: '#FAEEDA',
    badgeColor: '#BA7517',
  },
]


  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100">
          <ChartNoAxesCombined className="w-4 h-4 text-amber-600" />
        </div>
        <h1 className="text-xl font-medium">Data Analytics</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Track thesis submissions, views, and trends across the repository.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="border rounded-xl p-4 flex flex-col gap-2 bg-white dark:bg-background">
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
          </div>
        ))}
      </div>
    </div>
  )
}

export default DataAnalytics