// Shared type definitions used across client and server components

export interface FileCommit {
  hash: string
  date: string
  message: string
  author_name: string
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
  status: 'success' | 'failure' | 'warning' | 'info'
  content: string
  slug: string
  frontmatter: Record<string, any>
}

export interface MDXContent {
  frontmatter: Record<string, any>
  content: string
  slug: string
}
