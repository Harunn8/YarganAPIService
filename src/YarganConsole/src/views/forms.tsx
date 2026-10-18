import { useState, type FormEvent } from 'react'
import { cronApi, deviceApi, pagApi, pagDeviceApi, scriptApi, userApi } from '../api/api'
import type { CronPolicyResponse, DeviceResponse, PagDeviceResponse, PagResponse, QueryModel, UserResponse } from '../api/types'
import { EMPTY_GUID } from '../api/types'
import { cronValid, describeCron, nextRuns } from '../lib/cron'
import { isMaint, parseComm } from '../lib/domain'
import { keys, useDevices, usePags, useScripts } from '../lib/queries'
import { fullLabel, parseLocal, toInput, toLocalIso } from '../lib/time'
import { Button, Field, Seg, Sheet, useAction } from '../ui/kit'

const ensure = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(msg)
}

// ------------------------------------------------------------------ PAG

export function PagSheet({ open, pag, onClose }: { open: boolean; pag?: PagResponse | null; onClose: () => void }) {
  const [name, setName] = useState(pag?.name ?? '')
  const { run, busy } = useAction()
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(pag ? `${name} güncellendi` : `${name} eklendi`, () => (pag ? pagApi.update(pag.id, name) : pagApi.add(name)), [keys.pags, keys.devices])
    if (ok !== undefined) onClose()
  }
  return (
    <Sheet open={open} title={pag ? 'PAG’i düzenle' : 'Yeni PAG'} onClose={onClose}>
      <form onSubmit={submit} className="stack" style={{ gap: 12 }}>
        <Field label="Ad" hint="Cihazların toplandığı grup, örneğin bir rack ya da alt sistem">
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </Field>
        <div className="form-actions">
          <Button onClick={onClose}>Vazgeç</Button>
          <Button type="submit" variant="primary" disabled={busy || !name.trim()}>{pag ? 'Kaydet' : 'PAG ekle'}</Button>
        </div>
      </form>
    </Sheet>
  )
}

// ------------------------------------------------------------------ PAG cihazı (fiziksel cihaz örneği)

