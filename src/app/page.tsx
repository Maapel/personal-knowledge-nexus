import { getAllTrails } from '@/lib/mdx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Archive, Trophy, Target } from 'lucide-react'
import Link from 'next/link'

const statusIcons = {
  Active: Target,
  Archived: Archive,
  Mastered: Trophy,
}

const statusColors = {
  Active: 'bg-green-500',
  Archived: 'bg-gray-500',
  Mastered: 'bg-yellow-500',
}

export default async function Dashboard() {
  const trails = await getAllTrails()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          Personal Knowledge Nexus
        </h1>
        <p className="text-muted-foreground text-lg">
          Your gamified documentation library and agent field notes hub
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6" />
            Knowledge Trails
          </h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Active
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              Archived
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              Mastered
            </div>
          </div>
        </div>
      </div>

      {trails.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Trails Found</h3>
          <p className="text-muted-foreground">
            Add your first knowledge trail to get started. Create project documentation in /content/trails/
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trails.map((trail) => {
            const StatusIcon = statusIcons[trail.status]
            const statusColor = statusColors[trail.status]

            return (
              <Link href={`/trails/${trail.slug}`}>
                <Card
                  key={trail.slug}
                  className="glass hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105"
                >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {trail.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColor} text-white flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {trail.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground line-clamp-3">
                    {trail.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{trail.progress}%</span>
                    </div>
                    <Progress value={trail.progress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Archive className="w-6 h-6" />
            Recent Activity
          </h2>
          <a
            href="/feed"
            className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            View Agent Feed →
          </a>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/feed"
              className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-2"
            >
              🤖 Agent Feed →
            </a>
            <a
              href="/incidents"
              className="px-4 py-2 text-sm font-medium text-orange-600 border border-orange-600/30 rounded-lg hover:bg-orange-600/5 transition-colors flex items-center gap-2"
            >
              🚨 Incident Room →
            </a>
          </div>
          <p className="text-muted-foreground text-center">
            Monitor agent activities and analyze operational incidents through our specialized dashboards.
          </p>
        </div>
      </div>
    </div>
  )
}
