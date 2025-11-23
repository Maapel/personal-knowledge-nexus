import { getAllFieldNotes } from '@/lib/mdx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Bot, AlertCircle, CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default async function Feed() {
  const fieldNotes = await getAllFieldNotes()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Bot className="w-8 h-8" />
          Agent Field Notes
        </h1>
        <p className="text-muted-foreground text-lg">
          Automated logs and insights from your AI agents
        </p>
      </div>

      {fieldNotes.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Field Notes Found</h3>
          <p className="text-muted-foreground">
            Your agents will start generating field notes here. Add documentation in /content/field-notes/
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Timeline
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Success
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
                Failure
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {fieldNotes.map((note) => {
              const isSuccess = note.status === 'success'
              const borderColor = isSuccess ? 'border-green-500' : 'border-red-500'
              const bgColor = isSuccess ? 'bg-green-500/10' : 'bg-red-500/10'
              const headerIcon = isSuccess ? CheckCircle : AlertCircle
              const HeaderIcon = headerIcon

              return (
                <Card
                  key={note.slug}
                  id={`incident-${note.slug}`}
                  className={`glass ${borderColor} border-2 relative overflow-hidden`}
                >
                  <CardHeader className={`pb-4 ${bgColor}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <HeaderIcon className={`w-6 h-6 mt-1 ${isSuccess ? 'text-green-500' : 'text-red-500'}`} />
                        <div>
                          <CardTitle className="text-xl">{note.title}</CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(note.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(note.frontmatter.timestamp || note.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Bot className="w-4 h-4" />
                              {note.frontmatter.agent}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge className={`flex items-center gap-1 ${isSuccess ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {isSuccess ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {note.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown>
                        {note.content.split('---\n')[note.content.split('---\n').length - 1].trim()}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-12">
        <a
          href="/"
          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm font-medium"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  )
}
