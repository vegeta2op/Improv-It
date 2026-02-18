import { useQuery } from '@tanstack/react-query'
import { dashboardApi, analyticsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  Star,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.stats(),
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.overview(),
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => dashboardApi.notifications(),
    refetchInterval: 30000,
  })

  const handleRefresh = () => {
    refetchStats()
    window.location.reload()
  }

  if (statsLoading || analyticsLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.data?.total_students || 0,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      title: 'Avg. Performance',
      value: `${stats?.data?.average_performance?.toFixed(1) || 0}%`,
      change: '+8%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      title: 'Top Performers',
      value: stats?.data?.top_performers || 0,
      change: '+3',
      changeType: 'positive' as const,
      icon: Star,
    },
    {
      title: 'Needs Attention',
      value: stats?.data?.needs_attention || 0,
      change: '-5%',
      changeType: 'negative' as const,
      icon: AlertCircle,
    },
  ]

  const semesterData = analytics?.data?.semester_averages
    ? Object.entries(analytics.data.semester_averages).map(([key, value]) => ({
      name: key.replace('sem', 'Sem '),
      value: value as number,
    }))
    : []

  const distributionData = analytics?.data?.performance_distribution
    ? [
      { name: 'Excellent', value: analytics.data.performance_distribution.excellent },
      { name: 'Good', value: analytics.data.performance_distribution.good },
      { name: 'Average', value: analytics.data.performance_distribution.average },
      { name: 'Below Avg', value: analytics.data.performance_distribution.below_average },
    ]
    : []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's a summary of your students' performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={stat.title} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${i === 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : i === 1 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : i === 2 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                <span className={`flex items-center font-medium ${stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <Card className="lg:col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={semesterData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeOpacity: 0.2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4, stroke: 'hsl(var(--background))' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {distributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan x="50%" dy="-10" fontSize="24" fontWeight="bold" fill="hsl(var(--foreground))">
                      {stats?.data?.total_students || 0}
                    </tspan>
                    <tspan x="50%" dy="20" fontSize="12" fill="hsl(var(--muted-foreground))">
                      Students
                    </tspan>
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {distributionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span className="text-xs text-muted-foreground font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {notifications?.data?.notifications?.slice(0, 5).map((notification: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notification.type === 'warning' ? 'bg-amber-500' :
                      notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notification.message}</p>
                  </div>
                </div>
              ))}
              {(!notifications?.data?.notifications || notifications.data.notifications.length === 0) && (
                <div className="py-8 text-center text-muted-foreground text-sm">No new notifications</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.data?.top_performers?.slice(0, 5).map((student: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{student.usn}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{student.grade}</div>
                    <div className="text-xs text-muted-foreground">Sem 6</div>
                  </div>
                </div>
              ))}
              {(!analytics?.data?.top_performers || analytics.data.top_performers.length === 0) && (
                <div className="py-8 text-center text-muted-foreground text-sm">No student data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
