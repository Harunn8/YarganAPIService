import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cronApi, pagDeviceApi, passApi, scriptApi } from '../api/api'
import { isMaint } from '../lib/domain'
import { keys, useCrons, useDevices, usePagDevices, usePasses, useScripts } from '../lib/queries'
import { goto, select, setUi, views, type ViewId } from '../lib/state'
import { Button, Sheet, showFlash, useAction, useFlash } from '../ui/kit'

const norm = (s: string) => s.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim()

interface Suggestion {
  text: string
  hint: string
}

const viewAlias: Record<string, ViewId> = { zaman: 'serit', şerit: 'serit', saha: 'saha', otomasyon: 'otomasyon', istasyon: 'istasyon', ekip: 'ekip' }

export default function CommandLine({ onLogout, onTheme }: { onLogout: () => void; onTheme: () => void }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [help, setHelp] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const flash = useFlash()
  const qc = useQueryClient()
  const { run } = useAction()

  const scripts = useScripts().data ?? []
  const crons = useCrons().data ?? []
  const pagDevices = usePagDevices().data ?? []
  const devices = useDevices().data ?? []
  const passes = usePasses().data ?? []

  // "/" ya da Ctrl+K komut satırına odaklanır; Alt+1..5 görünüm değiştirir
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.altKey && /^[1-5]$/.test(e.key)) {
        e.preventDefault()
        goto(views[Number(e.key) - 1].id)
      }
      if (e.key === 'Escape' && !typing && !document.querySelector('dialog[open]')) select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const all: Suggestion[] = useMemo(() => {
    const s: Suggestion[] = [
      ...Object.keys(viewAlias).filter((k) => k !== 'şerit').map((k) => ({ text: `git ${k}`, hint: 'Görünüm değiştir' })),
      { text: 'planlayıcı başlat', hint: 'Otomatik geçiş planlayıcısını başlatır' },
      { text: 'planlayıcı durdur', hint: 'Sıradaki geçişleri iptal eder' },
      { text: 'şimdi', hint: 'Zaman şeridini şu ana getir' },
      { text: 'yenile', hint: 'Tüm verileri API’lerden yeniden çek' },
      { text: 'tema', hint: 'Gündüz / gece vardiyası görünümü' },
      { text: 'yardım', hint: 'Komut listesi ve kısayollar' },
      { text: 'çıkış', hint: 'Oturumu kapat' },
    ]
    scripts.forEach((x) => s.push({ text: `çalıştır ${x.name}`, hint: 'Scripti bir kez çalıştır' }))
    crons.forEach((x) => s.push({ text: `görev ${x.isRunning ? 'durdur' : 'başlat'} ${x.name}`, hint: x.isRunning ? 'Çalışan görevi durdur' : 'Duran görevi başlat' }))
    pagDevices.forEach((x) => s.push({ text: `cihaz ${isMaint(x) ? 'başlat' : 'bakım'} ${x.name}`, hint: isMaint(x) ? 'Haberleşmeyi başlat' : 'Bakıma al' }))
    ;[...pagDevices.map((x) => x.name), ...devices.map((x) => x.name), ...scripts.map((x) => x.name), ...new Set(passes.map((x) => x.name))].forEach((n) =>
      s.push({ text: `bul ${n}`, hint: 'Kaydı bul ve aç' }),
    )
    return s
  }, [scripts, crons, pagDevices, devices, passes])

  const matches = useMemo(() => {
    const q = norm(value)
    if (!q) return all.filter((s) => !s.text.startsWith('bul ')).slice(0, 8)
    const words = q.split(' ')
    return all
      .filter((s) => {
        const t = norm(s.text)
        return words.every((w) => t.includes(w))
      })
      .sort((a, b) => Number(!norm(a.text).startsWith(q)) - Number(!norm(b.text).startsWith(q)))
      .slice(0, 8)
  }, [all, value])

  const findByName = <T extends { name: string }>(list: T[], name: string) => {
    const n = norm(name)
    return list.find((x) => norm(x.name) === n) ?? list.find((x) => norm(x.name).includes(n))
  }

  const execute = async (raw: string) => {
    const cmd = norm(raw)
    if (!cmd) return
    setHistory((h) => [raw, ...h.filter((x) => x !== raw)].slice(0, 30))
    setHistIdx(-1)
    setValue('')
    setOpen(false)
    const rest = (prefix: string) => raw.trim().slice(prefix.length).trim()

    if (cmd.startsWith('git ')) {
      const v = viewAlias[cmd.slice(4)]
      if (v) return goto(v)
      return showFlash(`"${cmd.slice(4)}" diye bir görünüm yok. Seçenekler: zaman, saha, otomasyon, istasyon, ekip`, true)
    }
    if (cmd === 'planlayıcı başlat' || cmd === 'planlayıcı durdur') {
      const on = cmd.endsWith('başlat')
      return run(on ? 'Otomatik planlayıcı başlatıldı' : 'Otomatik planlayıcı durduruldu', () => passApi.autoSchedule(on), [keys.passes, keys.crons])
    }
    if (cmd === 'şimdi') return setUi({ focusAt: null, view: 'serit' })
    if (cmd === 'yenile') {
      await qc.invalidateQueries()
      return showFlash('Veriler yenilendi')
    }
    if (cmd === 'tema') return onTheme()
    if (cmd === 'yardım') return setHelp(true)
    if (cmd === 'çıkış') return onLogout()
    if (cmd.startsWith('çalıştır ')) {
      const s = findByName(scripts, rest('çalıştır'))
      if (!s) return showFlash(`"${rest('çalıştır')}" adında script yok`, true)
      return run(`${s.name} bir kez çalıştırıldı`, () => scriptApi.run(s.id))
    }
    const gorev = cmd.match(/^görev (başlat|durdur) (.+)$/)
    if (gorev) {
      const c = findByName(crons, raw.trim().split(/\s+/).slice(2).join(' '))
      if (!c) return showFlash('Bu adla cron görevi yok', true)
      const on = gorev[1] === 'başlat'
      return run(`${c.name} ${on ? 'başlatıldı' : 'durduruldu'}`, () => cronApi.startOrStop(c.id, on), [keys.crons])
    }
    const cihaz = cmd.match(/^cihaz (başlat|bakım) (.+)$/)
    if (cihaz) {
      const d = findByName(pagDevices, raw.trim().split(/\s+/).slice(2).join(' '))
      if (!d) return showFlash('Bu adla bağlı cihaz yok', true)
      const on = cihaz[1] === 'başlat'
      return run(`${d.name} ${on ? 'haberleşmeye alındı' : 'bakıma alındı'}`, () => pagDeviceApi.startOrStop(d.id, on), [keys.pagDevices])
    }
    if (cmd.startsWith('bul ')) {
      const q = rest('bul')
      const pd = findByName(pagDevices, q)
      if (pd) return goto('saha'), select({ kind: 'pagDevice', id: pd.id })
      const dv = findByName(devices, q)
      if (dv) return goto('saha'), select({ kind: 'device', id: dv.id })
      const sc = findByName(scripts, q)
      if (sc) return goto('otomasyon'), select({ kind: 'script', id: sc.id })
      const cr = findByName(crons, q)
      if (cr) return goto('otomasyon'), select({ kind: 'cron', id: cr.id })
      const now = Date.now()
      const ps = passes.filter((p) => norm(p.name).includes(norm(q))).sort((a, b) => Math.abs(new Date(a.aos).getTime() - now) - Math.abs(new Date(b.aos).getTime() - now))[0]
      if (ps) return goto('serit'), setUi({ focusAt: new Date(ps.aos).getTime() }), select({ kind: 'pass', id: ps.id })
      return showFlash(`"${q}" ile eşleşen kayıt yok`, true)
    }
    showFlash(`"${raw.trim()}" anlaşılamadı. Komutları görmek için "yardım" yaz.`, true)
  }

  return (
    <div className="cmd">
      <label htmlFor="cmd-input" className="cmd-prompt" aria-label="Komut">›</label>
      <input
        id="cmd-input"
        ref={inputRef}
        value={value}
        autoComplete="off"
        spellCheck={false}
        placeholder="Komut yaz: planlayıcı başlat, çalıştır …, cihaz bakım …, bul …"
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls="cmd-menu"
        aria-activedescendant={open ? `cmd-opt-${active}` : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setValue(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (!value && history.length && !open) return
            setActive((a) => Math.min(a + 1, matches.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (!open || !matches.length || (histIdx >= 0)) {
              const i = Math.min(histIdx + 1, history.length - 1)
              if (i >= 0) {
                setHistIdx(i)
                setValue(history[i])
                setOpen(false)
              }
              return
            }
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Tab' && open && matches[active]) {
            e.preventDefault()
            setValue(matches[active].text)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const exact = matches.find((m) => norm(m.text) === norm(value))
            execute(open && matches[active] && !exact && value.trim() ? matches[active].text : value)
          } else if (e.key === 'Escape') {
            setOpen(false)
            inputRef.current?.blur()
          }
        }}
      />
      <span className="cmd-hint">/ ile odaklan, Tab ile tamamla</span>
      <Button small variant="quiet" onClick={() => setHelp(true)}>Yardım</Button>

      {open && matches.length > 0 && (
        <ul className="cmd-menu" id="cmd-menu" role="listbox">
          {matches.map((m, i) => (
            <li key={m.text} id={`cmd-opt-${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => (e.preventDefault(), execute(m.text))} onMouseEnter={() => setActive(i)}>
              <span>{m.text}</span>
              <span>{m.hint}</span>
            </li>
          ))}
        </ul>
      )}
      {flash && !open && <div className={`cmd-result ${flash.error ? 'error' : ''}`} role="status" key={flash.id}>{flash.text}</div>}

      <Sheet open={help} title="Komutlar ve kısayollar" onClose={() => setHelp(false)}>
        <div className="kbd-list">
          <code>git saha</code><span>Görünüm değiştir (zaman, saha, otomasyon, istasyon, ekip)</span>
          <code>planlayıcı başlat</code><span>Takip seçilen geçişler için görev oluşturur</span>
          <code>planlayıcı durdur</code><span>Sıradaki geçişleri iptal eder</span>
          <code>çalıştır &lt;script&gt;</code><span>Scripti Rule Engine’de bir kez çalıştırır</span>
          <code>görev başlat &lt;ad&gt;</code><span>Cron görevini başlatır ya da durdurur</span>
          <code>cihaz bakım &lt;ad&gt;</code><span>Cihazı bakıma alır; "cihaz başlat" geri açar</span>
          <code>bul &lt;metin&gt;</code><span>Cihaz, script, görev ya da geçişi bulup açar</span>
          <code>şimdi</code><span>Zaman şeridini şu ana getirir</span>
          <code>yenile</code><span>Tüm verileri API’lerden yeniden çeker</span>
          <code>tema</code><span>Gece vardiyası görünümü</span>
        </div>
        <div className="kbd-list">
          <code>/</code><span>Komut satırına odaklan (Ctrl+K da olur)</span>
          <code>Alt+1…5</code><span>Görünümler arasında geç</span>
          <code>↑</code><span>Komut geçmişi</span>
          <code>Esc</code><span>Ayrıntı panelini kapat</span>
        </div>
      </Sheet>
    </div>
  )
}
