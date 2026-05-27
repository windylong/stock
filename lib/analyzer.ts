import Anthropic from '@anthropic-ai/sdk'
import type { CollectionSlot, Sentiment } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface AnalysisInput {
  stock: { ticker: string; name: string; sector?: string }
  articles: { title: string; content?: string; source: string; published_at?: string }[]
  slot: CollectionSlot
  previousPrediction?: string
  currentPrice?: { price: number; change_rate: number }
}

interface AnalysisResult {
  summary: string
  impact: string
  prediction?: string
  actual_comparison?: string
  sentiment: Sentiment
}

const SLOT_PROMPTS: Record<CollectionSlot, string> = {
  morning: '오늘 장 시작 전 뉴스 분석입니다. 오늘 주가 방향성을 예측해주세요.',
  afternoon: '장중(오전 9시~오후 2시) 뉴스 분석입니다. 오후 장 방향을 예측해주세요.',
  closing: '종가 분석입니다. 아침/낮의 예측과 실제 주가를 비교 분석해주세요.',
}

export async function analyzeStock(input: AnalysisInput): Promise<AnalysisResult> {
  const { stock, articles, slot, previousPrediction, currentPrice } = input

  const articlesText = articles
    .slice(0, 20)
    .map((a, i) => `[${i + 1}] [${a.source.toUpperCase()}] ${a.title}\n${a.content || ''}`)
    .join('\n\n')

  const closingContext = slot === 'closing' && previousPrediction
    ? `\n\n## 아침/낮 예측\n${previousPrediction}`
    : ''

  const priceContext = currentPrice
    ? `\n\n## 현재 주가\n${stock.name}(${stock.ticker}): ${currentPrice.price.toLocaleString()}원 (${currentPrice.change_rate > 0 ? '+' : ''}${currentPrice.change_rate}%)`
    : ''

  const systemPrompt = `당신은 국내 주식 전문 애널리스트입니다. 뉴스를 분석하여 투자자에게 유용한 인사이트를 제공합니다.
응답은 반드시 아래 JSON 형식으로만 출력하세요. 마크다운 코드블록 없이 순수 JSON만:
{
  "summary": "뉴스 핵심 사실 요약 (3-5문장)",
  "impact": "해당 종목에 대한 영향 분석 (2-3문장)",
  "prediction": "${slot !== 'closing' ? '주가 방향 예측 및 근거 (2-3문장)' : 'null'}",
  "actual_comparison": "${slot === 'closing' ? '예측 대비 실제 결과 비교 분석 (2-3문장)' : 'null'}",
  "sentiment": "positive | negative | neutral"
}`

  const userPrompt = `## 분석 대상
종목: ${stock.name} (${stock.ticker}) | 섹터: ${stock.sector || '미분류'}
분석 유형: ${SLOT_PROMPTS[slot]}${closingContext}${priceContext}

## 수집된 뉴스 (${articles.length}건)
${articlesText || '수집된 뉴스 없음'}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text)

    return {
      summary: parsed.summary || '',
      impact: parsed.impact || '',
      prediction: parsed.prediction !== 'null' ? parsed.prediction : undefined,
      actual_comparison: parsed.actual_comparison !== 'null' ? parsed.actual_comparison : undefined,
      sentiment: (['positive', 'negative', 'neutral'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral') as Sentiment,
    }
  } catch (e) {
    console.error('Claude 분석 오류:', stock.ticker, e)
    return {
      summary: '분석 중 오류가 발생했습니다.',
      impact: '',
      sentiment: 'neutral',
    }
  }
}

export async function analyzeMarketOverview(
  articles: { title: string; content?: string; source: string }[],
  slot: CollectionSlot
): Promise<string> {
  const articlesText = articles
    .slice(0, 15)
    .map((a) => `- [${a.source.toUpperCase()}] ${a.title}`)
    .join('\n')

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `다음 뉴스들을 바탕으로 오늘 국내 주식시장 전반의 핵심 이슈를 3문장으로 요약해주세요.\n분석 시점: ${SLOT_PROMPTS[slot]}\n\n${articlesText}`,
        },
      ],
    })
    return response.content[0].type === 'text' ? response.content[0].text : ''
  } catch {
    return ''
  }
}
