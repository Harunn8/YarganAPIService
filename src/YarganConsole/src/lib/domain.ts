import type { CommunicationData, PagDeviceResponse, SatellitePassResponse } from '../api/types'
import { parseLocal } from './time'

export const passStatusLabel: Record<number, string> = {
  0: 'Takip seçildi',
  1: 'Sırada',
  2: 'Takipte',
  3: 'Tamamlandı',
  4: 'Başarısız',
  5: 'İptal',
  6: 'Atlandı',
}

/** Geçiş şeridinin rengi: canlı = mint, sorunlu = rose, geçmiş = soluk buff */
export function passTone(p: SatellitePassResponse, now: number): string {
  if (p.status === 2) return 'strip pass live'
  if (p.status === 4 || p.status === 6 || p.status === 5) return 'strip pass fault'
  const los = parseLocal(p.los)?.getTime() ?? 0
  if (los < now || p.status === 3) return 'strip pass muted-strip'
  return 'strip pass'
}

export function parseComm(raw: string | null | undefined): CommunicationData {
  if (!raw) return {}
  try {
    const v = JSON.parse(raw)
    return v && typeof v === 'object' ? (v as CommunicationData) : {}
  } catch {
    return {}
  }
}

export const commLabel = (t: number) => ['SNMP', 'TCP', 'UDP', 'Ping'][t] ?? '?'

export const isMaint = (d: PagDeviceResponse) => Boolean(d.inMaintenance ?? d.inMaitenance)

/** TLE satırı checksum doğrulaması (mod 10, '-' = 1). */
export function tleChecksumOk(line: string): boolean {
  if (line.length < 69) return false
  let sum = 0
  for (const ch of line.slice(0, 68)) {
    if (ch >= '0' && ch <= '9') sum += Number(ch)
    else if (ch === '-') sum += 1
  }
  return sum % 10 === Number(line[68])
}

/** "AD\n1 ...\n2 ..." biçimindeki yapıştırılmış metni TLE kayıtlarına böler. */
export function parseTleBlock(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim())
  const out: { satelliteName: string; line1: string; line2: string; valid: boolean }[] = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.startsWith('1 ') && lines[i + 1]?.startsWith('2 ')) {
      const prev = i > 0 && !lines[i - 1].startsWith('2 ') && !lines[i - 1].startsWith('1 ') ? lines[i - 1].trim() : `Uydu ${out.length + 1}`
      const line1 = l.trim()
      const line2 = lines[i + 1].trim()
      out.push({ satelliteName: prev.replace(/^0 /, ''), line1, line2, valid: tleChecksumOk(line1) && tleChecksumOk(line2) })
      i++
    }
  }
  return out
}
