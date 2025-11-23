import { NeuralMap } from '@/components/visuals/neural-map'
import { getKnowledgeGraph } from '@/lib/graph'
import { Bot } from 'lucide-react'

export default async function NeuralMapPage() {
  const graphData = await getKnowledgeGraph()

  return (
    <div className="w-full h-screen bg-black relative">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 text-white">
          <Bot className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Neural Map</h1>
          <span className="text-sm text-gray-400">
            {graphData.nodes.length} nodes • {graphData.links.length} connections
          </span>
        </div>
        <p className="text-gray-400 mt-2 max-w-md">
          Interactive visualization of your knowledge base. Nodes represent knowledge trails and agent notes.
          Links show connections through shared tags and references.
        </p>
      </div>

      {/* Neural Map */}
      <NeuralMap data={graphData} />
    </div>
  )
}
