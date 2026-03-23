'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle, AlertTriangle, Loader2, Download, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'

type Row = Record<string, string>
type ImportResult = { success: number; errors: string[] }

function mapCliente(row: Row) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase())
      if (found && row[found]?.trim()) return row[found].trim()
    }
    return null
  }
  return {
    display_name: get('nome', 'name', 'display_name', 'cliente', 'nome completo') || '',
    email:        get('email', 'e-mail') || null,
    phone:        get('telefone', 'phone', 'fone', 'celular', 'whatsapp') || null,
    cpf:          get('cpf') || null,
    dob:          get('nascimento', 'dob', 'data de nascimento', 'data nascimento') || null,
    address:      get('endereco', 'endereço', 'address') || null,
    notes:        get('observacoes', 'observações', 'notes', 'obs') || null,
  }
}

function mapLead(row: Row) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase())
      if (found && row[found]?.trim()) return row[found].trim()
    }
    return null
  }
  return {
    name:            get('nome', 'name', 'lead', 'nome completo') || '',
    email:           get('email', 'e-mail') || null,
    phone:           get('telefone', 'phone', 'celular', 'whatsapp') || null,
    source:          get('origem', 'source', 'canal') || 'Importação',
    status:          get('status', 'etapa', 'stage') || 'Novo Lead',
    owner:           get('responsavel', 'responsável', 'owner') || 'Não atribuído',
    potential_value: parseFloat(get('valor', 'value', 'potential_value', 'valor potencial') || '0') || 0,
    notes:           get('observacoes', 'observações', 'notes', 'obs') || null,
  }
}

