import simpleGit, { DefaultLogFields } from 'simple-git'
import path from 'path'

export interface FileCommit {
  hash: string
  date: string
  message: string
  author_name: string
}

const git = simpleGit()

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
