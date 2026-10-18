// Demo modu (npm run dev:demo): API'ler olmadan, tarayıcı içinde tutulan örnek verilerle çalışır.
// Yanıt şekilleri gerçek API'lerle aynıdır; Device API zarfı ve 404 davranışı da taklit edilir.
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type {
  CronPolicyResponse,
  DeviceResponse,
  PagDeviceResponse,
  PagResponse,
  PolicyScriptResponse,
  SatellitePassFromTle,
  SatellitePassResponse,
  TleResponse,
  UserResponse,
} from './types'

export const DEMO = import.meta.env.VITE_DEMO === 'true'

const uid = () => crypto.randomUUID()
const MIN = 60_000
/** Backend saatleri "timestamp without time zone" olarak, yerel saatle döndürür. */
const local = (t: number) => {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const now = Date.now()
/** Demo TLE satırlarının son hanesini doğru checksum ile değiştirir. */
const sum = (line: string) => {
  const body = line.padEnd(68).slice(0, 68)
  let n = 0
  for (const ch of body) n += ch >= '0' && ch <= '9' ? Number(ch) : ch === '-' ? 1 : 0
  return body + (n % 10)
}
const sats = ['NOAA 19', 'NOAA 18', 'METEOR-M2 3', 'ISS (ZARYA)', 'FENGYUN 3D', 'NOAA 15']

// --------------------------------------------------------------- Satops
function buildPasses(): SatellitePassResponse[] {
  const list: SatellitePassResponse[] = []
  let t = now - 7 * 60 * MIN
  let i = 0
  while (t < now + 30 * 60 * MIN) {
    const dur = 6 + ((i * 7) % 9)
    const aos = t
    const los = aos + dur * MIN
    let status: number = 0
    if (los < now) status = i % 7 === 3 ? 4 : i % 5 === 2 ? 6 : 3
    else if (aos <= now) status = 2
    else if (aos < now + 6 * 60 * MIN) status = i % 6 === 4 ? 6 : 1
    list.push({
      id: uid(),
      name: sats[i % sats.length],
      duration: dur,
      aos: local(aos),
      los: local(los),
      isTracked: status !== 6,
      status: status as SatellitePassResponse['status'],
      updateDate: local(now - 3600_000),
      isImportant: i % 4 === 0,
    })
    t = los + (35 + ((i * 23) % 70)) * MIN
    if (i === 3) t = now - 4 * MIN // biri şu an takipte olsun
    i++
  }
  return list
}

const db = {
  passes: buildPasses(),
  tle: {
    id: uid(),
    name: 'Gölbaşı istasyonu',
    latitude: 39.789,
    longitude: 32.81,
    altitude: 1050,
    minElevation: 10,
    setupInterval: 120,
    tleData: [
      {
        satelliteName: 'NOAA 19',
        line1: sum('1 33591U 09005A   26290.51782528  .00000045  00000-0  48261-4 0  9994'),
        line2: sum('2 33591  99.0298 345.1201 0013925 222.6049 137.4054 14.12924310912286'),
      },
      {
        satelliteName: 'METEOR-M2 3',
        line1: sum('1 57166U 23091A   26290.48211934  .00000021  00000-0  28456-4 0  9991'),
        line2: sum('2 57166  98.6204 349.8822 0003212 102.4133 257.7401 14.24021365172410'),
      },
    ],
  } as TleResponse,
  scripts: [] as PolicyScriptResponse[],
  crons: [] as CronPolicyResponse[],
  pags: [] as PagResponse[],
  devices: [] as DeviceResponse[],
  pagDevices: [] as PagDeviceResponse[],
  users: [
    { id: uid(), userName: 'harun', name: 'Harun', surname: 'Kırtay', email: 'harun@yargan.local', roleId: uid() },
    { id: uid(), userName: 'gece.op', name: 'Elif', surname: 'Demir', email: 'elif@yargan.local', roleId: uid() },
    { id: uid(), userName: 'rf.muhendis', name: 'Kerem', surname: 'Aksoy', email: 'kerem@yargan.local', roleId: uid() },
  ] as UserResponse[],
}

const script = (name: string, body: string, hoursAgo: number): PolicyScriptResponse => ({
  id: uid(),
  name,
  script: body,
  updateDate: local(now - hoursAgo * 3600_000),
})

db.scripts = [
  script(
    'Anten park pozisyonu',
    `// Geçiş bittikten sonra anteni güvenli konuma alır
SendMqttMessage("Satops/Jobs", "Antenna parking");
SendCommand("ACU-1", "P 0 90");
WriteLogToConsole("Anten park pozisyonunda.");`,
    30,
  ),
  script(
    'RF zinciri sağlık kontrolü',
    `// LNA ve modem değerlerini okur, eşik dışıysa uyarır
var lnaTemp = GetData("lna.temperature");
var lock = GetData("modem.lock");
if (lnaTemp > 55) SendMqttMessage("RuleEngine/Warning", $"LNA sıcak: {lnaTemp}");
if (lock == 0) SendMqttMessage("RuleEngine/Warning", "Modem kilidi yok");
WriteLogToConsole($"LNA {lnaTemp} C, kilit {lock}");`,
    5,
  ),
  script(
    'Varsayılan geçiş scripti',
    `// Otomatik planlayıcı her geçiş için bu scripti temel alır
SendCommand("ACU-1", "TRACK ON");
SendCommand("Modem-1", "RX START");
WriteLogToConsole("Takip başladı.");`,
    72,
  ),
]

const cron = (name: string, s: PolicyScriptResponse, cronFormat: string | null, startOffsetMin: number, endOffsetMin: number | null, running: boolean): CronPolicyResponse => ({
  id: uid(),
  name,
  cronFormat,
  forOnce: cronFormat === null,
  policyScriptId: s.id,
  policyScript: { id: s.id, name: s.name, script: s.script },
  updateDate: local(now - 2 * 3600_000),
  startAt: local(now + startOffsetMin * MIN),
  endAt: endOffsetMin === null ? null : local(now + endOffsetMin * MIN),
  isRunning: running,
})

db.crons = [
  cron('RF sağlık turu', db.scripts[1], '*/30 * * * *', -600, null, true),
  cron('Gece anten parkı', db.scripts[0], '0 2 * * *', -2000, null, true),
  ...db.passes
    .filter((p) => p.status === 1 || p.status === 2)
    .map((p) =>
      cron(`${p.name}_${p.aos.slice(11, 16)}`, db.scripts[2], null,
        (new Date(p.aos).getTime() - now) / MIN - 2, (new Date(p.los).getTime() - now) / MIN, true),
    ),
  cron('Haftalık kalibrasyon', db.scripts[1], '0 10 * * 1', -9000, null, false),
]

const pagA = { id: uid(), name: 'PAG-A anten sistemi', deviceId: [] as string[], device: null }
const pagB = { id: uid(), name: 'PAG-B RF zinciri', deviceId: [] as string[], device: null }
db.pags = [pagA, pagB]

const comm = (type: 'snmp' | 'tcp', params: string[]) =>
  JSON.stringify(
    type === 'snmp'
      ? { SNMPVersion: 2, ReadCommunity: 'public', WriteCommunity: 'private', Queries: params.map((p, i) => ({ Query: `1.3.6.1.4.1.5000.${i + 1}.0`, ParameterId: uid(), ParameterName: p })) }
      : { Queries: params.map((p) => ({ Query: p.toUpperCase().replace(/ /g, '_') + '?', ParameterId: uid(), ParameterName: p })) },
  )

const dev = (name: string, pag: typeof pagA, type: 0 | 1, params: string[]): DeviceResponse => ({
  id: uid(),
  name,
  pagId: pag.id,
  pag: { id: pag.id, name: pag.name },
  communicationType: type,
  communicationData: comm(type === 0 ? 'snmp' : 'tcp', params),
})

db.devices = [
  dev('ACU anten kontrolcüsü', pagA, 0, ['azimuth', 'elevation', 'servo durum']),
  dev('Rotator', pagA, 1, ['pozisyon', 'hız']),
  dev('LNA', pagB, 0, ['sıcaklık', 'kazanç', 'akım']),
  dev('Demodülatör', pagB, 1, ['kilit', 'snr', 'ber']),
  dev('Frekans çevirici', pagB, 0, ['lo kilidi', 'çıkış gücü']),
]
pagA.deviceId = db.devices.filter((d) => d.pagId === pagA.id).map((d) => d.id)
pagB.deviceId = db.devices.filter((d) => d.pagId === pagB.id).map((d) => d.id)

const pd = (name: string, d: DeviceResponse, ip: string, port: number, maint: boolean): PagDeviceResponse => ({
  id: uid(),
  name,
  deviceId: d.id,
  device: { id: d.id, name: d.name, communicationType: d.communicationType, communicationData: d.communicationData, pagId: d.pagId },
  pagId: d.pagId,
  pag: d.pag,
  inMaitenance: maint,
  ipAddress: ip,
  port,
  timeout: 3000,
})

db.pagDevices = [
  pd('ACU-1', db.devices[0], '10.10.1.11', 161, false),
  pd('ROT-1', db.devices[1], '10.10.1.20', 4533, false),
  pd('ROT-2 yedek', db.devices[1], '10.10.1.21', 4533, true),
  pd('LNA-1', db.devices[2], '10.10.2.11', 161, false),
  pd('LNA-2', db.devices[2], '10.10.2.12', 161, false),
  pd('Modem-1', db.devices[3], '10.10.2.30', 5025, false),
  pd('BDC-1', db.devices[4], '10.10.2.40', 161, true),
]

// --------------------------------------------------------------- yönlendirme
type Handler = (m: string[], body: any, params: any) => unknown
type Route = [method: string, pattern: RegExp, handler: Handler, envelope?: boolean]

const notFound = Symbol('404')
const env = (result: unknown, message: string | null = null) =>
  result === null || (Array.isArray(result) && result.length === 0)
    ? { status: 404, message: message ?? 'Kayıt bulunamadı', result: null }
    : { status: 200, message: null, result }
const removeById = <T extends { id: string }>(list: T[], id: string) => {
  const i = list.findIndex((x) => x.id === id)
  if (i >= 0) list.splice(i, 1)
  return i >= 0
}

function predicted(): SatellitePassFromTle[] {
  // Planlanmış geçişlerin arasına düşen SGP4 tahminleri (demo için sentetik)
  return db.passes
    .filter((p) => new Date(p.aos).getTime() > now)
    .map((p, i) => {
      const aos = new Date(p.los).getTime() + (18 + (i % 3) * 7) * MIN
      const dur = 5 + (i % 6)
      return { name: sats[(i + 2) % sats.length], aos: local(aos), los: local(aos + dur * MIN), duration: dur }
    })
}

const routes: Record<string, Route[]> = {
  login: [['post', /^\/Login\/Login$/, (_m, b) => fakeJwt(b?.username || 'harun')]],
  user: [
    ['get', /^\/User\/GetAllUser$/, () => db.users],
    ['get', /^\/User\/GetUserById\/(.+)$/, ([id]) => db.users.find((u) => u.id === id) ?? notFound],
    ['post', /^\/User\/AddUser$/, (_m, b) => (db.users.push({ ...b, id: uid() }), db.users.at(-1))],
    ['put', /^\/User\/UpdateUser$/, (_m, b) => Object.assign(db.users.find((u) => u.id === b.id) ?? {}, b)],
    ['delete', /^\/User\/DeleteUser\/(.+)$/, ([id]) => removeById(db.users, id) || notFound],
  ],
  satops: [
    ['get', /^\/SatellitePass\/getallpasses$/, () => (db.passes.length ? db.passes : notFound)],
    ['get', /^\/SatellitePass\/getpassbyid\/(.+)$/, ([id]) => db.passes.find((p) => p.id === id) ?? notFound],
    ['post', /^\/SatellitePass\/addpass$/, (_m, b) => addPass(b)],
    ['post', /^\/SatellitePass\/getpassbyrange$/, (_m, b) => (b as any[]).map(addPass)],
    ['put', /^\/SatellitePass\/autostartorstop$/, (_m, _b, p) => {
      const on = String(p?.status) === 'true'
      db.passes.forEach((x) => {
        if (on && x.status === 0 && new Date(x.aos).getTime() > Date.now()) x.status = 1
        if (!on && (x.status === 0 || x.status === 1)) x.status = 5
      })
      demoEmit('Satops/Jobs', on ? 'Auto Scheduler Started' : 'All Passes Canceled')
      return true
    }],
    ['get', /^\/Tle$/, () => db.tle ?? notFound],
    ['post', /^\/Tle$/, (_m, b) => (db.tle = { ...b, id: uid() }, predicted())],
    ['get', /^\/Tle\/gettlewithpasses$/, () => predicted()],
    ['get', /^\/Tle\/getactivetle$/, (_m, _b, p) => {
      const q = String(p?.satelliteName ?? '').toUpperCase()
      const hits = [...sats, 'NOAA 20', 'METOP-B', 'METOP-C', 'TERRA', 'AQUA']
        .filter((s) => s.includes(q))
        .map((s, i) => ({
          satelliteName: s,
          line1: sum(`1 ${String(25000 + i * 777).padStart(5, '0')}U 98030A   26290.50000000  .00000040  00000-0  40000-4 0  999${i % 10}`),
          line2: sum(`2 ${String(25000 + i * 777).padStart(5, '0')}  98.7000 340.0000 0012000 200.0000 160.0000 14.2000000040000${i % 10}`),
        }))
      return hits.length ? hits : notFound
    }],
  ],
  rule: [
    ['get', /^\/PolicyScript\/getall$/, () => (db.scripts.length ? db.scripts : notFound)],
    ['get', /^\/PolicyScript\/getbyid\/(.+)$/, ([id]) => db.scripts.find((s) => s.id === id) ?? notFound],
    ['post', /^\/PolicyScript\/add$/, (_m, b) => (db.scripts.push({ ...b, id: uid(), updateDate: local(Date.now()) }), db.scripts.at(-1))],
    ['put', /^\/PolicyScript\/update$/, (_m, b) => Object.assign(db.scripts.find((s) => s.id === b.id) ?? {}, b, { updateDate: local(Date.now()) })],
    ['put', /^\/PolicyScript\/runpolicyscript\/(.+)$/, ([id]) => {
      const s = db.scripts.find((x) => x.id === id)
      demoEmit('RuleEngine/RunForOnce', s?.id ?? id)
      setTimeout(() => demoEmit('Satops/Jobs', `${s?.name ?? 'Script'} tamamlandı`), 1400)
      return true
    }],
    ['delete', /^\/PolicyScript\/delete\/(.+)$/, ([id]) => removeById(db.scripts, id)],
    ['get', /^\/CronPolicy\/getall$/, () => db.crons],
    ['get', /^\/CronPolicy\/getactivejobs$/, () => db.crons.filter((c) => c.isRunning)],
    ['get', /^\/CronPolicy\/getbyid\/(.+)$/, ([id]) => db.crons.find((c) => c.id === id) ?? notFound],
    ['post', /^\/CronPolicy\/add$/, (_m, b) => {
      const s = db.scripts.find((x) => x.id === b.policyScriptId)
      db.crons.push({ ...b, id: uid(), isRunning: false, updateDate: local(Date.now()), policyScript: s ? { id: s.id, name: s.name, script: s.script } : null })
      return db.crons.at(-1)
    }],
    ['put', /^\/CronPolicy\/update$/, (_m, b) => Object.assign(db.crons.find((c) => c.id === b.id) ?? {}, b)],
    ['put', /^\/CronPolicy\/startorstop\/([^,]+),(true|false)$/, ([id, on]) => {
      const c = db.crons.find((x) => x.id === id)
      if (!c) return notFound
      c.isRunning = on === 'true'
      demoEmit(c.isRunning ? 'RuleEngine/Run' : 'RuleEngine/DeleteCronJob', c.id)
      return true
    }],
    ['delete', /^\/CronPolicy\/delete\/(.+)$/, ([id]) => removeById(db.crons, id)],
  ],
  device: [
    ['get', /^\/Device\/getall$/, () => env(db.devices), true],
    ['get', /^\/Device\/getbyid\/(.+)$/, ([id]) => env(db.devices.find((d) => d.id === id) ?? null), true],
    ['get', /^\/Device\/getsnmpdevices$/, () => env(db.devices.filter((d) => d.communicationType === 0)), true],
    ['get', /^\/Device\/gettcpdevices$/, () => env(db.devices.filter((d) => d.communicationType === 1)), true],
    ['post', /^\/Device\/addsnmpdevice$/, (_m, b) => env(addDevice(b, 0)), true],
    ['post', /^\/Device$/, (_m, b) => env(addDevice(b, 1)), true],
    ['put', /^\/Device\/update$/, (_m, b) => env(Object.assign(db.devices.find((d) => d.id === b.id) ?? {}, b)), true],
    ['put', /^\/Device\/updatesnmpdevice$/, (_m, b) => {
      const d = db.devices.find((x) => x.id === b.id)
      if (!d) return env(null)
      const { id: _id, name, pagId, ...rest } = b
      Object.assign(d, { name, pagId, communicationData: JSON.stringify(pascal(rest)) })
      return env(d)
    }, true],
    ['delete', /^\/Device$/, (_m, _b, p) => env(removeById(db.devices, p.id) || null), true],
    ['get', /^\/Pag\/getall$/, () => env(db.pags), true],
    ['get', /^\/Pag\/getbydeviceid\/(.+)$/, ([id]) => env(db.pags.find((p) => p.deviceId?.includes(id)) ?? null), true],
    ['post', /^\/Pag$/, (_m, b) => (db.pags.push({ id: uid(), name: b.name, deviceId: [], device: null }), env(db.pags.at(-1))), true],
    ['put', /^\/Pag$/, (_m, b) => env(Object.assign(db.pags.find((p) => p.id === b.id) ?? {}, b)), true],
    ['delete', /^\/Pag$/, (_m, _b, p) => env(removeById(db.pags, p.id) || null), true],
    ['get', /^\/PagDevice\/getall$/, () => env(db.pagDevices), true],
    ['get', /^\/PagDevice\/getactive$/, () => env(db.pagDevices.filter((d) => !d.inMaitenance)), true],
    ['get', /^\/PagDevice\/getbyid\/(.+)$/, ([id]) => env(db.pagDevices.find((d) => d.id === id) ?? null), true],
    ['get', /^\/PagDevice\/getbypagid\/(.+)$/, ([id]) => env(db.pagDevices.filter((d) => d.pagId === id)), true],
    ['get', /^\/PagDevice\/getbydeviceid\/(.+)$/, ([id]) => env(db.pagDevices.filter((d) => d.deviceId === id)), true],
    ['post', /^\/PagDevice$/, (_m, b) => env(addPagDevice(b)), true],
    ['put', /^\/PagDevice\/update$/, (_m, b) => {
      const d = db.pagDevices.find((x) => x.id === b.id)
      if (!d) return env(null)
      const device = db.devices.find((x) => x.id === b.deviceId)
      Object.assign(d, { name: b.name, ipAddress: b.ipAddress, port: b.port, timeout: b.timeOut, inMaitenance: b.inMaintenance, deviceId: b.deviceId, pagId: b.pagId, device: device ?? d.device })
      return env(d)
    }, true],
    ['put', /^\/PagDevice\/startorstop$/, (_m, _b, p) => env(toggle([p.id], String(p.isStart) === 'true')), true],
    ['put', /^\/PagDevice\/startorstopmulti$/, (_m, b, p) => env(toggle(b, String(p.isStart) === 'true')), true],
    ['delete', /^\/PagDevice$/, (_m, _b, p) => {
      const d = db.pagDevices.find((x) => x.id === p.id)
      if (d) demoEmit('DCM/DeleteDevice', JSON.stringify({ Id: d.id, Name: d.name }))
      return env(removeById(db.pagDevices, p.id) || null)
    }, true],
  ],
}

function pascal(o: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(o)) {
    const key = k === 'snmpVersion' ? 'SNMPVersion' : k[0].toUpperCase() + k.slice(1)
    out[key] = Array.isArray(v) ? v.map((x) => (typeof x === 'object' ? pascal(x) : x)) : v
  }
  return out
}

