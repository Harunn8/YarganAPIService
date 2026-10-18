import { useState } from 'react'
import { cronApi, deviceApi, pagDeviceApi, passApi, scriptApi } from '../api/api'
import { describeCron, nextRuns } from '../lib/cron'
import { commLabel, isMaint, parseComm, passStatusLabel } from '../lib/domain'
import { useEvents } from '../lib/events'
import { useNow } from '../lib/hooks'
import { keys, useCrons, useDevices, usePagDevices, usePasses, usePredicted, useScripts } from '../lib/queries'
import { goto, select, useUi } from '../lib/state'
import { countdown, fullLabel, hhmmss, parseLocal, relative, span } from '../lib/time'
import { Button, useAction, useConfirm } from '../ui/kit'
import { CronSheet, DeviceSheet, PagDeviceSheet } from './forms'

export default function Inspector() {
  const { selection } = useUi()
  if (!selection) return null
  return (
    <aside className="inspector" aria-label="Ayrıntılar">
      {selection.kind === 'pass' && <PassPanel id={selection.id} />}
      {selection.kind === 'predicted' && <PredictedPanel k={selection.key} />}
      {selection.kind === 'cron' && <CronPanel id={selection.id} />}
      {selection.kind === 'script' && <ScriptPanel id={selection.id} />}
      {selection.kind === 'pagDevice' && <PagDevicePanel id={selection.id} />}
      {selection.kind === 'device' && <DevicePanel id={selection.id} />}
      {selection.kind === 'event' && <EventPanel id={selection.id} />}
    </aside>
  )
}

function Head({ kind, title }: { kind: string; title: string }) {
  return (
    <div className="inspector-head">
      <div>
        <span className="muted" style={{ fontSize: 13 }}>{kind}</span>
        <h2>{title}</h2>
      </div>
      <Button small variant="quiet" onClick={() => select(null)} aria-label="Ayrıntıları kapat">Kapat</Button>
    </div>
  )
}

const Gone = ({ what }: { what: string }) => (
  <>
    <Head kind={what} title="Bulunamadı" />
    <div className="inspector-body"><p className="muted">Kayıt silinmiş ya da henüz yüklenmedi.</p></div>
  </>
)

function PassPanel({ id }: { id: string }) {
  const passes = usePasses()
  const crons = useCrons()
  const now = useNow()
  const p = passes.data?.find((x) => x.id === id)
  if (!p) return <Gone what="Geçiş" />
  const aos = parseLocal(p.aos)!
  const los = parseLocal(p.los)!
  const t = now.getTime()
  const live = aos.getTime() <= t && los.getTime() >= t
  const job = crons.data?.find((c) => c.name.startsWith(`${p.name}_`) && Math.abs((parseLocal(c.endAt)?.getTime() ?? 0) - los.getTime()) < 120_000)
  return (
    <>
      <Head kind="Planlı geçiş" title={p.name} />
      <div className="inspector-body">
        <div className={`strip pass ${live ? 'live' : ''}`} style={{ padding: '10px 14px' }}>
          <span className="muted" style={{ fontSize: 13 }}>{live ? "LOS'a kalan" : aos.getTime() > t ? "AOS'a kalan" : 'Bitti'}</span>
          <b style={{ fontFamily: 'var(--font-strip)', fontSize: 34, lineHeight: 1.1 }}>
            {live ? countdown(los.getTime() - t) : aos.getTime() > t ? countdown(aos.getTime() - t) : relative(los, t)}
          </b>
        </div>
        <dl className="facts">
          <dt>Durum</dt><dd>{passStatusLabel[p.status]}</dd>
          <dt>AOS</dt><dd>{fullLabel(aos)}</dd>
          <dt>LOS</dt><dd>{fullLabel(los)}</dd>
          <dt>Süre</dt><dd>{span(los.getTime() - aos.getTime())}</dd>
          <dt>Öncelik</dt><dd>{p.isImportant ? 'Öncelikli' : 'Normal'}</dd>
          <dt>Takip</dt><dd>{p.isTracked ? 'Takip edilecek' : 'Takip edilmeyecek'}</dd>
        </dl>
        {job ? (
          <div className="stack">
            <h3>Geçiş görevi</h3>
            <p className="muted" style={{ fontSize: 14 }}>Otomatik planlayıcı bu geçiş için tek seferlik bir cron görevi açmış.</p>
            <Button onClick={() => select({ kind: 'cron', id: job.id })}>{job.name} görevini aç</Button>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 14 }}>Bu geçiş için henüz görev yok. Otomatik planlayıcı başlatılınca "takip seçildi" durumundaki geçişlere görev açılır.</p>
        )}
        <p className="faint" style={{ fontSize: 13 }}>Satops API geçiş güncelleme ya da silme ucu sunmuyor; durum değişiklikleri planlayıcıdan gelir.</p>
      </div>
    </>
  )
}

