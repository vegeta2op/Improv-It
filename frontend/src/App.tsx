import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/store'
import { Toaster } from '@/components/ui/toaster'
import Layout from '@/components/Layout'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/Login'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'))
const SignupPage = lazy(() => import('@/pages/Signup'))
const DashboardPage = lazy(() => import('@/pages/Dashboard'))
const StudentsPage = lazy(() => import('@/pages/Students'))
const StudentDetailPage = lazy(() => import('@/pages/StudentDetail'))
const PredictorPage = lazy(() => import('@/pages/Predictor'))
const AnalyticsPage = lazy(() => import('@/pages/Analytics'))
const ReportsPage = lazy(() => import('@/pages/Reports'))
const SettingsPage = lazy(() => import('@/pages/Settings'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  // Wait for Zustand to rehydrate from localStorage before making auth decisions.
  // Without this, on page refresh the store briefly shows isAuthenticated=false
  // and immediately redirects to /login before the persisted state is loaded.
  if (!_hasHydrated) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function App() {
  const theme = useAuthStore((state) => state.theme)
  
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:usn" element={<StudentDetailPage />} />
            <Route path="predictor" element={<PredictorPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  )
}

export default App
