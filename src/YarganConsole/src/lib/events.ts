import { useSyncExternalStore } from 'react'
import { DEMO, onDemoEvent } from '../api/demo'

export type EventKind = 'mqtt' | 'action' | 'error'
export interface StationEvent {
  id: number
  at: Date
  kind: EventKind
  topic: string
  text: string
}
export type LinkState = 'bağlanıyor' | 'bağlı' | 'kopuk' | 'demo'

let seq = 0
let events: StationEvent[] = []
let link = (DEMO ? 'demo' : 'bağlanıyor') as LinkState
const listeners = new Set<() => void>()
const topicListeners = new Set<(topic: string, payload: string) => void>()
const notify = () => listeners.forEach((l) => l())

export function pushEvent(kind: EventKind, topic: string, text: string) {
  events = [{ id: ++seq, at: new Date(), kind, topic, text }, ...events].slice(0, 400)
  notify()
}

export const logAction = (text: string) => pushEvent('action', 'arayüz', text)
export const logError = (text: string) => pushEvent('error', 'arayüz', text)

/** Gelen MQTT mesajlarını dinler (ör. ilgili sorguları yenilemek için). */
export function onTopic(fn: (topic: string, payload: string) => void) {
  topicListeners.add(fn)
  return () => {
    topicListeners.delete(fn)
  }
}

function receive(topic: string, payload: string) {
  pushEvent('mqtt', topic, payload.length > 240 ? `${payload.slice(0, 240)}…` : payload)
  topicListeners.forEach((l) => l(topic, payload))
}

let started = false
export function startEventStream() {
  if (started) return
  started = true
  if (DEMO) {
    onDemoEvent(receive)
    const samples: [string, string][] = [
      ['RuleEngine/Warning', 'LNA-1 sıcaklık 51.2 °C'],
      ['Satops/Jobs', 'NOAA 19 job created'],
      ['DCM/Status', 'ACU-1 yanıt süresi 42 ms'],
      ['RuleEngine/Run', 'RF sağlık turu çalıştı'],
      ['DCM/Status', 'Modem-1 kilit var, SNR 11.8 dB'],
    ]
    let i = 0
    receive('Satops/Jobs', 'Auto Scheduler Started')
    setInterval(() => receive(...samples[i++ % samples.length]), 9000)
    return
  }
  void connectMqtt()
}

// mqtt.js büyük bir paket; yalnızca gerçek modda ve ihtiyaç olduğunda yüklenir
async function connectMqtt() {
  const { default: mqtt } = await import('mqtt')
  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mqtt`
  const client = mqtt.connect(url, { reconnectPeriod: 5000, connectTimeout: 6000, clientId: `yargan-console-${Math.random().toString(16).slice(2, 8)}` })
  const set = (s: LinkState) => {
    if (link !== s) {
      link = s
      notify()
    }
  }
  client.on('connect', () => {
    set('bağlı')
    client.subscribe(['Satops/#', 'DCM/#', 'RuleEngine/#', 'Yargan/#'])
  })
  client.on('reconnect', () => set('bağlanıyor'))
  client.on('close', () => set('kopuk'))
  client.on('error', () => set('kopuk'))
  client.on('message', (topic, buf) => receive(topic, buf.toString()))
}

let snapshot = { events, link }
const getSnapshot = () => {
  if (snapshot.events !== events || snapshot.link !== link) snapshot = { events, link }
  return snapshot
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useEvents = () => useSyncExternalStore(subscribe, getSnapshot)
