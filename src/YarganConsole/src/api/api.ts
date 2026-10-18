import axios from 'axios'
import { DEMO } from './demo'
import {
  data,
  deviceClient as dc,
  listOr404,
  loginClient,
  nullOr404,
  ruleClient as rc,
  satopsClient as sc,
  services,
  tokenStore,
  unwrapEnvelope,
  unwrapList,
  userClient as uc,
  type ServiceName,
} from './http'
import type {
  ActiveTleResponse,
  AddCronPolicyModel,
  AddPagDeviceModel,
  AddSatellitePassModel,
  AddScriptModel,
  AddSnmpDeviceModel,
  AddTcpDeviceModel,
  AddTleModel,
  AddUserModel,
  ApiEnvelope,
  CronPolicyResponse,
  DeviceResponse,
  Guid,
  PagDeviceResponse,
  PagResponse,
  PolicyScriptResponse,
  SatellitePassFromTle,
  SatellitePassResponse,
  TleResponse,
  UpdateCronPolicyModel,
  UpdateDeviceModel,
  UpdatePagDeviceModel,
  UpdateScriptModel,
  UpdateUserModel,
  UserResponse,
} from './types'

type Env<T> = ApiEnvelope<T>

// ------------------------------------------------------------------ Login API

function normalizeToken(raw: unknown): string {
  let token = typeof raw === 'string' ? raw.trim() : ''
  if (token.startsWith('"') && token.endsWith('"')) {
    try {
      token = JSON.parse(token) as string
    } catch {
      token = token.slice(1, -1)
    }
  }
  return token
}

export async function login(username: string, password: string): Promise<string> {
  const { data: body } = await loginClient.post('/Login/Login', { username, password }, {
    responseType: 'text',
    transformResponse: (b: unknown) => b,
  })
  const token = normalizeToken(body)
  if (token.split('.').length !== 3) throw new Error('Login API geçerli bir token döndürmedi.')
  return token
}

/** JWT içindeki kullanıcı adını okur (imza doğrulanmaz, yalnızca gösterim için). */
export function tokenUser(token: string | null): { name: string; expires: Date | null } | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const name =
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? payload.unique_name ?? payload.sub ?? 'operatör'
    return { name, expires: payload.exp ? new Date(payload.exp * 1000) : null }
  } catch {
    return { name: 'operatör', expires: null }
  }
}

// ------------------------------------------------------------------ Sağlık

export interface HealthResult {
  service: ServiceName
  ok: boolean
  latencyMs: number
}

