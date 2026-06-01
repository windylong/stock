'use client'

import Link from 'next/link'
import { SentimentBadge } from './SentimentBadge'
import { SourceBadge } from './SourceBadge'
import type { Stock, Analysis, PriceSnapshot, NewsArticle } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { MarkdownText } from './MarkdownText'
import { useState } from 'react'

interface Props {
  stock: Stock
  latestAnalysis?: Analysis
  latestPrice?: PriceSnapshot
  articles: NewsArticle[]
}

const SLOT_LABELS = { morning: '🌅 아침', afternoon: '☀️ 낮', closing: '📊 종가' }

export function StockSummaryCard({ stock, latestAnalysis, latestPrice, articles }: Props) {
  const [newsExpanded, setNewsExpanded] = useState(false)
  const isUp = latestPrice && latestPrice.change_rate > 0
  const isDown = latestPrice && latestPrice.change_rate < 0

  const visibleArticles = newsExpanded ? articles : articles.slice(0, 3)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 종목 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href={`/stocks/${stock.ticker}`} className="hover:underline">
            <span className="font-bold text-gray-900 text-lg">{stock.name}</span>
          </Link>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{stock.market}</span>
          {stock.sector && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded hidden sm:inline">{stock.sector}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {latestPrice ? (
            <div className="text-right">
              <p className="font-bold text-gray-900">{latestPrice.price.toLocaleString()}원</p>
              <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${
                isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-400'
              }`}>
                {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
                {latestPrice.change_rate > 0 ? '+' : ''}{latestPrice.change_rate.toFixed(2)}%
              </p>
            </div>
          ) : null}
          {latestAnalysis && <SentimentBadge sentiment={latestAnalysis.sentiment} />}
          <Link
            href={`/stocks/${stock.ticker}`}
            className="text-gray-400 hover:text-blue-500 transition-colors"
            title="상세 페이지"
          >
            <ExternalLink size={15} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        {/* AI 분석 요약 (왼쪽 3/5) */}
        <div className="lg:col-span-3 px-5 py-4">
          {latestAnalysis ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                🤖 AI 분석 · {SLOT_LABELS[latestAnalysis.analysis_type]} · 뉴스 {latestAnalysis.article_count}건
              </p>
              <MarkdownText text={latestAnalysis.summary ?? ''} className="text-sm text-gray-700 space-y-1" />
              {latestAnalysis.prediction && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-2">
                  <p className="text-xs font-semibold text-blue-600 mb-0.5">예측</p>
                  <MarkdownText text={latestAnalysis.prediction ?? ''} className="text-xs text-blue-800 space-y-0.5" />
                </div>
              )}
              {latestAnalysis.actual_comparison && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-purple-600 mb-0.5">예측 vs 실제</p>
                  <MarkdownText text={latestAnalysis.actual_comparison ?? ''} className="text-xs text-purple-800 space-y-0.5" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-2">오늘 분석 데이터 없음</p>
          )}
        </div>

        {/* 뉴스 (오른쪽 2/5) */}
        <div className="lg:col-span-2 px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            📰 오늘의 뉴스 ({articles.length}건)
          </p>
          {articles.length === 0 ? (
            <p className="text-sm text-gray-400 italic">수집된 뉴스 없음</p>
          ) : (
            <div className="space-y-2">
              {visibleArticles.map((article) => (
                <div key={article.id} className="flex items-start gap-2">
                  <SourceBadge source={article.source} />
                  {article.url ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-700 hover:text-blue-600 line-clamp-2 leading-relaxed transition-colors"
                    >
                      {article.title}
                    </a>
                  ) : (
                    <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{article.title}</p>
                  )}
                </div>
              ))}
              {articles.length > 3 && (
                <button
                  onClick={() => setNewsExpanded(!newsExpanded)}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors mt-1"
                >
                  {newsExpanded ? (
                    <><ChevronUp size={12} /> 접기</>
                  ) : (
                    <><ChevronDown size={12} /> {articles.length - 3}건 더 보기</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
