import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  LayoutDashboard,
  Users,
  Brain,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Predictor', href: '/predictor', icon: Brain },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout, theme, setTheme } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await authApi.logout()
      logout()
      navigate('/login')
      toast({
        title: 'Logged out',
        description: 'Have a great day!',
      })
    } catch (error) {
      logout()
      navigate('/login')
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const pageTitle = navigation.find(item => item.href === location.pathname)?.name || 'Improv-It'

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background flex transition-colors duration-300">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white dark:bg-card border-r border-gray-100 dark:border-border shadow-sm transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-50 dark:border-border">
          <div className={cn("flex items-center gap-3 overflow-hidden", sidebarCollapsed && "justify-center w-full")}>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-lg">I</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold text-gray-800 dark:text-foreground tracking-tight whitespace-nowrap opacity-100 transition-opacity duration-300">
                Improv-It
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-muted text-gray-500 dark:text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 mt-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary/5 text-primary dark:bg-primary/20 dark:text-primary"
                    : "text-gray-500 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-muted hover:text-gray-900 dark:hover:text-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )
              }
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0 transition-colors")} />
              {!sidebarCollapsed && (
                <span className="whitespace-nowrap origin-left transition-all duration-200">
                  {item.name}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 w-full px-3">
          <div className="border-t border-gray-100 dark:border-border mb-2 mx-2"></div>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 text-gray-400 hover:text-gray-600 dark:text-muted-foreground dark:hover:text-foreground hover:bg-gray-50 dark:hover:bg-muted rounded-lg mb-2 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

           <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-500 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground hover:bg-gray-50 dark:hover:bg-muted transition-colors mb-2",
              sidebarCollapsed && "justify-center px-2"
            )}
            onClick={toggleTheme}
            title={sidebarCollapsed ? (theme === 'dark' ? "Light Mode" : "Dark Mode") : undefined}
          >
            {theme === 'dark' ? (
               <Sun className={cn("h-5 w-5", !sidebarCollapsed && "mr-2")} />
            ) : (
               <Moon className={cn("h-5 w-5", !sidebarCollapsed && "mr-2")} />
            )}
            {!sidebarCollapsed && (theme === 'dark' ? "Light Mode" : "Dark Mode")}
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-muted-foreground dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors",
              sidebarCollapsed && "justify-center px-2"
            )}
            onClick={handleLogout}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className={cn("h-5 w-5", !sidebarCollapsed && "mr-2")} />
            {!sidebarCollapsed && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-64")}>
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-100 dark:border-border px-4 sm:px-6 lg:px-8">
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-50 dark:hover:bg-muted text-gray-500 dark:text-muted-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>

              <h1 className="text-xl font-semibold text-gray-800 dark:text-foreground hidden sm:block">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex relative items-center">
                <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-9 w-64 rounded-full bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 dark:text-foreground transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="h-6 w-px bg-gray-200 dark:bg-border hidden sm:block"></div>

              <button className="relative p-2 rounded-full hover:bg-gray-50 dark:hover:bg-muted text-gray-500 dark:text-muted-foreground transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-background" />
              </button>

              <div className="flex items-center gap-3 pl-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-sm text-right">
                  <p className="font-medium text-gray-700 dark:text-foreground leading-none">{user?.full_name || 'Teacher'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in text-foreground">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
