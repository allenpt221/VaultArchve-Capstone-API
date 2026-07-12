"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import gccImage from '@/assets/gcc.png'
import Link from "next/link"
import { authUserStore } from "@/Stores/authStores"
import { CircleCheckBig, CircleAlert, Eye, EyeOff } from "lucide-react"

export function ResetForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { resetPassword, resetPasswordLoading } = authUserStore()
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get("token") ?? ""
  const id = searchParams.get("id") ?? ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [failed, setFailed] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Real-time validation flags
  const passwordTooShort = password.length > 0 && password.length < 8
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFailed(false)
    setSuccess(false)
    setError("")

    if (!token || !id) {
      setError("Invalid or missing reset link. Please request a new one.")
      setFailed(true)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      setFailed(true)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setFailed(true)
      return
    }

    const result = await resetPassword({ id, token, password, confirmPassword })

    if (!result.success) {
      setError(result.message ?? "Something went wrong.")
      setFailed(true)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push("/login")
    }, 2000)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {failed && (
        <Alert
          variant="default"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md px-6 py-4 shadow-lg rounded-xl border border-red-500 bg-red-100"
        >
          <div className="flex items-start gap-3">
            <CircleAlert className="text-red-500" />
            <div>
              <AlertTitle className="text-red-600 font-semibold">
                Reset Failed
              </AlertTitle>
              <AlertDescription className="text-red-600 text-xs">
                {error}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {success && (
        <Alert
          variant="default"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md px-6 py-4 shadow-lg rounded-xl border border-green-500 bg-green-100"
        >
          <div className="flex items-start gap-3">
            <CircleCheckBig className="text-green-500" />
            <div>
              <AlertTitle className="text-green-600 font-semibold">
                Password Reset
              </AlertTitle>
              <AlertDescription className="text-green-600 text-xs">
                Your password has been reset successfully. Redirecting to login...
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Reset password</h1>
                <p className="text-balance text-muted-foreground">
                  Enter a new password for your account
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={resetPasswordLoading}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordTooShort && (
                  <p className="text-xs text-red-600 mt-1">
                    Password must be at least 8 characters long.
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={resetPasswordLoading}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="text-xs text-red-600 mt-1">
                    Passwords do not match.
                  </p>
                )}
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={
                    resetPasswordLoading ||
                    passwordTooShort ||
                    passwordsMismatch ||
                    !password ||
                    !confirmPassword
                  }
                  className="h-10 cursor-pointer bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity-60"
                >
                  {resetPasswordLoading ? "Resetting..." : "Reset password"}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Remember your password?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Back to login
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden md:block">
            <Image
              src={gccImage}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-amber-600/40"></div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}