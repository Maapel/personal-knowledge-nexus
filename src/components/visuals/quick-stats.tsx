import { Card, CardContent } from '@/components/ui/card'
import { Activity, Zap, CheckCircle } from 'lucide-react'

interface QuickStatsProps {
  totalKnowledge: number
  successRate: number
}

export function QuickStats({ totalKnowledge, successRate }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <Card className="border border-border bg-muted/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">System Status</p>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-lg font-bold">Operational</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border border-border bg-muted/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Knowledge Base</p>
            <p className="text-lg font-bold font-mono">{totalKnowledge}</p>
            <p className="text-xs text-muted-foreground">artifacts indexed</p>
          </div>
          <Zap className="w-4 h-4 text-muted-foreground" />
        </CardContent>
      </Card>
      <Card className="border border-border bg-muted/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Success Rate</p>
            <p className="text-lg font-bold font-mono text-green-500">{successRate}%</p>
            <p className="text-xs text-muted-foreground">agent operations</p>
          </div>
          <Activity className={`w-4 h-4 ${
            successRate >= 95 ? 'text-green-500' :
            successRate >= 85 ? 'text-yellow-500' : 'text-red-500'
          }`} />
        </CardContent>
      </Card>
    </div>
  )
}
