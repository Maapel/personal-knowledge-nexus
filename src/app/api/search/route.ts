import { NextRequest, NextResponse } from 'next/server'
import { searchNexus } from '@/lib/search'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Perform the search
    const results = await searchNexus(query)

    // Return results in a format that's easy for both humans and AI agents to consume
    return NextResponse.json({
      query,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during search' },
      { status: 500 }
    )
  }
}

/* AI Agent Integration Pattern:

The search API is designed to be easily usable by AI agents:

```python
import requests

# Example: AI agent searches before making changes
def query_knowledge_base(query: str):
    response = requests.get('http://localhost:3001/api/search', params={'q': query})
    data = response.json()
    
    if data['results']:
        # Learn from past experiences
        for result in data['results']:
            slug = result['slug']
            title = result['title'] 
            snippet = result['snippet']
            result_type = result['type']  # 'trail' or 'note'
            
            # Agent can now use this contextual knowledge
            if 'failure' in (result.get('status') or ''):
                print(f"⚠️ Warning: Found past failure in {title}")
            elif result_type == 'trail':
                print(f"📖 Info: Relevant documentation in {title}")
    
    return data['results']
```

This creates the "Hive Mind" effect - AI agents can query the collective knowledge
before taking actions, learning from both successful patterns and past failures.

Usage patterns:
- "deployment failures" - learn from past deployment issues
- "successful optimizations" - learn winning strategies
- "package installation errors" - avoid known pitfalls
- "reinforcement learning setup" - get implementation guidance
*/
