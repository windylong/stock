import type { Sentiment } from '@/lib/types'

const config: Record<Sentiment, { label: string; classes: string }> = {
  positive: { label: '긍정', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  negative: { label: '부정', classes: 'bg-red-100 text-red-700 border-red-200' },
  neutral: { label: '중립', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export function SentimentBadge({ sentiment }: { sentiment?: Sentiment }) {
  const s = sentiment || 'neutral'
  const { label, classes } = config[s]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${classes}`}>
      {label}
    </span>
  )
}
