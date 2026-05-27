import type { NewsSource } from '@/lib/types'

const config: Record<string, { label: string; classes: string }> = {
  naver: { label: '네이버', classes: 'bg-green-100 text-green-700' },
  dart: { label: 'DART', classes: 'bg-blue-100 text-blue-700' },
  yonhap: { label: '연합뉴스', classes: 'bg-orange-100 text-orange-700' },
  finnhub: { label: '해외', classes: 'bg-purple-100 text-purple-700' },
}

export function SourceBadge({ source }: { source: string }) {
  const { label, classes } = config[source] || { label: source, classes: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}
