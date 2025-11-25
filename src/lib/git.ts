import simpleGit, { DefaultLogFields } from 'simple-git'
import path from 'path'
import { FileCommit } from './types'

// Content repository root detection (matching mdx.ts)
function findContentRoot(): string {
  // Check for environment variable
  const contentPath = process.env.NEXUS_CONTENT_PATH
  if (contentPath) {
    return path.resolve(contentPath)
  }

  // Try project root + nexus-content sibling
  const projectRoot = path.dirname(path.dirname(path.dirname(__filename)))
  const siblingContent = path.join(projectRoot, 'nexus-content')
  if (require('fs').existsSync(siblingContent)) {
    return siblingContent
  }

  // Try legacy project content directory
  const legacyContainer = path.join(projectRoot, 'content')
  if (require('fs').existsSync(legacyContainer)) {
    return legacyContainer
  }

  // Fallback to project content
  return path.join(projectRoot, 'content')
}

// Initialize git instance pointing to content repository
const CONTENT_ROOT = findContentRoot()
const git = simpleGit(CONTENT_ROOT)

export async function getFileContentAtCommit(
  slug: string,
  type: 'trails' | 'field-notes',
  commitHash: string
): Promise<string | null> {
  try {
    const filePath = type === 'trails'
      ? `content/trails/${slug}/index.mdx`
      : `content/field-notes/${slug}.md`

    // Get the file content at a specific commit
    const result = await git.show([`${commitHash}:${filePath}`])
    return result
  } catch (error) {
    console.warn(`Could not get file content at commit ${commitHash}:`, error)
    return null
  }
}

export async function getFileHistory(
  slug: string,
  type: 'trails' | 'field-notes'
): Promise<FileCommit[]> {
  try {
    // Construct the file path based on type
    const filePath = type === 'trails'
      ? `content/trails/${slug}/index.mdx`
      : `content/field-notes/${slug}.md`

    // Get the commit history for this specific file
    const log = await git.log({
      file: filePath,
      format: {
        hash: '%H',
        date: '%ai', // ISO date format
        message: '%s',
        author_name: '%an'
      }
    })

    // Transform the log into our FileCommit interface
    return log.all.map((entry: any) => ({
      hash: entry.hash.slice(0, 7), // Short hash for display
      date: entry.date.split(' ')[0], // Just the date part (YYYY-MM-DD)
      message: entry.message,
      author_name: entry.author_name
    }))

  } catch (error) {
    // If git fails or file has no history, return empty array
    console.warn(`Could not fetch git history for ${type}/${slug}:`, error)
    return []
  }
}
