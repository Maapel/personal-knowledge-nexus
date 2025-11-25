import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { MDXContent, TrailData, FieldNoteData } from './types'

// Content repository root detection
export function findContentRoot(): string {
  // Check for environment variable
  const contentPath = process.env.NEXUS_CONTENT_PATH
  if (contentPath) {
    return path.resolve(contentPath)
  }

  // Try project root + nexus-content sibling
  const projectRoot = path.dirname(path.dirname(path.dirname(__filename)))
  const siblingContent = path.join(projectRoot, 'nexus-content')
  if (fs.existsSync(siblingContent)) {
    return siblingContent
  }

  // Try legacy project content directory
  const legacyContent = path.join(projectRoot, 'content')
  if (fs.existsSync(legacyContent)) {
    return legacyContent
  }

  // Fallback to project content
  return path.join(projectRoot, 'content')
}

// Get content directories
const CONTENT_ROOT = findContentRoot()
const TRAILS_DIR = path.join(CONTENT_ROOT, 'trails')
const FIELD_NOTES_DIR = path.join(CONTENT_ROOT, 'field-notes')

// Read all trails from content repository
export async function getAllTrails(): Promise<TrailData[]> {
  if (!fs.existsSync(TRAILS_DIR)) {
    return []
  }

  const trailDirs = fs.readdirSync(TRAILS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  const trails: TrailData[] = []

  for (const trailName of trailDirs) {
    const trailPath = path.join(TRAILS_DIR, trailName, 'index.mdx')

    if (fs.existsSync(trailPath)) {
      const fileContents = fs.readFileSync(trailPath, 'utf8')
      const { data } = matter(fileContents)

      trails.push({
        title: data.title || trailName,
        description: data.description || '',
        status: data.status || 'Active',
        progress: data.progress || 0,
        slug: trailName
      })
    }
  }

  return trails
}

// Read all field notes from content repository
export async function getAllFieldNotes(): Promise<FieldNoteData[]> {
  if (!fs.existsSync(FIELD_NOTES_DIR)) {
    return []
  }

  const noteFiles = fs.readdirSync(FIELD_NOTES_DIR)
    .filter(file => file.endsWith('.md'))
    .sort((a, b) => b.localeCompare(a)) // Sort by filename descending (newest first)

  const notes: FieldNoteData[] = []

  for (const fileName of noteFiles) {
    const filePath = path.join(FIELD_NOTES_DIR, fileName)
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data } = matter(fileContents)

    notes.push({
      date: data.date || fileName.replace('.md', ''),
      title: data.title || 'Untitled Note',
      status: data.status || 'success',
      content: fileContents, // Keep full content with frontmatter for rendering
      slug: fileName.replace('.md', ''),
      frontmatter: data
    })
  }

  return notes
}

// Read a single trail
export async function getTrail(slug: string): Promise<MDXContent | null> {
  const trailPath = path.join(TRAILS_DIR, slug, 'index.mdx')

  if (!fs.existsSync(trailPath)) {
    return null
  }

  try {
    const fileContents = fs.readFileSync(trailPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      frontmatter: data,
      content,
      slug
    }
  } catch (error) {
    console.error('Error reading trail:', error)
    return null
  }
}

// Read a single field note
export async function getFieldNote(slug: string): Promise<MDXContent | null> {
  const notePath = path.join(FIELD_NOTES_DIR, `${slug}.md`)

  if (!fs.existsSync(notePath)) {
    return null
  }

  try {
    const fileContents = fs.readFileSync(notePath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      frontmatter: data,
      content,
      slug
    }
  } catch (error) {
    console.error('Error reading field note:', error)
    return null
  }
}
