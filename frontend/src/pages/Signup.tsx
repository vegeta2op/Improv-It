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
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'

const signupSchema = z
    .object({
        full_name: z.string().min(2, 'Full name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one digit'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()
    const { toast } = useToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
    })

    const password = watch('password', '')

    const passwordStrength = () => {
        let score = 0
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[a-z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++
        return score
    }

    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500', 'bg-emerald-500']
    const strength = passwordStrength()

    const onSubmit = async (data: SignupForm) => {
        setIsLoading(true)
        try {
            await authApi.register({
                email: data.email,
                password: data.password,
                full_name: data.full_name,
            })

            // Auto-login after registration by logging in
            const loginResponse = await authApi.login(data.email, data.password)
            const { access_token, user } = loginResponse.data

            setAuth(user, access_token)

            toast({
                title: 'Account created!',
                description: `Welcome to Improv-It, ${data.full_name}!`,
            })

            navigate('/dashboard')
        } catch (error: any) {
            toast({
                title: 'Registration failed',
                description: error.response?.data?.detail || 'Could not create account. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
            {/* Left side - Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-primary/5 p-12 lg:p-16 border-r border-border/50">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="font-bold text-xl">I</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">Improv-It</span>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
                        Join the Improv-It Platform
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-8">
                        Create your faculty account and start leveraging AI-powered insights to improve student outcomes from day one.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            <span className="text-muted-foreground">Instant access to all features</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            <span className="text-muted-foreground">AI-driven student performance predictions</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            <span className="text-muted-foreground">Detailed analytics and reporting</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            <span className="text-muted-foreground">Secure and private data handling</span>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground/60 font-medium">
                    © {new Date().getFullYear()} Improv-It Education Systems
                </div>
            </div>

            {/* Right side - Signup form */}
            <div className="flex items-center justify-center p-8 lg:p-16 bg-background overflow-y-auto">
                <div className="w-full max-w-sm space-y-6 animate-fade-in py-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="font-bold text-xl">I</span>
                        </div>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-sm font-medium text-foreground">
                                Full Name
                            </Label>
                            <Input
                                id="full_name"
                                type="text"
                                placeholder="Dr. Jane Smith"
                                {...register('full_name')}
                                className="h-10 bg-muted/50 border-input focus:bg-background transition-all"
                                autoComplete="name"
                            />
                            {errors.full_name && (
                                <p className="text-xs text-destructive font-medium">{errors.full_name.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@institution.edu"
                                {...register('email')}
                                className="h-10 bg-muted/50 border-input focus:bg-background transition-all"
                                autoComplete="email"
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 8 characters"
                                    {...register('password')}
                                    className="h-10 bg-muted/50 border-input focus:bg-background transition-all pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {/* Password strength indicator */}
                            {password.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : 'bg-muted'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs font-medium ${strength <= 2 ? 'text-destructive' : strength <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {strengthLabel[strength]}
                                    </p>
                                </div>
                            )}
                            {errors.password && (
                                <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground/80">Must include uppercase, lowercase, and a number.</p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Re-enter your password"
                                    {...register('confirmPassword')}
                                    className="h-10 bg-muted/50 border-input focus:bg-background transition-all pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 font-medium bg-primary hover:bg-primary/90 transition-colors shadow-sm mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
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
                        By creating an account, you agree to our{' '}
                        <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>{' '}
                        and{' '}
                        <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
                    </p>
                </div>
            </div>
        </div>
    )
}
