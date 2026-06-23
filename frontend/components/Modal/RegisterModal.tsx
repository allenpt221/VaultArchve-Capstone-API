'use client'
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react'
import { userStore } from '@/Stores/userStore'

interface registerModalProps {
  isOpen: boolean
  onClose: () => void
}

interface registerFormState {
  firstname: string
  lastname: string
  email: string
  password: string
  role: string
}

const initialFormState: registerFormState = {
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  role: 'student',
}

function RegisterModal({ isOpen, onClose }: registerModalProps) {
  const { addUser, fetchUsers, currentPage } = userStore()

  const [form, setForm] = useState<registerFormState>(initialFormState)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(field: keyof registerFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  function resetAndClose() {
    setForm(initialFormState)
    setShowPassword(false)
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.firstname || !form.lastname || !form.email || !form.password) {
      setError('Please fill in all required fields.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const result = await addUser(form)
    setLoading(false)

    if (result?.success) {
      await fetchUsers(currentPage, 10)
      resetAndClose()
    } else {
      setError(result?.message || 'Failed to register student. Please try again.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent
        className="lg:max-w-235 md:max-w-150"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#FAEEDA' }}
            >
              <UserPlus className="w-4 h-4" style={{ color: '#BA7517' }} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold leading-tight">
                Register Student
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Create a new student account.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstname" className="text-xs font-medium">
                First Name
              </Label>
              <Input
                id="firstname"
                value={form.firstname}
                onChange={(e) => handleChange('firstname', e.target.value)}
                placeholder="Juan"
                disabled={loading}
                className="text-sm h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastname" className="text-xs font-medium">
                Last Name
              </Label>
              <Input
                id="lastname"
                value={form.lastname}
                onChange={(e) => handleChange('lastname', e.target.value)}
                placeholder="Dela Cruz"
                disabled={loading}
                className="text-sm h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="juan.delacruz@email.com"
              disabled={loading}
              className="text-sm h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Minimum 8 characters"
                disabled={loading}
                className="text-sm pr-9 h-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5 cursor-pointer" />
                ) : (
                  <Eye className="w-3.5 h-3.5 cursor-pointer" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-xs font-medium">
              Role
            </Label>
            <Select
              value={form.role}
              onValueChange={(value) => handleChange('role', value)}
              disabled={loading}
            >
              <SelectTrigger id="role" className="text-sm">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: '#FEEAEA', color: '#B91C1C' }}
            >
              {error}
            </p>
          )}

          <DialogFooter className="pt-1 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={loading}
              className="text-sm cursor-pointer" 
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-sm text-white hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
              style={{ background: '#D97706' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Student'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterModal