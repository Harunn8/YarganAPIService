import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { passApi } from '../api/api'
import type { CronPolicyResponse, SatellitePassResponse } from '../api/types'
import { runsBetween } from '../lib/cron'
import { passStatusLabel, passTone } from '../lib/domain'
import { useEvents } from '../lib/events'
import { useNow, useStored } from '../lib/hooks'
import { keys, useActiveCrons, useCrons, usePasses, usePredicted, useTle } from '../lib/queries'
import { select, setUi, useUi, type Selection } from '../lib/state'
import { countdown, dayLabel, hhmm, hhmmss, parseLocal, relative, span } from '../lib/time'
import { Button, Cell, Empty, QueryError, Seg, useAction } from '../ui/kit'

const HOUR = 3600_000
const spans = [
  { id: '3', label: '3 sa' },
  { id: '6', label: '6 sa' },
  { id: '12', label: '12 sa' },
  { id: '24', label: '24 sa' },
  { id: '72', label: '3 gün' },
] as const
type SpanId = (typeof spans)[number]['id']

interface Placed<T> {
  item: T
  start: number
  end: number
  row: number
}

/** Çakışan aralıkları alt alta dizer; satır > 0 ise öncekilerle çakışıyor demektir. */
function stack<T>(items: { item: T; start: number; end: number }[], gapMs = 0): Placed<T>[] {
  const rowsEnd: number[] = []
  return items
    .sort((a, b) => a.start - b.start)
    .map((it) => {
      let row = rowsEnd.findIndex((end) => end + gapMs <= it.start)
      if (row === -1) row = rowsEnd.length
      rowsEnd[row] = it.end
      return { ...it, row }
    })
}

const sameSel = (a: Selection, b: Selection) => JSON.stringify(a) === JSON.stringify(b)

