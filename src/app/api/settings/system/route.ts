import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { findContentRoot } from '@/lib/mdx'
import { getAllTrails, getAllFieldNotes } from '@/lib/mdx'

// Function to check if content directory has git initialized
function isGitInitialized(contentPath: string): boolean {
  const gitPath = path.join(contentPath, '.git')
  return fs.existsSync(gitPath)
}

// Function to check if content path is from env var vs auto-detected
function isAutoDetected(contentPath: string): boolean {
  const envPath = process.env.NEXUS_CONTENT_PATH
  if (!envPath) return true // Auto-detected if no env var set
  return path.resolve(envPath) !== contentPath
}

export async function GET() {
  try {
    // Get current content root
    const contentRoot = findContentRoot()

    // Get stats
    const trails = await getAllTrails()
    const notes = await getAllFieldNotes()

    // Check if content directory exists and has git
    const contentExists = fs.existsSync(contentRoot)
    const gitInitialized = contentExists && isGitInitialized(contentRoot)
    const autoDetected = isAutoDetected(contentRoot)

    const systemInfo = {
      currentContentPath: contentRoot,
      autoDetected,
      contentExists,
      gitInitialized,
      totalTrails: trails.length,
      totalNotes: notes.length,
      lastSync: new Date().toISOString()
    }

    return NextResponse.json(systemInfo)
  } catch (error) {
    console.error('Error fetching system info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system information' },
      { status: 500 }
    )
  }
}
