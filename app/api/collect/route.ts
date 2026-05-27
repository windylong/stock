import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { collectNaverNews } from '@/lib/collectors/naver'
import { collectDartDisclosures } from '@/lib/collectors/dart'
import { collectYonhapNews } from '@/lib/collectors/yonhap'
import { collectFinnhubNews } from '@/lib/collectors/finnhub'
import { analyzeStock, analyzeMarketOverview } from '@/lib/analyzer'
import type { CollectionSlot, RawNewsItem } from '@/lib/types'
import { subHours } from 'date-fns'

// GitHub Actions에서 호출 시 인증
function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-collect-secret') || req.nextUrl.searchParams.get('secret')
  return secret === process.env.COLLECT_SECRET
}

function getSinceDate(slot: CollectionSlot): Date {
  const now = new Date()
  switch (slot) {
    case 'morning':
      // 전날 16:00 ~ 당일 08:00
      const yesterday1600 = new Date(now)
      yesterday1600.setDate(yesterday1600.getDate() - 1)
      yesterday1600.setHours(16, 0, 0, 0)
      return yesterday1600
    case 'afternoon':
      // 당일 09:00 ~ 14:00
      const today0900 = new Date(now)
      today0900.setHours(9, 0, 0, 0)
      return today0900
    case 'closing':
      // 당일 전체
      const today0800 = new Date(now)
      today0800.setHours(8, 0, 0, 0)
      return today0800
    default:
      return subHours(now, 8)
  }
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const slot: CollectionSlot = body.slot || 'morning'

  const supabase = createAdminClient()

  // 1. 관심 종목 조회
  const { data: stocks, error: stocksError } = await supabase
    .from('stocks')
    .select('*')
    .order('created_at')

  if (stocksError || !stocks?.length) {
    return NextResponse.json({ error: '종목 없음', detail: stocksError }, { status: 400 })
  }

  const since = getSinceDate(slot)
  console.log(`[${slot}] 뉴스 수집 시작. since:`, since.toISOString())

  // 2. 뉴스 병렬 수집
  const [naverNews, dartNews, yonhapNews, finnhubNews] = await Promise.all([
    collectNaverNews(stocks, since),
    collectDartDisclosures(stocks, since),
    collectYonhapNews(stocks, since),
    collectFinnhubNews(stocks, since),
  ])

  const allNews: RawNewsItem[] = [...naverNews, ...dartNews, ...yonhapNews, ...finnhubNews]
  console.log(`수집된 뉴스: Naver ${naverNews.length}, DART ${dartNews.length}, 연합 ${yonhapNews.length}, Finnhub ${finnhubNews.length}`)

  // 3. 뉴스 DB 저장 (종목별 매핑)
  const articlesToInsert = allNews.map((article) => {
    const matchedStock = stocks.find(
      (s) =>
        article.title.includes(s.name) ||
        article.content?.includes(s.name) ||
        article.url?.includes(s.ticker)
    )
    return {
      ticker: matchedStock?.ticker || null,
      title: article.title,
      content: article.content?.slice(0, 2000),
      url: article.url,
      source: article.source,
      published_at: article.published_at?.toISOString() || null,
      collection_slot: slot,
      is_relevant: !!matchedStock,
    }
  })

  if (articlesToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('news_articles')
      .upsert(articlesToInsert, { onConflict: 'url', ignoreDuplicates: true })
    if (insertError) console.error('뉴스 저장 오류:', insertError)
  }

  // 4. 주가 스냅샷 (closing 슬롯에서)
  if (slot === 'closing') {
    await captureAllPrices(supabase, stocks)
  }

  // 5. 종목별 AI 분석
  const analysisResults = await Promise.allSettled(
    stocks.map(async (stock) => {
      const stockArticles = allNews.filter(
        (a) =>
          a.title.includes(stock.name) ||
          a.content?.includes(stock.name) ||
          a.url?.includes(stock.ticker)
      )

      let previousPrediction: string | undefined
      if (slot === 'closing') {
        const { data: prev } = await supabase
          .from('analyses')
          .select('prediction')
          .eq('ticker', stock.ticker)
          .in('analysis_type', ['morning', 'afternoon'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        previousPrediction = prev?.prediction
      }

      let currentPrice
      if (slot === 'closing') {
        const { data: priceData } = await supabase
          .from('price_snapshots')
          .select('price, change_rate')
          .eq('ticker', stock.ticker)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single()
        currentPrice = priceData || undefined
      }

      const analysis = await analyzeStock({
        stock,
        articles: stockArticles.map((a) => ({
          ...a,
          published_at: a.published_at?.toISOString(),
        })),
        slot,
        previousPrediction,
        currentPrice,
      })

      await supabase.from('analyses').insert({
        ticker: stock.ticker,
        analysis_type: slot,
        summary: analysis.summary,
        impact: analysis.impact,
        prediction: analysis.prediction,
        actual_comparison: analysis.actual_comparison,
        sentiment: analysis.sentiment,
        article_count: stockArticles.length,
      })

      return { ticker: stock.ticker, sentiment: analysis.sentiment }
    })
  )

  // 6. 시장 전체 요약 (general ticker = 'MARKET')
  const marketSummary = await analyzeMarketOverview(allNews.slice(0, 15), slot)
  if (marketSummary) {
    await supabase.from('analyses').insert({
      ticker: 'MARKET',
      analysis_type: slot,
      summary: marketSummary,
      impact: '',
      sentiment: 'neutral',
      article_count: allNews.length,
    })
  }

  return NextResponse.json({
    success: true,
    slot,
    collected: allNews.length,
    analyzed: analysisResults.filter((r) => r.status === 'fulfilled').length,
  })
}

async function captureAllPrices(
  supabase: ReturnType<typeof createAdminClient>,
  stocks: { ticker: string }[]
) {
  for (const stock of stocks) {
    try {
      const res = await fetch(
        `https://api.finance.naver.com/service/itemSummary.nhn?itemcode=${stock.ticker}`,
        { headers: { Referer: 'https://finance.naver.com' } }
      )
      if (!res.ok) continue
      const data = await res.json()
      if (!data.now) continue
      await supabase.from('price_snapshots').insert({
        ticker: stock.ticker,
        price: parseFloat(data.now.replace(/,/g, '')),
        change_amount: parseFloat(data.diff?.replace(/,/g, '') || '0'),
        change_rate: parseFloat(data.rate?.replace(/%/g, '') || '0'),
        volume: parseInt(data.quant?.replace(/,/g, '') || '0'),
      })
    } catch (e) {
      console.error('주가 수집 오류:', stock.ticker, e)
    }
  }
}

// 개발/테스트용 GET 엔드포인트
export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const slot = (req.nextUrl.searchParams.get('slot') || 'morning') as CollectionSlot
  const mockReq = new NextRequest(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ slot }),
  })
  return POST(mockReq)
}
