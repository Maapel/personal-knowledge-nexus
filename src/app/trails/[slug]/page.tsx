'use client'

import { FileCommit } from '@/lib/types'
import { useState, useEffect, useMemo } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, GitBranch, User, RotateCcw, History } from 'lucide-react'
import Link from 'next/link'

interface SerializedContent {
  compiledSource: string
  scope?: Record<string, unknown>
}

export default function TrailPage({ params }: { params: { slug: string } }) {
  const [trail, setTrail] = useState<any>(null)
  const [history, setHistory] = useState<FileCommit[]>([])
  const [currentContent, setCurrentContent] = useState<string>('')
  const [originalContent, setOriginalContent] = useState<string>('')
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Create markdown components with access to params
  const markdownComponents = useMemo(() => ({
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mb-4 mt-8 scroll-m-20">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold mb-3 mt-6 scroll-m-20">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-semibold mb-2 mt-4">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-lg font-medium mb-2 mt-4">{children}</h4>,
    p: ({ children }: any) => <p className="mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="mb-4 ml-6 list-disc">{children}</ul>,
    ol: ({ children }: any) => <ol className="mb-4 ml-6 list-decimal">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1">{children}</li>,
    code: ({ className, children }: any) => {
      const isInline = !className?.includes('language-')
      return (
        <code className={`font-mono text-sm ${
          isInline
            ? 'bg-secondary/50 px-1.5 py-0.5 rounded text-primary'
            : 'font-mono'
        }`}>
          {children}
        </code>
      )
    },
    pre: ({ children }: any) => (
      <pre className="bg-secondary/50 border border-border rounded-lg p-4 mb-4 overflow-x-auto">
        {children}
      </pre>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }: any) => {
      const imageSrc = src?.startsWith('http') || src?.startsWith('//')
        ? src
        : `/content/trails/${params.slug}/${src}`
      return (
        <img
          src={imageSrc}
          alt={alt || ''}
          className="rounded-lg shadow-md max-w-full h-auto my-4"
          loading="lazy"
        />
      )
    },
    a: ({ children, href }: any) => (
      <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  }), [params.slug])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch current trail data
        const response = await fetch(`${window.location.origin}/api/trails/${params.slug}`)
        if (!response.ok) throw new Error('Failed to load trail')

        const data = await response.json()
        setTrail(data.trail || {})
        setOriginalContent(data.content || '')
        setCurrentContent(data.content || '')

        // Fetch git history
        const historyRes = await fetch(`${window.location.origin}/api/trails/${params.slug}/history`)
        if (historyRes.ok) {
          const historyData = await historyRes.json()
          setHistory(historyData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.slug])

  const switchToVersion = async (commitHash: string) => {
    try {
      const response = await fetch(`${window.location.origin}/api/trails/${params.slug}?commit=${commitHash}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentContent(data.content)
        setSelectedCommit(commitHash)
      }
    } catch (error) {
      console.error('Error switching version:', error)
    }
  }

  const returnToCurrent = () => {
    setCurrentContent(originalContent)
    setSelectedCommit(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <GitBranch className="w-8 h-8 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading trail...</p>
        </div>
      </div>
    )
  }

  if (!trail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Trail not found</p>
          <Link href="/" className="text-primary hover:underline">
            Back to Nexus
          </Link>
        </div>
      </div>
    )
  }

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

      {/* Main Content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-12 border-b border-border pb-8">
          {/* Header Image */}
          {trail.frontmatter.image && (
            <div className="mb-8 -mx-4 sm:-mx-8 lg:-mx-12">
              <img
                src={`/content/trails/${params.slug}/${trail.frontmatter.image}`}
                alt={trail.frontmatter.title}
                className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-primary border-primary/30">
              {trail.frontmatter.status || 'Draft'}
            </Badge>
            {trail.frontmatter.date && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {trail.frontmatter.date}
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            {trail.frontmatter.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {trail.frontmatter.description}
          </p>
        </header>

        {/* Documentation Body */}
        <div className="prose dark:prose-invert prose-lg max-w-none
          prose-headings:scroll-m-20 prose-headings:font-bold
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-pre:bg-secondary/50 prose-pre:border prose-pre:border-border
        ">
          <ReactMarkdown components={markdownComponents}>
            {currentContent}
          </ReactMarkdown>
        </div>

        {/* Changelog Section */}
        {history.length > 0 && (
          <div className="mt-16 border-t border-border pt-12">
            <div className="flex items-center gap-2 mb-8">
              <GitBranch className="w-6 h-6" />
              <h2 className="text-2xl font-bold text-foreground">Changelog</h2>
            </div>

            <div className="space-y-6">
              {selectedCommit && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Viewing historical version</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {selectedCommit}
                      </Badge>
                    </div>
                    <Button
                      onClick={returnToCurrent}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Return to Current
                    </Button>
                  </div>
                </div>
              )}

              {history.map((commit, index) => (
                <div
                  key={commit.hash}
                  className={`flex gap-4 cursor-pointer hover:bg-secondary/20 p-4 -m-4 rounded-lg transition-colors ${
                    selectedCommit === commit.hash ? 'bg-primary/20 border-2 border-primary/50' : ''
                  }`}
                  onClick={() => switchToVersion(commit.hash)}
                >
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                    {index < history.length - 1 && (
                      <div className="w-0.5 h-12 bg-border mt-2" />
                    )}
                  </div>

                  {/* Commit content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-foreground leading-tight">
                        {commit.message}
                      </h3>
                      <Badge variant="outline" className="ml-3 font-mono text-xs">
                        {commit.hash}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {commit.author_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(commit.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
