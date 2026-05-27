import { createAdminClient } from '@/lib/supabase'
import { AnalysisCard } from '@/components/AnalysisCard'
import { NewsCard } from '@/components/NewsCard'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import type { Analysis, NewsArticle, PriceSnapshot } from '@/lib/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ ticker: string }>
}

async function getStockData(ticker: string) {
  const supabase = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { data: stock },
    { data: analyses },
    { data: articles },
    { data: priceHistory },
  ] = await Promise.all([
    supabase.from('stocks').select('*').eq('ticker', ticker).single(),
    supabase
      .from('analyses')
      .select('*')
      .eq('ticker', ticker)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('news_articles')
      .select('*')
      .or(`ticker.eq.${ticker},title.ilike.%${ticker}%`)
      .gte('collected_at', today.toISOString())
      .order('published_at', { ascending: false })
      .limit(30),
    supabase
      .from('price_snapshots')
      .select('*')
      .eq('ticker', ticker)
      .order('recorded_at', { ascending: false })
      .limit(5),
  ])

  return { stock, analyses: analyses || [], articles: articles || [], priceHistory: priceHistory || [] }
}

export default async function StockPage({ params }: Props) {
  const { ticker } = await params
  const { stock, analyses, articles, priceHistory } = await getStockData(ticker)

  if (!stock) notFound()

  const latestPrice = priceHistory[0] as PriceSnapshot | undefined
  const isUp = latestPrice && latestPrice.change_rate > 0
  const isDown = latestPrice && latestPrice.change_rate < 0

  // 슬롯별 최신 분석
  const analysisBySlot: Record<string, Analysis> = {}
  for (const analysis of analyses) {
    if (!analysisBySlot[analysis.analysis_type]) {
      analysisBySlot[analysis.analysis_type] = analysis
    }
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 + 헤더 */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={14} />
          대시보드로
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{stock.name}</h1>
                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{stock.market}</span>
                {stock.sector && (
                  <span className="text-sm bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{stock.sector}</span>
                )}
              </div>
              <p className="text-gray-500 text-sm">{stock.ticker}</p>
            </div>
            <a
              href={`https://finance.naver.com/item/main.naver?code=${stock.ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              네이버 금융 <ExternalLink size={12} />
            </a>
          </div>

          {latestPrice && (
            <div className="mt-4 flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900">
                {latestPrice.price.toLocaleString()}원
              </span>
              <div className={`flex items-center gap-1 text-lg font-semibold ${
                isUp ? 'text-red-500' : isDown ? 'text-blue-500' : 'text-gray-500'
              }`}>
                {isUp ? <TrendingUp size={18} /> : isDown ? <TrendingDown size={18} /> : <Minus size={18} />}
                <span>
                  {latestPrice.change_amount > 0 ? '+' : ''}{latestPrice.change_amount.toLocaleString()}원
                  ({latestPrice.change_rate > 0 ? '+' : ''}{latestPrice.change_rate.toFixed(2)}%)
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {format(new Date(latestPrice.recorded_at), 'HH:mm 기준', { locale: ko })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: AI 분석 */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-800">🤖 AI 분석 (오늘)</h2>
          {['morning', 'afternoon', 'closing'].map((slot) => {
            const analysis = analysisBySlot[slot]
            if (!analysis) return null
            return (
              <AnalysisCard
                key={slot}
                analysis={analysis}
                defaultExpanded={slot === Object.keys(analysisBySlot)[0]}
              />
            )
          })}
          {Object.keys(analysisBySlot).length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              오늘 분석이 아직 없습니다.<br />
              <span className="text-xs">08:00 / 14:30 / 16:10에 자동 수집됩니다.</span>
            </div>
          )}
        </div>

        {/* 오른쪽: 뉴스 */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-800">📰 오늘의 뉴스 ({articles.length}건)</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            {articles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">수집된 뉴스 없음</p>
            ) : (
              articles.map((article) => (
                <NewsCard key={article.id} article={article as NewsArticle} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
