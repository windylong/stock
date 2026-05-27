'use client'

import { SentimentBadge } from './SentimentBadge'
import type { Analysis } from '@/lib/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronDown, ChevronUp, FileText, TrendingUp, BarChart2 } from 'lucide-react'
import { useState } from 'react'

const SLOT_LABELS = { morning: '아침 분석', afternoon: '낮 분석', closing: '종가 분석' }
const SLOT_ICONS = {
  morning: '🌅',
  afternoon: '☀️',
  closing: '📊',
}

interface Props {
  analysis: Analysis
  defaultExpanded?: boolean
}

export function AnalysisCard({ analysis, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{SLOT_ICONS[analysis.analysis_type]}</span>
          <div className="text-left">
            <p className="font-semibold text-gray-800">{SLOT_LABELS[analysis.analysis_type]}</p>
            <p className="text-xs text-gray-400">
              {format(new Date(analysis.created_at), 'M월 d일 HH:mm', { locale: ko })} ·{' '}
              뉴스 {analysis.article_count}건
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SentimentBadge sentiment={analysis.sentiment} />
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {analysis.summary && (
            <Section icon={<FileText size={14} />} title="뉴스 요약" content={analysis.summary} />
          )}
          {analysis.impact && (
            <Section icon={<BarChart2 size={14} />} title="종목 영향" content={analysis.impact} />
          )}
          {analysis.prediction && (
            <Section
              icon={<TrendingUp size={14} />}
              title="주가 예측"
              content={analysis.prediction}
              highlight="blue"
            />
          )}
          {analysis.actual_comparison && (
            <Section
              icon={<BarChart2 size={14} />}
              title="예측 vs 실제"
              content={analysis.actual_comparison}
              highlight="purple"
            />
          )}
        </div>
      )}
    </div>
  )
}

function Section({
  icon,
  title,
  content,
  highlight,
}: {
  icon: React.ReactNode
  title: string
  content: string
  highlight?: 'blue' | 'purple'
}) {
  const bgClass = highlight === 'blue'
    ? 'bg-blue-50 border-blue-200'
    : highlight === 'purple'
    ? 'bg-purple-50 border-purple-200'
    : 'bg-gray-50 border-gray-200'

  return (
    <div className={`rounded-lg border p-3 ${bgClass}`}>
      <div className="flex items-center gap-1.5 mb-2 text-gray-600">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}
