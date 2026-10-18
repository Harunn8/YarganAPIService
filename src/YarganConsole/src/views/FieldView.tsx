import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { deviceApi, pagApi, pagDeviceApi } from '../api/api'
import type { DeviceResponse, PagDeviceResponse, PagResponse } from '../api/types'
import { commLabel, isMaint, parseComm } from '../lib/domain'
import { keys, useActivePagDevices, usePagDevices, usePags } from '../lib/queries'
import { select, useUi } from '../lib/state'
import { Button, Cell, Empty, Loading, QueryError, Seg, useAction, useConfirm } from '../ui/kit'
import { DeviceSheet, PagDeviceSheet, PagSheet } from './forms'

type Filter = 'all' | 'live' | 'maint'
type DefFilter = 'all' | 'snmp' | 'tcp'

export default function FieldView() {
  const ui = useUi()
  const pags = usePags()
  const pagDevices = usePagDevices()
  const active = useActivePagDevices()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [sheet, setSheet] = useState<
    | { kind: 'pag'; pag?: PagResponse }
    | { kind: 'pagDevice'; item?: PagDeviceResponse; pagId?: string }
    | { kind: 'device'; device?: DeviceResponse; type?: 'snmp' | 'tcp' }
    | null
  >(null)
  const { run, busy } = useAction()
  const confirm = useConfirm()

  const all = pagDevices.data ?? []
  const shown = all.filter((d) => {
    if (filter === 'live' && isMaint(d)) return false
    if (filter === 'maint' && !isMaint(d)) return false
    const s = q.trim().toLowerCase()
    return !s || `${d.name} ${d.ipAddress} ${d.device?.name ?? ''}`.toLowerCase().includes(s)
  })
  const liveCount = active.data?.length ?? all.filter((d) => !isMaint(d)).length

  const togglePick = (id: string) =>
    setPicked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const bulk = async (isStart: boolean) => {
    const ids = [...picked]
    await run(`${ids.length} cihazda haberleşme ${isStart ? 'başlatıldı' : 'durduruldu'}`, () => pagDeviceApi.startOrStopMany(ids, isStart), [keys.pagDevices])
    setPicked(new Set())
  }

  const removePag = async (p: PagResponse) => {
    if (!(await confirm.ask(`${p.name} silinecek. İçindeki cihaz tanımları başka bir PAG'e taşınmazsa sahipsiz kalır.`))) return
    run(`${p.name} silindi`, () => pagApi.remove(p.id), [keys.pags, keys.pagDevices, keys.devices])
  }

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>Saha</h2>
          <p>
            {all.length} cihaz bağlı, {liveCount} tanesi DCM ile haberleşiyor. Şeride tıklayınca ayrıntısı sağda açılır.
          </p>
        </div>
        <div className="toolbar">
          <input className="input" style={{ width: 200 }} placeholder="Ad ya da IP ile süz" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cihazları süz" />
          <Seg label="Durum" value={filter} onChange={setFilter} options={[{ id: 'all', label: 'Tümü' }, { id: 'live', label: 'Haberleşen' }, { id: 'maint', label: 'Bakımda' }]} />
          <Button onClick={() => setSheet({ kind: 'pag' })}>PAG ekle</Button>
          <Button variant="primary" onClick={() => setSheet({ kind: 'pagDevice' })}>Cihaz bağla</Button>
        </div>
      </div>

      {picked.size > 0 && (
        <div className="notice" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <b>{picked.size} cihaz seçili</b>
          <Button small disabled={busy} onClick={() => bulk(true)}>Haberleşmeyi başlat</Button>
          <Button small disabled={busy} onClick={() => bulk(false)}>Bakıma al</Button>
          <Button small variant="quiet" onClick={() => setPicked(new Set())}>Seçimi temizle</Button>
        </div>
      )}

      {pags.error && <QueryError error={pags.error} onRetry={() => pags.refetch()} />}
      {pags.isLoading && <Loading what="PAG'ler" />}
      {pags.data?.length === 0 && (
        <Empty action={<Button variant="primary" onClick={() => setSheet({ kind: 'pag' })}>İlk PAG'i ekle</Button>}>
          Henüz PAG yok. Cihazlar PAG'ler altında gruplanır; önce bir PAG ekle.
        </Empty>
      )}

      <div className="board-columns" style={{ marginTop: 0 }}>
        {pags.data?.map((p) => {
          const items = shown.filter((d) => d.pagId === p.id)
          const total = all.filter((d) => d.pagId === p.id)
          return (
            <section className="rack" key={p.id} aria-label={p.name}>
              <div className="rack-head">
                <h3>{p.name}</h3>
                <span>
                  {total.filter((d) => !isMaint(d)).length}/{total.length} haberleşiyor
                </span>
              </div>
              {items.length === 0 && <div className="rack-empty">{total.length ? 'Süzgece uyan cihaz yok.' : 'Bu PAG’de bağlı cihaz yok.'}</div>}
              {items.map((d) => {
                const maint = isMaint(d)
                const sel = ui.selection?.kind === 'pagDevice' && ui.selection.id === d.id
                return (
                  <div key={d.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" className="check" style={{ width: 17, height: 17, accentColor: 'var(--ink)' }} checked={picked.has(d.id)} onChange={() => togglePick(d.id)} aria-label={`${d.name} seç`} />
                    <button className={`strip ${maint ? 'fault' : 'live'}`} aria-pressed={sel} onClick={() => select(sel ? null : { kind: 'pagDevice', id: d.id })}>
                      <div className="cells" style={{ gridTemplateColumns: '1.1fr 1.2fr .9fr' }}>
                        <Cell k={d.device?.name ?? 'Tanımsız'} v={d.name} big />
                        <Cell k={d.device ? commLabel(d.device.communicationType) : 'Adres'} v={`${d.ipAddress}:${d.port}`} />
                        <Cell k={maint ? 'Bakımda' : 'Haberleşiyor'} v={`${d.timeout} ms`} />
                      </div>
                    </button>
                  </div>
                )
              })}
              <div className="toolbar" style={{ marginTop: 4 }}>
                <Button small variant="quiet" onClick={() => setSheet({ kind: 'pagDevice', pagId: p.id })}>Bu PAG’e cihaz bağla</Button>
                <Button small variant="quiet" onClick={() => setSheet({ kind: 'pag', pag: p })}>Yeniden adlandır</Button>
                <Button small variant="quiet" onClick={() => removePag(p)}>Sil</Button>
              </div>
            </section>
          )
        })}
      </div>

      <Definitions onAdd={(type) => setSheet({ kind: 'device', type })} />

      {sheet?.kind === 'pag' && <PagSheet open pag={sheet.pag} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'pagDevice' && <PagDeviceSheet open item={sheet.item} defaultPagId={sheet.pagId} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'device' && <DeviceSheet open device={sheet.device} kind={sheet.type} onClose={() => setSheet(null)} />}
      {confirm.node}
    </div>
  )
}

/** Cihaz tanımları: SNMP/TCP şablonları ve okunan parametreleri. */
function Definitions({ onAdd }: { onAdd: (type: 'snmp' | 'tcp') => void }) {
  const ui = useUi()
  const [f, setF] = useState<DefFilter>('all')
  const devices = useQuery({
    queryKey: [...keys.devices, f],
    queryFn: () => (f === 'snmp' ? deviceApi.getSnmp() : f === 'tcp' ? deviceApi.getTcp() : deviceApi.getAll()),
  })
  const byPag = useMemo(() => {
    const m = new Map<string, DeviceResponse[]>()
    devices.data?.forEach((d) => m.set(d.pag?.name ?? 'PAG yok', [...(m.get(d.pag?.name ?? 'PAG yok') ?? []), d]))
    return [...m.entries()]
  }, [devices.data])

  return (
    <section style={{ marginTop: 32 }}>
      <div className="view-head">
        <div>
          <h2>Cihaz tanımları</h2>
          <p>Bir tanım, aynı modeldeki cihazların nasıl okunacağını (SNMP OID’leri ya da TCP sorguları) tutar.</p>
        </div>
        <div className="toolbar">
          <Seg label="Tür" value={f} onChange={setF} options={[{ id: 'all', label: 'Tümü' }, { id: 'snmp', label: 'SNMP' }, { id: 'tcp', label: 'TCP' }]} />
          <Button onClick={() => onAdd('snmp')}>SNMP cihazı tanımla</Button>
          <Button onClick={() => onAdd('tcp')}>TCP cihazı tanımla</Button>
        </div>
      </div>
      {devices.error && <QueryError error={devices.error} onRetry={() => devices.refetch()} />}
      {devices.data?.length === 0 && <Empty>Bu türde cihaz tanımı yok.</Empty>}
      <div className="board-columns" style={{ marginTop: 0 }}>
        {byPag.map(([pag, list]) => (
          <section className="rack" key={pag} aria-label={pag}>
            <div className="rack-head">
              <h3>{pag}</h3>
              <span>{list.length} tanım</span>
            </div>
            {list.map((d) => {
              const c = parseComm(d.communicationData)
              const sel = ui.selection?.kind === 'device' && ui.selection.id === d.id
              return (
                <button key={d.id} className="strip" aria-pressed={sel} onClick={() => select(sel ? null : { kind: 'device', id: d.id })}>
                  <div className="cells" style={{ gridTemplateColumns: '1.4fr .6fr 1fr' }}>
                    <Cell k={c.Version ? `Sürüm ${c.Version}` : 'Tanım'} v={d.name} big />
                    <Cell k="Tür" v={commLabel(d.communicationType)} />
                    <Cell k="Parametre" v={c.Queries?.map((x) => x.ParameterName).join(', ') || '—'} />
                  </div>
                </button>
              )
            })}
          </section>
        ))}
      </div>
    </section>
  )
}
