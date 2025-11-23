'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Book, Bot, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Import missing Input component type - we'll add it later if needed
// For now, we'll use a basic input

interface SearchResult {
  slug: string
  title: string
  snippet: string
  type: 'trail' | 'note'
  status?: string
}

interface SearchResponse {
  query: string
  results: SearchResult[]
  count: number
  timestamp: string
}

export function NexusSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Perform search
  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data: SearchResponse = await response.json()

        if (response.ok) {
          setResults(data.results)
        } else {
          setResults([])
        }
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(search, 300) // Debounce search requests
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleSearchClick = () => {
    setIsSearchMode(true)
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleInputBlur = () => {
    if (!query.trim()) {
      setIsSearchMode(false)
      setIsOpen(false)
    }
  }

  const resetSearch = () => {
    setQuery('')
    setResults([])
    setIsLoading(false)
    setIsOpen(false)
    setIsSearchMode(false)
  }

  const getResultUrl = (result: SearchResult) => {
    return result.type === 'trail' ? `/trails/${result.slug}` : `/feed#incident-${result.slug}`
  }

  const getStatusColor = (status?: string) => {
    if (!status) return 'text-muted-foreground'
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-600'
      case 'failure':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div ref={searchRef} className="relative">
      {/* Search Input */}
      <div className="flex items-center">
        {!isSearchMode ? (
          <Button
            onClick={handleSearchClick}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-secondary/20"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search Nexus</span>
            <span className="sm:hidden">Search</span>
          </Button>
        ) : (
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={handleInputBlur}
              placeholder="Search documentation, field notes..."
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-all"
            />
            {query && (
              <button
                onClick={resetSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.trim() || isLoading) && (
        <div className="absolute top-full mt-2 w-96 max-w-full bg-card border border-border rounded-lg shadow-lg z-50">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">
              <div className="inline-flex items-center">
                <Search className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && results.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground px-2">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              </div>

              {results.map((result) => {
                const Icon = result.type === 'trail' ? Book : Bot
                const isIncident = result.type === 'note' && (
                  result.status === 'failure' || result.status === 'warning'
                )

                return (
                  <Link
                    key={`${result.type}-${result.slug}`}
                    href={getResultUrl(result)}
                    onClick={resetSearch}
                    className="block p-3 hover:bg-secondary/20 transition-colors border-b border-border/20 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Icon className={`w-4 h-4 ${
                          result.type === 'trail' ? 'text-primary' : 'text-orange-500'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">
                            {result.title}
                          </h4>
                          {result.status && (
                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(result.status)} bg-current/10`}>
                              {result.status}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.snippet}
                        </p>

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className={`px-2 py-0.5 rounded ${
                            result.type === 'trail' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500/80'
                          }`}>
                            {result.type === 'trail' ? 'Documentation' : 'Agent Note'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.trim() && results.length === 0 && (
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for documentation trails or agent field notes
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !query.trim() && (
            <div className="p-6 text-center">
              <Book className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Search the entire knowledge base
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Find documentation, field notes, and insights
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
