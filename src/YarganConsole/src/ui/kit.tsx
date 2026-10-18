import { useQueryClient } from '@tanstack/react-query'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { errorMessage } from '../api/http'
import { logAction, logError } from '../lib/events'

// ------------------------------------------------------------------ geri bildirim satırı

type Flash = { text: string; error: boolean; id: number } | null
let flash: Flash = null
let flashTimer: ReturnType<typeof setTimeout> | undefined
const flashListeners = new Set<() => void>()
export function showFlash(text: string, error = false) {
  flash = { text, error, id: Date.now() }
  flashListeners.forEach((l) => l())
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flash = null
    flashListeners.forEach((l) => l())
  }, error ? 7000 : 3500)
}
export const useFlash = () =>
  useSyncExternalStore(
    (l) => {
      flashListeners.add(l)
      return () => flashListeners.delete(l)
    },
    () => flash,
  )

/**
 * Bir API işlemini çalıştırır: sonucu olay günlüğüne yazar, geri bildirim gösterir,
 * verilen sorguları tazeler. Hata olursa mesajı döndürür, fırlatmaz.
 */
export function useAction() {
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const run = useCallback(
    async <T,>(label: string, fn: () => Promise<T>, invalidate: (readonly string[])[] = []): Promise<T | undefined> => {
      setBusy(true)
      try {
        const result = await fn()
        logAction(label)
        showFlash(label)
        await Promise.all(invalidate.map((queryKey) => qc.invalidateQueries({ queryKey })))
        return result
      } catch (error) {
        const msg = `${label} başarısız: ${errorMessage(error)}`
        logError(msg)
        showFlash(msg, true)
        return undefined
      } finally {
        setBusy(false)
      }
    },
    [qc],
  )
  return { run, busy }
}

// ------------------------------------------------------------------ temel parçalar

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'danger' | 'quiet'
  small?: boolean
}
export function Button({ variant, small, className = '', type = 'button', ...rest }: BtnProps) {
  return <button type={type} className={`btn ${variant ?? ''} ${small ? 'small' : ''} ${className}`} {...rest} />
}

export function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`field ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function Cell({ k, v, big, grow, title }: { k?: string; v: ReactNode; big?: boolean; grow?: boolean; title?: string }) {
  return (
    <div className={`cell ${grow ? 'grow' : ''}`} title={title}>
      {k && <span className="k">{k}</span>}
      <span className={`v ${big ? 'big' : ''}`}>{v}</span>
    </div>
  )
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <p>{children}</p>
      {action}
    </div>
  )
}

export function Sheet({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className={`sheet ${wide ? 'wide' : ''}`} onClose={onClose} onCancel={onClose}>
      {open && (
        <>
          <div className="sheet-head">
            <h2>{title}</h2>
            <Button variant="quiet" small onClick={onClose} aria-label="Kapat">
              Kapat
            </Button>
          </div>
          <div className="sheet-body">{children}</div>
        </>
      )}
    </dialog>
  )
}

/** Silme gibi geri alınamayan işlemler için onay penceresi. */
export function useConfirm() {
  const [state, setState] = useState<{ text: string; resolve: (ok: boolean) => void } | null>(null)
  const ask = (text: string) => new Promise<boolean>((resolve) => setState({ text, resolve }))
  const close = (ok: boolean) => {
    state?.resolve(ok)
    setState(null)
  }
  const node = (
    <Sheet open={!!state} title="Emin misin?" onClose={() => close(false)}>
      <p>{state?.text}</p>
      <div className="form-actions">
        <Button onClick={() => close(false)}>Vazgeç</Button>
        <Button variant="danger" onClick={() => close(true)} autoFocus>
          Sil
        </Button>
      </div>
    </Sheet>
  )
  return { ask, node }
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Loading({ what }: { what: string }) {
  return <p className="muted">{what} yükleniyor…</p>
}

export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="notice warn">
      {errorMessage(error)} {onRetry && <Button small onClick={onRetry}>Tekrar dene</Button>}
    </div>
  )
}
