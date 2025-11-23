'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FieldNoteData } from '@/lib/types'
import { format, eachDayOfInterval, subDays } from 'date-fns'

interface ActivityHeatmapProps {
  data: FieldNoteData[]
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const chartData = useMemo(() => {
    // Get last 7 days
    const endDate = new Date()
    const startDate = subDays(endDate, 6)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Group notes by date
    const notesByDate = data.reduce((acc, note) => {
      const dateStr = format(new Date(note.date), 'yyyy-MM-dd')
      if (!acc[dateStr]) {
        acc[dateStr] = { success: 0, failure: 0 }
      }
      acc[dateStr][note.status as 'success' | 'failure']++
      return acc
    }, {} as Record<string, { success: number; failure: number }>)

    // Create data for each day in the range
    return days.map((day: Date) => {
      const dateKey = format(day, 'yyyy-MM-dd')
      const dayNotes = notesByDate[dateKey] || { success: 0, failure: 0 }
      return {
        date: format(day, 'MMM dd'),
        success: dayNotes.success,
        failure: dayNotes.failure,
        total: dayNotes.success + dayNotes.failure
      }
    })
  }, [data])

  return (
    <div className="w-full" style={{ minHeight: '200px' }}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value, name) => [
              value,
              name === 'success' ? 'Success' : 'Failure'
            ]}
          />
          <Bar
            dataKey="success"
            stackId="a"
            fill="#22c55e"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="failure"
            stackId="a"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
