import type { RawNewsItem } from '../types'
import { format } from 'date-fns'

const DART_API_BASE = 'https://opendart.fss.or.kr/api'

interface DartDisclosure {
  corp_name: string
  corp_code: string
  stock_code: string
  report_nm: string
  rcept_no: string
  flr_nm: string
  rcept_dt: string
  rm: string
}

export async function collectDartDisclosures(
  stocks: { ticker: string; name: string; dart_code?: string }[],
  since?: Date
): Promise<RawNewsItem[]> {
  const apiKey = process.env.DART_API_KEY
  if (!apiKey) {
    console.warn('DART_API_KEY 없음 - DART 수집 건너뜀')
    return []
  }

  const results: RawNewsItem[] = []
  const today = format(new Date(), 'yyyyMMdd')
  const fromDate = since ? format(since, 'yyyyMMdd') : today

  for (const stock of stocks) {
    try {
      const params = new URLSearchParams({
        crtfc_key: apiKey,
        bgn_de: fromDate,
        end_de: today,
        last_reprt_at: 'N',
        pblntf_ty: 'A',  // 정기공시
        page_count: '20',
      })

      if (stock.dart_code) {
        params.set('corp_code', stock.dart_code)
      } else {
        params.set('stock_code', stock.ticker)
      }

      const res = await fetch(`${DART_API_BASE}/list.json?${params}`)
      if (!res.ok) continue

      const data = await res.json()
      if (data.status !== '000' || !data.list) continue

      for (const item of data.list as DartDisclosure[]) {
        const pubDate = parseDartDate(item.rcept_dt)
        results.push({
          title: `[${item.corp_name}] ${item.report_nm}`,
          content: `제출인: ${item.flr_nm}${item.rm ? ` / ${item.rm}` : ''}`,
          url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
          source: 'dart',
          published_at: pubDate,
        })
      }
    } catch (e) {
      console.error('DART 수집 오류:', stock.ticker, e)
    }
  }

  return results
}

function parseDartDate(dateStr: string): Date {
  // DART 날짜 형식: YYYYMMDD
  const y = dateStr.slice(0, 4)
  const m = dateStr.slice(4, 6)
  const d = dateStr.slice(6, 8)
  return new Date(`${y}-${m}-${d}T09:00:00+09:00`)
}