export function PagDeviceSheet({ open, item, defaultPagId, onClose }: { open: boolean; item?: PagDeviceResponse | null; defaultPagId?: string; onClose: () => void }) {
  const pags = usePags()
  const devices = useDevices()
  const [f, setF] = useState({
    name: item?.name ?? '',
    ipAddress: item?.ipAddress ?? '',
    port: item?.port ?? 161,
    timeOut: item?.timeout ?? 3000,
    deviceId: item?.deviceId ?? '',
    pagId: item?.pagId ?? defaultPagId ?? '',
    inMaintenance: item ? isMaint(item) : false,
  })
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }))
  const { run, busy } = useAction()
  const deviceOptions = (devices.data ?? []).filter((d) => !f.pagId || d.pagId === f.pagId)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const model = { ...f, port: Number(f.port), timeOut: Number(f.timeOut) }
    const ok = await run(item ? `${f.name} güncellendi` : `${f.name} bağlandı`, () => {
      ensure(model.deviceId && model.pagId, 'PAG ve cihaz tanımı seçilmeli')
      return item ? pagDeviceApi.update({ ...model, id: item.id }) : pagDeviceApi.add(model)
    }, [keys.pagDevices])
    if (ok !== undefined) onClose()
  }
  return (
    <Sheet open={open} title={item ? `${item.name} düzenle` : 'Cihaz bağla'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <Field label="Ad" wide>
          <input value={f.name} onChange={(e) => set({ name: e.target.value })} required autoFocus placeholder="ACU-1" />
        </Field>
        <Field label="PAG">
          <select value={f.pagId} onChange={(e) => set({ pagId: e.target.value, deviceId: '' })} required>
            <option value="">Seç</option>
            {pags.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Cihaz tanımı" hint={deviceOptions.length === 0 ? 'Bu PAG’de tanım yok, önce cihaz tanımla' : undefined}>
          <select value={f.deviceId} onChange={(e) => set({ deviceId: e.target.value })} required>
            <option value="">Seç</option>
            {deviceOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="IP adresi">
          <input value={f.ipAddress} onChange={(e) => set({ ipAddress: e.target.value })} required placeholder="10.10.1.11" inputMode="decimal" />
        </Field>
        <Field label="Port">
          <input type="number" min={1} max={65535} value={f.port} onChange={(e) => set({ port: Number(e.target.value) })} required />
        </Field>
        <Field label="Zaman aşımı (ms)">
          <input type="number" min={100} step={100} value={f.timeOut} onChange={(e) => set({ timeOut: Number(e.target.value) })} required />
        </Field>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <label className="check">
            <input type="checkbox" checked={f.inMaintenance} onChange={(e) => set({ inMaintenance: e.target.checked })} />
            Bakımda (haberleşme kapalı)
          </label>
        </div>
        <div className="form-actions wide">
          <Button onClick={onClose}>Vazgeç</Button>
          <Button type="submit" variant="primary" disabled={busy}>{item ? 'Kaydet' : 'Cihazı bağla'}</Button>
        </div>
      </form>
    </Sheet>
  )
}

// ------------------------------------------------------------------ cihaz tanımı (SNMP / TCP)

type Kind = 'snmp' | 'tcp'
const newQuery = (): QueryModel => ({ query: '', parameterName: '', parameterId: crypto.randomUUID() })

export function DeviceSheet({ open, device, kind: initialKind, onClose }: { open: boolean; device?: DeviceResponse | null; kind?: Kind; onClose: () => void }) {
  const pags = usePags()
  const comm = parseComm(device?.communicationData)
  const [kind, setKind] = useState<Kind>(device ? (device.communicationType === 0 ? 'snmp' : 'tcp') : initialKind ?? 'snmp')
  const [f, setF] = useState({
    name: device?.name ?? '',
    pagId: device?.pagId ?? '',
    version: comm.Version ?? '',
    versionNote: comm.VersionNote ?? '',
    snmpVersion: comm.SNMPVersion ?? 2,
    readCommunity: comm.ReadCommunity ?? 'public',
    writeCommunity: comm.WriteCommunity ?? '',
  })
  const [queries, setQueries] = useState<QueryModel[]>(
    comm.Queries?.length ? comm.Queries.map((q) => ({ query: q.Query, parameterName: q.ParameterName, parameterId: q.ParameterId })) : [newQuery()],
  )
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }))
  const { run, busy } = useAction()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const qs = queries.filter((q) => q.query.trim() && q.parameterName.trim())
    const base = { name: f.name, pagId: f.pagId, version: f.version || null, versionNote: f.versionNote || null, queries: qs }
    const snmp = { ...base, snmpVersion: Number(f.snmpVersion) as 1 | 2 | 3, readCommunity: f.readCommunity, writeCommunity: f.writeCommunity || null }
    const ok = await run(device ? `${f.name} tanımı güncellendi` : `${f.name} tanımlandı`, () => {
      ensure(f.pagId, 'PAG seçilmeli')
      if (!device) return kind === 'snmp' ? deviceApi.addSnmp(snmp) : deviceApi.addTcp(base)
      if (kind === 'snmp') return deviceApi.updateSnmp({ ...snmp, id: device.id })
      return deviceApi.update({
        id: device.id,
        name: f.name,
        pagId: f.pagId,
        communicationType: 1,
        version: base.version,
        versionNote: base.versionNote,
        communicationData: JSON.stringify({
          Version: base.version,
          VersionNote: base.versionNote,
          Queries: qs.map((q) => ({ Query: q.query, ParameterId: q.parameterId, ParameterName: q.parameterName })),
        }),
      })
    }, [keys.devices, keys.pags, keys.pagDevices])
    if (ok !== undefined) onClose()
  }

  return (
    <Sheet open={open} wide title={device ? `${device.name} tanımı` : 'Cihaz tanımla'} onClose={onClose}>
      <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
        {!device && (
          <Seg label="Haberleşme" value={kind} onChange={setKind} options={[{ id: 'snmp', label: 'SNMP' }, { id: 'tcp', label: 'TCP' }]} />
        )}
        <div className="form-grid">
          <Field label="Ad">
            <input value={f.name} onChange={(e) => set({ name: e.target.value })} required autoFocus placeholder="LNA" />
          </Field>
          <Field label="PAG">
            <select value={f.pagId} onChange={(e) => set({ pagId: e.target.value })} required>
              <option value="">Seç</option>
              {pags.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Sürüm">
            <input value={f.version} onChange={(e) => set({ version: e.target.value })} placeholder="2.4.1" />
          </Field>
          <Field label="Sürüm notu">
            <input value={f.versionNote} onChange={(e) => set({ versionNote: e.target.value })} />
          </Field>
          {kind === 'snmp' && (
            <>
              <Field label="SNMP sürümü">
                <select value={f.snmpVersion} onChange={(e) => set({ snmpVersion: Number(e.target.value) })}>
                  <option value={1}>v1</option>
                  <option value={2}>v2c</option>
                  <option value={3}>v3</option>
                </select>
              </Field>
              <Field label="Okuma community">
                <input value={f.readCommunity} onChange={(e) => set({ readCommunity: e.target.value })} required />
              </Field>
              <Field label="Yazma community">
                <input value={f.writeCommunity} onChange={(e) => set({ writeCommunity: e.target.value })} />
              </Field>
            </>
          )}
        </div>
        <div className="panel-head">
          <h3>Parametreler</h3>
          <Button small onClick={() => setQueries((q) => [...q, newQuery()])}>Parametre ekle</Button>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          {kind === 'snmp' ? 'Her parametre bir OID ile okunur.' : 'Her parametre cihaza gönderilen bir sorgu komutuyla okunur.'} Alarm kuralları parametre kimliğine bağlanır.
        </p>
        <div className="stack">
          {queries.map((q, i) => (
            <div key={q.parameterId} className="strip" style={{ gridTemplateColumns: '1fr 1.4fr auto', alignItems: 'end', gap: 10, padding: '8px 10px' }}>
              <Field label="Parametre adı">
                <input value={q.parameterName} onChange={(e) => setQueries((all) => all.map((x, j) => (j === i ? { ...x, parameterName: e.target.value } : x)))} placeholder="sıcaklık" />
              </Field>
              <Field label={kind === 'snmp' ? 'OID' : 'Sorgu'}>
                <input value={q.query} onChange={(e) => setQueries((all) => all.map((x, j) => (j === i ? { ...x, query: e.target.value } : x)))} placeholder={kind === 'snmp' ? '1.3.6.1.4.1…' : 'TEMP?'} />
              </Field>
              <Button small variant="quiet" onClick={() => setQueries((all) => all.filter((_, j) => j !== i))} aria-label="Parametreyi kaldır">Kaldır</Button>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <Button onClick={onClose}>Vazgeç</Button>
          <Button type="submit" variant="primary" disabled={busy}>{device ? 'Kaydet' : 'Tanımla'}</Button>
        </div>
      </form>
    </Sheet>
  )
}

// ------------------------------------------------------------------ cron politikası

export function CronSheet({ open, cron, scriptId, onClose }: { open: boolean; cron?: CronPolicyResponse | null; scriptId?: string; onClose: () => void }) {
  const scripts = useScripts()
  const start = parseLocal(cron?.startAt) ?? new Date(Date.now() + 5 * 60_000)
  const end = parseLocal(cron?.endAt)
  const [f, setF] = useState({
    name: cron?.name ?? '',
    forOnce: cron?.forOnce ?? false,
    cronFormat: cron?.cronFormat ?? '*/30 * * * *',
    startAt: toInput(start),
    endAt: end ? toInput(end) : '',
    policyScriptId: cron?.policyScriptId ?? scriptId ?? '',
  })
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }))
  const { run, busy } = useAction()
  const valid = f.forOnce || cronValid(f.cronFormat)
  const preview = valid
    ? nextRuns({ forOnce: f.forOnce, cronFormat: f.forOnce ? null : f.cronFormat, startAt: f.startAt, endAt: f.endAt || null }, 4)
    : []
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const model = {
      name: f.name,
      forOnce: f.forOnce,
      cronFormat: f.forOnce ? null : f.cronFormat,
      startAt: toLocalIso(new Date(f.startAt)),
      endAt: f.endAt ? toLocalIso(new Date(f.endAt)) : null,
      policyScriptId: f.policyScriptId,
    }
    const ok = await run(cron ? `${f.name} güncellendi` : `${f.name} görevi oluşturuldu`, () => {
      ensure(model.policyScriptId, 'Script seçilmeli')
      return cron ? cronApi.update({ ...model, id: cron.id }) : cronApi.add(model)
    }, [keys.crons])
    if (ok !== undefined) onClose()
  }
  return (
    <Sheet open={open} title={cron ? `${cron.name} düzenle` : 'Yeni cron görevi'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <Field label="Ad" wide>
          <input value={f.name} onChange={(e) => set({ name: e.target.value })} required autoFocus />
        </Field>
        <Field label="Script" wide>
          <select value={f.policyScriptId} onChange={(e) => set({ policyScriptId: e.target.value })} required>
            <option value="">Seç</option>
            {scripts.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <div className="field wide">
          <Seg label="Tekrar" value={f.forOnce ? 'once' : 'cron'} onChange={(v) => set({ forOnce: v === 'once' })}
            options={[{ id: 'cron', label: 'Tekrarlı' }, { id: 'once', label: 'Bir kez' }]} />
        </div>
        {!f.forOnce && (
          <Field label="Cron ifadesi" wide hint={valid ? describeCron(f.cronFormat) : 'İfade okunamadı. Örnek: */15 * * * * ya da 0 2 * * *'}>
            <input value={f.cronFormat} onChange={(e) => set({ cronFormat: e.target.value })} required aria-invalid={!valid} />
          </Field>
        )}
        <Field label={f.forOnce ? 'Çalışma anı' : 'Başlangıç'}>
          <input type="datetime-local" value={f.startAt} onChange={(e) => set({ startAt: e.target.value })} required />
        </Field>
        <Field label="Bitiş" hint="Boş bırakılabilir">
          <input type="datetime-local" value={f.endAt} onChange={(e) => set({ endAt: e.target.value })} />
        </Field>
        {preview.length > 0 && (
          <p className="wide muted" style={{ fontSize: 13 }}>Sonraki çalışmalar: {preview.map((d) => fullLabel(d)).join(', ')}</p>
        )}
        <div className="form-actions wide">
          <Button onClick={onClose}>Vazgeç</Button>
          <Button type="submit" variant="primary" disabled={busy || !valid}>{cron ? 'Kaydet' : 'Görevi oluştur'}</Button>
        </div>
      </form>
    </Sheet>
  )
}

// ------------------------------------------------------------------ script adı (yeni script)

export function NewScriptSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const { run, busy } = useAction()
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const created = await run(`${name} scripti oluşturuldu`, () => scriptApi.add({ name, script: '// Script gövdesi\nWriteLogToConsole("Merhaba istasyon");\n' }), [keys.scripts])
    if (created) {
      onCreated(created.id)
      onClose()
    }
  }
  return (
    <Sheet open={open} title="Yeni script" onClose={onClose}>
      <form onSubmit={submit} className="stack" style={{ gap: 12 }}>
        <Field label="Ad">
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Anten park pozisyonu" />
        </Field>
        <div className="form-actions">
          <Button onClick={onClose}>Vazgeç</Button>
          <Button type="submit" variant="primary" disabled={busy || !name.trim()}>Oluştur</Button>
        </div>
      </form>
    </Sheet>
  )
}