function PredictedPanel({ k }: { k: string }) {
  const predicted = usePredicted()
  const { run, busy } = useAction()
  const [important, setImportant] = useState(false)
  const p = predicted.data?.find((x) => `${x.name}|${x.aos}` === k)
  if (!p) return <Gone what="TLE tahmini" />
  const aos = parseLocal(p.aos)!
  const los = parseLocal(p.los)!
  return (
    <>
      <Head kind="TLE tahmini, planlanmamış" title={p.name} />
      <div className="inspector-body">
        <dl className="facts">
          <dt>AOS</dt><dd>{fullLabel(aos)}</dd>
          <dt>LOS</dt><dd>{fullLabel(los)}</dd>
          <dt>Süre</dt><dd>{p.duration.toFixed(1)} dk</dd>
          <dt>Ne zaman</dt><dd>{relative(aos)}</dd>
        </dl>
        <label className="check">
          <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} /> Öncelikli olarak planla
        </label>
        <Button variant="primary" disabled={busy} onClick={async () => {
          const r = await run(`${p.name} geçişi planlandı`, () => passApi.add({ name: p.name, aos: p.aos, los: p.los, duration: p.duration, maxElevation: 0, isImportant: important }), [keys.passes])
          if (r) select({ kind: 'pass', id: r.id })
        }}>Planlamaya ekle</Button>
      </div>
    </>
  )
}

function CronPanel({ id }: { id: string }) {
  const crons = useCrons()
  const { run, busy } = useAction()
  const confirm = useConfirm()
  const [edit, setEdit] = useState(false)
  const c = crons.data?.find((x) => x.id === id)
  if (!c) return <Gone what="Cron görevi" />
  const runs = nextRuns(c, 5)
  return (
    <>
      <Head kind={c.isRunning ? 'Cron görevi, çalışıyor' : 'Cron görevi, durdu'} title={c.name} />
      <div className="inspector-body">
        <dl className="facts">
          <dt>Takvim</dt><dd>{c.forOnce ? 'Bir kez' : `${describeCron(c.cronFormat)} (${c.cronFormat})`}</dd>
          <dt>Başlangıç</dt><dd>{fullLabel(parseLocal(c.startAt))}</dd>
          <dt>Bitiş</dt><dd>{fullLabel(parseLocal(c.endAt))}</dd>
          <dt>Script</dt><dd>{c.policyScript?.name ?? c.policyScriptId}</dd>
        </dl>
        <div className="stack">
          <h3>Sonraki çalışmalar</h3>
          {runs.length ? runs.map((d) => <span key={d.getTime()} style={{ fontSize: 14 }}>{fullLabel(d)} <span className="faint">{relative(d)}</span></span>) : <span className="muted">Planlı çalışma yok.</span>}
        </div>
        <div className="toolbar">
          <Button variant="primary" disabled={busy} onClick={() => run(`${c.name} ${c.isRunning ? 'durduruldu' : 'başlatıldı'}`, () => cronApi.startOrStop(c.id, !c.isRunning), [keys.crons])}>
            {c.isRunning ? 'Durdur' : 'Başlat'}
          </Button>
          <Button onClick={() => setEdit(true)}>Düzenle</Button>
          <Button onClick={() => { select({ kind: 'script', id: c.policyScriptId }); goto('otomasyon') }}>Scripti aç</Button>
          <Button variant="quiet" onClick={async () => {
            if (!(await confirm.ask(`${c.name} görevi silinecek.`))) return
            const ok = await run(`${c.name} silindi`, () => cronApi.remove(c.id), [keys.crons])
            if (ok !== undefined) select(null)
          }}>Sil</Button>
        </div>
        {c.policyScript?.script && <pre className="code">{c.policyScript.script}</pre>}
      </div>
      {edit && <CronSheet open cron={c} onClose={() => setEdit(false)} />}
      {confirm.node}
    </>
  )
}

function ScriptPanel({ id }: { id: string }) {
  const scripts = useScripts()
  const crons = useCrons()
  const { run, busy } = useAction()
  const s = scripts.data?.find((x) => x.id === id)
  if (!s) return <Gone what="Script" />
  const used = crons.data?.filter((c) => c.policyScriptId === s.id) ?? []
  return (
    <>
      <Head kind="Policy script" title={s.name} />
      <div className="inspector-body">
        <div className="toolbar">
          <Button variant="primary" disabled={busy} onClick={() => run(`${s.name} bir kez çalıştırıldı`, () => scriptApi.run(s.id))}>Bir kez çalıştır</Button>
          <Button onClick={() => goto('otomasyon')}>Düzenle</Button>
        </div>
        <p className="muted" style={{ fontSize: 14 }}>{used.length ? `${used.length} cron görevi bu scripti kullanıyor.` : 'Hiçbir cron görevine bağlı değil.'}</p>
        <pre className="code">{s.script}</pre>
      </div>
    </>
  )
}

