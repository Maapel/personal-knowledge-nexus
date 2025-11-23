'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { XRayScanResult, XRayNode, XRayLink } from '@/lib/code-scanner'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
    </div>
  )
})

interface XRayMapProps {
  data: XRayScanResult
}

export function XRayMap({ data }: XRayMapProps) {
  const [mounted, setMounted] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<XRayNode | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black relative">
      <ForceGraph2D
        graphData={data as any}
        nodeLabel={(node: any) => {
          return `${node.name}\n${node.language} (${node.lines} lines)\n${node.path}`
        }}
        nodeColor={(node: any) => node.color || '#64748b'}
        nodeRelSize={6}
        nodeVal={(node: any) => node.group === 1 ? 4 : node.group === 2 ? 3 : node.group === 3 ? 2 : 1}
        linkColor={() => 'rgba(34, 197, 94, 0.4)'}  // Soft green links
        linkWidth={(link: any) => link.value || 1}
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={() => '#22c55e'}
        backgroundColor="#000000"
        onNodeHover={(node: any, prevNode: any) => {
          setHoveredNode(node || null)
        }}
        onNodeClick={(node: any) => {
          // Could implement file opening in future
          console.log('X-Ray file selected:', node.path)
        }}
        enableNodeDrag={true}
        minZoom={0.1}
        maxZoom={10}
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.02}
        cooldownTime={3000}
        warmupTicks={100}
      />

      {/* Hovered node tooltip */}
      {hoveredNode && (
        <div className="absolute top-20 right-4 bg-black/90 border border-gray-700 rounded-lg p-4 max-w-sm pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: hoveredNode.color }}
            />
            <span className="text-white font-semibold">{hoveredNode.name}</span>
            <span className="text-gray-400 text-sm">({hoveredNode.extension})</span>
          </div>

          <div className="space-y-1 text-sm text-gray-300">
            <div>Language: <span className="text-cyan-400">{hoveredNode.language}</span></div>
            <div>Lines: <span className="text-green-400">{hoveredNode.lines}</span></div>
            <div>Size: <span className="text-yellow-400">{hoveredNode.size} chars</span></div>
          </div>

          <div className="mt-2 text-xs text-gray-500 font-mono break-all">
            {hoveredNode.path}
          </div>
        </div>
      )}
    </div>
  )
}
