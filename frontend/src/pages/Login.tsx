import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data.email, data.password)
      const { access_token, user } = response.data

      setAuth(user, access_token)

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${user.email}`,
        variant: 'default',
      })

      navigate('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.detail || 'Invalid email or password',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left side - Branding Information */}
      <div className="hidden lg:flex flex-col justify-between bg-primary/5 p-12 lg:p-16 border-r border-border/50">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-xl">I</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Improv-It</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
            Intelligent Student Performance Prediction
          </h1>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-8">
            Empower your teaching with AI-driven insights. Identify at-risk students early and intervene effectively to improve academic outcomes.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Advanced prediction models</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Real-time academic analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Actionable student insights</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground/60 font-medium">
          © {new Date().getFullYear()} Improv-It Education Systems
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex items-center justify-center p-8 lg:p-16 bg-background">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="font-bold text-xl">I</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in to your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access the faculty dashboard
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:text-primary/80">
                Create one
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@institution.edu"
                  {...register('email')}
                  className="h-10 bg-muted/50 border-input focus:bg-background transition-all"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-medium mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80">Forgot password?</Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="h-10 bg-muted/50 border-input focus:bg-background transition-all"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-xs text-destructive font-medium mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 font-medium bg-primary hover:bg-primary/90 transition-colors shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Secure System</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/60">
            For access issues, please contact the IT department.
          </p>
        </div>
      </div>
    </div>
  )
}
