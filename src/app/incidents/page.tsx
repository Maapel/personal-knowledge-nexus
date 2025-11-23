import { getAllFieldNotes } from '@/lib/mdx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, AlertTriangle, AlertCircle, Bot, Calendar } from 'lucide-react'
import Link from 'next/link'

function extractLessonsLearned(content: string): string {
  // Look for "## Lessons Learned" or "### Root Cause" sections
  const lessonsRegex = /## Lessons Learned\s*\n(.*?)(?=##|\n---|$)/is
  const rootCauseRegex = /### Root Cause\s*\n(.*?)(?=##|\n---|$)/is

  const lessonsMatch = content.match(lessonsRegex)
  const rootCauseMatch = content.match(rootCauseRegex)

  if (lessonsMatch) {
    return lessonsMatch[1].trim()
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('-') && !line.startsWith('*'))
      .slice(0, 3) // Take first 3 lines
      .join(' ')
      .substring(0, 200) // Truncate to 200 chars
      + (lessonsMatch[1].length > 200 ? '...' : '')
  }

  if (rootCauseMatch) {
    return rootCauseMatch[1].trim()
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 2) // Take first 2 lines
      .join(' ')
      .substring(0, 200)
      + (rootCauseMatch[1].length > 200 ? '...' : '')
  }

  // Fallback: take the first meaningful paragraph after Incident Summary
  const incidentRegex = /## Incident Summary\s*\n(.*?)(?=##|\n---|$)/is
  const incidentMatch = content.match(incidentRegex)
  if (incidentMatch) {
    return incidentMatch[1].trim()
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 2)
      .join(' ')
      .substring(0, 200)
      + '...'
  }

  // Ultimate fallback
  return 'Investigation in progress - check agent logs for details.'
}

export default async function IncidentsPage() {
  const allNotes = await getAllFieldNotes()
  const incidents = allNotes.filter(note =>
    note.status === 'failure' || note.status === 'warning'
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Navigation */}
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Nexus
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <h1 className="text-4xl font-bold text-foreground">Incident Room</h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Operational lessons and failure analysis from AI agent activities
          </p>
        </div>

        {incidents.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No Incidents Reported</h3>
            <p className="text-muted-foreground">
              All agent operations are proceeding smoothly. Check back later for any incident analysis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incidents.map((incident) => {
              const lesson = extractLessonsLearned(incident.content)
              const isFailure = incident.status === 'failure'

              return (
                <a
                  key={incident.slug}
                  href={`/feed#incident-${incident.slug}`}
                  className="block"
                >
                  <Card
                    className={`${isFailure
                      ? 'glass border-red-500/30 bg-red-500/5'
                      : 'glass border-yellow-500/30 bg-yellow-500/5'
                    } hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105`}
                  >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isFailure ? (
                          <Badge className="bg-red-500 text-white flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Failure
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Warning
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Bot className="w-4 h-4" />
                        {incident.frontmatter.agent}
                      </div>
                    </div>

                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {incident.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Lessons Learned */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-2 text-sm uppercase tracking-wide">
                          Lesson Learned
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {lesson}
                        </p>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
                        <Calendar className="w-3 h-3" />
                        {new Date(incident.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                </a>
              )
            })}
          </div>
        )}

        {/* Stats Footer */}
        {incidents.length > 0 && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 text-center rounded-xl">
              <div className="text-3xl font-bold text-red-500 mb-2">
                {incidents.filter(i => i.status === 'failure').length}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Critical Failures
              </div>
            </div>

            <div className="glass p-6 text-center rounded-xl">
              <div className="text-3xl font-bold text-yellow-500 mb-2">
                {incidents.filter(i => i.status === 'warning').length}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Warning Incidents
              </div>
            </div>

            <div className="glass p-6 text-center rounded-xl">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {allNotes.filter(n => n.status === 'success').length}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Successful Operations
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
