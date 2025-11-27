import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { findContentRoot } from '@/lib/mdx'

// Serve static files from content directories
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')
    const contentRoot = findContentRoot()
    const fullPath = path.join(contentRoot, 'trails', filePath)

    // Security check - ensure file is within content/trails
    const resolvedPath = path.resolve(fullPath)
    const trailsDir = path.join(contentRoot, 'trails')

    if (!resolvedPath.startsWith(trailsDir)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get file stats
    const stat = fs.statSync(fullPath)

    // Directory listing (optional, could be removed for security)
    if (stat.isDirectory()) {
      const files = fs.readdirSync(fullPath)
      return NextResponse.json({ directory: filePath, files })
    }

    // Serve file
    const file = fs.readFileSync(fullPath)
    const ext = path.extname(fullPath).toLowerCase()

    // Determine content type
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.json': 'application/json',
    }

    const contentType = contentTypes[ext] || 'application/octet-stream'

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('Error serving static file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
