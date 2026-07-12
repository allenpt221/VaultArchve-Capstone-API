import { ForgotForm } from '@/components/forgot-password-form';
import { LoginForm } from '@/components/login-form';

function ForgotPassword() {
  return (
     <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <ForgotForm />
      </div>
    </div>
  )
}

export default ForgotPassword;