export async function checkHealth(service: ServiceName): Promise<HealthResult> {
  const started = performance.now()
  if (DEMO) return { service, ok: true, latencyMs: 8 + Math.round(Math.random() * 30) }
  const token = tokenStore.get()
  try {
    const res = await axios.get(`/svc/${service}/health`, {
      timeout: 5000,
      responseType: 'text',
      validateStatus: () => true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    return { service, ok: res.status >= 200 && res.status < 300, latencyMs: Math.round(performance.now() - started) }
  } catch {
    return { service, ok: false, latencyMs: Math.round(performance.now() - started) }
  }
}

export const checkAllHealth = () => Promise.all(services.map((s) => checkHealth(s.name)))

// ------------------------------------------------------------------ Device API

export const deviceApi = {
  getAll: () => unwrapList(dc.get<Env<DeviceResponse[]>>('/Device/getall')),
  getById: (id: Guid) => unwrapEnvelope(dc.get<Env<DeviceResponse>>(`/Device/getbyid/${id}`)),
  getSnmp: () => unwrapList(dc.get<Env<DeviceResponse[]>>('/Device/getsnmpdevices')),
  getTcp: () => unwrapList(dc.get<Env<DeviceResponse[]>>('/Device/gettcpdevices')),
  addSnmp: (m: AddSnmpDeviceModel) => unwrapEnvelope(dc.post<Env<DeviceResponse>>('/Device/addsnmpdevice', m)),
  addTcp: (m: AddTcpDeviceModel) => unwrapEnvelope(dc.post<Env<DeviceResponse>>('/Device', m)),
  update: (m: UpdateDeviceModel) => unwrapEnvelope(dc.put<Env<DeviceResponse>>('/Device/update', m)),
  updateSnmp: (m: AddSnmpDeviceModel & { id: Guid }) =>
    unwrapEnvelope(dc.put<Env<DeviceResponse>>('/Device/updatesnmpdevice', m)),
  remove: (id: Guid) => unwrapEnvelope(dc.delete<Env<boolean>>('/Device', { params: { id } })),
}

export const pagApi = {
  getAll: () => unwrapList(dc.get<Env<PagResponse[]>>('/Pag/getall')),
  getByDeviceId: (deviceId: Guid) => unwrapEnvelope(dc.get<Env<PagResponse>>(`/Pag/getbydeviceid/${deviceId}`)),
  add: (name: string) => unwrapEnvelope(dc.post<Env<PagResponse>>('/Pag', { name })),
  update: (id: Guid, name: string) => unwrapEnvelope(dc.put<Env<PagResponse>>('/Pag', { id, name })),
  remove: (id: Guid) => unwrapEnvelope(dc.delete<Env<boolean>>('/Pag', { params: { id } })),
}

export const pagDeviceApi = {
  getAll: () => unwrapList(dc.get<Env<PagDeviceResponse[]>>('/PagDevice/getall')),
  /** Bakımda olmayan, DCM'nin haberleştiği cihazlar. */
  getActive: () => unwrapList(dc.get<Env<PagDeviceResponse[]>>('/PagDevice/getactive')),
  getById: (id: Guid) => unwrapEnvelope(dc.get<Env<PagDeviceResponse>>(`/PagDevice/getbyid/${id}`)),
  getByPagId: (pagId: Guid) => unwrapList(dc.get<Env<PagDeviceResponse[]>>(`/PagDevice/getbypagid/${pagId}`)),
  getByDeviceId: (deviceId: Guid) =>
    unwrapList(dc.get<Env<PagDeviceResponse[]>>(`/PagDevice/getbydeviceid/${deviceId}`)),
  add: (m: AddPagDeviceModel) => unwrapEnvelope(dc.post<Env<PagDeviceResponse>>('/PagDevice', m)),
  update: (m: UpdatePagDeviceModel) => unwrapEnvelope(dc.put<Env<PagDeviceResponse>>('/PagDevice/update', m)),
  startOrStop: (id: Guid, isStart: boolean) =>
    unwrapEnvelope(dc.put<Env<boolean>>('/PagDevice/startorstop', null, { params: { id, isStart } })),
  startOrStopMany: (ids: Guid[], isStart: boolean) =>
    unwrapEnvelope(dc.put<Env<boolean>>('/PagDevice/startorstopmulti', ids, { params: { isStart } })),
  remove: (id: Guid) => unwrapEnvelope(dc.delete<Env<boolean>>('/PagDevice', { params: { id } })),
}

export const inMaintenance = (d: PagDeviceResponse) => Boolean(d.inMaintenance ?? d.inMaitenance)

// ------------------------------------------------------------------ Rule API

export const scriptApi = {
  getAll: () => listOr404(rc.get<PolicyScriptResponse[]>('/PolicyScript/getall')),
  getById: (id: Guid) => data(rc.get<PolicyScriptResponse>(`/PolicyScript/getbyid/${id}`)),
  add: (m: AddScriptModel) => data(rc.post<PolicyScriptResponse>('/PolicyScript/add', m)),
  update: (m: UpdateScriptModel) => data(rc.put<PolicyScriptResponse>('/PolicyScript/update', m)),
  /** Script'i bir kez çalıştırır (Rule Engine'e RuleEngine/RunForOnce gider). */
  run: (id: Guid) => data(rc.put<boolean>(`/PolicyScript/runpolicyscript/${id}`)),
  remove: (id: Guid) => data(rc.delete<boolean>(`/PolicyScript/delete/${id}`)),
}

export const cronApi = {
  getAll: () => listOr404(rc.get<CronPolicyResponse[]>('/CronPolicy/getall')),
  getActive: () => listOr404(rc.get<CronPolicyResponse[]>('/CronPolicy/getactivejobs')),
  getById: (id: Guid) => data(rc.get<CronPolicyResponse>(`/CronPolicy/getbyid/${id}`)),
  add: (m: AddCronPolicyModel) => data(rc.post<CronPolicyResponse>('/CronPolicy/add', m)),
  update: (m: UpdateCronPolicyModel) => data(rc.put<CronPolicyResponse>('/CronPolicy/update', m)),
  startOrStop: (id: Guid, isStart: boolean) => data(rc.put<boolean>(`/CronPolicy/startorstop/${id},${isStart}`)),
  remove: (id: Guid) => data(rc.delete<boolean>(`/CronPolicy/delete/${id}`)),
}

// ------------------------------------------------------------------ Satops API

export const passApi = {
  getAll: () => listOr404(sc.get<SatellitePassResponse[]>('/SatellitePass/getallpasses')),
  getById: (id: Guid) => data(sc.get<SatellitePassResponse>(`/SatellitePass/getpassbyid/${id}`)),
  add: (m: AddSatellitePassModel) => data(sc.post<SatellitePassResponse>('/SatellitePass/addpass', m)),
  /** Birden çok geçişi planlamaya ekler (backend'deki adı "getpassbyrange"). */
  addMany: (m: AddSatellitePassModel[]) => data(sc.post<SatellitePassResponse[]>('/SatellitePass/getpassbyrange', m)),
  /** Otomatik planlayıcıyı başlatır ya da durdurur. Durumu sorgulayan bir uç yok. */
  autoSchedule: (status: boolean) => data(sc.put<boolean>('/SatellitePass/autostartorstop', null, { params: { status } })),
}

export const tleApi = {
  get: () => nullOr404(sc.get<TleResponse>('/Tle')),
  /** Mevcut yapılandırmanın yerine geçer ve hesaplanan geçişleri döndürür. */
  save: (m: AddTleModel) => data(sc.post<SatellitePassFromTle[]>('/Tle', m)),
  passes: () => listOr404(sc.get<SatellitePassFromTle[]>('/Tle/gettlewithpasses')),
  search: (satelliteName: string) =>
    listOr404(sc.get<ActiveTleResponse[]>('/Tle/getactivetle', { params: { satelliteName } })),
}

// ------------------------------------------------------------------ User API

export const userApi = {
  getAll: () => data(uc.get<UserResponse[] | null>('/User/GetAllUser')).then((u) => u ?? []),
  getById: (id: Guid) => data(uc.get<UserResponse>(`/User/GetUserById/${id}`)),
  add: (m: AddUserModel) => data(uc.post<UserResponse>('/User/AddUser', m)),
  update: (m: UpdateUserModel) => data(uc.put<UserResponse>('/User/UpdateUser', m)),
  remove: (id: Guid) => data(uc.delete(`/User/DeleteUser/${id}`)).then(() => true),
}
