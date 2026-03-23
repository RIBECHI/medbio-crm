import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const supabase = createServerClient()

  const { data: settings } = await supabase.from('settings').select('automation_key').eq('id', 'general').single()
  if (!apiKey || apiKey !== settings?.automation_key) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let body: any
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }

  const { campo, valor } = body
  if (!campo || valor === undefined) {
    return NextResponse.json({ error: 'Campos "campo" e "valor" são obrigatórios.' }, { status: 400 })
  }

  const { error } = await supabase.from('ai_training')
    .upsert({ campo, valor, updated_at: new Date().toISOString() }, { onConflict: 'campo' })

  if (error) return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 })
  return NextResponse.json({ success: true, campo, message: `Campo "${campo}" atualizado.` })
}

export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const supabase = createServerClient()

  const { data: settings } = await supabase.from('settings').select('automation_key').eq('id', 'general').single()
  if (!apiKey || apiKey !== settings?.automation_key) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { data } = await supabase.from('ai_training').select('*')
  const training = Object.fromEntries((data || []).map(r => [r.campo, r.valor]))
  return NextResponse.json({ training })
}
