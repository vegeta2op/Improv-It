import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { studentsApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Search,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const gradeColor = (grade: number) => {
  if (grade >= 90) return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20'
  if (grade >= 80) return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-blue-600/20'
  if (grade >= 70) return 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-violet-600/20'
  if (grade >= 60) return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-amber-600/20'
  return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-600/20'
}

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()

  const limit = 10

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', { search, page, limit }],
    queryFn: () => studentsApi.list({ search, skip: (page - 1) * limit, limit }),
  })

  const { data: count } = useQuery({
    queryKey: ['students', 'count'],
    queryFn: () => studentsApi.count(),
  })

  const deleteMutation = useMutation({
    mutationFn: (usn: string) => studentsApi.delete(usn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast({ title: 'Student deleted successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to delete student', variant: 'destructive' })
    },
  })

  const handleExport = async () => {
    try {
      const response = await studentsApi.export()
      const blob = new Blob([response.data.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.data.filename
      a.click()
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil((count?.data?.total || 0) / limit)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your class roster and academic records</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <AddStudentForm
                onSuccess={() => {
                  setIsAddDialogOpen(false)
                  queryClient.invalidateQueries({ queryKey: ['students'] })
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shadow-sm focus-within:border-primary/20 focus-within:ring-2 focus-within:ring-primary/10 transition-all max-w-md">
        <Search className="h-4 w-4 text-muted-foreground ml-2" />
        <Input
          placeholder="Search by name or USN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 h-8 bg-transparent"
        />
      </div>

      {/* Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student Info</th>
                    <th className="px-6 py-4 font-medium">USN</th>
                    <th className="px-6 py-4 font-medium">Sem 6 Grade</th>
                    <th className="px-6 py-4 font-medium">Predicted Sem 7</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students?.data?.map((student: any) => (
                    <tr key={student.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold ring-2 ring-background">
                            {student.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{student.name}</div>
                            <div className="text-xs text-muted-foreground">Class of 2024</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{student.usn}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${gradeColor(student.sem6)}`}>
                          {student.sem6}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {student.predicted_sem7 ? (
                          <span className="font-medium text-foreground">{student.predicted_sem7.toFixed(1)}%</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {student.sem6 >= 85 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            Excellent
                          </span>
                        ) : student.sem6 >= 60 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                            Good
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            At Risk
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/students/${student.usn}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit Record
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this student record?')) {
                                  deleteMutation.mutate(student.usn)
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {(!students?.data || students.data.length === 0) && !isLoading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddStudentForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      usn: formData.get('usn') as string,
      name: formData.get('name') as string,
      sem1: Number(formData.get('sem1')),
      sem2: Number(formData.get('sem2')),
      sem3: Number(formData.get('sem3')),
      sem4: Number(formData.get('sem4')),
      sem5: Number(formData.get('sem5')),
      sem6: Number(formData.get('sem6')),
    }

    try {
      await studentsApi.create(data)
      toast({ title: 'Student added successfully' })
      onSuccess()
    } catch (error) {
      toast({ title: 'Failed to add student', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="usn">USN</Label>
          <Input id="usn" name="usn" required placeholder="Ex. 1RV19IS001" className="h-9" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" required placeholder="Ex. John Doe" className="h-9" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground font-normal uppercase tracking-wider">Academic Performance</Label>
        <div className="grid grid-cols-3 gap-4">
          {['sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6'].map((sem) => (
            <div key={sem} className="space-y-1.5">
              <Label htmlFor={sem} className="text-xs">{sem.toUpperCase()}</Label>
              <Input
                id={sem}
                name={sem}
                type="number"
                min="0"
                max="100"
                required
                placeholder="%"
                className="h-8"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {isLoading ? 'Adding...' : 'Add Student Record'}
        </Button>
      </div>
    </form>
  )
}
