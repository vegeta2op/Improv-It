import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const { toast } = useToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true)
        try {
            // We'll assume the API call is successful for now, even if the backend isn't ready
            await authApi.forgotPassword(data.email)

            setIsSubmitted(true)
            toast({
                title: 'Reset link sent',
                description: 'Check your email for instructions to reset your password.',
            })
        } catch (error: any) {
            toast({
                title: 'Request failed',
                description: error.response?.data?.detail || 'Something went wrong. Please try again.',
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
                        Account Recovery
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-8">
                        Don't worry, it happens to the best of us. We'll help you get back into your account in no time.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-muted-foreground">Secure reset process</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-muted-foreground">Instant email delivery</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-muted-foreground">24/7 Support available</span>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground/60 font-medium">
                    © {new Date().getFullYear()} Improv-It Education Systems
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex items-center justify-center p-8 lg:p-16 bg-background">
                <div className="w-full max-w-sm space-y-8 animate-fade-in">
                    <div className="text-center lg:text-left">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Login
                        </Link>

                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Forgot your password?</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {isSubmitted ? (
                        <div className="bg-green-50 border border-green-100 rounded-lg p-6 text-center animate-in fade-in zoom-in duration-300 dark:bg-green-900/10 dark:border-green-900/20">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-green-900/20">
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-green-900 mb-2 dark:text-green-400">Check your email</h3>
                            <p className="text-sm text-green-700 mb-6 dark:text-green-300">
                                We've sent a password reset link to your email address.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                                onClick={() => setIsSubmitted(false)}
                            >
                                Send another link
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@institution.edu"
                                        {...register('email')}
                                        className="pl-9 h-10 bg-muted/50 border-input focus:bg-background transition-all"
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-destructive font-medium mt-1">{errors.email.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-10 font-medium bg-primary hover:bg-primary/90 transition-colors shadow-sm"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Secure System</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
