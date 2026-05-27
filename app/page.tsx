import { createAdminClient } from '@/lib/supabase'
import { StockCard } from '@/components/StockCard'
import Link from 'next/link'
import { Plus, RefreshCw, Clock } from 'lucide-react'
import type { Stock, Analysis, PriceSnapshot } from '@/lib/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const supabase = createAdminClient()

  const [{ data: stocks }, { data: marketAnalyses }, { data: latestPrices }] = await Promise.all([
    supabase.from('stocks').select('*').order('market').order('name'),
    supabase
      .from('analyses')
      .select('*')
      .eq('ticker', 'MARKET')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('price_snapshots')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(50),
  ])

  // 종목별 최신 분석
  const analyses: Record<string, Analysis> = {}
  if (stocks?.length) {
    const { data: allAnalyses } = await supabase
      .from('analyses')
      .select('*')
      .in('ticker', stocks.map((s) => s.ticker))
      .order('created_at', { ascending: false })
      .limit(stocks.length * 3)

    for (const analysis of allAnalyses || []) {
      if (!analyses[analysis.ticker]) {
        analyses[analysis.ticker] = analysis
      }
    }
  }

  // 종목별 최신 주가
  const prices: Record<string, PriceSnapshot> = {}
  for (const price of latestPrices || []) {
    if (!prices[price.ticker]) prices[price.ticker] = price
  }

  return { stocks: stocks || [], analyses, prices, marketAnalyses: marketAnalyses || [] }
}

export default async function DashboardPage() {
  const { stocks, analyses, prices, marketAnalyses } = await getDashboardData()

  const now = new Date()
  const hour = now.getHours()
  const currentSlot = hour < 9 ? '장 시작 전' : hour < 14 ? '장중' : hour < 16 ? '마감 후' : '종가 이후'

  const positiveCount = Object.values(analyses).filter((a) => a.sentiment === 'positive').length
  const negativeCount = Object.values(analyses).filter((a) => a.sentiment === 'negative').length

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Clock size={13} />
            {format(now, 'M월 d일 (E) HH:mm', { locale: ko })} · {currentSlot}
          </p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          종목 추가
        </Link>
      </div>

      {/* 시장 요약 */}
      {marketAnalyses.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">📰 시장 전체 요약</h2>
            <div className="flex items-center gap-3 text-sm text-blue-100">
              <span>↑ {positiveCount}종목</span>
              <span>↓ {negativeCount}종목</span>
            </div>
          </div>
          <p className="text-sm text-blue-50 leading-relaxed">{marketAnalyses[0].summary}</p>
          <p className="text-xs text-blue-200 mt-2">
            {format(new Date(marketAnalyses[0].created_at), 'HH:mm 분석', { locale: ko })} ·
            뉴스 {marketAnalyses[0].article_count}건 기반
          </p>
        </div>
      )}

      {/* 종목 그리드 */}
      {stocks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">관심 종목을 추가해보세요</p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={15} />
            종목 추가
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock) => (
            <StockCard
              key={stock.id}
              stock={stock}
              latestAnalysis={analyses[stock.ticker]}
              latestPrice={prices[stock.ticker]}
            />
          ))}
        </div>
      )}

      {/* 수집 일정 안내 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 자동 수집 일정</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { time: '08:00', label: '아침 분석', desc: '전날 16:00 ~ 당일 08:00' },
            { time: '14:30', label: '낮 분석', desc: '당일 09:00 ~ 14:00' },
            { time: '16:10', label: '종가 분석', desc: '예측 vs 실제 비교' },
          ].map((schedule) => (
            <div key={schedule.time} className="text-center">
              <p className="text-lg font-bold text-blue-600">{schedule.time}</p>
              <p className="text-sm font-medium text-gray-700">{schedule.label}</p>
              <p className="text-xs text-gray-400">{schedule.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
