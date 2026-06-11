// components/ConditionalShell.tsx
'use client'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import ProtectedRoute from './ProtectedRoute'

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideShell = pathname.startsWith('/admin') || pathname.startsWith('/login')

  if (hideShell) {
    return <>{children}</>
  }

  return (
    <ProtectedRoute>
      <Navbar />
      {children}
      <Footer />
    </ProtectedRoute>
  )
}