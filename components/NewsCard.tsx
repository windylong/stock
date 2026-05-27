import { SourceBadge } from './SourceBadge'
import type { NewsArticle } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Props {
  article: NewsArticle
}

export function NewsCard({ article }: Props) {
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: ko })
    : ''

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <SourceBadge source={article.source} />
          {timeAgo && <span className="text-xs text-gray-400">{timeAgo}</span>}
        </div>
        {article.url ? (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-2"
          >
            {article.title}
          </a>
        ) : (
          <p className="text-sm font-medium text-gray-800 line-clamp-2">{article.title}</p>
        )}
        {article.content && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.content}</p>
        )}
      </div>
    </div>
  )
}
