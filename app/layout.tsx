import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { BarChart2, Settings } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '국내 주식 뉴스 분석 | StockLens AI',
  description: '종목별 뉴스 수집 및 Claude AI 분석 대시보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
                <BarChart2 size={20} className="text-blue-600" />
                <span>StockLens</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">AI</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings size={15} />
                <span className="hidden sm:inline">관심 종목 관리</span>
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
