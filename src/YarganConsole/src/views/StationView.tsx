import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { passApi, tleApi } from '../api/api'
import type { ActiveTleResponse, SatellitePassFromTle, TleData } from '../api/types'
import { parseTleBlock, tleChecksumOk } from '../lib/domain'
import { keys, usePasses, usePredicted, useTle } from '../lib/queries'
import { dayLabel, hhmm, parseLocal, toInput, toLocalIso } from '../lib/time'
import { Button, Cell, Empty, Field, Loading, QueryError, Sheet, useAction } from '../ui/kit'

const DAY = 24 * 3600_000

export default function StationView() {
  const tle = useTle()
  const predicted = usePredicted()
  const passes = usePasses()
  const qc = useQueryClient()
  const { run, busy } = useAction()
  const [manual, setManual] = useState(false)

  const [st, setSt] = useState({
    name: 'Yer istasyonu',
    latitude: 39.92,
    longitude: 32.85,
    altitude: 900,
    minElevation: 10,
    setupInterval: 120,
    startAt: toInput(new Date()),
    endAt: toInput(new Date(Date.now() + 2 * DAY)),
  })
  const [sats, setSats] = useState<TleData[]>([])
  useEffect(() => {
    if (!tle.data) return
    setSt((s) => ({
      ...s,
      name: tle.data!.name,
      latitude: tle.data!.latitude,
      longitude: tle.data!.longitude,
      altitude: tle.data!.altitude,
      minElevation: tle.data!.minElevation,
      setupInterval: tle.data!.setupInterval,
    }))
    setSats(tle.data.tleData ?? [])
  }, [tle.data])
  const set = (patch: Partial<typeof st>) => setSt((s) => ({ ...s, ...patch }))

  const [computed, setComputed] = useState<SatellitePassFromTle[] | null>(null)
  const list = computed ?? predicted.data ?? []

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const result = await run(`${st.name} yapılandırması kaydedildi`, () =>
      tleApi.save({
        ...st,
        latitude: Number(st.latitude),
        longitude: Number(st.longitude),
        altitude: Number(st.altitude),
        minElevation: Number(st.minElevation),
        setupInterval: Number(st.setupInterval),
        tleData: sats,
        startAt: toLocalIso(new Date(st.startAt)),
        endAt: toLocalIso(new Date(st.endAt)),
      }),
    [keys.tle])
    if (result) {
      setComputed(result)
      qc.setQueryData(keys.predicted, result)
    }
  }

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>İstasyon</h2>
          <p>Yer istasyonu konumu ve takip edilecek uyduların TLE’leri. Kaydedince Satops API seçilen pencere için geçişleri SGP4 ile hesaplar.</p>
        </div>
        <div className="toolbar">
          <Button onClick={() => setManual(true)}>Elle geçiş ekle</Button>
        </div>
      </div>
      {tle.error && <QueryError error={tle.error} onRetry={() => tle.refetch()} />}

      <form className="split" onSubmit={save}>
        <section className="panel">
          <h3>Konum ve hesaplama</h3>
          {tle.isLoading && <Loading what="Yapılandırma" />}
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="İstasyon adı" wide>
              <input value={st.name} onChange={(e) => set({ name: e.target.value })} required />
            </Field>
            <Field label="Enlem (°)">
              <input type="number" step="0.0001" min={-90} max={90} value={st.latitude} onChange={(e) => set({ latitude: Number(e.target.value) })} required />
            </Field>
            <Field label="Boylam (°)">
              <input type="number" step="0.0001" min={-180} max={180} value={st.longitude} onChange={(e) => set({ longitude: Number(e.target.value) })} required />
            </Field>
            <Field label="Yükseklik (m)">
              <input type="number" step="1" value={st.altitude} onChange={(e) => set({ altitude: Number(e.target.value) })} required />
            </Field>
            <Field label="En düşük elevasyon (°)">
              <input type="number" step="0.5" min={0} max={90} value={st.minElevation} onChange={(e) => set({ minElevation: Number(e.target.value) })} required />
            </Field>
            <Field label="Kurulum süresi (sn)" hint="Geçişler arası anten hazırlığı; çakışma hesabında kullanılır" wide>
              <input type="number" min={0} value={st.setupInterval} onChange={(e) => set({ setupInterval: Number(e.target.value) })} required />
            </Field>
            <Field label="Pencere başı">
              <input type="datetime-local" value={st.startAt} onChange={(e) => set({ startAt: e.target.value })} required />
            </Field>
            <Field label="Pencere sonu">
              <input type="datetime-local" value={st.endAt} onChange={(e) => set({ endAt: e.target.value })} required />
            </Field>
          </div>
          <Button type="submit" variant="primary" disabled={busy || sats.length === 0}>
            Kaydet ve geçişleri hesapla
          </Button>
          {sats.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Hesaplama için en az bir uydu ekle.</p>}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Takip edilen uydular</h3>
            <span className="muted" style={{ fontSize: 13 }}>{sats.length} uydu</span>
          </div>
          {sats.length === 0 && <div className="rack-empty">Liste boş. Aşağıdan adla ara ya da TLE yapıştır.</div>}
          <div className="stack">
            {sats.map((s, i) => {
              const ok = tleChecksumOk(s.line1) && tleChecksumOk(s.line2)
              return (
                <div key={`${s.satelliteName}-${i}`} className={`strip ${ok ? 'pass' : 'fault'}`}>
                  <div className="cells" style={{ gridTemplateColumns: '1fr auto' }}>
                    <div className="cell grow">
                      <span className="k">{ok ? 'TLE geçerli' : 'Checksum tutmuyor'}</span>
                      <span className="v">{s.satelliteName}</span>
                      <span className="tle-lines">{`${s.line1}\n${s.line2}`}</span>
                    </div>
                    <div className="cell">
                      <Button small variant="quiet" onClick={() => setSats((all) => all.filter((_, j) => j !== i))}>Çıkar</Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <TleSearch onAdd={(t) => setSats((all) => (all.some((x) => x.line1 === t.line1) ? all : [...all, t]))} />
          <TlePaste onAdd={(items) => setSats((all) => [...all, ...items.filter((t) => !all.some((x) => x.line1 === t.line1))])} />
        </section>
      </form>

      <section className="panel" style={{ marginTop: 18 }}>
        <PassPicker list={list} planned={passes.data ?? []} loading={predicted.isLoading && !computed} />
      </section>

      {manual && <ManualPassSheet onClose={() => setManual(false)} />}
    </div>
  )
}

function TleSearch({ onAdd }: { onAdd: (t: TleData) => void }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<ActiveTleResponse[] | null>(null)
  const { run, busy } = useAction()
  const search = async () => {
    if (!q.trim()) return
    const r = await run(`"${q}" için TLE arandı`, () => tleApi.search(q.trim()))
    setHits(r ?? [])
  }
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <Field label="Adla ara" hint="Satops API güncel TLE’yi dış servisten çeker">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="NOAA" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())} />
        </Field>
        <Button disabled={busy} onClick={search} style={{ marginBottom: 18 }}>Ara</Button>
      </div>
      {hits && hits.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Sonuç yok.</p>}
      {hits?.slice(0, 8).map((h) => (
        <div key={h.line1} className="strip" style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
          <Cell k={h.line1.slice(2, 7)} v={h.satelliteName} />
          <div className="cell"><Button small onClick={() => onAdd(h)}>Ekle</Button></div>
        </div>
      ))}
    </div>
  )
}

