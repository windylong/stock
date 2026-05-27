import Parser from 'rss-parser'
import type { RawNewsItem } from '../types'

const parser = new Parser({
  requestOptions: {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockNewsBot/1.0)' },
  },
})

const YONHAP_RSS_FEEDS = [
  { url: 'https://www.yonhapnewstv.co.kr/browse/feed/', label: '연합뉴스TV 전체' },
  { url: 'https://www.yonhapnews.co.kr/rss/economy.xml', label: '연합뉴스 경제' },
  { url: 'https://www.yna.co.kr/economy/all.xml', label: '연합뉴스 경제2' },
]

export async function collectYonhapNews(
  stocks: { ticker: string; name: string }[],
  since?: Date
): Promise<RawNewsItem[]> {
  const results: RawNewsItem[] = []
  const stockNames = stocks.map((s) => s.name)

  for (const feed of YONHAP_RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : undefined
        if (since && pubDate && pubDate < since) continue

        const title = item.title || ''
        const content = item.contentSnippet || item.content || ''

        // 관심 종목 관련 뉴스만 포함하거나 금융/경제 뉴스 포함
        const isRelevant =
          stockNames.some((name) => title.includes(name) || content.includes(name)) ||
          isFinanceNews(title)

        if (isRelevant) {
          results.push({
            title,
            content,
            url: item.link,
            source: 'yonhap',
            published_at: pubDate,
          })
        }
      }
    } catch (e) {
      console.error('연합뉴스 RSS 오류:', feed.label, e)
    }
  }

  return deduplicateByUrl(results)
}

function isFinanceNews(title: string): boolean {
  const keywords = [
    '주식', '코스피', '코스닥', '증시', '주가', '매출', '영업이익', '실적',
    '반도체', '배터리', '금리', '환율', '수출', '무역', '산업', '경제',
  ]
  return keywords.some((kw) => title.includes(kw))
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
