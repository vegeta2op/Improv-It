import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, TrendingUp, Users, AlertCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
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

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.overview(),
  })

  // Mock data for distribution if API fails or returns empty format
  const { data: distribution } = useQuery({
    queryKey: ['analytics', 'distribution'],
    queryFn: () => analyticsApi.distribution(),
  })

  const { data: topPerformers } = useQuery({
    queryKey: ['analytics', 'top'],
    queryFn: () => analyticsApi.topPerformers(5), // Limit to top 5 for cleaner UI
  })

  const { data: needsAttention } = useQuery({
    queryKey: ['analytics', 'attention'],
    queryFn: () => analyticsApi.needsAttention(60),
  })

  const { data: mostImproved } = useQuery({
    queryKey: ['analytics', 'improved'],
    queryFn: () => analyticsApi.mostImproved(5), // Limit to top 5
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  const semesterData = analytics?.data?.semester_averages
    ? Object.entries(analytics.data.semester_averages).map(([key, value]) => ({
      name: key.replace('sem', 'Sem '),
      value: value as number,
    }))
    : []

  const distributionData = distribution?.data
    ? [
      { name: 'Excellent (≥90)', value: distribution.data.excellent },
      { name: 'Good (80-89)', value: distribution.data.good },
      { name: 'Average (70-79)', value: distribution.data.average },
      { name: 'Below Avg (<70)', value: distribution.data.below_average },
    ]
    : []

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics Overview</h1>
        <p className="text-muted-foreground mt-1">Deep dive into academic performance metrics and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Semester Averages */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Semester Performance</CardTitle>
            <CardDescription>Average performance across all semesters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={semesterData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Student distribution by performance bands</CardDescription>
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
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {distributionData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <CardDescription>Highest achieving students this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers?.data?.map((student: any, index: number) => (
                <div key={index} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{student.usn}</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400 text-sm">{student.grade}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Improved */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Most Improved</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <CardDescription>Biggest gainers from Sem 1 to Sem 6</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mostImproved?.data?.map((student: any, index: number) => (
                <div key={index} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                      {student.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.sem1}% <span className="text-muted-foreground/50">→</span> {student.sem6}%
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">+{student.improvement}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-red-600 dark:text-red-400">Needs Attention</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <CardDescription>Students below performance threshold</CardDescription>
          </CardHeader>
          <CardContent>
            {needsAttention?.data?.length > 0 ? (
              <div className="space-y-3">
                {needsAttention?.data?.map((student: any, index: number) => (
                  <div key={index} className="p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-red-900 dark:text-red-300">{student.name}</p>
                      <p className="text-xs text-red-400 dark:text-red-300/70 font-mono">{student.usn}</p>
                    </div>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{student.grade}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <div className="h-10 w-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm font-medium text-foreground">All Clear</p>
                <p className="text-xs text-muted-foreground mt-1">No students below threshold</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