// ------------------------------------------------------------------ kullanıcı

export function UserSheet({ open, user, onClose }: { open: boolean; user?: UserResponse | null; onClose: () => void }) {
  const [f, setF] = useState({
    userName: user?.userName ?? '',
    name: user?.name ?? '',
    surname: user?.surname ?? '',
    email: user?.email ?? '',
    password: '',
    roleId: user?.roleId ?? EMPTY_GUID,
  })
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }))
  const { run, busy } = useAction()
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(user ? `${f.userName} güncellendi` : `${f.userName} eklendi`, () => {
      if (user) {
        // Şifre alanı boşsa API mevcut hash'i korumaz; bu yüzden yeni şifre zorunlu tutuluyor.
        ensure(f.password, 'Güncelleme için şifre girilmeli')
        return userApi.update({ ...f, id: user.id })
      }
      return userApi.add(f)
    }, [keys.users])
    if (ok !== undefined) onClose()
  }
  return (
    <Sheet open={open} title={user ? `${user.userName} düzenle` : 'Yeni kullanıcı'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <Field label="Kullanıcı adı">
          <input value={f.userName} onChange={(e) => set({ userName: e.target.value })} required autoFocus autoComplete="off" />
        </Field>
        <Field label="E-posta">
          <input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} required />
        </Field>
        <Field label="Ad">
          <input value={f.name} onChange={(e) => set({ name: e.target.value })} required />
        </Field>
        <Field label="Soyad">
          <input value={f.surname} onChange={(e) => set({ surname: e.target.value })} required />
        </Field>
        <Field label={user ? 'Yeni şifre' : 'Şifre'}>
          <input type="password" value={f.password} onChange={(e) => set({ password: e.target.value })} required autoComplete="new-password" />
        </Field>
        <Field label="Rol kimliği" hint="Rol yönetimi API’de henüz yok; GUID olarak saklanır">
          <input value={f.roleId} onChange={(e) => set({ roleId: e.target.value })} required />
        </Field>
        <div className="form-actions wide">
          <Button onClick={onClose}>Vazgeç</Button>
          <Button type="submit" variant="primary" disabled={busy}>{user ? 'Kaydet' : 'Kullanıcı ekle'}</Button>
        </div>
      </form>
    </Sheet>
  )
}
