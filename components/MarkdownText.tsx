'use client'

interface Props {
  text: string
  className?: string
}

// 마크다운을 읽기 좋은 plain text로 변환
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')          // 헤딩 제거
    .replace(/\*\*(.+?)\*\*/g, '$1')    // 볼드 제거
    .replace(/\*(.+?)\*/g, '$1')        // 이탤릭 제거
    .replace(/^\|.*/gm, '')              // 테이블 행 제거 (| 로 시작하는 줄)
    .replace(/^[-*+]\s+/gm, '• ')       // 리스트 bullet 통일
    .replace(/^\d+\.\s+/gm, '')         // 숫자 리스트 제거
    .replace(/^---+$/gm, '')            // 수평선 제거
    .replace(/\n{3,}/g, '\n\n')         // 연속 빈 줄 정리
    .trim()
}

export function MarkdownText({ text, className = '' }: Props) {
  const lines = stripMarkdown(text).split('\n').filter(Boolean)

  return (
    <div className={className}>
      {lines.map((line, i) => (
        <p key={i} className="leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  )
}
