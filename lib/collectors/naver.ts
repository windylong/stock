import Parser from 'rss-parser'
import type { RawNewsItem } from '../types'

const parser = new Parser({
  customFields: { item: ['description', 'pubDate'] },
  requestOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; StockNewsBot/1.0)',
    },
  },
})

const NAVER_FINANCE_RSS_URLS = [
  'https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258',
  'https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=259',
]

const NAVER_SEARCH_RSS = 'https://openapi.naver.com/v1/search/news.json'

async function fetchNaverSearchNews(query: string): Promise<RawNewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) return []

  try {
    const url = `${NAVER_SEARCH_RSS}?query=${encodeURIComponent(query)}&display=20&sort=date`
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.items || []).map((item: any) => ({
      title: item.title.replace(/<[^>]*>/g, ''),
      content: item.description.replace(/<[^>]*>/g, ''),
      url: item.originallink || item.link,
      source: 'naver' as const,
      published_at: new Date(item.pubDate),
    }))
  } catch {
    return []
  }
}

async function fetchNaverStockNews(ticker: string): Promise<RawNewsItem[]> {
  try {
    const url = `https://finance.naver.com/item/news_news.naver?code=${ticker}&page=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockNewsBot/1.0)' },
    })
    if (!res.ok) return []
    const html = await res.text()

    const items: RawNewsItem[] = []
    const regex = /<a[^>]*href="(\/news\/news_read[^"]*)"[^>]*>([^<]+)<\/a>/g
    let match
    while ((match = regex.exec(html)) !== null) {
      const path = match[1]
      const title = match[2].trim()
      if (title && path) {
        items.push({
          title,
          url: `https://finance.naver.com${path}`,
          source: 'naver',
        })
      }
    }
    return items.slice(0, 20)
  } catch {
    return []
  }
}

export async function collectNaverNews(
  stocks: { ticker: string; name: string }[],
  since?: Date
): Promise<RawNewsItem[]> {
  const results: RawNewsItem[] = []

  // RSS 피드 수집
  for (const rssUrl of NAVER_FINANCE_RSS_URLS) {
    try {
      const feed = await parser.parseURL(rssUrl)
      for (const item of feed.items) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : undefined
        if (since && pubDate && pubDate < since) continue
        results.push({
          title: item.title || '',
          content: item.contentSnippet || item.content,
          url: item.link,
          source: 'naver',
          published_at: pubDate,
        })
      }
    } catch (e) {
      console.error('Naver RSS 오류:', rssUrl, e)
    }
  }

  // 종목별 뉴스 수집
  for (const stock of stocks) {
    const [searchNews, stockPageNews] = await Promise.all([
      fetchNaverSearchNews(stock.name),
      fetchNaverStockNews(stock.ticker),
    ])
    results.push(...searchNews, ...stockPageNews)
  }

  return deduplicateNews(results)
}

function deduplicateNews(items: RawNewsItem[]): RawNewsItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.url || item.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
