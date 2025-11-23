import { NextResponse } from 'next/server'
import { getFileHistory } from '@/lib/git'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const history = await getFileHistory(params.slug, 'trails')
    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
