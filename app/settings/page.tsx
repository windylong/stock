'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, TrendingUp, Plus, Check, Search, X } from 'lucide-react'
import type { Stock } from '@/lib/types'
import { POPULAR_STOCKS, ALL_SECTORS, ALL_MARKETS, filterStocks, type StockInfo } from '@/lib/stock-data'

type Tab = 'watchlist' | 'add'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('watchlist')
  const [watchlist, setWatchlist] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)

  // 관심 종목 추가 탭 필터 상태
  const [query, setQuery] = useState('')
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/stocks')
      if (res.ok) setWatchlist(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWatchlist() }, [])

  const watchedTickers = useMemo(
    () => new Set(watchlist.map((s) => s.ticker)),
    [watchlist]
  )

  const filteredStocks = useMemo(
    () => filterStocks(query, selectedMarkets, selectedSectors),
    [query, selectedMarkets, selectedSectors]
  )

  const toggleFilter = <T extends string>(
    list: T[],
    setList: (v: T[]) => void,
    value: T
  ) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  const handleAdd = async (stock: StockInfo) => {
    setAdding(stock.ticker)
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stock),
      })
      if (res.ok) {
        const added = await res.json()
        setWatchlist((prev) => [...prev, added])
      }
    } finally {
      setAdding(null)
    }
  }

  const handleDelete = async (stock: Stock) => {
    if (!confirm(`${stock.name}을 삭제하시겠습니까?`)) return
    setDeleting(stock.id)
    try {
      const res = await fetch('/api/stocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: stock.id }),
      })
      if (res.ok) setWatchlist((prev) => prev.filter((s) => s.id !== stock.id))
    } finally {
      setDeleting(null)
    }
  }

  const clearFilters = () => {
    setQuery('')
    setSelectedMarkets([])
    setSelectedSectors([])
  }

  const hasFilters = query || selectedMarkets.length > 0 || selectedSectors.length > 0

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} />
          대시보드로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">관심 종목</h1>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-6">
        {([
          { key: 'watchlist', label: `관심 종목 ${watchlist.length > 0 ? `(${watchlist.length})` : ''}` },
          { key: 'add',       label: '관심 종목 추가' },
        ] as { key: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 관심 종목 탭 */}
      {activeTab === 'watchlist' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">불러오는 중...</div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <TrendingUp size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">관심 종목이 없습니다</p>
              <button
                onClick={() => setActiveTab('add')}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus size={15} />
                종목 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlist.map((stock) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                      <TrendingUp size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{stock.name}</p>
                      <p className="text-xs text-gray-400">
                        {stock.ticker} · {stock.market}
                        {stock.sector ? ` · ${stock.sector}` : ''}
                      </p>
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
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 관심 종목 추가 탭 */}
      {activeTab === 'add' && (
        <div className="space-y-5">
          {/* 검색창 */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="종목명 또는 코드 검색 (예: 삼성, 005930)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* 시장 필터 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">시장</p>
            <div className="flex gap-2">
              {ALL_MARKETS.map((market) => (
                <FilterChip
                  key={market}
                  label={market}
                  active={selectedMarkets.includes(market)}
                  onClick={() => toggleFilter(selectedMarkets, setSelectedMarkets, market)}
                />
              ))}
            </div>
          </div>

          {/* 섹터 필터 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">섹터</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SECTORS.map((sector) => (
                <FilterChip
                  key={sector}
                  label={sector}
                  active={selectedSectors.includes(sector)}
                  onClick={() => toggleFilter(selectedSectors, setSelectedSectors, sector)}
                />
              ))}
            </div>
          </div>

          {/* 필터 초기화 + 결과 수 */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {hasFilters
                ? `검색 결과 ${filteredStocks.length}종목`
                : `인기 종목 상위 ${filteredStocks.length}종목`}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <X size={12} />
                필터 초기화
              </button>
            )}
          </div>

          {/* 종목 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredStocks.map((stock) => {
              const isAdded = watchedTickers.has(stock.ticker)
              const isAdding = adding === stock.ticker
              return (
                <div
                  key={stock.ticker}
                  className={`flex items-center justify-between bg-white rounded-xl border px-4 py-3.5 transition-colors ${
                    isAdded ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{stock.name}</p>
                    <p className="text-xs text-gray-400">
                      {stock.ticker} ·{' '}
                      <span className={stock.market === 'KOSPI' ? 'text-blue-500' : 'text-purple-500'}>
                        {stock.market}
                      </span>
                      {stock.sector && ` · ${stock.sector}`}
                    </p>
                  </div>
                  <button
                    onClick={() => !isAdded && handleAdd(stock)}
                    disabled={isAdded || isAdding}
                    className={`ml-3 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isAdded
                        ? 'bg-emerald-100 text-emerald-600 cursor-default'
                        : isAdding
                        ? 'bg-gray-100 text-gray-400 cursor-wait'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {isAdded ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                </div>
              )
            })}
          </div>

          {filteredStocks.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              조건에 맞는 종목이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  )
}
