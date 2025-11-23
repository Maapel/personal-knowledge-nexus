import Fuse from 'fuse.js'
import { getAllTrails, getAllFieldNotes } from './mdx'

// Search result type for consistency
export interface SearchResult {
  slug: string
  title: string
  snippet: string
  type: 'trail' | 'note'
  status?: string
}

// Strip markdown basic syntax for better searching
function stripMarkdown(text: string): string {
  return text
    .replace(/#+\s+/g, '') // Headers
    .replace(/(\*\*|__).*?(\*\*__|__)/g, '$1') // Bold
    .replace(/(\*|_).*?(\*|_*)/g, '$1') // Italic
    .replace(/`.*?`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/\[.*?\]\(.*?\)/g, '$1') // Links - keep text, remove urls
    .replace(/!\[.*?\]\(.*?\)/g, '') // Images
    .replace(/-{3,}/g, '') // Separators
    .replace(/\n\s*\n/g, ' ') // Multiple newlines
    .replace(/\s+/g, ' ') // Multiple spaces
    .trim()
}

export async function buildSearchIndex(): Promise<Fuse<SearchResult>> {
  const [trails, notes] = await Promise.all([
    getAllTrails(),
    getAllFieldNotes()
  ])

  const searchItems: SearchResult[] = [
    // Add trails to search index
    ...trails.map(trail => ({
      slug: trail.slug,
      title: trail.title,
      snippet: trail.description,
      type: 'trail' as const,
      status: trail.status
    })),

    // Add field notes to search index
    ...notes.map(note => {
      // Create a snippet from the content (first meaningful paragraph)
      const content = note.content.split('---\n').slice(2).join('---\n').trim()
      const strippedContent = stripMarkdown(content)
      const snippet = strippedContent.slice(0, 200) + (strippedContent.length > 200 ? '...' : '')

      return {
        slug: note.slug,
        title: note.title,
        snippet,
        type: 'note' as const,
        status: note.status
      }
    })
  ]

  // Configure Fuse.js for fuzzy search
  const fuse = new Fuse(searchItems, {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'snippet', weight: 2 },
      { name: 'status', weight: 1 }
    ],
    includeScore: true,
    threshold: 0.6, // Lower = more strict matching, 0-1
    minMatchCharLength: 2,
    shouldSort: true,
    includeMatches: true
  })

  return fuse
}

// Search function that AI agents and humans can both use
export async function searchNexus(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  const fuse = await buildSearchIndex()

  // Perform search and get results with scores
  const searchResults = fuse.search(query.trim())

  // Map back to our SearchResult format with score filtering
  return searchResults
    .filter(result => (result.score || 0) < 0.6) // Filter by relevance score
    .map(result => ({
      slug: result.item.slug,
      title: result.item.title,
      snippet: result.item.snippet,
      type: result.item.type,
      status: result.item.status
    }))
    .slice(0, 10) // Limit results for performance
}

/* Python Integration Example (for AI agents):
```python
import requests
import json

def search_knowledge_base(query: str, base_url: str = "http://localhost:3001") -> list:
    """
    Search the Personal Knowledge Nexus before taking actions.
    
    This helps AI agents learn from past successes and failures.
    
    Example: search_knowledge_base("reinforcement learning installation")
    Returns: [ {"slug": "project-1", "title": "RL Fundamentals", "snippet": "...", "type": "trail"}, ... ]
    """
    try:
        response = requests.get(f"{base_url}/api/search", params={"q": query}, timeout=5)
        response.raise_for_status()
        results = response.json()
        
        # Filter for failure/incident related content before risky operations
        incidents = [r for r in results if 'failure' in r.get('status', '') or 'warning' in r.get('status', '')]
        success_patterns = [r for r in results if 'success' in r.get('status', '')]
        
        print(f"⚠️ Found {len(incidents)} related incidents")
        print(f"✅ Found {len(success_patterns)} successful patterns")
        
        return results
        
    except requests.RequestException as e:
        print(f"❌ Unable to query knowledge base: {e}")
        return []

# Usage pattern for AI agents:
if __name__ == "__main__":
    # Before installing a new package, check for past issues
    past_issues = search_knowledge_base("package installation failures")
    if past_issues:
        print("🛑 Detected past installation issues - proceeding with caution...")
        
        # Agent can now make informed decisions based on historical data
        for issue in past_issues:
            print(f"💡 Learned from past: {issue['title']}")
```
*/