function TlePaste({ onAdd }: { onAdd: (t: TleData[]) => void }) {
  const [text, setText] = useState('')
  const parsed = parseTleBlock(text)
  const valid = parsed.filter((p) => p.valid)
  return (
    <div className="stack" style={{ gap: 8 }}>
      <Field label="TLE yapıştır" hint={text ? `${parsed.length} kayıt okundu, ${valid.length} tanesi geçerli` : 'Ad satırı ve iki TLE satırı; birden çok uydu olabilir'}>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12 }} />
      </Field>
      <div>
        <Button small disabled={valid.length === 0} onClick={() => (onAdd(valid.map(({ valid: _v, ...t }) => t)), setText(''))}>
          {valid.length ? `${valid.length} uyduyu ekle` : 'Uydu ekle'}
        </Button>
      </div>
    </div>
  )
}

function PassPicker({ list, planned, loading }: { list: SatellitePassFromTle[]; planned: { name: string; aos: string }[]; loading: boolean }) {
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [important, setImportant] = useState<Set<string>>(new Set())
  const { run, busy } = useAction()
  const key = (p: SatellitePassFromTle) => `${p.name}|${p.aos}`
  const isPlanned = (p: SatellitePassFromTle) =>
    planned.some((q) => q.name === p.name && Math.abs((parseLocal(q.aos)?.getTime() ?? 0) - (parseLocal(p.aos)?.getTime() ?? 0)) < 60_000)
  const future = list.filter((p) => (parseLocal(p.los)?.getTime() ?? 0) > Date.now())
  const toggle = (set: Set<string>, k: string) => {
    const n = new Set(set)
    if (n.has(k)) n.delete(k)
    else n.add(k)
    return n
  }
  const plan = async () => {
    const chosen = future.filter((p) => picked.has(key(p)))
    await run(`${chosen.length} geçiş planlamaya eklendi`, () =>
      passApi.addMany(chosen.map((p) => ({ name: p.name, aos: p.aos, los: p.los, duration: p.duration, maxElevation: 0, isImportant: important.has(key(p)) }))),
    [keys.passes])
    setPicked(new Set())
  }
  let lastDay = ''
  return (
    <>
      <div className="panel-head">
        <div>
          <h3>Hesaplanan geçişler</h3>
          <p className="muted" style={{ fontSize: 13 }}>Planlamak istediklerini seç. Öncelikli işaretlenenler çakışmada öne geçer.</p>
        </div>
        <div className="toolbar">
          <Button small onClick={() => setPicked(new Set(future.filter((p) => !isPlanned(p)).map(key)))}>Planlanmamışları seç</Button>
          <Button variant="primary" disabled={busy || picked.size === 0} onClick={plan}>
            {picked.size ? `${picked.size} geçişi planla` : 'Seçileni planla'}
          </Button>
        </div>
      </div>
      {loading && <Loading what="Geçişler" />}
      {!loading && future.length === 0 && <Empty>Pencerede gelecek geçiş yok. Uydu ekleyip yapılandırmayı kaydet.</Empty>}
      <div className="table-list">
        {future.map((p) => {
          const k = key(p)
          const aos = parseLocal(p.aos)!
          const day = dayLabel(aos)
          const showDay = day !== lastDay
          lastDay = day
          const done = isPlanned(p)
          return (
            <div key={k}>
              {showDay && <h3 style={{ margin: '10px 0 6px', fontSize: 15 }} className="muted">{day}</h3>}
              <div className={`strip pass ${done ? '' : 'ghost'}`} style={{ gridTemplateColumns: 'auto 1fr auto', alignItems: 'center' }}>
                <label className="cell" style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <input type="checkbox" className="check" style={{ width: 17, height: 17, accentColor: 'var(--ink)' }} disabled={done} checked={picked.has(k)} onChange={() => setPicked((s) => toggle(s, k))} aria-label={`${p.name} ${hhmm(aos)} seç`} />
                </label>
                <div className="cells" style={{ gridTemplateColumns: '1.4fr .7fr .7fr .7fr' }}>
                  <Cell k={done ? 'Planlandı' : 'Tahmin'} v={p.name} />
                  <Cell k="AOS" v={hhmm(aos)} />
                  <Cell k="LOS" v={hhmm(parseLocal(p.los)!)} />
                  <Cell k="Süre" v={`${p.duration.toFixed(1)} dk`} />
                </div>
                <label className="cell check" style={{ flexDirection: 'row' }}>
                  <input type="checkbox" disabled={done} checked={important.has(k)} onChange={() => setImportant((s) => toggle(s, k))} />
                  Öncelikli
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function ManualPassSheet({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ name: '', aos: toInput(new Date(Date.now() + 3600_000)), los: toInput(new Date(Date.now() + 3600_000 + 10 * 60_000)), maxElevation: 45, isImportant: false })
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }))
  const { run, busy } = useAction()
  const aos = new Date(f.aos)
  const los = new Date(f.los)
  const valid = los > aos
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(`${f.name} geçişi eklendi`, () =>
      passApi.add({ name: f.name, aos: toLocalIso(aos), los: toLocalIso(los), duration: Math.round(((los.getTime() - aos.getTime()) / 60_000) * 100) / 100, maxElevation: Number(f.maxElevation), isImportant: f.isImportant }),
    [keys.passes])
    if (ok !== undefined) onClose()
  }
  return (
    <Sheet open title="Elle geçiş ekle" onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <Field label="Uydu" wide>
          <input value={f.name} onChange={(e) => set({ name: e.target.value })} required autoFocus placeholder="NOAA 19" />
        </Field>
        <Field label="AOS">
          <input type="datetime-local" value={f.aos} onChange={(e) => set({ aos: e.target.value })} required />
        </Field>
        <Field label="LOS" hint={valid ? undefined : 'LOS, AOS’tan sonra olmalı'}>
          <input type="datetime-local" value={f.los} onChange={(e) => set({ los: e.target.value })} required aria-invalid={!valid} />
        </Field>
        <Field label="Maks. elevasyon (°)">
          <input type="number" min={0} max={90} value={f.maxElevation} onChange={(e) => set({ maxElevation: Number(e.target.value) })} />
        </Field>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <label className="check">
            <input type="checkbox" checked={f.isImportant} onChange={(e) => set({ isImportant: e.target.checked })} />
            Öncelikli geçiş
          </label>
        </div>
        <div className="form-actions wide">
          <Button onClick={onClose}>Vazgeç</Button>
          <Button type="submit" variant="primary" disabled={busy || !valid}>Geçişi ekle</Button>
        </div>
      </form>
    </Sheet>
  )
}
