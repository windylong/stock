import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { collectNaverNews } from '@/lib/collectors/naver'
import { collectDartDisclosures } from '@/lib/collectors/dart'
import { collectYonhapNews } from '@/lib/collectors/yonhap'
import { collectFinnhubNews } from '@/lib/collectors/finnhub'
import { analyzeStock, analyzeMarketOverview } from '@/lib/analyzer'
import type { CollectionSlot, RawNewsItem } from '@/lib/types'
import { subHours } from 'date-fns'

// Vercel 타임아웃 60초 (Hobby 플랜 최대)
export const maxDuration = 60

function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-collect-secret') || req.nextUrl.searchParams.get('secret')
  return secret === process.env.COLLECT_SECRET
}

function getSinceDate(slot: CollectionSlot): Date {
  const now = new Date()
  switch (slot) {
    case 'morning': {
      const d = new Date(now)
      d.setDate(d.getDate() - 1)
      d.setHours(16, 0, 0, 0)
      return d
    }
    case 'afternoon': {
      const d = new Date(now)
      d.setHours(9, 0, 0, 0)
      return d
    }
    case 'closing': {
      const d = new Date(now)
      d.setHours(8, 0, 0, 0)
      return d
    }
    default:
      return subHours(now, 8)
  }
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const slot: CollectionSlot = body.slot || 'morning'
    const supabase = createAdminClient()

    // 1. 관심 종목 조회
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('*')
      .order('created_at')

    if (stocksError) {
      console.error('[collect] 종목 조회 오류:', stocksError)
      return NextResponse.json({ error: 'DB 오류', detail: stocksError.message }, { status: 500 })
    }
    if (!stocks?.length) {
      return NextResponse.json({ error: '관심 종목이 없습니다. 먼저 종목을 추가하세요.' }, { status: 400 })
    }

    const since = getSinceDate(slot)
    console.log(`[collect:${slot}] 시작 - 종목 ${stocks.length}개, since: ${since.toISOString()}`)

    // 2. 뉴스 수집 (각 소스별 에러 무시)
    const [naverNews, dartNews, yonhapNews, finnhubNews] = await Promise.all([
      collectNaverNews(stocks, since).catch((e) => { console.error('[naver]', e.message); return [] }),
      collectDartDisclosures(stocks, since).catch((e) => { console.error('[dart]', e.message); return [] }),
      collectYonhapNews(stocks, since).catch((e) => { console.error('[yonhap]', e.message); return [] }),
      collectFinnhubNews(stocks, since).catch((e) => { console.error('[finnhub]', e.message); return [] }),
    ])

    const allNews: RawNewsItem[] = [...naverNews, ...dartNews, ...yonhapNews, ...finnhubNews]
    console.log(`[collect:${slot}] 수집 완료 - Naver:${naverNews.length} DART:${dartNews.length} 연합:${yonhapNews.length} Finnhub:${finnhubNews.length}`)

    // 3. 뉴스 DB 저장
    if (allNews.length > 0) {
      const articlesToInsert = allNews.map((article) => {
        const matchedStock = stocks.find(
          (s) => article.title.includes(s.name) || article.content?.includes(s.name) || article.url?.includes(s.ticker)
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

      const { error: insertError } = await supabase
        .from('news_articles')
        .upsert(articlesToInsert, { onConflict: 'url', ignoreDuplicates: true })
      if (insertError) console.error('[collect] 뉴스 저장 오류:', insertError.message)
    }

    // 4. 주가 스냅샷 (closing 슬롯)
    if (slot === 'closing') {
      await captureAllPrices(supabase, stocks)
    }

    // 5. 종목별 AI 분석 (병렬)
    const analysisResults = await Promise.allSettled(
      stocks.map(async (stock) => {
        const stockArticles = allNews.filter(
          (a) => a.title.includes(stock.name) || a.content?.includes(stock.name) || a.url?.includes(stock.ticker)
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

        let currentPrice: { price: number; change_rate: number } | undefined
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

        const { error: analysisError } = await supabase.from('analyses').insert({
          ticker: stock.ticker,
          analysis_type: slot,
          summary: analysis.summary,
          impact: analysis.impact,
          prediction: analysis.prediction,
          actual_comparison: analysis.actual_comparison,
          sentiment: analysis.sentiment,
          article_count: stockArticles.length,
        })
        if (analysisError) console.error(`[collect] 분석 저장 오류 (${stock.ticker}):`, analysisError.message)

        return { ticker: stock.ticker, sentiment: analysis.sentiment, articles: stockArticles.length }
      })
    )

    const succeeded = analysisResults.filter((r) => r.status === 'fulfilled')
    const failed = analysisResults.filter((r) => r.status === 'rejected')
    failed.forEach((r, i) => console.error(`[collect] 분석 실패 #${i}:`, (r as PromiseRejectedResult).reason?.message))

    // 6. 시장 전체 요약
    if (allNews.length > 0) {
      const marketSummary = await analyzeMarketOverview(allNews.slice(0, 15), slot).catch((e) => {
        console.error('[collect] 시장 요약 오류:', e.message)
        return ''
      })
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
    }

    return NextResponse.json({
      success: true,
      slot,
      collected: allNews.length,
      analyzed: succeeded.length,
      failed: failed.length,
      breakdown: { naver: naverNews.length, dart: dartNews.length, yonhap: yonhapNews.length, finnhub: finnhubNews.length },
    })

  } catch (e: any) {
    console.error('[collect] 치명적 오류:', e?.message, e?.stack)
    return NextResponse.json({ error: e?.message || '알 수 없는 오류', stack: e?.stack }, { status: 500 })
  }
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
        change_rate: parseFloat(data.rate?.replace(/%/g, '').replace(/[+]/g, '') || '0'),
        volume: parseInt(data.quant?.replace(/,/g, '') || '0'),
      })
    } catch (e: any) {
      console.error('[collect] 주가 수집 오류:', stock.ticker, e.message)
    }
  }
}

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
