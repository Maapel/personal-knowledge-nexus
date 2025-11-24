import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Zap, Target } from 'lucide-react'

interface QuickStatsProps {
  totalKnowledge: number
}

export function QuickStats({ totalKnowledge }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card className="glass bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase">Knowledge Base</p>
            <p className="text-2xl font-bold">{totalKnowledge}</p>
            <p className="text-xs text-muted-foreground">artifacts indexed</p>
          </div>
          <Zap className="w-5 h-5 text-primary" />
        </CardContent>
      </Card>
      <Card className="glass">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase">Agent Health</p>
            <p className="text-2xl font-bold text-green-500">98%</p>
            <p className="text-xs text-muted-foreground">success rate</p>
          </div>
          <Activity className="w-5 h-5 text-green-500" />
        </CardContent>
      </Card>
      <Card className="glass">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase">Last Sync</p>
            <p className="text-2xl font-bold">Just Now</p>
            <p className="text-xs text-muted-foreground">system updated</p>
          </div>
          <Target className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  )
}
