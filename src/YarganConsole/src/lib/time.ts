// Backend saatleri saat dilimi olmadan, istasyonun yerel saatiyle gelir ("timestamp without time zone").
// Tarayıcı aynı saat diliminde olduğu sürece yerel saat olarak okumak doğrudur.
export const parseLocal = (s: string | null | undefined): Date | null => {
  if (!s) return null
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : s.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

export const toLocalIso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** <input type="datetime-local"> değeri */
export const toInput = (d: Date) => toLocalIso(d).slice(0, 16)

const two = (n: number) => String(n).padStart(2, '0')
export const hhmm = (d: Date) => `${two(d.getHours())}:${two(d.getMinutes())}`
export const hhmmss = (d: Date) => `${hhmm(d)}:${two(d.getSeconds())}`
export const utcHhmmss = (d: Date) => `${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())}`

const fmtDay = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })
export const dayLabel = (d: Date) => fmtDay.format(d)
const fmtFull = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const fullLabel = (d: Date | null) => (d ? fmtFull.format(d) : '—')

/** 3 sa 12 dk / 4 dk 05 sn / 12 sn */
export function span(ms: number): string {
  const s = Math.max(0, Math.round(Math.abs(ms) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h} sa ${two(m)} dk`
  if (m > 0) return `${m} dk ${two(sec)} sn`
  return `${sec} sn`
}

export function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`
}

export const relative = (d: Date, now = Date.now()) => {
  const diff = d.getTime() - now
  return diff >= 0 ? `${span(diff)} sonra` : `${span(diff)} önce`
}
