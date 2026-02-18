import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { studentsApi, predictionsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Brain, Upload, CheckCircle2, User, Users, BarChart } from 'lucide-react'

export default function PredictorPage() {
  const [selectedUsns, setSelectedUsns] = useState<string[]>([])
  const [singleUsn, setSingleUsn] = useState('')
  const { toast } = useToast()

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.list({ limit: 100 }),
  })

  // Single prediction mutation
  const singleMutation = useMutation({
    mutationFn: (usn: string) => predictionsApi.single(usn),
    onSuccess: (data) => {
      toast({
        title: 'Prediction Generated',
        description: `Predicted Score: ${data.data.predicted_grade} with ${(data.data.confidence * 100).toFixed(0)}% confidence`,
        variant: 'default',
      })
    },
    onError: () => {
      toast({
        title: 'Prediction Failed',
        description: 'Could not generate prediction. Please check the USN.',
        variant: 'destructive'
      })
    },
  })

  // Batch prediction mutation
  const batchMutation = useMutation({
    mutationFn: (usns: string[]) => predictionsApi.batch(usns),
    onSuccess: (data) => {
      toast({
        title: 'Batch Predictions Complete',
        description: `Successfully generated predictions for ${data.data.total} students`,
      })
      setSelectedUsns([])
    },
    onError: () => {
      toast({ title: 'Batch prediction failed', variant: 'destructive' })
    },
  })

  const handleSelectAll = () => {
    if (students?.data) {
      // If all are selected, deselect all. Otherwise, select all.
      if (selectedUsns.length === students.data.length) {
        setSelectedUsns([])
      } else {
        setSelectedUsns(students.data.map((s: any) => s.usn))
      }
    }
  }

  const toggleUsn = (usn: string) => {
    setSelectedUsns((prev) =>
      prev.includes(usn) ? prev.filter((u) => u !== usn) : [...prev, usn]
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Performance Predictor</h1>
        <p className="text-muted-foreground mt-1">Leverage machine learning to forecast student performance and identify at-risk individuals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Single Prediction Card */}
        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs font-normal">Individual Analysis</Badge>
            </div>
            <CardTitle className="text-xl">Single Student Prediction</CardTitle>
            <CardDescription>
              Enter a USN to generate a performance forecast for a specific student.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="space-y-2">
              <Label htmlFor="singleUsn" className="text-sm font-medium">Student USN</Label>
              <div className="flex gap-2">
                <Input
                  id="singleUsn"
                  placeholder="e.g., 1RV23CS001"
                  value={singleUsn}
                  onChange={(e) => setSingleUsn(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the full University Seat Number (USN).
              </p>
            </div>

            {singleMutation.data && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Predicted Grade</span>
                  <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {singleMutation.data.data.predicted_grade}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-1">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${singleMutation.data.data.predicted_grade}%` }}
                  />
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="pt-2">
            <Button
              className="w-full gap-2"
              onClick={() => singleMutation.mutate(singleUsn)}
              disabled={!singleUsn || singleMutation.isPending}
            >
              {singleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {singleMutation.isPending ? 'Analyzing...' : 'Generate Prediction'}
            </Button>
          </CardFooter>
        </Card>

        {/* Batch Prediction Card */}
        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <Badge variant="outline" className="text-xs font-normal">Bulk Processing</Badge>
            </div>
            <CardTitle className="text-xl">Batch Predictions</CardTitle>
            <CardDescription>
              Select multiple students to generate predictions in bulk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedUsns.length} student{selectedUsns.length !== 1 && 's'} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll} className="h-8 text-xs">
                  {selectedUsns.length === students?.data?.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-border rounded-md bg-muted/30 p-1 space-y-1 max-h-[250px]">
              {students?.data?.map((student: any) => (
                <label
                  key={student.usn}
                  className={`flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors border ${selectedUsns.includes(student.usn) ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted border-transparent'}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedUsns.includes(student.usn) ? 'bg-primary border-primary' : 'border-input bg-card'}`}>
                    {selectedUsns.includes(student.usn) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedUsns.includes(student.usn)}
                    onChange={() => toggleUsn(student.usn)}
                    className="hidden"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{student.name}</span>
                    <span className="text-xs text-muted-foreground">{student.usn}</span>
                  </div>
                </label>
              ))}
              {(!students?.data || students.data.length === 0) && (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No students found
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => batchMutation.mutate(selectedUsns)}
              disabled={selectedUsns.length === 0 || batchMutation.isPending}
            >
              {batchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {batchMutation.isPending ? 'Processing...' : 'Run Batch Analysis'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Model Info Section */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Model Architecture Weights</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Linear Regression', weight: '15%', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
            { name: 'Ridge Regression', weight: '20%', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' },
            { name: 'Lasso Regression', weight: '10%', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' },
            { name: 'Random Forest', weight: '25%', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
            { name: 'Gradient Boosting', weight: '30%', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
            { name: 'Ensemble Model', weight: 'Aggregated', color: 'bg-muted text-foreground border-border' },
          ].map((model) => (
            <Card key={model.name} className={`border-0 shadow-sm ${model.color} transition-all hover:scale-[1.02]`}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="font-semibold text-sm mb-1">{model.name}</span>
                <Badge variant="secondary" className="bg-background/50 backdrop-blur-sm border-0 text-xs mt-1">
                  {model.weight}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
