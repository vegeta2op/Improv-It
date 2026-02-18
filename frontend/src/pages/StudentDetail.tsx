import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi, predictionsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeft, Brain, TrendingUp, TrendingDown, Minus, GraduationCap } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function StudentDetailPage() {
  const { usn } = useParams<{ usn: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', usn],
    queryFn: () => studentsApi.get(usn!),
    enabled: !!usn,
  })

  const { data: insights } = useQuery({
    queryKey: ['insights', usn],
    queryFn: () => predictionsApi.insights(usn!),
    enabled: !!usn,
  })

  // const { data: chartData } = useQuery({
  //   queryKey: ['chart', usn],
  //   queryFn: () => dashboardApi.performanceChart(usn!),
  //   enabled: !!usn,
  // })

  const predictMutation = useMutation({
    mutationFn: () => predictionsApi.single(usn!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', usn] })
      queryClient.invalidateQueries({ queryKey: ['insights', usn] })
      toast({ title: 'Prediction generated successfully' })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  if (!student?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Student Not Found</h2>
        <p className="text-gray-500">The student record you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate('/students')}>
          Back to Students Directory
        </Button>
      </div>
    )
  }

  const s = student.data
  const trend = s.sem6 - s.sem1

  const semesterMarks = [
    { name: 'Sem 1', value: s.sem1 },
    { name: 'Sem 2', value: s.sem2 },
    { name: 'Sem 3', value: s.sem3 },
    { name: 'Sem 4', value: s.sem4 },
    { name: 'Sem 5', value: s.sem5 },
    { name: 'Sem 6', value: s.sem6 },
  ]

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')} className="mt-1">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{s.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground font-mono text-sm">
                <span className="bg-muted px-2 py-0.5 rounded text-foreground">{s.usn}</span>
                <span>•</span>
                <span>Class of 2024</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                Edit Profile
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => predictMutation.mutate()}
                disabled={predictMutation.isPending}
              >
                {predictMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Generate AI Insight
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Average</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{s.sem6}%</div>
            <p className="text-xs text-muted-foreground mt-1">Based on Semester 6 results</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Trend</CardTitle>
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : trend < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className={`text-3xl font-bold ${trend > 0 ? 'text-green-600 dark:text-green-400' : trend < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{trend > 0 ? '+' : ''}{trend}%</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Since Semester 1</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Predicted Sem 7</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {s.predicted_sem7 ? (
              <>
                <div className="text-3xl font-bold text-primary">{s.predicted_sem7.toFixed(1)}%</div>
                <p className="text-xs text-primary/70 mt-1">
                  {(s.prediction_confidence * 100).toFixed(0)}% confidence score
                </p>
              </>
            ) : (
              <>
                <div className="text-xl font-medium text-muted-foreground">N/A</div>
                <p className="text-xs text-muted-foreground mt-1">Run prediction to see forecast</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Academic Trajectory</CardTitle>
              <CardDescription>Performance history across all completed semesters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={semesterMarks} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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

          {/* Semester Details Table */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Semester Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { sem: 'Sem 1', val: s.sem1 },
                  { sem: 'Sem 2', val: s.sem2 },
                  { sem: 'Sem 3', val: s.sem3 },
                  { sem: 'Sem 4', val: s.sem4 },
                  { sem: 'Sem 5', val: s.sem5 },
                  { sem: 'Sem 6', val: s.sem6 },
                ].map((item) => (
                  <div key={item.sem} className="relative group p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">{item.sem}</div>
                    <div className="text-2xl font-bold text-foreground">{item.val}%</div>
                    <div className={`h-1 w-full rounded-full mt-3 ${item.val >= 70 ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                      <div className={`h-full rounded-full ${item.val >= 70 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-foreground">AI Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {insights?.data ? (
                <>
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Performance Trend
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                      {insights.data.trend === 'improving'
                        ? 'This student has been consistently improving over the last few semesters.'
                        : insights.data.trend === 'declining'
                          ? 'Performance has been declining recently. Early intervention is recommended.'
                          : 'Performance has been stable with minor fluctuations.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Recommendations</h4>
                    <ul className="space-y-3">
                      {insights.data.recommendations.slice(0, 4).map((rec: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2 items-start">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="bg-muted h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Brain className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-medium">No Analysis Generated</p>
                  <p className="text-sm text-muted-foreground mt-1">Click the "Generate AI Insight" button to analyze this student's performance.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
