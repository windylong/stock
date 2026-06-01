import { createAdminClient } from '@/lib/supabase'
import { StockSummaryCard } from '@/components/StockSummaryCard'
import { MarkdownText } from '@/components/MarkdownText'
import Link from 'next/link'
import { Plus, Clock } from 'lucide-react'
import type { Stock, Analysis, PriceSnapshot, NewsArticle } from '@/lib/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  try {
    const supabase = createAdminClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

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

    const analyses: Record<string, Analysis> = {}
    const newsMap: Record<string, NewsArticle[]> = {}

    if (stocks?.length) {
      const tickers = stocks.map((s) => s.ticker)

      const [{ data: allAnalyses }, { data: allNews }] = await Promise.all([
        supabase
          .from('analyses')
          .select('*')
          .in('ticker', tickers)
          .order('created_at', { ascending: false })
          .limit(stocks.length * 3),
        supabase
          .from('news_articles')
          .select('*')
          .in('ticker', tickers)
          .gte('collected_at', today.toISOString())
          .order('published_at', { ascending: false })
          .limit(tickers.length * 20),
      ])

      for (const analysis of allAnalyses || []) {
        if (!analyses[analysis.ticker]) {
          analyses[analysis.ticker] = analysis
        }
      }

      for (const article of allNews || []) {
        if (article.ticker) {
          if (!newsMap[article.ticker]) newsMap[article.ticker] = []
          newsMap[article.ticker].push(article as NewsArticle)
        }
      }
    }

    const prices: Record<string, PriceSnapshot> = {}
    for (const price of latestPrices || []) {
      if (!prices[price.ticker]) prices[price.ticker] = price
    }

    return { stocks: stocks || [], analyses, prices, newsMap, marketAnalyses: marketAnalyses || [], dbReady: true }
  } catch (e: any) {
    console.error('[Dashboard] DB 연결 오류:', e?.message || e)
    return {
      stocks: [] as Stock[],
      analyses: {} as Record<string, Analysis>,
      prices: {} as Record<string, PriceSnapshot>,
      newsMap: {} as Record<string, NewsArticle[]>,
      marketAnalyses: [] as Analysis[],
      dbReady: false,
      dbError: String(e?.message || e),
    }
  }
}

export default async function DashboardPage() {
  const { stocks, analyses, prices, newsMap, marketAnalyses, dbReady, dbError } = await getDashboardData()

  const now = new Date()
  const hour = now.getHours()
  const currentSlot = hour < 9 ? '장 시작 전' : hour < 14 ? '장중' : hour < 16 ? '마감 후' : '종가 이후'

  const positiveCount = Object.values(analyses).filter((a) => a.sentiment === 'positive').length
  const negativeCount = Object.values(analyses).filter((a) => a.sentiment === 'negative').length
  const neutralCount = Object.values(analyses).filter((a) => a.sentiment === 'neutral').length

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">오늘의 시장 요약</h1>
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

      {/* DB 미초기화 안내 */}
      {!dbReady && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800">
          <strong>⚠️ DB 초기화 필요</strong> — Supabase SQL Editor에서{' '}
          <code className="bg-amber-100 px-1 rounded">supabase/schema.sql</code>을 실행해주세요.
          <a
            href="https://supabase.com/dashboard/project/bwoklujitltwqyjhwdoq/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 underline font-medium"
          >
            SQL Editor 바로가기 →
          </a>
          {dbError && (
            <p className="mt-1 text-xs text-red-600 font-mono break-all">오류: {dbError}</p>
          )}
        </div>
      )}

      {/* 시장 전체 요약 */}
      {marketAnalyses.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-semibold text-lg">📰 시장 전체 요약</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {format(new Date(marketAnalyses[0].created_at), 'HH:mm 분석', { locale: ko })} ·
                뉴스 {marketAnalyses[0].article_count}건 기반
              </p>
            </div>
            {stocks.length > 0 && (
              <div className="flex items-center gap-3 text-sm bg-white/10 rounded-xl px-3 py-2">
                <span className="text-red-300 font-semibold">↑ {positiveCount}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-300">{neutralCount}</span>
                <span className="text-gray-300">|</span>
                <span className="text-blue-300 font-semibold">↓ {negativeCount}</span>
              </div>
            )}
          </div>
          <MarkdownText text={marketAnalyses[0].summary ?? ''} className="text-sm text-blue-50 space-y-1" />

          {/* 직전 분석도 있으면 보여줌 */}
          {marketAnalyses[1] && (
            <details className="mt-3">
              <summary className="text-xs text-blue-200 cursor-pointer hover:text-white">
                이전 분석 보기 ({format(new Date(marketAnalyses[1].created_at), 'HH:mm', { locale: ko })})
              </summary>
              <MarkdownText text={marketAnalyses[1].summary ?? ''} className="text-xs text-blue-100 mt-2 space-y-1" />
            </details>
          )}
        </div>
      )}

      {/* 종목 요약 리스트 */}
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
        <div className="space-y-4">
          {stocks.map((stock) => (
            <StockSummaryCard
              key={stock.id}
              stock={stock}
              latestAnalysis={analyses[stock.ticker]}
              latestPrice={prices[stock.ticker]}
              articles={newsMap[stock.ticker] || []}
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
