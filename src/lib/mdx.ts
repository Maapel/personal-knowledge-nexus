import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface MDXContent {
  frontmatter: Record<string, any>
  content: string
  slug: string
}

export interface TrailData {
  title: string
  description: string
  status: 'Active' | 'Archived' | 'Mastered'
  progress: number
  slug: string
}

export interface FieldNoteData {
  date: string
  title: string
  status: 'success' | 'failure'
  content: string
  slug: string
  frontmatter: Record<string, any>
}

// Read all trails from /content/trails
export async function getAllTrails(): Promise<TrailData[]> {
  const trailsDir = path.join(process.cwd(), 'content', 'trails')

  if (!fs.existsSync(trailsDir)) {
    return []
  }

  const trailDirs = fs.readdirSync(trailsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  const trails: TrailData[] = []

  for (const trailName of trailDirs) {
    const trailPath = path.join(trailsDir, trailName, 'index.mdx')

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

// Read all field notes from /content/field-notes
export async function getAllFieldNotes(): Promise<FieldNoteData[]> {
  const notesDir = path.join(process.cwd(), 'content', 'field-notes')

  if (!fs.existsSync(notesDir)) {
    return []
  }

  const noteFiles = fs.readdirSync(notesDir)
    .filter(file => file.endsWith('.md'))
    .sort((a, b) => b.localeCompare(a)) // Sort by filename descending (newest first)

  const notes: FieldNoteData[] = []

  for (const fileName of noteFiles) {
    const filePath = path.join(notesDir, fileName)
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
  const trailPath = path.join(process.cwd(), 'content', 'trails', slug, 'index.mdx')

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
  const notePath = path.join(process.cwd(), 'content', 'field-notes', `${slug}.md`)

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