export default function TimelineView() {
  const now = useNow(1000)
  const ui = useUi()
  const [spanId, setSpanId] = useStored<SpanId>('yc.span', window.innerWidth < 700 ? '3' : '6')
  const spanMs = Number(spanId) * HOUR
  const passes = usePasses()
  const predicted = usePredicted()
  const crons = useCrons()
  const active = useActiveCrons()
  const tle = useTle()
  const { events } = useEvents()
  const { run, busy } = useAction()
  const [lastScheduler, setLastScheduler] = useStored<{ on: boolean; at: string } | null>('yc.scheduler', null)

  // görünür pencere: odak anı soldan %22'de durur, geleceğe daha çok yer kalır
  const focus = ui.focusAt ?? now.getTime()
  const from = focus - spanMs * 0.22
  const to = from + spanMs

  const bodyRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const x = (t: number) => ((t - from) / spanMs) * width

  // sürükleyerek kaydırma
  const drag = useRef<{ x: number; focus: number } | null>(null)
  const onDown = (e: RPointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    drag.current = { x: e.clientX, focus }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: RPointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    setUi({ focusAt: drag.current.focus - (dx / width) * spanMs })
  }
  const onUp = () => (drag.current = null)

  const setup = (tle.data?.setupInterval ?? 0) * 1000
  const passList = passes.data ?? []
  const placedPasses = useMemo(
    () =>
      stack(
        passList
          .map((p) => ({ item: p, start: parseLocal(p.aos)?.getTime() ?? 0, end: parseLocal(p.los)?.getTime() ?? 0 }))
          .filter((p) => p.end >= from - HOUR && p.start <= to + HOUR),
        setup,
      ),
    [passList, from, to, setup],
  )
  const placedPredicted = useMemo(
    () =>
      stack(
        (predicted.data ?? [])
          .map((p) => ({ item: p, start: parseLocal(p.aos)?.getTime() ?? 0, end: parseLocal(p.los)?.getTime() ?? 0 }))
          .filter((p) => p.end >= from && p.start <= to)
          // planlanmış bir geçişle aynı olanları gösterme
          .filter((p) => !passList.some((q) => q.name === p.item.name && Math.abs((parseLocal(q.aos)?.getTime() ?? 0) - p.start) < 60_000)),
      ),
    [predicted.data, passList, from, to],
  )

  const cronList = crons.data ?? []
  const cronBars = useMemo(
    () =>
      stack(
        cronList
          .filter((c) => c.forOnce || !c.cronFormat)
          .map((c) => {
            const start = parseLocal(c.startAt)?.getTime() ?? 0
            const end = parseLocal(c.endAt)?.getTime() ?? start + 5 * 60_000
            return { item: c, start, end: Math.max(end, start + 60_000) }
          })
          .filter((c) => c.end >= from && c.start <= to),
      ),
    [cronList, from, to],
  )
  const cronDots = useMemo(() => {
    const out: { c: CronPolicyResponse; t: number; lane: number }[] = []
    cronList
      .filter((c) => !c.forOnce && c.cronFormat)
      .forEach((c, lane) => runsBetween(c, new Date(from), new Date(to), 300).forEach((d) => out.push({ c, t: d.getTime(), lane })))
    return out
  }, [cronList, from, to])
  const recurring = cronList.filter((c) => !c.forOnce && c.cronFormat)

  const visibleEvents = events.filter((e) => e.at.getTime() >= from && e.at.getTime() <= to)

  // cetvel çizgileri
  // etiketler arasında en az ~64 px kalacak en küçük adım
  const tickStep = [15, 30, 60, 120, 180, 360, 720, 1440].map((m) => m * 60_000).find((st) => (st / spanMs) * width >= 64) ?? 24 * HOUR
  const ticks: number[] = []
  const firstTick = Math.ceil(from / tickStep) * tickStep
  for (let t = firstTick; t <= to; t += tickStep) ticks.push(t)

  const upcoming = passList
    .filter((p) => (parseLocal(p.los)?.getTime() ?? 0) >= now.getTime() && p.status !== 5)
    .sort((a, b) => a.aos.localeCompare(b.aos))
  const nextPass = upcoming.find((p) => (parseLocal(p.aos)?.getTime() ?? 0) > now.getTime())
  const rowsP = Math.max(1, ...placedPasses.map((p) => p.row + 1))
  const rowsPred = Math.max(1, ...placedPredicted.map((p) => p.row + 1))
  const rowsC = Math.max(1, ...cronBars.map((p) => p.row + 1)) + (recurring.length ? 1 : 0)

  const scheduler = (on: boolean) =>
    run(on ? 'Otomatik planlayıcı başlatıldı' : 'Otomatik planlayıcı durduruldu', async () => {
      const ok = await passApi.autoSchedule(on)
      if (!ok && on) throw new Error('planlanacak "takip seçildi" durumunda gelecek geçiş yok')
      setLastScheduler({ on, at: new Date().toISOString() })
      return ok
    }, [keys.passes, keys.crons, keys.scripts])

  const pick = (s: Selection) => select(sameSel(ui.selection, s) ? null : s)

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>Zaman şeridi</h2>
          <p>
            Geçişler, görevler ve istasyon olayları aynı eksende. Şeridi sürükleyerek kaydır.
            {ui.focusAt !== null && <> Şu an {relative(new Date(focus), now.getTime())} bakıyorsun.</>}
          </p>
        </div>
        <div className="toolbar">
          <Seg label="Pencere" value={spanId} options={[...spans]} onChange={setSpanId} />
          <Button small onClick={() => setUi({ focusAt: focus - spanMs / 2 })} aria-label="Geri">‹</Button>
          <Button small onClick={() => setUi({ focusAt: null })} disabled={ui.focusAt === null}>Şimdi</Button>
          <Button small onClick={() => setUi({ focusAt: focus + spanMs / 2 })} aria-label="İleri">›</Button>
        </div>
      </div>

      {passes.error && <QueryError error={passes.error} onRetry={() => passes.refetch()} />}

      <div className="tape" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="lane" style={{ minHeight: 0 }}>
          <div className="lane-label" style={{ justifyContent: 'center' }}>
            <span>{dayLabel(new Date(focus))}</span>
          </div>
          <div className="tape-ruler" ref={bodyRef}>
            {ticks.map((t) => {
              const d = new Date(t)
              const major = d.getHours() === 0 && d.getMinutes() === 0
              return (
                <div key={t} className={`tick ${major ? 'major' : ''}`} style={{ left: x(t) }}>
                  {major && <span className="day">{dayLabel(d)}</span>}
                  {hhmm(d)}
                </div>
              )
            })}
            <NowLine left={x(now.getTime())} label={hhmmss(now)} width={width} />
          </div>
        </div>

        <div className="lanes">
          <Lane title="Planlı geçişler" sub={`${passList.length} kayıt`} rows={rowsP} ticks={ticks} x={x} nowX={x(now.getTime())} width={width}>
            {placedPasses.map(({ item: p, start, end, row }) => (
              <TapeStrip key={p.id} className={passTone(p, now.getTime())} left={x(start)} w={x(end) - x(start)} row={row}
                k={`${hhmm(new Date(start))}${p.isImportant ? ' öncelikli' : ''}${row > 0 ? ' çakışma' : ''}`} v={p.name}
                extra={{ k: passStatusLabel[p.status], v: `${Math.round(p.duration)} dk` }}
                title={`${p.name} ${hhmm(new Date(start))}–${hhmm(new Date(end))} ${passStatusLabel[p.status]}${row > 0 ? ' (çakışma)' : ''}`}
                selected={sameSel(ui.selection, { kind: 'pass', id: p.id })} onClick={() => pick({ kind: 'pass', id: p.id })} />
            ))}
          </Lane>
          <Lane title="TLE tahmini" sub="Planlanmamış geçişler" rows={rowsPred} ticks={ticks} x={x} nowX={x(now.getTime())} width={width}>
            {placedPredicted.map(({ item: p, start, end, row }) => {
              const key = `${p.name}|${p.aos}`
              return (
                <TapeStrip key={key} className="strip pass ghost" left={x(start)} w={x(end) - x(start)} row={row} k={hhmm(new Date(start))} v={p.name}
                  title={`${p.name} ${hhmm(new Date(start))}–${hhmm(new Date(end))}, planlanmamış`}
                  selected={sameSel(ui.selection, { kind: 'predicted', key })} onClick={() => pick({ kind: 'predicted', key })} />
              )
            })}
          </Lane>
          <Lane title="Görevler" sub={`${cronList.length} politika`} rows={rowsC} ticks={ticks} x={x} nowX={x(now.getTime())} width={width}>
            {cronBars.map(({ item: c, start, end, row }) => (
              <TapeStrip key={c.id} className={`strip job ${c.isRunning ? '' : 'muted-strip'}`} left={x(start)} w={x(end) - x(start)} row={row}
                k={`${hhmm(new Date(start))} ${c.isRunning ? 'aktif' : 'durdu'}`} v={c.name} title={c.name}
                selected={sameSel(ui.selection, { kind: 'cron', id: c.id })} onClick={() => pick({ kind: 'cron', id: c.id })} />
            ))}
            {cronDots.map(({ c, t }) => (
              <button key={`${c.id}-${t}`} className="tape-dot" aria-label={`${c.name} ${hhmm(new Date(t))}`} title={`${c.name} ${hhmm(new Date(t))}`}
                style={{ left: x(t) - 2, top: 8 + (rowsC - 1) * 50 + 7, opacity: c.isRunning ? 1 : 0.4 }} onClick={() => pick({ kind: 'cron', id: c.id })} />
            ))}
          </Lane>
          <Lane title="Olaylar" sub="Bu oturumda" rows={1} ticks={ticks} x={x} nowX={x(now.getTime())} width={width} short>
            {visibleEvents.map((e) => (
              <button key={e.id} className={`tape-dot event ${e.kind === 'error' ? 'error' : ''}`} style={{ left: x(e.at.getTime()) - 1, top: 10 }}
                title={`${hhmmss(e.at)} ${e.topic}: ${e.text}`} aria-label={`${e.topic} ${e.text}`} onClick={() => pick({ kind: 'event', id: e.id })} />
            ))}
          </Lane>
        </div>
      </div>

      <div className="tape-legend">
        <span><i className="swatch" style={{ ['--paper' as string]: 'var(--buff)', ['--edge' as string]: 'var(--buff-edge)' }} />Planlı geçiş</span>
        <span><i className="swatch" style={{ ['--paper' as string]: 'var(--mint)', ['--edge' as string]: 'var(--mint-edge)' }} />Takipte</span>
        <span><i className="swatch" style={{ ['--paper' as string]: 'var(--rose)', ['--edge' as string]: 'var(--rose-edge)' }} />Atlandı, başarısız ya da iptal</span>
        <span><i className="swatch" style={{ ['--paper' as string]: 'transparent', ['--edge' as string]: 'var(--buff-edge)', borderStyle: 'dashed' }} />TLE tahmini</span>
        <span><i className="swatch" style={{ ['--paper' as string]: 'var(--sky)', ['--edge' as string]: 'var(--sky-edge)' }} />Görev</span>
        <span>Alt alta binen şeritler kurulum süresiyle ({span(setup)}) çakışıyor</span>
      </div>

      <div className="board-columns">
        <section className="rack" aria-label="Sıradaki geçişler">
          <div className="rack-head">
            <h3>Sıradaki geçişler</h3>
            <span>{nextPass ? `AOS'a ${countdown((parseLocal(nextPass.aos)?.getTime() ?? 0) - now.getTime())}` : ''}</span>
          </div>
          {passes.isLoading && <p className="muted">Yükleniyor…</p>}
          {!passes.isLoading && upcoming.length === 0 && (
            <div className="rack-empty">Planlı geçiş yok. İstasyon sekmesinden TLE ile geçiş hesaplayıp planlamaya ekleyebilirsin.</div>
          )}
          {upcoming.slice(0, 7).map((p) => (
            <BayStrip key={p.id} p={p} now={now.getTime()} selected={sameSel(ui.selection, { kind: 'pass', id: p.id })} onClick={() => pick({ kind: 'pass', id: p.id })} />
          ))}
        </section>

        <section className="rack" aria-label="Otomatik planlayıcı ve aktif görevler">
          <div className="rack-head">
            <h3>Otomatik planlayıcı</h3>
            <span>{lastScheduler ? `Son komut: ${lastScheduler.on ? 'başlat' : 'durdur'}, ${hhmm(new Date(lastScheduler.at))}` : 'Durum bilgisi API’de yok'}</span>
          </div>
          <p className="muted" style={{ fontSize: 14 }}>
            Başlatınca "takip seçildi" durumundaki gelecek geçişler için script ve tek seferlik cron görevi oluşturulur. Durdurunca sıradaki geçişler iptal edilir.
          </p>
          <div className="toolbar">
            <Button variant="primary" disabled={busy} onClick={() => scheduler(true)}>Planlayıcıyı başlat</Button>
            <Button disabled={busy} onClick={() => scheduler(false)}>Durdur</Button>
          </div>
          <div className="rack-head" style={{ marginTop: 8 }}>
            <h3>Aktif görevler</h3>
            <span>{active.data?.length ?? 0} çalışıyor</span>
          </div>
          {active.data?.length === 0 && <div className="rack-empty">Çalışan cron görevi yok.</div>}
          {active.data?.slice(0, 6).map((c) => {
            const next = runsBetween(c, now, new Date(now.getTime() + 30 * 24 * HOUR), 1)[0]
            return (
              <button key={c.id} className={`strip job ${sameSel(ui.selection, { kind: 'cron', id: c.id }) ? 'is-selected' : ''}`} onClick={() => pick({ kind: 'cron', id: c.id })}>
                <div className="cells" style={{ gridTemplateColumns: '1fr auto' }}>
                  <Cell k={c.policyScript?.name ?? 'Script'} v={c.name} grow />
                  <Cell k="Sonraki" v={next ? hhmm(next) : '—'} />
                </div>
              </button>
            )
          })}
        </section>

        <section className="rack" aria-label="Son olaylar">
          <div className="rack-head">
            <h3>Son olaylar</h3>
            <span>{events.length} kayıt</span>
          </div>
          {events.length === 0 ? (
            <Empty>Henüz olay yok. MQTT mesajları ve arayüzde yaptığın işlemler burada akar.</Empty>
          ) : (
            <div className="event-log">
              {events.slice(0, 14).map((e) => (
                <button key={e.id} className={`event-row ${e.kind}`} onClick={() => pick({ kind: 'event', id: e.id })}>
                  <time className="faint">{hhmmss(e.at)}</time>
                  <span className="topic">{e.topic}</span>
                  <span className="text">{e.text}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function NowLine({ left, label, width }: { left: number; label: string; width: number }) {
  if (left < 0 || left > width) return null
  return (
    <div className="now-line" style={{ left }}>
      <span>{label}</span>
    </div>
  )
}

function Lane({ title, sub, rows, ticks, x, nowX, width, children, short }: {
  title: string
  sub: string
  rows: number
  ticks: number[]
  x: (t: number) => number
  nowX: number
  width: number
  children: React.ReactNode
  short?: boolean
}) {
  return (
    <div className="lane" style={{ minHeight: short ? 46 : 16 + rows * 50 }}>
      <div className="lane-label">
        <b>{title}</b>
        <span>{sub}</span>
      </div>
      <div className="lane-body">
        {ticks.map((t) => <div key={t} className="grid-line" style={{ left: x(t) }} />)}
        {nowX >= 0 && nowX <= width && <div className="now-line" style={{ left: nowX }} />}
        {children}
      </div>
    </div>
  )
}

/** Zaman eksenindeki şerit. Etiket sığmayacak kadar darsa adı şeridin sağına yazılır. */
function TapeStrip({ className, left, w, row, k, v, extra, title, selected, onClick }: {
  className: string
  left: number
  w: number
  row: number
  k: string
  v: string
  extra?: { k: string; v: string }
  title: string
  selected: boolean
  onClick: () => void
}) {
  const wide = w > 92
  const top = 8 + row * 50
  return (
    <>
      <button className={`${className} tape-item ${selected ? 'is-selected' : ''}`} style={{ left, width: Math.max(8, w), top }} onClick={onClick} title={title} aria-label={title}>
        {wide && (
          <div className="cells">
            <Cell k={k} v={v} />
            {extra && w > 190 && <Cell k={extra.k} v={extra.v} />}
          </div>
        )}
      </button>
      {!wide && (
        <span className="tape-label" style={{ left: left + Math.max(8, w) + 5, top }} aria-hidden>
          <small>{k}</small>
          {v}
        </span>
      )}
    </>
  )
}

/** Klasik şerit yuvası görünümü: sıradaki geçişler alt alta, en yakını en üstte. */
function BayStrip({ p, now, selected, onClick }: { p: SatellitePassResponse; now: number; selected: boolean; onClick: () => void }) {
  const aos = parseLocal(p.aos)?.getTime() ?? 0
  const los = parseLocal(p.los)?.getTime() ?? 0
  const live = aos <= now && los >= now
  return (
    <button className={`${passTone(p, now)} ${live ? 'live' : ''}`} aria-pressed={selected} onClick={onClick}>
      <div className="cells" style={{ gridTemplateColumns: '1.4fr .8fr .8fr 1fr' }}>
        <Cell k={p.isImportant ? 'Öncelikli' : passStatusLabel[p.status]} v={p.name} big />
        <Cell k="AOS" v={hhmm(new Date(aos))} />
        <Cell k="LOS" v={hhmm(new Date(los))} />
        <Cell k={live ? "LOS'a" : "AOS'a"} v={countdown((live ? los : aos) - now)} />
      </div>
    </button>
  )
}
