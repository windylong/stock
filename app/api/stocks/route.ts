import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .order('market')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ticker, name, market, sector, dart_code } = body

  if (!ticker || !name) {
    return NextResponse.json({ error: '종목코드와 종목명은 필수입니다.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('stocks')
    .insert({ ticker: ticker.trim(), name: name.trim(), market, sector, dart_code })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id 필수' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('stocks').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
