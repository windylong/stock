'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onAdded: () => void
}

const MARKETS = ['KOSPI', 'KOSDAQ', 'KONEX']
const SECTORS = [
  '전기전자', '반도체', 'IT서비스', '자동차', '화학', '바이오',
  '금융', '에너지', '건설', '유통', '통신', '철강', '기타',
]

export function AddStockModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    ticker: '',
    name: '',
    market: 'KOSPI',
    sector: '',
    dart_code: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.ticker || !form.name) {
      setError('종목코드와 종목명은 필수입니다.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '추가 실패')
      }
      onAdded()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">종목 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종목코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="005930"
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종목명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="삼성전자"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시장</label>
              <select
                value={form.market}
                onChange={(e) => setForm({ ...form, market: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MARKETS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">섹터</label>
              <select
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택</option>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DART 고유번호 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              placeholder="00126380"
              value={form.dart_code}
              onChange={(e) => setForm({ ...form, dart_code: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              DART에서 공시 수집 시 필요.
              <a href="https://dart.fss.or.kr" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">dart.fss.or.kr</a>에서 확인
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '추가 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
