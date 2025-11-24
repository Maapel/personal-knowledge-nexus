import { getAllTrails, getAllFieldNotes } from '@/lib/mdx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Zap, Target, Terminal, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { NexusSearch } from '@/components/nexus-search'
import { ActivityHeatmap } from '@/components/visuals/activity-heatmap'

export default async function Dashboard() {
  const trails = await getAllTrails()
  const notes = await getAllFieldNotes()
  const recentFailures = notes.filter(n => n.status === 'failure').slice(0, 3)

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" />
            NEXUS_OS v2.1
          </h1>
          <p className="text-sm text-muted-foreground font-mono">System operational. {notes.length} logs indexed.</p>
        </div>
        <div className="w-[400px]">
          <NexusSearch />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">

        {/* Left Col: System Status (Heatmap + Incidents) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <ActivityHeatmap data={notes} />

          <div className="grid grid-cols-3 gap-4">
             {/* Dense Stat Cards */}
             <Card className="glass bg-primary/5 border-primary/20">
               <CardContent className="p-6 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-mono text-muted-foreground uppercase">Active Agents</p>
                   <p className="text-2xl font-bold">3</p>
                 </div>
                 <Zap className="w-5 h-5 text-primary" />
               </CardContent>
             </Card>
             <Card className="glass">
               <CardContent className="p-6 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-mono text-muted-foreground uppercase">Total Trails</p>
                   <p className="text-2xl font-bold">{trails.length}</p>
                 </div>
                 <Target className="w-5 h-5 text-muted-foreground" />
               </CardContent>
             </Card>
             <Card className="glass">
               <CardContent className="p-6 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-mono text-muted-foreground uppercase">Success Rate</p>
                   <p className="text-2xl font-bold text-green-500">98%</p>
                 </div>
                 <Activity className="w-5 h-5 text-green-500" />
               </CardContent>
             </Card>
          </div>

          {/* Active Trails (List View for density) */}
          <Card className="glass flex-1 overflow-hidden">
            <CardHeader className="pb-3">
               <CardTitle className="text-sm font-mono uppercase tracking-wider">Active Projects</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {trails.map((trail) => (
                <Link href={`/trails/${trail.slug}`} key={trail.slug}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${trail.status === 'Active' ? 'bg-green-500' : 'bg-zinc-500'}`} />
                    <span className="font-medium">{trail.title}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">{trail.progress}%</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: The Feed & Alerts */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
           {/* Critical Alerts Box */}
           {recentFailures.length > 0 && (
             <Card className="border-red-500/30 bg-red-500/5">
               <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-mono text-red-400 flex items-center gap-2">
                   <AlertCircle className="w-4 h-4" /> ACTIVE INCIDENTS
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 {recentFailures.map(fail => (
                   <div key={fail.slug} className="text-sm border-l-2 border-red-500 pl-3 py-1">
                     <p className="font-medium text-red-200">{fail.title}</p>
                     <p className="text-xs text-red-400/70">{fail.date} • {fail.frontmatter.agent}</p>
                   </div>
                 ))}
               </CardContent>
             </Card>
           )}

           {/* Live Agent Feed */}
           <Card className="glass flex-1 flex flex-col">
             <CardHeader className="pb-3 border-b border-border/50">
               <CardTitle className="text-sm font-mono uppercase">Agent Stream</CardTitle>
             </CardHeader>
             <CardContent className="flex-1 overflow-y-auto p-0">
               {notes.slice(0, 10).map((note) => (
                 <div key={note.slug} className="p-4 border-b border-border/50 last:border-0 hover:bg-muted/30">
                   <div className="flex justify-between items-start mb-1">
                     <span className="font-semibold text-sm">{note.frontmatter.agent}</span>
                     <span className="text-xs text-muted-foreground font-mono">{note.date}</span>
                   </div>
                   <p className="text-sm text-muted-foreground line-clamp-2">{note.title}</p>
                 </div>
               ))}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