function PagDevicePanel({ id }: { id: string }) {
  const list = usePagDevices()
  const { run, busy } = useAction()
  const confirm = useConfirm()
  const [edit, setEdit] = useState(false)
  const d = list.data?.find((x) => x.id === id)
  if (!d) return <Gone what="Cihaz" />
  const maint = isMaint(d)
  const comm = parseComm(d.device?.communicationData)
  return (
    <>
      <Head kind={maint ? 'Bakımda' : 'Haberleşiyor'} title={d.name} />
      <div className="inspector-body">
        <dl className="facts">
          <dt>Adres</dt><dd>{d.ipAddress}:{d.port}</dd>
          <dt>Zaman aşımı</dt><dd>{d.timeout} ms</dd>
          <dt>PAG</dt><dd>{d.pag?.name ?? '—'}</dd>
          <dt>Tanım</dt><dd>{d.device ? `${d.device.name} (${commLabel(d.device.communicationType)})` : '—'}</dd>
        </dl>
        {comm.Queries?.length ? (
          <div className="stack">
            <h3>Okunan parametreler</h3>
            {comm.Queries.map((q) => (
              <div key={q.ParameterId} className="strip" style={{ padding: '4px 10px', fontSize: 14 }}>
                <b>{q.ParameterName}</b> <span className="faint">{q.Query}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="toolbar">
          <Button variant="primary" disabled={busy} onClick={() => run(`${d.name} ${maint ? 'haberleşmeye alındı' : 'bakıma alındı'}`, () => pagDeviceApi.startOrStop(d.id, maint), [keys.pagDevices])}>
            {maint ? 'Haberleşmeyi başlat' : 'Bakıma al'}
          </Button>
          <Button onClick={() => setEdit(true)}>Düzenle</Button>
          <Button variant="quiet" onClick={async () => {
            if (!(await confirm.ask(`${d.name} cihazı silinecek; DCM bu cihazla haberleşmeyi bırakır.`))) return
            const ok = await run(`${d.name} silindi`, () => pagDeviceApi.remove(d.id), [keys.pagDevices])
            if (ok !== undefined) select(null)
          }}>Sil</Button>
        </div>
      </div>
      {edit && <PagDeviceSheet open item={d} onClose={() => setEdit(false)} />}
      {confirm.node}
    </>
  )
}

function DevicePanel({ id }: { id: string }) {
  const devices = useDevices()
  const pagDevices = usePagDevices()
  const { run } = useAction()
  const confirm = useConfirm()
  const [edit, setEdit] = useState(false)
  const d = devices.data?.find((x) => x.id === id)
  if (!d) return <Gone what="Cihaz tanımı" />
  const c = parseComm(d.communicationData)
  const instances = pagDevices.data?.filter((x) => x.deviceId === d.id) ?? []
  return (
    <>
      <Head kind={`${commLabel(d.communicationType)} cihaz tanımı`} title={d.name} />
      <div className="inspector-body">
        <dl className="facts">
          <dt>PAG</dt><dd>{d.pag?.name ?? '—'}</dd>
          {c.Version && (<><dt>Sürüm</dt><dd>{c.Version}{c.VersionNote ? `, ${c.VersionNote}` : ''}</dd></>)}
          {d.communicationType === 0 && (<><dt>SNMP</dt><dd>v{c.SNMPVersion ?? '?'}, okuma "{c.ReadCommunity ?? ''}"</dd></>)}
          <dt>Bağlı cihaz</dt><dd>{instances.length ? instances.map((x) => x.name).join(', ') : 'Yok'}</dd>
        </dl>
        <div className="stack">
          <h3>Parametreler</h3>
          {c.Queries?.length ? c.Queries.map((q) => (
            <div key={q.ParameterId} className="strip" style={{ padding: '4px 10px', fontSize: 14 }}>
              <b>{q.ParameterName}</b> <span className="faint">{q.Query}</span>
            </div>
          )) : <span className="muted">Parametre tanımlı değil.</span>}
        </div>
        <div className="toolbar">
          <Button variant="primary" onClick={() => setEdit(true)}>Düzenle</Button>
          <Button variant="quiet" onClick={async () => {
            if (!(await confirm.ask(`${d.name} tanımı silinecek.${instances.length ? ` ${instances.length} bağlı cihaz tanımsız kalır.` : ''}`))) return
            const ok = await run(`${d.name} tanımı silindi`, () => deviceApi.remove(d.id), [keys.devices, keys.pags])
            if (ok !== undefined) select(null)
          }}>Sil</Button>
        </div>
      </div>
      {edit && <DeviceSheet open device={d} onClose={() => setEdit(false)} />}
      {confirm.node}
    </>
  )
}

function EventPanel({ id }: { id: number }) {
  const { events } = useEvents()
  const e = events.find((x) => x.id === id)
  if (!e) return <Gone what="Olay" />
  let pretty = e.text
  try {
    pretty = JSON.stringify(JSON.parse(e.text), null, 2)
  } catch {
    // düz metin
  }
  return (
    <>
      <Head kind={e.kind === 'mqtt' ? 'MQTT mesajı' : e.kind === 'error' ? 'Hata' : 'Arayüz işlemi'} title={e.topic} />
      <div className="inspector-body">
        <dl className="facts">
          <dt>Zaman</dt><dd>{hhmmss(e.at)} ({relative(e.at)})</dd>
        </dl>
        <pre className="code">{pretty}</pre>
      </div>
    </>
  )
}
