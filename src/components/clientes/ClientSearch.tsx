'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Search } from 'lucide-react'

export function ClientSearch({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  return (
    <div style={{ position: 'relative' }}>
      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      <input
        defaultValue={defaultValue}
        placeholder="Buscar clientes..."
        onChange={e => {
          const q = e.target.value
          startTransition(() => {
            if (q) router.push(`${pathname}?q=${encodeURIComponent(q)}`)
            else router.push(pathname)
          })
        }}
        style={{ paddingLeft: '30px', width: '220px' }}
        className="input-base"
      />
    </div>
  )
}
