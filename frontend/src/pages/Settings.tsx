import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { User, Bell, Shield, Database, Save } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated successfully.'
    })
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account credentials and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        {/* Sidebar Navigation (Visual Only for now) */}
        <nav className="hidden md:flex flex-col space-y-1">
          <Button variant="ghost" className="justify-start font-medium bg-muted text-foreground">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button variant="ghost" className="justify-start font-medium text-muted-foreground hover:text-foreground">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button variant="ghost" className="justify-start font-medium text-muted-foreground hover:text-foreground">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </Button>
          <Button variant="ghost" className="justify-start font-medium text-muted-foreground hover:text-foreground">
            <Database className="mr-2 h-4 w-4" />
            System
          </Button>
        </nav>

        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="border-border/50 shadow-sm" id="profile">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground border-2 border-dashed border-border">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">Change Avatar</Button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={user?.full_name || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" value={user?.email || ''} disabled className="bg-muted text-muted-foreground opacity-70" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" value={user?.role || 'Faculty'} disabled className="bg-muted text-muted-foreground opacity-70" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dept">Department</Label>
                      <Input id="dept" value={'Computer Science'} disabled className="bg-muted text-muted-foreground opacity-70" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border flex justify-end py-3">
              <Button onClick={handleSave} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          {/* Notifications Section */}
          <Card className="border-border/50 shadow-sm" id="notifications">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how and when you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive daily summaries and critical alerts via email.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Low Performance Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified immediately when a student's prediction drops below threshold.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Receive automated weekly analysis reports every Monday.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="border-border/50 shadow-sm" id="security">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and account security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" placeholder="••••••••" className="max-w-md" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" placeholder="••••••••" className="max-w-md" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input id="confirm" type="password" placeholder="••••••••" className="max-w-md" />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border flex justify-end py-3">
              <Button onClick={handleSave} variant="secondary" size="sm">
                Update Password
              </Button>
            </CardFooter>
          </Card>

          {/* System Section */}
          <Card className="border-border/50 shadow-sm bg-muted/20" id="system">
            <CardHeader>
              <CardTitle className="text-lg">System Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">Retrain ML Models</p>
                  <p className="text-xs text-muted-foreground">Trigger a manual retraining of prediction models with latest data.</p>
                </div>
                <Button variant="outline" size="sm">Retrain</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">Clear Application Cache</p>
                  <p className="text-xs text-muted-foreground">Clear local cache to free up space and resolve sync issues.</p>
                </div>
                <Button variant="outline" size="sm">Clear Cache</Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground pt-8 pb-4">
            <p>Improv-It v0.0.1 • Build {new Date().getFullYear()}.{new Date().getMonth() + 1}.{new Date().getDate()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
