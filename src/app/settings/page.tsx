'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Folder, Database, RefreshCw, Settings, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface SystemInfo {
  currentContentPath: string
  autoDetected: boolean
  contentExists: boolean
  gitInitialized: boolean
  totalTrails: number
  totalNotes: number
  lastSync: string
}

export default function SettingsPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [newContentPath, setNewContentPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/settings/system')
      if (response.ok) {
        const data = await response.json()
        setSystemInfo(data)
        setNewContentPath(data.currentContentPath)
      }
    } catch (error) {
      console.error('Failed to fetch system info:', error)
    }
  }

  const handleSaveSettings = async () => {
    if (!newContentPath.trim()) {
      setMessage({ type: 'error', text: 'Content path cannot be empty' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/settings/content-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentPath: newContentPath }),
      })

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Content path updated! Please restart your server for changes to take effect.'
        })
        // Refresh system info
        fetchSystemInfo()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const detectAvailableLocations = () => {
    const suggestions = [
      '/home/maadhav/Projects/nexus-content',
      '/home/maadhav/Documents/nexus-content',
      '/home/maadhav/nexus-content'
    ]
    return suggestions
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8" />
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground text-lg">
              Configure your Personal Knowledge Nexus
            </p>
          </div>
        </div>

        <nav className="flex gap-4 text-sm">
          <Link href="/" className="text-primary hover:underline">Dashboard</Link>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">Settings</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Content Repository Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Folder className="w-6 h-6" />
                <CardTitle>Knowledge Repository</CardTitle>
              </div>
              <CardDescription>
                Where your knowledge data (trails, field notes) is stored
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Current Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Current Path</Label>
                  <Badge variant={systemInfo?.contentExists ? 'default' : 'destructive'}>
                    {systemInfo?.contentExists ? 'Connected' : 'Missing'}
                  </Badge>
                </div>

                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="font-mono text-sm break-all">
                    {systemInfo?.currentContentPath || 'Loading...'}
                  </p>
                  {systemInfo?.autoDetected && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Auto-detected from directory structure
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Path Configuration */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Set Custom Path</Label>

                <div className="space-y-3">
                  <Input
                    value={newContentPath}
                    onChange={(e) => setNewContentPath(e.target.value)}
                    placeholder="/path/to/your/nexus-content"
                    className="font-mono"
                  />

                  {/* Quick Suggestions */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Quick suggestions:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {detectAvailableLocations().map((path) => (
                        <Button
                          key={path}
                          variant="outline"
                          size="sm"
                          onClick={() => setNewContentPath(path)}
                          className="font-mono text-xs"
                        >
                          {path}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Set Path & Save'}
                  </Button>

                  <Button variant="outline" onClick={fetchSystemInfo}>
                    Refresh Status
                  </Button>
                </div>

                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
                      : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {message.type === 'success' ? (
                        <Database className="w-5 h-5 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">
                          {message.type === 'success' ? 'Success' : 'Error'}
                        </p>
                        <p className="text-sm mt-1">{message.text}</p>
                        {message.type === 'success' && (
                          <Button
                            variant="link"
                            className="p-0 h-auto mt-2 text-sm"
                            onClick={() => window.location.reload()}
                          >
                            Restart Application →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Repository Information */}
          <Card>
            <CardHeader>
              <CardTitle>Repository Setup Guide</CardTitle>
              <CardDescription>
                How to set up your separate knowledge repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium mb-2">Suggested Repository Structure</h4>
                  <pre className="text-sm font-mono bg-background p-2 rounded overflow-x-auto">
{`/path/to/your/nexus-content/
├── README.md          (Repository documentation)
├── trails/            (Knowledge trails)
│   ├── project-1/
│   ├── ai-reviewer/
│   └── ...
├── field-notes/       (Incident logs)
│   ├── 2025-11-20-abc123.md
│   ├── 2025-11-21-def456.md
│   └── ...
└── .git/              (Independent git history)`}
                  </pre>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Setup Commands</h4>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <ol className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <code className="font-mono bg-background px-1 py-0.5 rounded text-xs">1</code>
                        Create directory: <code className="font-mono bg-background px-1 py-0.5 rounded">mkdir nexus-content</code>
                      </li>
                      <li className="flex gap-2">
                        <code className="font-mono bg-background px-1 py-0.5 rounded text-xs">2</code>
                        Initialize git: <code className="font-mono bg-background px-1 py-0.5 rounded">git init</code>
                      </li>
                      <li className="flex gap-2">
                        <code className="font-mono bg-background px-1 py-0.5 rounded text-xs">3</code>
                        Create directories: <code className="font-mono bg-background px-1 py-0.5 rounded">mkdir trails field-notes</code>
                      </li>
                      <li className="flex gap-2">
                        <code className="font-mono bg-background px-1 py-0.5 rounded text-xs">4</code>
                        Set path in settings: <code className="font-mono bg-background px-1 py-0.5 rounded">Use this page!</code>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded">
                  <span className="text-sm font-medium">Repository</span>
                  <Badge variant={systemInfo?.contentExists ? 'default' : 'destructive'}>
                    {systemInfo?.contentExists ? 'Available' : 'Not Found'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded">
                  <span className="text-sm font-medium">Git Versioning</span>
                  <Badge variant={systemInfo?.gitInitialized ? 'default' : 'secondary'}>
                    {systemInfo?.gitInitialized ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {systemInfo?.totalTrails || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Knowledge Trails</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {systemInfo?.totalNotes || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Field Notes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Helpful Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/trails">
                <Button variant="outline" className="w-full justify-start">
                  <Folder className="w-4 h-4 mr-2" />
                  Browse Trails
                </Button>
              </Link>
              <Link href="/feed">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  Activity Feed
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
