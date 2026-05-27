'use client'

import Link from 'next/link'
import { SentimentBadge } from './SentimentBadge'
import type { Stock, Analysis, PriceSnapshot } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  stock: Stock
  latestAnalysis?: Analysis
  latestPrice?: PriceSnapshot
}

export function StockCard({ stock, latestAnalysis, latestPrice }: Props) {
  const isUp = latestPrice && latestPrice.change_rate > 0
  const isDown = latestPrice && latestPrice.change_rate < 0

  return (
    <Link href={`/stocks/${stock.ticker}`}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-5 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">{stock.name}</h3>
            <p className="text-sm text-gray-500">{stock.ticker} · {stock.market}</p>
          </div>
          {latestAnalysis && <SentimentBadge sentiment={latestAnalysis.sentiment} />}
        </div>

        {latestPrice && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              {latestPrice.price.toLocaleString()}원
            </span>
            <div className={`flex items-center gap-0.5 text-sm font-medium ${
              isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-500'
            }`}>
              {isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : <Minus size={14} />}
              <span>
                {latestPrice.change_rate > 0 ? '+' : ''}{latestPrice.change_rate.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {latestAnalysis?.summary && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {latestAnalysis.summary}
          </p>
        )}

        {!latestAnalysis && (
          <p className="text-sm text-gray-400 italic">분석 데이터 없음</p>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          {stock.sector && <span className="bg-gray-100 px-2 py-0.5 rounded">{stock.sector}</span>}
          {latestAnalysis && (
            <span>뉴스 {latestAnalysis.article_count}건</span>
          )}
        </div>
      </div>
    </Link>
  )
}
