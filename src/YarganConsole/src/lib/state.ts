import { useSyncExternalStore } from 'react'

export type ViewId = 'serit' | 'saha' | 'otomasyon' | 'istasyon' | 'ekip'
export const views: { id: ViewId; label: string; hint: string }[] = [
  { id: 'serit', label: 'Zaman şeridi', hint: 'Geçişler, görevler ve olaylar tek eksende' },
  { id: 'saha', label: 'Saha', hint: "PAG'ler ve cihazlar" },
  { id: 'otomasyon', label: 'Otomasyon', hint: 'Scriptler ve cron politikaları' },
  { id: 'istasyon', label: 'İstasyon', hint: 'Konum, TLE ve geçiş hesaplama' },
  { id: 'ekip', label: 'Ekip', hint: 'Kullanıcılar' },
]

export type Selection =
  | { kind: 'pass'; id: string }
  | { kind: 'predicted'; key: string }
  | { kind: 'cron'; id: string }
  | { kind: 'script'; id: string }
  | { kind: 'pagDevice'; id: string }
  | { kind: 'device'; id: string }
  | { kind: 'event'; id: number }
  | null

interface UiState {
  view: ViewId
  selection: Selection
  /** Zaman şeridinin odak anı (ms); null = şimdiyi takip et */
  focusAt: number | null
}

const initialView = (location.hash.replace('#', '') as ViewId) || 'serit'
let state: UiState = { view: views.some((v) => v.id === initialView) ? initialView : 'serit', selection: null, focusAt: null }
const listeners = new Set<() => void>()

export function setUi(patch: Partial<UiState>) {
  state = { ...state, ...patch }
  if (patch.view) history.replaceState(null, '', `#${patch.view}`)
  listeners.forEach((l) => l())
}
export const select = (selection: Selection) => setUi({ selection })
export const goto = (view: ViewId) => setUi({ view })
export const getUi = () => state

export const useUi = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
