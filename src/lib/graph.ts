import { getAllTrails, getAllFieldNotes } from './mdx'

export interface GraphNode {
  id: string
  name: string
  type: 'trail' | 'note'
  status?: string
  url: string
  group: number
  color?: string
}

export interface GraphLink {
  source: string
  target: string
  value: number
}

export interface KnowledgeGraph {
  nodes: GraphNode[]
  links: GraphLink[]
}

interface ItemWithMetadata {
  slug: string
  type: 'trail' | 'note'
  tags: string[]
  references: string[]
}

// Extract tags from markdown content using regex
function extractTags(content: string): string[] {
  const tagRegex = /#[\w-]+/g
  const matches = content.match(tagRegex)
  return matches ? matches.map(tag => tag.slice(1)) : []
}

// Extract references to other files (looking for slug-like patterns)
function extractReferences(content: string): string[] {
  // Look for patterns like [project-1] or just project-1
  const refRegex = /\[?([a-z0-9-]+)\]?/gi
  const matches = content.match(refRegex)
  if (!matches) return []

  // Clean up matches - remove brackets and filter out common words
  return matches
    .map(match => match.replace(/[\[\]]/g, ''))
    .filter(match =>
      match.length > 3 && // Ignore very short matches
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'by', 'hot', 'are', 'but', 'for', 'one', 'our', 'had', 'by', 'hot'].includes(match.toLowerCase()) &&
      match.match(/^[a-z0-9-]+$/) // Only alphanumeric with dashes
    )
    .slice(0, 10) // Limit references per file
}

export async function getKnowledgeGraph(): Promise<KnowledgeGraph> {
  const [trails, notes] = await Promise.all([
    getAllTrails(),
    getAllFieldNotes()
  ])

  const nodes: GraphNode[] = []
  const links: GraphLink[] = []

  // Create nodes for trails
  for (const trail of trails) {
    // For now, use basic content - we can enhance this to fetch full content later
    const content = `${trail.title} ${trail.description || ''}`
    const tags = extractTags(content)
    const references = extractReferences(content)

    nodes.push({
      id: `trail-${trail.slug}`,
      name: trail.title,
      type: 'trail',
      status: trail.status,
      url: `/trails/${trail.slug}`,
      group: 1, // Trails group
      color: trail.status === 'Active' ? '#3b82f6' : trail.status === 'Mastered' ? '#22c55e' : '#64748b'
    })

    // Store tags and references for later linking
    ;(trail as any).tags = tags
    ;(trail as any).references = references
  }

  // Create nodes for field notes
  for (const note of notes) {
    const content = note.content.split('---\n').slice(2).join('---\n').trim()
    const tags = extractTags(content)
    const references = extractReferences(content)

    nodes.push({
      id: `note-${note.slug}`,
      name: note.title,
      type: 'note',
      status: note.status,
      url: `/feed#incident-${note.slug}`,
      group: 2, // Notes group
      color: note.status === 'success' ? '#22c55e' : note.status === 'failure' ? '#ef4444' : note.status === 'warning' ? '#f59e0b' : '#64748b'
    })

    // Store tags and references for later linking
    ;(note as any).tags = tags
    ;(note as any).references = references
  }

  // Store metadata separately to avoid TypeScript issues
  const itemMetadata: Record<string, ItemWithMetadata> = {}

  // Store metadata for trails
  trails.forEach(trail => {
    const content = `${trail.title} ${trail.description || ''}`
    itemMetadata[`trail-${trail.slug}`] = {
      slug: trail.slug,
      type: 'trail',
      tags: extractTags(content),
      references: extractReferences(content)
    }
  })

  // Store metadata for notes
  notes.forEach(note => {
    const content = note.content.split('---\n').slice(2).join('---\n').trim()
    itemMetadata[`note-${note.slug}`] = {
      slug: note.slug,
      type: 'note',
      tags: extractTags(content),
      references: extractReferences(content)
    }
  })

  // Create links based on shared tags and references
  const allNodeIds = nodes.map(node => node.id)

  for (let i = 0; i < allNodeIds.length; i++) {
    for (let j = i + 1; j < allNodeIds.length; j++) {
      const nodeId1 = allNodeIds[i]
      const nodeId2 = allNodeIds[j]

      const meta1 = itemMetadata[nodeId1]
      const meta2 = itemMetadata[nodeId2]

      if (!meta1 || !meta2) continue

      // Check for shared tags
      const sharedTags = meta1.tags.filter(tag => meta2.tags.includes(tag))
      if (sharedTags.length > 0) {
        links.push({
          source: nodeId1,
          target: nodeId2,
          value: Math.min(sharedTags.length * 2, 5) // Stronger links for more shared tags
        })
      }

      // Check for direct references between slugs
      const hasReference = meta1.references.includes(meta2.slug) || meta2.references.includes(meta1.slug)

      if (hasReference) {
        // Check if link already exists
        const existingLink = links.find(link =>
          (link.source === nodeId1 && link.target === nodeId2) ||
          (link.source === nodeId2 && link.target === nodeId1)
        )

        if (existingLink) {
          existingLink.value = Math.min(existingLink.value + 3, 8) // Strengthen existing link
        } else {
          links.push({
            source: nodeId1,
            target: nodeId2,
            value: 3 // Reference links are strong
          })
        }
      }
    }
  }

  return { nodes, links }
}
