import { NextRequest, NextResponse } from 'next/server'
import { getFileContentAtCommit } from '@/lib/git'
import { getTrail } from '@/lib/mdx'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const commitHash = searchParams.get('commit')

    if (commitHash) {
      // Get file content at specific commit
      const content = await getFileContentAtCommit(params.slug, 'trails', commitHash)

      if (!content) {
        return NextResponse.json({ error: 'Could not retrieve content at this commit' }, { status: 404 })
      }

      // Parse frontmatter and extract content (similar to our mdx logic)
      const contentWithoutFrontmatter = content.split('---\n').slice(2).join('---\n').trim()

      return NextResponse.json({ content: contentWithoutFrontmatter })
    } else {
      // Get current trail data
      const trail = await getTrail(params.slug)

      if (!trail) {
        return NextResponse.json({ error: 'Trail not found' }, { status: 404 })
      }

      return NextResponse.json({
        trail: {
          frontmatter: trail.frontmatter,
          title: trail.frontmatter.title,
          description: trail.frontmatter.description,
          status: trail.frontmatter.status || 'Draft',
          date: trail.frontmatter.date
        },
        content: trail.content
      })
    }
  } catch (error) {
    console.error('Error fetching historical content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
