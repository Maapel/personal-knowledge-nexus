import { getTrail, getAllTrails } from '@/lib/mdx'
import { getFileHistory, FileCommit } from '@/lib/git'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, GitBranch, User } from 'lucide-react'
import Link from 'next/link'

export async function generateStaticParams() {
  const trails = await getAllTrails()
  return trails.map((trail) => ({
    slug: trail.slug,
  }))
}

export default async function TrailPage({ params }: { params: { slug: string } }) {
  const [trail, history] = await Promise.all([
    getTrail(params.slug),
    getFileHistory(params.slug, 'trails')
  ])

  if (!trail) {
    notFound()
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
          <MDXRemote source={trail.content} />
        </div>

        {/* Changelog Section */}
        {history.length > 0 && (
          <div className="mt-16 border-t border-border pt-12">
            <div className="flex items-center gap-2 mb-8">
              <GitBranch className="w-6 h-6" />
              <h2 className="text-2xl font-bold text-foreground">Changelog</h2>
            </div>

            <div className="space-y-6">
              {history.map((commit, index) => (
                <div key={commit.hash} className="flex gap-4">
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
