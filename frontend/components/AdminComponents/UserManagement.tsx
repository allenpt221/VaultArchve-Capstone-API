'use client'
import { userStore } from '@/Stores/userStore'
import {
  ChevronRight,
  ChevronLeft,
  Search,
  User,
  Users,
  BadgeCheck,
  ShieldMinus,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserTableActions } from '../UserTable'
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function UserManagement() {
  const {
    users,
    currentPage,
    totalPages,
    totalCount,
    loading,
    fetchUsers,
    deleteUser,
    disableUser
  } = userStore()


  const [search, setSearch] = useState('')
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)



  const handleDisable = (id: string) => {
    return disableUser(id);
  };

  const handleDelete = (id: string) => {
    return deleteUser(id);
  };

  useEffect(() => {
    fetchUsers(1, 10)
  }, [])

  async function handlePageChange(page: number) {
    fetchUsers(page, 10)
  }

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase()
    return (
      u.email?.toLowerCase().includes(term) ||
      u.firstname?.toLowerCase().includes(term) ||
      u.lastname?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    )
  })

  const activeAccounts = users.filter((u: any) => u.status?.toLowerCase() === 'active').length
  const disabledAccounts = users.filter((u: any) => u.status?.toLowerCase() === 'disabled').length

  const stats = [
    {
      icon: <User className="w-4 h-4" style={{ color: '#185FA5' }} />,
      iconBg: '#E6F1FB',
      value: totalCount,
      label: 'Total Students',
      badge: 'Student',
      badgeBg: '#E6F1FB',
      badgeColor: '#0C447C',
    },
    {
      icon: <BadgeCheck className="w-4 h-4" style={{ color: '#3B6D11' }} />,
      iconBg: '#EAF3DE',
      value: activeAccounts,
      label: 'Active accounts',
      badge: 'All time',
      badgeBg: '#EAF3DE',
      badgeColor: '#27500A',
    },
    {
      icon: <ShieldMinus className="w-4 h-4" style={{ color: '#DC2626' }} />,
      iconBg: '#EEEDFE',
      value: disabledAccounts,
      label: 'Disable accounts',
      badge: 'All time',
      badgeBg: '#EEEDFE',
      badgeColor: '#3C3489',
    },
  ]

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
          <Users className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight">
            User Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every Student account - tracked and managed in one place.
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          Manage Users
        </p>

        <div
          className="border rounded-xl overflow-hidden bg-white dark:bg-background"
          style={{ borderColor: 'rgba(0,0,0,0.08)' }}
        >
          {/* Table toolbar */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3"
            style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}
          >
            <div className="relative w-full sm:w-auto sm:min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg w-full border bg-transparent outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  borderColor: 'rgba(0,0,0,0.12)',
                }}
              />
            </div>

            <Button
              onClick={() => setIsRegisterOpen(true)}
              className="w-full sm:w-auto flex items-center cursor-pointer justify-center gap-1.5 text-sm font-medium text-white hover:opacity-90"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: '#D97706',
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register Student
            </Button>
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
                    'User ID',
                    'Student',
                    'Email',
                    'Role',
                    'Status',
                    'Actions',
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-sm text-muted-foreground"
                    >
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item: any) => (
                    <UserTableActions
                      key={item.id}
                      id={item.id}
                      firstname={item.firstname}
                      lastname={item.lastname}
                      middle={item.middle}
                      email={item.email}
                      role={item.role}
                      status={item.status}
                      isDisable={handleDisable}
                      DeleteUser={handleDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
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
    </div>
  )
}

export default UserManagement