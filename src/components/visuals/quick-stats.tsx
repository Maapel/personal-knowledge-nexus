import { Card, CardContent } from '@/components/ui/card'
import { Activity, Database, Zap } from 'lucide-react'

export function QuickStats({ totalItems, successRate }: { totalItems: number, successRate: string }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="bg-muted/20 border-border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">System Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono font-bold text-sm text-foreground">OPERATIONAL</span>
            </div>
          </div>
          <Zap className="w-4 h-4 text-green-500 opacity-50" />
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Knowledge Base</p>
            <p className="font-mono font-bold text-xl mt-1">{totalItems}</p>
          </div>
          <Database className="w-4 h-4 text-primary opacity-50" />
        </CardContent>
      </Card>

      <Card className="bg-muted/20 border-border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Success Rate</p>
            <p className="font-mono font-bold text-xl mt-1 text-green-500">{successRate}</p>
          </div>
          <Activity className="w-4 h-4 text-green-500 opacity-50" />
        </CardContent>
      </Card>
    </div>
  )
}
