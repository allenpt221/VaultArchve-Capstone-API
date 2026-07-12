// app/reset-password/page.tsx
import { ResetForm } from "@/components/reset-form"
import { Suspense } from "react"

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <Suspense fallback={<div>Loading...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}