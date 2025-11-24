import { getAllTrails, getAllFieldNotes } from '@/lib/mdx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Search } from 'lucide-react'
import Link from 'next/link'
import { NexusSearch } from '@/components/nexus-search'
import { ActivityHeatmap } from '@/components/visuals/activity-heatmap'
import { QuickStats } from '@/components/visuals/quick-stats'

export default async function Dashboard() {
  const trails = await getAllTrails()
  const notes = await getAllFieldNotes()

  // Calculate stats
  const successCount = notes.filter(n => n.status === 'success').length
  const successRate = notes.length > 0 ? Math.round((successCount / notes.length) * 100) + '%' : '100%'
  const totalItems = trails.length + notes.length

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6">

      {/* Header with Brand */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight font-mono">NEXUS_OS // v2.1</h1>
          <p className="text-xs text-muted-foreground font-mono">Developer Intelligence Console</p>
        </div>
        <div className="w-[300px]">
          <NexusSearch />
        </div>
      </div>

      {/* Status Overview */}
      <QuickStats totalItems={totalItems} successRate={successRate} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6 min-h-[600px]">

        {/* Left Col: Activity & Status */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <ActivityHeatmap data={notes} />

          {/* Active Trails List */}
          <Card className="border border-border bg-muted/10 flex-1">
            <CardHeader className="pb-2 border-b border-border/50">
               <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                 <Target className="w-4 h-4" />
                 Active Projects
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {trails.map((trail) => (
                <Link href={`/trails/${trail.slug}`} key={trail.slug}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${trail.status === 'Active' ? 'bg-green-500' : 'bg-zinc-500'}`} />
                    <span className="font-medium text-sm">{trail.title}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs text-muted-foreground">
                    {trail.progress}%
                  </Badge>
                </Link>
              ))}
              {trails.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active trails</p>
                  <p className="text-xs">Start your first project</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Recent Activity Feed */}
        <div className="col-span-12 lg:col-span-4">
           <Card className="border border-border bg-muted/10 h-full min-h-[600px]">
             <CardHeader className="pb-2 border-b border-border/50">
               <CardTitle className="text-sm font-mono uppercase tracking-wider">Recent Activity</CardTitle>
               <p className="text-xs text-muted-foreground">{notes.length} total logs</p>
             </CardHeader>
             <CardContent className="p-0 flex-1 max-h-96 overflow-y-auto">
               {notes.slice(0, 15).map((note) => (
                 <div key={note.slug} className="px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/20">
                   <div className="flex justify-between items-start mb-1">
                     <span className="font-semibold text-sm font-mono">{note.frontmatter.agent}</span>
                     <span className="text-xs text-muted-foreground font-mono">{note.date}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${
                       note.status === 'success' ? 'bg-green-500' :
                       note.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                     }`} />
                     <p className="text-sm text-muted-foreground line-clamp-1">{note.title}</p>
                   </div>
                 </div>
               ))}
               {notes.length === 0 && (
                 <div className="px-4 py-8 text-center text-muted-foreground">
                   <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                   <p className="text-sm">No activity yet</p>
                   <p className="text-xs">Logs will appear here</p>
                 </div>
               )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
