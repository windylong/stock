import type { RawNewsItem } from '../types'
import { format } from 'date-fns'

const FINNHUB_BASE = 'https://finnhub.io/api/v1'

// 해외 섹터 매핑 (국내 섹터 → 관련 해외 종목)
const SECTOR_ETF_MAP: Record<string, string[]> = {
  '전기전자': ['SOXX', 'SMH'],
  '반도체': ['SOXX', 'SMH', 'NVDA'],
  'IT서비스': ['IGV', 'CIBR'],
  '자동차': ['CARZ', 'TSLA'],
  '화학': ['XLB', 'ICLN'],
  '바이오': ['XBI', 'IBB'],
  '금융': ['XLF', 'KBE'],
  '에너지': ['XLE', 'USO'],
}

interface FinnhubNewsItem {
  headline: string
  summary: string
  url: string
  datetime: number
  source: string
  category: string
}

export async function collectFinnhubNews(
  stocks: { ticker: string; name: string; sector?: string }[],
  since?: Date
): Promise<RawNewsItem[]> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    console.warn('FINNHUB_API_KEY 없음 - Finnhub 수집 건너뜀')
    return []
  }

  const results: RawNewsItem[] = []
  const sectors = [...new Set(stocks.map((s) => s.sector).filter(Boolean))]

  // 일반 시장 뉴스 수집
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/news?category=general&token=${apiKey}`
    )
    if (res.ok) {
      const items: FinnhubNewsItem[] = await res.json()
      const sinceTs = since ? since.getTime() / 1000 : 0
      for (const item of items) {
        if (item.datetime < sinceTs) continue
        results.push({
          title: item.headline,
          content: item.summary,
          url: item.url,
          source: 'finnhub',
          published_at: new Date(item.datetime * 1000),
        })
      }
    }
  } catch (e) {
    console.error('Finnhub 일반 뉴스 오류:', e)
  }

  // 섹터별 해외 뉴스 수집
  const today = format(new Date(), 'yyyy-MM-dd')
  const fromDate = since ? format(since, 'yyyy-MM-dd') : today

  for (const sector of sectors) {
    const symbols = SECTOR_ETF_MAP[sector || ''] || []
    for (const symbol of symbols.slice(0, 2)) {
      try {
        const res = await fetch(
          `${FINNHUB_BASE}/company-news?symbol=${symbol}&from=${fromDate}&to=${today}&token=${apiKey}`
        )
        if (!res.ok) continue
        const items: FinnhubNewsItem[] = await res.json()
        for (const item of items.slice(0, 5)) {
          results.push({
            title: `[${symbol}] ${item.headline}`,
            content: item.summary,
            url: item.url,
            source: 'finnhub',
            published_at: new Date(item.datetime * 1000),
          })
        }
      } catch (e) {
        console.error('Finnhub 섹터 뉴스 오류:', symbol, e)
      }
    }
  }

  return deduplicateByUrl(results)
}

function deduplicateByUrl(items: RawNewsItem[]): RawNewsItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.url || item.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
