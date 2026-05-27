import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Naver Finance 비공식 API로 실시간 주가 조회
export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'ticker 필수' }, { status: 400 })

  try {
    const res = await fetch(
      `https://api.finance.naver.com/service/itemSummary.nhn?itemcode=${ticker}`,
      {
        headers: {
          Referer: 'https://finance.naver.com',
          'User-Agent': 'Mozilla/5.0 (compatible; StockNewsBot/1.0)',
        },
        next: { revalidate: 60 },
      }
    )

    if (!res.ok) throw new Error('Naver API 오류')
    const data = await res.json()

    if (!data.now) {
      return NextResponse.json({ error: '주가 데이터 없음' }, { status: 404 })
    }

    const price = {
      ticker,
      price: parseFloat(data.now.replace(/,/g, '')),
      change_amount: parseFloat(data.diff?.replace(/,/g, '') || '0'),
      change_rate: parseFloat(data.rate?.replace(/%/g, '').replace(/[+]/g, '') || '0'),
      volume: parseInt(data.quant?.replace(/,/g, '') || '0'),
      name: data.name,
    }

    // DB에도 저장
    const supabase = createAdminClient()
    await supabase.from('price_snapshots').insert({
      ticker: price.ticker,
      price: price.price,
      change_amount: price.change_amount,
      change_rate: price.change_rate,
      volume: price.volume,
    })

    return NextResponse.json(price)
  } catch (e) {
    console.error('주가 조회 오류:', ticker, e)
    return NextResponse.json({ error: '주가 조회 실패' }, { status: 500 })
  }
}
