'use client'

import { getAllTrails } from '@/lib/mdx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { BookOpen, Archive, Trophy, Target, Plus, Map, FileCode, Lightbulb, Briefcase, Book } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const statusIcons = {
  Active: Target,
  Archived: Archive,
  Mastered: Trophy,
}

const statusColors = {
  Active: 'bg-green-500',
  Archived: 'bg-gray-500',
  Mastered: 'bg-yellow-500',
}

export default async function TrailsPage() {
  const trails = await getAllTrails()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Map className="w-8 h-8" />
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Knowledge Trails</h1>
            <p className="text-muted-foreground text-lg">
              Explore and manage your project documentation trails
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/#knowledge-trails"
            className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="px-4 py-2 bg-secondary/50 rounded-lg text-sm">
            <span className="text-muted-foreground">Create new trails with:</span>
            <code className="font-mono ml-2 bg-background px-2 py-1 rounded">nexus new "Your Project"</code>
          </div>
          <TemplateSelector />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-green-500" />
            <h3 className="font-semibold">Active Trails</h3>
          </div>
          <div className="text-3xl font-bold">{trails.filter(t => t.status === 'Active').length}</div>
        </div>

        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h3 className="font-semibold">Mastered</h3>
          </div>
          <div className="text-3xl font-bold">{trails.filter(t => t.status === 'Mastered').length}</div>
        </div>

        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-2">
            <Archive className="w-6 h-6 text-gray-500" />
            <h3 className="font-semibold">Archived</h3>
          </div>
          <div className="text-3xl font-bold">{trails.filter(t => t.status === 'Archived').length}</div>
        </div>
      </div>

      {/* Trails Grid */}
      {trails.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-4">No Knowledge Trails Yet</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Start documenting your projects and create your first knowledge trail.
          </p>
          <div className="bg-secondary/50 rounded-lg p-4 max-w-md mx-auto mb-6">
            <p className="text-sm font-medium mb-2">Create your first trail:</p>
            <code className="text-sm bg-background px-3 py-2 rounded block">
              nexus new "My First Project" --desc "Learning and documenting this technology"
            </code>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Map className="w-5 h-5" />
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <>
          {/* Status Legend */}
          <div className="flex items-center justify-center gap-6 mb-8 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-muted-foreground">Archived</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-muted-foreground">Mastered</span>
            </div>
          </div>

          {/* Trails Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trails.map((trail) => {
              const StatusIcon = statusIcons[trail.status] || Target
              const statusColor = statusColors[trail.status] || 'bg-gray-500'

              return (
                <Link href={`/trails/${trail.slug}`} key={trail.slug}>
                  <Card className="glass hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105 h-full overflow-hidden">
                    {/* Trail Image */}
                    {trail.image && (
                      <div className="relative h-48 overflow-hidden bg-secondary/20">
                        <img
                          src={`/content/trails/${trail.slug}/${trail.image}`}
                          alt={trail.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className={`${statusColor} text-white flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {trail.status}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                            {trail.title}
                          </CardTitle>
                          {!trail.image && (
                            <div className="flex justify-end mb-3">
                              <Badge className={`${statusColor} text-white flex items-center gap-1`}>
                                <StatusIcon className="w-3 h-3" />
                                {trail.status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-muted-foreground line-clamp-3">
                        {trail.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{trail.progress}%</span>
                        </div>
                        <Progress value={trail.progress} className="w-full" />

                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            Slug: <code className="bg-secondary/50 px-1 py-0.5 rounded text-xs">{trail.slug}</code>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* Footer Info */}
      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>
          Knowledge trails are automatically version-controlled and searchable.
          Use the CLI tools to create and update your project documentation.
        </p>
      </div>
    </div>
  )
}

// Template Selector Component
function TemplateSelector() {
  const [showTemplates, setShowTemplates] = useState(false)

  const templates = [
    {
      name: 'project',
      title: 'Development Project',
      description: 'Software project with phases, metrics, and technical architecture',
      icon: Briefcase,
      color: 'text-blue-500'
    },
    {
      name: 'research',
      title: 'Research Study',
      description: 'Academic or technical research with methodology and findings',
      icon: Lightbulb,
      color: 'text-green-500'
    },
    {
      name: 'tutorial',
      title: 'Learning Tutorial',
      description: 'Step-by-step guide with examples and troubleshooting',
      icon: Book,
      color: 'text-purple-500'
    },
    {
      name: 'documentation',
      title: 'Technical Reference',
      description: 'API docs, guides, and technical specifications',
      icon: FileCode,
      color: 'text-orange-500'
    }
  ]

  const handleTemplateSelect = async (templateName: string) => {
    const title = prompt(`Enter title for ${templateName} trail:`)
    if (!title) return

    const description = prompt('Enter description:', `A comprehensive ${templateName} knowledge trail`)
    if (!description) return

    const tags = prompt('Enter tags (comma-separated, optional):', templateName)
    const tagsString = tags ? ` --tags "${tags}"` : ''

    // Use the terminal command style
    const command = `nexus new "${title}" --desc "${description}" --template ${templateName}${tagsString}`

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(command)
      alert(`Command copied to clipboard:\n${command}\n\nRun this in your terminal to create the trail.`)
    } catch (err) {
      alert(`Run this command in your terminal:\n${command}`)
    }

    setShowTemplates(false)
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowTemplates(!showTemplates)}
        variant="default"
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create with Template
      </Button>

      {showTemplates && (
        <div className="absolute top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg p-4 z-10">
          <h3 className="font-medium mb-3">Choose a Template</h3>
          <div className="space-y-2">
            {templates.map((template) => {
              const Icon = template.icon
              return (
                <button
                  key={template.name}
                  onClick={() => handleTemplateSelect(template.name)}
                  className="w-full p-3 border border-border rounded-lg hover:bg-secondary/20 text-left transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${template.color}`} />
                    <div>
                      <div className="font-medium text-sm">{template.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Missing import fix
import { ArrowLeft } from 'lucide-react'
