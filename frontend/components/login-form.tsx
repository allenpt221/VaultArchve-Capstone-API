'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import gccImage from '@/assets/gcc.png'
import Image from "next/image"
import { useEffect, useState } from "react"
import { authUserStore } from "@/Stores/authStores"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { CircleCheckBig, Eye, EyeOff } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState('');
   const [retryAfter, setRetryAfter] = useState<string | null>(null);
   const [countdown, setCountdown] = useState<number | null>(null);
  


  const { logIn, loading } = authUserStore();

    const parseRetryAfter = (retryAfter?: string): number | null => {
      if (!retryAfter) return null;
      const match = retryAfter.match(/\d+/);
      return match ? parseInt(match[0]) : null;
  };



  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess(false);
      setFailed(false);
      setRetryAfter(null);

      if (!email.trim() || !password.trim()) {
        setError('All fields are required.');
        setFailed(true);
        return;
      }

      try {
        const result = await logIn({ email, password });

        if (!result.success) {
          setError(result.message || 'Invalid credentials.');
          setRetryAfter(result.retryAfter ?? null);
          setCountdown(parseRetryAfter(result.retryAfter));
          setFailed(true);
        } else {
          setSuccess(true);
          setPassword('');
          setEmail('');
        }
      } catch (error: any) {
        console.error(error);
        setError('Something went wrong. Please try again.');
        setFailed(true);
      }
    };

  useEffect(() => {
    if (!success && !failed) return;
    const timer = setTimeout(() => {
      setSuccess(false);
      setFailed(false);
      setRetryAfter(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [success, failed]);


    useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);





  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your VaultArchve account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  className={`sm:text-base h-10 text-sm ${failed && !email.trim() ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  id="email"
                  type="email"
                  placeholder="me@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                  <div className="relative w-full">
                  <span
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </span>
                  <Input
                    className={`sm:text-base h-10 text-sm pr-10 ${failed && !password.trim() ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                </Field>
                <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                </a>
              <Field>
                <Button type="submit" 
                disabled={loading || countdown !== null}
                className="bg-amber-500 py-5 cursor-pointer text-black hover:bg-amber-500/80 font-semibold">
                  {loading
                    ? 'Logging in...'
                    : 'Log In'
                  }
                </Button>
                {countdown !== null && (
                  <span className=" text-xs text-red-500 font-medium">
                    Too many attempts. Please wait{" "}
                    <span className="font-bold">{countdown}s</span>{" "}
                    before trying again.
                  </span>
                )}
              </Field>
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

      {success && (
      <Alert
        variant="default"
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md px-6 py-4 shadow-lg rounded-xl border border-green-500 bg-green-100`}
      >
        <div className="flex items-start gap-3">
          <CircleCheckBig className="text-green-500" />
          <div>
            <AlertTitle
              className='text-green-600 font-semibold'>
              Login successful
            </AlertTitle>
            <AlertDescription className="text-green-600 text-xs">
              Welcome back! You’re now signed in.
            </AlertDescription>
          </div>
        </div>
      </Alert>
      )}

      {failed && (
        <Alert
          variant="default"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md px-6 py-4 shadow-lg rounded-xl border border-red-500 bg-red-100"
        >
          <div className="flex items-start gap-3">
            <CircleCheckBig className="text-red-500" />
            <div>
              <AlertTitle className="text-red-600 font-semibold">
                Login Failed
              </AlertTitle>
              <AlertDescription className="text-red-600 text-xs">
                {error}
                {retryAfter && (
                  <span className="block mt-1 font-medium">
                    Please try again in {retryAfter}.
                  </span>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
    </div>
  )
}
