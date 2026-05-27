export type Market = 'KOSPI' | 'KOSDAQ' | 'KONEX'
export type Sentiment = 'positive' | 'negative' | 'neutral'
export type CollectionSlot = 'morning' | 'afternoon' | 'closing'
export type AnalysisType = 'morning' | 'afternoon' | 'closing'
export type NewsSource = 'naver' | 'dart' | 'yonhap' | 'finnhub'

export interface Stock {
  id: string
  ticker: string
  name: string
  market: Market
  sector?: string
  dart_code?: string
  created_at: string
}

export interface NewsArticle {
  id: string
  ticker?: string
  title: string
  content?: string
  url?: string
  source: NewsSource
  published_at?: string
  collected_at: string
  collection_slot?: CollectionSlot
  is_relevant: boolean
}

export interface Analysis {
  id: string
  ticker: string
  analysis_type: AnalysisType
  summary?: string
  impact?: string
  prediction?: string
  actual_comparison?: string
  sentiment?: Sentiment
  article_count: number
  created_at: string
}

export interface PriceSnapshot {
  id: string
  ticker: string
  price: number
  change_amount: number
  change_rate: number
  volume?: number
  recorded_at: string
}

export interface RawNewsItem {
  title: string
  content?: string
  url?: string
  source: NewsSource
  published_at?: Date
}