function addPass(b: any): SatellitePassResponse {
  const p: SatellitePassResponse = { id: uid(), name: b.name, duration: b.duration, aos: b.aos, los: b.los, isTracked: false, status: 0, updateDate: local(Date.now()), isImportant: !!b.isImportant }
  db.passes.push(p)
  db.passes.sort((a, c) => a.aos.localeCompare(c.aos))
  return p
}

function addDevice(b: any, type: 0 | 1): DeviceResponse {
  const pag = db.pags.find((p) => p.id === b.pagId)
  const { name, pagId, ...rest } = b
  const d: DeviceResponse = { id: uid(), name, pagId, pag: pag ? { id: pag.id, name: pag.name } : null, communicationType: type, communicationData: JSON.stringify(pascal(rest)) }
  db.devices.push(d)
  pag?.deviceId?.push(d.id)
  return d
}

function addPagDevice(b: any): PagDeviceResponse {
  const device = db.devices.find((d) => d.id === b.deviceId)
  const pag = db.pags.find((p) => p.id === b.pagId)
  const d: PagDeviceResponse = {
    id: uid(), name: b.name, deviceId: b.deviceId, pagId: b.pagId, ipAddress: b.ipAddress, port: b.port, timeout: b.timeOut,
    inMaitenance: b.inMaintenance,
    device: device ? { id: device.id, name: device.name, communicationType: device.communicationType, communicationData: device.communicationData, pagId: device.pagId } : null,
    pag: pag ? { id: pag.id, name: pag.name } : null,
  }
  db.pagDevices.push(d)
  return d
}

