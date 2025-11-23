import { NextRequest, NextResponse } from 'next/server'
import { searchNexus } from '@/lib/search'
import OpenAI from 'openai'

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      )
    }

    // Step 1: Retrieve relevant content using existing search
    const searchResults = await searchNexus(query)
    const topResults = searchResults.slice(0, 3) // Get top 3 most relevant results

    // Step 2: If no relevant content found, return a helpful message
    if (topResults.length === 0) {
      return NextResponse.json({
        answer: "I don't have enough context from your knowledge base to answer that question. Try searching for specific terms related to your documentation or field notes.",
        sources: [],
        simulated: !openai
      })
    }

    // Step 3: Build context from search results
    const contextSnippets = topResults.map(result =>
      `[${result.type.toUpperCase()}] ${result.title}:\n${result.snippet}`
    ).join('\n\n')

    // Step 4: Generate AI answer using OpenAI
    let answer: string

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Use gpt-4o-mini for better performance
          messages: [
            {
              role: 'system',
              content: `You are the Nexus OS, an intelligent assistant that helps users understand their knowledge base. Answer questions based ONLY on the provided context snippets. If the context doesn't contain enough information to fully answer the question, say so clearly.

Keep answers concise but informative. Reference specific documents, field notes, or events when relevant. Always maintain a professional, helpful tone.`
            },
            {
              role: 'user',
              content: `Context from knowledge base:\n\n${contextSnippets}\n\nQuestion: ${query}`
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })

        answer = completion.choices[0]?.message?.content || "I couldn't generate a response."
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError)
        answer = "I'm having trouble connecting to my AI services right now. Using fallback response based on your knowledge base."
      }
    } else {
      // Fallback simulation when no API key
      answer = `Based on your knowledge base, I found ${topResults.length} relevant ${topResults.length === 1 ? 'item' : 'items'} related to your question "${query}".\n\nMost relevant: "${topResults[0].title}" - ${topResults[0].snippet}\n\n⚠️ This is a simulated response. Add OPENAI_API_KEY to your .env.local for full AI-powered answers.`

      if (topResults.length > 1) {
        answer += `\n\nOther relevant content: ${topResults.slice(1).map(r => `"${r.title}"`).join(', ')}`
      }
    }

    // Step 5: Return answer with source information
    return NextResponse.json({
      answer,
      sources: topResults.map(result => ({
        slug: result.slug,
        title: result.title,
        type: result.type,
        url: result.type === 'trail' ? `/trails/${result.slug}` : `/feed#incident-${result.slug}`
      })),
      simulated: !openai
    })

  } catch (error) {
    console.error('Ask API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during query processing' },
      { status: 500 }
    )
  }
}

/* Example usage for AI agents and humans:

POST /api/ask
Content-Type: application/json

{
  "query": "Why did the deployment fail last Tuesday?"
}

Response:
{
  "answer": "Based on field note 'incident-2025-11-24-a9d2adcb', the deployment failed because of a JWT authentication issue. The error showed 'Invalid token format' when attempting to validate user sessions. The agent noted this was due to a configuration change in the auth middleware.",
  "sources": [
    {
      "slug": "incident-2025-11-24-a9d2adcb",
      "title": "JWT Authentication Failure",
      "type": "note",
      "url": "/feed#incident-incident-2025-11-24-a9d2adcb"
    }
  ],
  "simulated": false
}

This transforms your search from "find this" to "explain this contextually".
*/
