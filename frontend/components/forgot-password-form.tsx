"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/

export function ForgotForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { forgotPassword, forgotPasswordLoading } = authUserStore()

  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!GMAIL_REGEX.test(email.trim())) {
      setFeedback({
        type: "error",
        message: "Please enter a valid Gmail address (e.g. name@gmail.com).",
      })
      return
    }

    const result = await forgotPassword(email.trim().toLowerCase())

    // Backend always returns a generic success message even if the
    // email doesn't exist, so this branch only fires on real errors
    // (network issues, 500s, etc.)
    setFeedback({
      type: result.success ? "success" : "error",
      message:
        result.message ??
        "If an account with that email exists, a reset link has been sent.",
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Forgot password?</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your Gmail address and we&apos;ll send you a link to reset your password
                </p>
              </div>

              <div className="space-y-1">
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={forgotPasswordLoading}
                    pattern="[a-zA-Z0-9._%+-]+@gmail\.com$"
                    title="Please enter a valid Gmail address"
                    required
                  />
                </Field>
                {feedback && (
                  <p
                    className={cn(
                      "text-xs text-center",
                      feedback.type === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {feedback.message}
                  </p>
                )}
              </div>
              <Field>
                <Button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="h-10 cursor-pointer bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity"
                >
                  {forgotPasswordLoading ? "Sending..." : "Send reset link"}
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