'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { GraphNode, GraphLink, KnowledgeGraph } from '@/lib/graph'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
})

interface NeuralMapProps {
  data: KnowledgeGraph
}

export function NeuralMap({ data }: NeuralMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black">
      <ForceGraph2D
        graphData={data as any}
        nodeLabel={(node: any) => `${node.name}\n${node.type === 'trail' ? 'Knowledge Trail' : 'Agent Note'}`}
        nodeColor={(node: any) => node.color || '#64748b'}
        nodeRelSize={8}
        nodeVal={(node: any) => node.group === 1 ? 3 : 2} // Trails are slightly larger
        linkColor={() => 'rgba(255, 255, 255, 0.3)'}
        linkWidth={(link: any) => Math.sqrt(link.value) * 0.5}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#000000"
        onNodeClick={(node: any) => {
          if (node.url) {
            window.open(node.url, '_blank')
          }
        }}
        d3VelocityDecay={0.3} // Slower decay for more stable movement
        d3AlphaDecay={0.02}
      />
    </div>
  )
}
