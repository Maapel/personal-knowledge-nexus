import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { findContentRoot } from '@/lib/mdx'
import { TrailAttachment, TrailAttachments } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const contentRoot = findContentRoot()
    const attachmentsDir = path.join(contentRoot, 'trails', slug, 'attachments')

    // Check if attachments directory exists
    if (!fs.existsSync(attachmentsDir)) {
      return NextResponse.json({ slug, attachments: [] } as TrailAttachments)
    }

    // Read README.md for descriptions if it exists
    const readmePath = path.join(attachmentsDir, 'README.md')
    let descriptions: Record<string, string> = {}

    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf8')

      // Parse README content to extract descriptions
      const lines = readmeContent.split('\n')
      let currentFile = null

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Look for headings that start with ##
        if (line.startsWith('## ')) {
          currentFile = line.substring(3).trim()
        } else if (currentFile && line && !line.startsWith('#')) {
          // Next non-empty line after the heading is the description
          descriptions[currentFile] = line
          currentFile = null
        }
      }
    }

    // Get all files in attachments directory (excluding README.md)
    const files = fs.readdirSync(attachmentsDir)
      .filter(file => file !== 'README.md' && !file.startsWith('.'))

    // Create attachment objects
    const attachments: TrailAttachment[] = files.map(filename => ({
      filename,
      description: descriptions[filename] || '',
      url: `/content/trails/${slug}/attachments/${filename}`
    }))

    return NextResponse.json({ slug, attachments } as TrailAttachments)

  } catch (error) {
    console.error('Error fetching trail attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trail attachments' },
      { status: 500 }
    )
  }
}