export default function ImportarPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<'clientes' | 'leads'>('clientes')
  const [preview, setPreview] = useState<Row[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: Row[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
    setPreview(rows.slice(0, 5))
    setStep('preview')
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setLoading(true)
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: Row[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
    let success = 0
    const errors: string[] = []
    const BATCH = 50
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      if (type === 'clientes') {
        const records = batch.map(mapCliente).filter(r => r.display_name)
        if (!records.length) continue
        const { error } = await supabase.from('clients').insert(records)
        if (error) errors.push(`Linhas ${i+1}-${i+batch.length}: ${error.message}`)
        else success += records.length
      } else {
        const records = batch.map(mapLead).filter(r => r.name)
        if (!records.length) continue
        const { error } = await supabase.from('leads').insert(records)
        if (error) errors.push(`Linhas ${i+1}-${i+batch.length}: ${error.message}`)
        else success += records.length
      }
    }
    setResult({ success, errors })
    setLoading(false)
    setStep('done')
  }

  function downloadTemplate() {
    const run = async () => {
      const XLSX = await import('xlsx')
      const cols = type === 'clientes'
        ? [['Nome','Email','Telefone','CPF','Nascimento','Endereço','Observações'],
           ['Maria da Silva','maria@email.com','44999990000','000.000.000-00','1990-05-15','Rua das Flores, 123','Cliente VIP']]
        : [['Nome','Email','Telefone','Origem','Status','Valor Potencial','Observações'],
           ['Ana Lima','ana@email.com','44988880000','WhatsApp','Novo Lead','500','Interesse em botox']]
      const ws = XLSX.utils.aoa_to_sheet(cols)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, type === 'clientes' ? 'Clientes' : 'Leads')
      XLSX.writeFile(wb, `modelo_${type}.xlsx`)
    }
    run()
  }

  function reset() {
    setStep('upload'); setPreview([]); setFileName(''); setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const headers = preview[0] ? Object.keys(preview[0]) : []

  return (
    <div style={{ padding:'2rem', maxWidth:'820px' }}>
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2.2rem', fontWeight:300, color:'#f0ebe0' }}>Importar Dados</h1>
        <div style={{ height:'1px', marginTop:'0.5rem', width:'120px', background:'linear-gradient(90deg, rgba(201,147,24,0.4), transparent)' }} />
        <p style={{ marginTop:'0.75rem', fontSize:'13px', color:'#9a9080', maxWidth:'480px' }}>
          Importe clientes ou leads a partir de uma planilha Excel (.xlsx) ou CSV.
        </p>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'1.5rem' }}>
        {(['clientes','leads'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); reset() }}
            style={{ padding:'8px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:500, background: type===t ? 'var(--gold)' : 'rgba(255,255,255,0.05)', color: type===t ? '#0d0d0d' : '#9a9080', transition:'all .15s' }}>
            {t === 'clientes' ? 'Clientes' : 'Leads'}
          </button>
        ))}
        <button onClick={downloadTemplate} className="btn-ghost" style={{ marginLeft:'auto', fontSize:'12px', gap:'6px' }}>
          <Download size={13} />Baixar modelo {type}
        </button>
      </div>

      {step === 'upload' && (
        <div className="card">
          <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', padding:'3rem 2rem', cursor:'pointer', borderRadius:'0.75rem', border:'2px dashed rgba(201,147,24,0.2)', transition:'border-color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(201,147,24,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(201,147,24,0.2)')}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(201,147,24,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileSpreadsheet size={24} style={{ color:'var(--gold)' }} />
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'14px', fontWeight:500, color:'#f0ebe0', marginBottom:'4px' }}>Clique para selecionar a planilha</div>
              <div style={{ fontSize:'12px', color:'#7a7060' }}>Excel (.xlsx) ou CSV</div>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display:'none' }} />
          </label>
        </div>
      )}

      {step === 'preview' && preview.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="card" style={{ padding:'1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
              <div>
                <div style={{ fontSize:'13px', fontWeight:500, color:'#f0ebe0' }}>{fileName}</div>
                <div style={{ fontSize:'12px', color:'#9a9080', marginTop:'2px' }}>Prévia das primeiras 5 linhas</div>
              </div>
              <button onClick={reset} style={{ background:'none', border:'none', color:'#7a7060', cursor:'pointer', fontSize:'12px' }}>Trocar arquivo</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="table-base">
                <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>{headers.map(h => <td key={h} style={{ color:'#c8c0b0', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row[h]||'—'}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ padding:'10px 14px', background:'rgba(201,147,24,0.06)', border:'1px solid rgba(201,147,24,0.15)', borderRadius:'8px', fontSize:'12px', color:'#a09080' }}>
            <strong style={{ color:'var(--gold)', display:'block', marginBottom:'3px' }}>Mapeamento automático de colunas</strong>
            {type === 'clientes' ? 'Detecta: Nome / Email / Telefone / CPF / Nascimento / Endereço / Observações'
              : 'Detecta: Nome / Email / Telefone / Origem / Status / Valor Potencial / Observações'}
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button onClick={reset} className="btn-ghost">Cancelar</button>
            <button onClick={handleImport} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} />Importando...</> : <><Upload size={14} />Confirmar importação</>}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {result.success > 0 && (
            <div style={{ padding:'1.25rem 1.5rem', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:'10px', display:'flex', alignItems:'center', gap:'12px' }}>
              <CheckCircle size={20} style={{ color:'#34d399', flexShrink:0 }} />
              <div>
                <div style={{ fontSize:'14px', fontWeight:500, color:'#34d399' }}>{result.success} {type === 'clientes' ? 'cliente(s)' : 'lead(s)'} importado(s) com sucesso!</div>
                <div style={{ fontSize:'12px', color:'#9a9080', marginTop:'2px' }}>Disponíveis imediatamente no sistema.</div>
              </div>
            </div>
          )}
          {result.errors.length > 0 && (
            <div style={{ padding:'1.25rem 1.5rem', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <AlertTriangle size={16} style={{ color:'#f87171' }} />
                <span style={{ fontSize:'13px', fontWeight:500, color:'#f87171' }}>{result.errors.length} erro(s)</span>
              </div>
              {result.errors.map((err, i) => <div key={i} style={{ fontSize:'12px', color:'#9a9080', padding:'4px 0', borderTop:'1px solid rgba(239,68,68,0.1)' }}>{err}</div>)}
            </div>
          )}
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button onClick={reset} className="btn-ghost">Importar mais</button>
            <Link href={`/${type}`} className="btn-primary" style={{ textDecoration:'none' }}>Ver {type === 'clientes' ? 'clientes' : 'leads'} →</Link>
          </div>
        </div>
      )}

      <div className="card" style={{ padding:'1.5rem', marginTop:'2rem' }}>
        <div style={{ fontSize:'11px', fontWeight:500, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--gold)', marginBottom:'1rem' }}>Como exportar do Firebase</div>
        {['Acesse console.firebase.google.com → seu projeto → Firestore Database',
          'Clique na coleção "clients" ou "leads" no painel esquerdo',
          'Use a extensão "Export Firestore to CSV" do Chrome ou Firebase CLI',
          'Salve como .xlsx ou .csv com campos: Nome, Email, Telefone, etc.',
          'Faça upload aqui — o sistema mapeia as colunas automaticamente.'
        ].map((s, i) => (
          <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start', padding:'6px 0', borderTop: i>0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(201,147,24,0.1)', border:'1px solid rgba(201,147,24,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:600, color:'var(--gold)', flexShrink:0, marginTop:'1px' }}>{i+1}</div>
            <div style={{ fontSize:'12px', color:'#9a9080', lineHeight:1.5 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
