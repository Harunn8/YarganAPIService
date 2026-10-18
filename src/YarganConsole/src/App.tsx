import { useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { login, tokenUser } from './api/api'
import { DEMO } from './api/demo'
import { errorMessage, services, setUnauthorizedHandler, tokenStore } from './api/http'
import { startEventStream, useEvents } from './lib/events'
import { useNow, useStored } from './lib/hooks'
import { useHealth, useLiveInvalidation, usePasses } from './lib/queries'
import { goto, select, useUi, views } from './lib/state'
import { countdown, hhmm, hhmmss, parseLocal, utcHhmmss } from './lib/time'
import { Button, Field } from './ui/kit'
import CommandLine from './views/CommandLine'
import Inspector from './views/Inspector'
import TimelineView from './views/TimelineView'

const FieldView = lazy(() => import('./views/FieldView'))
const AutomationView = lazy(() => import('./views/AutomationView'))
const StationView = lazy(() => import('./views/StationView'))
const CrewView = lazy(() => import('./views/CrewView'))

export default function App() {
  const [token, setToken] = useState(() => tokenStore.get())
  const [theme, setTheme] = useStored<'day' | 'night'>('yc.theme', 'day')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const user = tokenUser(token)
  const expired = user?.expires && user.expires.getTime() < Date.now()
  useEffect(() => {
    if (expired) {
      tokenStore.clear()
      setToken(null)
    }
  }, [expired])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear()
      setToken(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  if (!token || expired) return <Login onToken={(t) => (tokenStore.set(t), setToken(t))} />
  return (
    <Shell
      user={user?.name ?? 'operatör'}
      theme={theme}
      onTheme={() => setTheme((t) => (t === 'day' ? 'night' : 'day'))}
      onLogout={() => {
        tokenStore.clear()
        setToken(null)
      }}
    />
  )
}

function Login({ onToken }: { onToken: (t: string) => void }) {
  const [username, setUsername] = useState(DEMO ? 'harun' : '')
  const [password, setPassword] = useState(DEMO ? 'demo' : '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onToken(await login(username, password))
    } catch (err) {
      const msg = errorMessage(err)
      setError(msg.includes('HTTP 401') || msg.includes('süresi dolmuş') ? 'Kullanıcı adı ya da şifre yanlış.' : msg)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="login">
      <div className="login-card">
        <div className="strip pass">
          <span className="muted">Yargan yer istasyonu</span>
          <h1>Console</h1>
          <p className="muted">Geçişler, cihazlar ve otomasyon tek panoda. Devralmak için giriş yap.</p>
          <form onSubmit={submit}>
            <Field label="Kullanıcı adı">
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus />
            </Field>
            <Field label="Şifre">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            {error && <div className="notice warn" role="alert">{error}</div>}
            <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Vardiyayı devral'}</Button>
            {DEMO && <p className="faint" style={{ fontSize: 13 }}>Demo modu: API yok, veriler tarayıcıda üretiliyor. Her şifre kabul edilir.</p>}
          </form>
        </div>
      </div>
    </main>
  )
}

function Shell({ user, theme, onTheme, onLogout }: { user: string; theme: string; onTheme: () => void; onLogout: () => void }) {
  const ui = useUi()
  const now = useNow()
  const health = useHealth()
  const passes = usePasses()
  const { events, link } = useEvents()
  const qc = useQueryClient()
  useLiveInvalidation()
  useEffect(() => startEventStream(), [])
  useEffect(() => () => qc.clear(), [qc])

  const t = now.getTime()
  const live = passes.data?.find((p) => (parseLocal(p.aos)?.getTime() ?? 0) <= t && (parseLocal(p.los)?.getTime() ?? 0) >= t && p.status !== 5)
  const next = passes.data
    ?.filter((p) => (parseLocal(p.aos)?.getTime() ?? 0) > t && p.status !== 5 && p.status !== 6)
    .sort((a, b) => a.aos.localeCompare(b.aos))[0]

  return (
    <div className="shell">
      <header className="masthead">
        <div className="brand">
          <b>Yargan</b>
          <span>Console{DEMO ? ', demo' : ''}</span>
        </div>
        <nav className="tabs" aria-label="Görünümler">
          {views.map((v, i) => (
            <button key={v.id} className="tab" aria-current={ui.view === v.id ? 'page' : undefined} title={v.hint} onClick={() => goto(v.id)}>
              {v.label}
              <kbd>Alt {i + 1}</kbd>
            </button>
          ))}
        </nav>
        <div className="station-clock">
          <button className="clock next" style={{ border: 0, background: 'none', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => {
              const p = live ?? next
              if (p) (goto('serit'), select({ kind: 'pass', id: p.id }))
            }}>
            <span>{live ? `${live.name} takipte, LOS'a` : next ? `${next.name} AOS'a` : 'Sıradaki geçiş'}</span>
            <b>{live ? countdown((parseLocal(live.los)?.getTime() ?? t) - t) : next ? countdown((parseLocal(next.aos)?.getTime() ?? t) - t) : '—'}</b>
          </button>
          <div className="clock">
            <span>Yerel</span>
            <b>{hhmmss(now)}</b>
          </div>
          <div className="clock utc">
            <span>UTC</span>
            <b>{utcHhmmss(now)}</b>
          </div>
          <div className="lamps" aria-label="Servis durumu">
            {services.map((s) => {
              const h = health.data?.find((x) => x.service === s.name)
              return (
                <span key={s.name} className="lamp" data-state={!h ? 'wait' : h.ok ? 'ok' : 'bad'} title={`${s.label}: ${!h ? 'kontrol ediliyor' : h.ok ? `çalışıyor, ${h.latencyMs} ms` : 'yanıt yok'}`}>
                  {s.label.replace(' API', '')}
                </span>
              )
            })}
            <span className="lamp" data-state={link === 'bağlı' || link === 'demo' ? 'ok' : link === 'bağlanıyor' ? 'wait' : 'bad'} title={`MQTT: ${link}`}>
              MQTT
            </span>
          </div>
          <div className="user-chip">
            <span>{user}</span>
            <Button small variant="quiet" onClick={onTheme} title="Gündüz / gece vardiyası">{theme === 'day' ? 'Gece' : 'Gündüz'}</Button>
            <Button small variant="quiet" onClick={onLogout}>Çıkış</Button>
          </div>
        </div>
      </header>

      <div className={`workspace ${ui.selection ? 'with-inspector' : ''}`}>
        <main style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={<div className="view"><p className="muted">Yükleniyor…</p></div>}>
            {ui.view === 'serit' && <TimelineView />}
            {ui.view === 'saha' && <FieldView />}
            {ui.view === 'otomasyon' && <AutomationView />}
            {ui.view === 'istasyon' && <StationView />}
            {ui.view === 'ekip' && <CrewView me={user} />}
          </Suspense>
        </main>
        <Inspector />
      </div>

      <div className="ticker" aria-label="Son olaylar">
        <span className="ticker-label">Canlı</span>
        <div className="ticker-items">
          {events.length === 0 && <span style={{ opacity: 0.7 }}>{link === 'bağlı' || link === 'demo' ? 'MQTT bağlı, mesaj bekleniyor' : `MQTT ${link}`}</span>}
          {events.slice(0, 8).map((e) => (
            <button key={e.id} onClick={() => select({ kind: 'event', id: e.id })}>
              <time>{hhmm(e.at)}</time>
              <b>{e.topic}</b>
              {e.text.length > 70 ? `${e.text.slice(0, 70)}…` : e.text}
            </button>
          ))}
        </div>
      </div>
      <CommandLine onLogout={onLogout} onTheme={onTheme} />
    </div>
  )
}
