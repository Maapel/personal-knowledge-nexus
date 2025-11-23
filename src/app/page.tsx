import { getAllTrails, getAllFieldNotes } from '@/lib/mdx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Activity, Zap, Target, Archive, Radar } from 'lucide-react'
import Link from 'next/link'
import { NexusSearch } from '@/components/nexus-search'
import { ActivityHeatmap } from '@/components/visuals/activity-heatmap'
import { CodeDependencyScanner } from '@/lib/code-scanner'

export default async function Dashboard() {
  const trails = await getAllTrails()
  const fieldNotes = await getAllFieldNotes()
  const scanner = new CodeDependencyScanner()
  const xrayProjects = await scanner.listScannedProjects()

  return (
    <div className="max-w-7xl mx-auto space-y-8 container py-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Command Center
          </h1>
          <p className="text-muted-foreground">
            System status and neural retrieval.
          </p>
        </div>
        <div className="w-full md:w-[400px]">
          <NexusSearch />
        </div>
      </div>

      {/* Stats Row with Heatmap */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2">
            <ActivityHeatmap data={fieldNotes} />
        </div>

        <Card className="glass col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Knowledge</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trails.length + fieldNotes.length}</div>
            <p className="text-xs text-muted-foreground">artifacts indexed</p>
          </CardContent>
        </Card>

        <Card className="glass col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Operational</div>
            <p className="text-xs text-muted-foreground">All systems nominal</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Trails Column (Larger) */}
        <div className="col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Target className="w-5 h-5"/> Active Trails</h2>
          </div>
          <div className="grid gap-4">
             {trails.map((trail) => (
              <Link href={`/trails/${trail.slug}`} key={trail.slug}>
                <Card className="glass hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                      {trail.title}
                    </CardTitle>
                    <Badge variant={trail.status === 'Active' ? 'default' : 'secondary'}>
                      {trail.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{trail.progress}%</span>
                    </div>
                    <Progress value={trail.progress} className="h-2" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Feed Column (Smaller) */}
        <div className="col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Archive className="w-5 h-5"/> Agent Feed</h2>
            <Link href="/feed" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {fieldNotes.slice(0, 5).map((note) => (
              <div key={note.slug} className="flex items-center p-3 glass rounded-lg">
                <div className={`mr-4 h-2 w-2 rounded-full ${note.status === 'failure' ? 'bg-red-500' : 'bg-green-500'}`} />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{note.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {note.frontmatter.agent} • {note.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project X-Rays Section */}
      {xrayProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Radar className="w-5 h-5"/> Project X-Rays</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {xrayProjects.map((project) => (
              <Link href={`/xray/${project}`} key={project}>
                <Card className="glass hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                      {project}
                    </CardTitle>
                    <Radar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Code architecture analysis
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
