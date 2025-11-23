import { getTrail, getAllTrails } from '@/lib/mdx'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

export async function generateStaticParams() {
  const trails = await getAllTrails()
  return trails.map((trail) => ({
    slug: trail.slug,
  }))
}

export default async function TrailPage({ params }: { params: { slug: string } }) {
  const trail = await getTrail(params.slug)

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
      </article>
    </div>
  )
}
