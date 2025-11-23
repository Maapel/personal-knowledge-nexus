import { CodeDependencyScanner } from '@/lib/code-scanner'
import { XRayMap } from '@/components/visuals/xray-map'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface XRayProjectPageProps {
  params: { project: string }
}

export default async function XRayProjectPage({ params }: XRayProjectPageProps) {
  const projectName = params.project

  // Load scan data
  try {
    // Reuse scanner to read existing scan results
    const scanner = new CodeDependencyScanner()
    const scanData = await scanner.loadScanResult(projectName)

    return (
      <div className="w-full h-screen bg-black relative">
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Command Center
              </Button>
            </Link>

            <div className="text-white">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-cyan-400">🔍</span>
                Project X-Ray: {scanData.project_name}
              </h1>
              <p className="text-gray-400 text-sm">
                Code architecture analysis for {scanData.metadata.total_files} files
                • Scanned {new Date(scanData.scan_time).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Project metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
            <div className="bg-black/50 rounded-lg p-3 backdrop-blur">
              <div className="text-2xl font-bold">{scanData.metadata.total_files}</div>
              <div className="text-xs text-gray-400">Files Analyzed</div>
            </div>

            <div className="bg-black/50 rounded-lg p-3 backdrop-blur">
              <div className="text-2xl font-bold">{scanData.nodes.length}</div>
              <div className="text-xs text-gray-400">Code Nodes</div>
            </div>

            <div className="bg-black/50 rounded-lg p-3 backdrop-blur">
              <div className="text-2xl font-bold">{scanData.links.length}</div>
              <div className="text-xs text-gray-400">Dependencies</div>
            </div>

            <div className="bg-black/50 rounded-lg p-3 backdrop-blur">
              <div className="flex flex-wrap gap-1">
                {Object.entries(scanData.metadata.languages).map(([lang, count]) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3D X-Ray Visualization */}
        <XRayMap data={scanData} />

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 bg-black/80 rounded-lg p-4 backdrop-blur">
          <h3 className="text-white font-semibold mb-2">Node Colors</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Python (.py)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span>TypeScript (.ts/.tsx)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>JavaScript (.js/.jsx)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Other</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Links show import dependencies between files
          </p>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">X-Ray Scan Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No scan data found for project "{projectName}". Run the scanner first:
            </p>
            <code className="block bg-muted p-2 rounded text-sm mb-4">
              python3 xray_scanner.py --path /path/to/project --name {projectName}
            </code>
            <Link href="/">
              <Button>Back to Command Center</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
}
