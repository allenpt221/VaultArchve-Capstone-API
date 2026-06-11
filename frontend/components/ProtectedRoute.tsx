'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authUserStore } from '@/Stores/authStores'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = authUserStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading || !user) return null

  return <>{children}</>
}