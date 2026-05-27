'use client'

import { useState, useEffect } from 'react'
import { AddStockModal } from '@/components/AddStockModal'
import { Plus, Trash2, TrendingUp, BarChart2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Stock } from '@/lib/types'

export default function SettingsPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchStocks = async () => {
    try {
      const res = await fetch('/api/stocks')
      if (res.ok) setStocks(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStocks() }, [])

  const handleDelete = async (stock: Stock) => {
    if (!confirm(`${stock.name}(${stock.ticker})을 삭제하시겠습니까?`)) return
    setDeleting(stock.id)
    try {
      const res = await fetch('/api/stocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: stock.id }),
      })
      if (res.ok) setStocks((prev) => prev.filter((s) => s.id !== stock.id))
    } finally {
      setDeleting(null)
    }
  }

  const groupedByMarket = stocks.reduce((acc, stock) => {
    const market = stock.market || 'KOSPI'
    if (!acc[market]) acc[market] = []
    acc[market].push(stock)
    return acc
  }, {} as Record<string, Stock[]>)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} />
          대시보드로
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">관심 종목 관리</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} />
            종목 추가
          </button>
        </div>
      </div>

      {/* API 설정 안내 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-800 mb-2">⚙️ 환경변수 설정 필요</h3>
        <div className="text-sm text-amber-700 space-y-1">
          <p>· <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> / <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></p>
          <p>· <code className="bg-amber-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> — DB 쓰기 권한</p>
          <p>· <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> — Claude AI 분석</p>
          <p>· <code className="bg-amber-100 px-1 rounded">DART_API_KEY</code> — 공시 수집 (선택)</p>
          <p>· <code className="bg-amber-100 px-1 rounded">FINNHUB_API_KEY</code> — 해외 섹터 뉴스 (선택)</p>
          <p>· <code className="bg-amber-100 px-1 rounded">COLLECT_SECRET</code> — GitHub Actions 인증</p>
        </div>
        <p className="text-xs text-amber-600 mt-2">
          <code>.env.local.example</code>을 복사해 <code>.env.local</code>에 값을 입력하세요.
        </p>
      </div>

      {/* 종목 목록 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : stocks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <BarChart2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">관심 종목을 추가해보세요</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={15} />
            첫 종목 추가
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByMarket).map(([market, marketStocks]) => (
            <div key={market} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700 text-sm">{market}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {marketStocks.map((stock) => (
                  <div key={stock.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{stock.name}</p>
                        <p className="text-xs text-gray-400">{stock.ticker}{stock.sector ? ` · ${stock.sector}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/stocks/${stock.ticker}`}
                        className="text-xs text-blue-600 hover:underline px-2 py-1"
                      >
                        분석 보기
                      </Link>
                      <button
                        onClick={() => handleDelete(stock)}
                        disabled={deleting === stock.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-sm text-gray-400 text-center">총 {stocks.length}종목 관리 중</p>
        </div>
      )}

      {showModal && (
        <AddStockModal onClose={() => setShowModal(false)} onAdded={fetchStocks} />
      )}
    </div>
  )
}