function toggle(ids: string[], isStart: boolean) {
  const hit = db.pagDevices.filter((d) => ids.includes(d.id))
  hit.forEach((d) => (d.inMaitenance = !isStart))
  demoEmit('DCM/StartOrStopCommunication', JSON.stringify(hit.map((d) => ({ Id: d.id, Name: d.name, IsStart: isStart }))))
  return hit.length > 0
}

function fakeJwt(name: string) {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: name, unique_name: name, exp: Math.floor(Date.now() / 1000) + 7200 })}.demo`
}

// Demo olayları: lib/events.ts bu kancayı dinler
type Emit = (topic: string, payload: string) => void
let emitter: Emit | null = null
export function onDemoEvent(fn: Emit | null) {
  emitter = fn
}
export function demoEmit(topic: string, payload: string) {
  setTimeout(() => emitter?.(topic, payload), 250)
}

export function demoAdapter(service: string): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    await new Promise((r) => setTimeout(r, 120 + Math.random() * 180))
    const method = (config.method ?? 'get').toLowerCase()
    const url = (config.url ?? '').replace(/^\/+/, '/').split('?')[0]
    const body = typeof config.data === 'string' && config.data ? JSON.parse(config.data) : config.data
    const respond = (status: number, payload: unknown): AxiosResponse => {
      const res = { data: payload, status, statusText: String(status), headers: {}, config, request: {} } as AxiosResponse
      if (status >= 400) {
        const err: any = new Error(`Request failed with status code ${status}`)
        err.isAxiosError = true
        err.response = res
        err.config = config
        throw err
      }
      return res
    }
    for (const [m, pattern, handler] of routes[service] ?? []) {
      if (m !== method) continue
      const match = url.match(pattern)
      if (!match) continue
      const result = handler(match.slice(1), body, config.params ?? {})
      if (result === notFound) return respond(404, 'Kayıt bulunamadı')
      return respond(200, result)
    }
    return respond(404, `Demo: ${method.toUpperCase()} ${url} tanımlı değil`)
  }
}
