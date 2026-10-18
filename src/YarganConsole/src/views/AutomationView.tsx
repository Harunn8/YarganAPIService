import { useEffect, useState } from 'react'
import { cronApi, scriptApi } from '../api/api'
import type { CronPolicyResponse, PolicyScriptResponse } from '../api/types'
import { describeCron, nextRuns } from '../lib/cron'
import { keys, useActiveCrons, useCrons, useScripts } from '../lib/queries'
import { select, useUi } from '../lib/state'
import { fullLabel, parseLocal, relative } from '../lib/time'
import { Button, Cell, Empty, Field, Loading, QueryError, useAction, useConfirm } from '../ui/kit'
import { CronSheet, NewScriptSheet } from './forms'

export default function AutomationView() {
  const ui = useUi()
  const scripts = useScripts()
  const crons = useCrons()
  const active = useActiveCrons()
  const [current, setCurrent] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [cronSheet, setCronSheet] = useState<{ cron?: CronPolicyResponse; scriptId?: string } | null>(null)

  // inspector'dan ya da komut satırından bir script seçildiyse onu aç
  useEffect(() => {
    if (ui.selection?.kind === 'script') setCurrent(ui.selection.id)
  }, [ui.selection])
  const list = scripts.data ?? []
  const script = list.find((s) => s.id === current) ?? list[0] ?? null
  const activeIds = new Set(active.data?.map((c) => c.id))

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>Otomasyon</h2>
          <p>Policy scriptleri Rule Engine’de çalışır. Cron görevleri onları bir takvime bağlar; otomatik planlayıcı her geçiş için kendi görevini açar.</p>
        </div>
        <div className="toolbar">
          <Button onClick={() => setCronSheet({})}>Cron görevi ekle</Button>
          <Button variant="primary" onClick={() => setNewOpen(true)}>Yeni script</Button>
        </div>
      </div>

      {scripts.error && <QueryError error={scripts.error} onRetry={() => scripts.refetch()} />}
      <div className="split">
        <section className="rack" aria-label="Scriptler">
          <div className="rack-head">
            <h3>Scriptler</h3>
            <span>{list.length}</span>
          </div>
          {scripts.isLoading && <Loading what="Scriptler" />}
          {!scripts.isLoading && list.length === 0 && <div className="rack-empty">Henüz script yok.</div>}
          {list.map((s) => {
            const used = (crons.data ?? []).filter((c) => c.policyScriptId === s.id)
            return (
              <button key={s.id} className="strip job" aria-pressed={script?.id === s.id} onClick={() => setCurrent(s.id)}>
                <div className="cells" style={{ gridTemplateColumns: '1fr auto' }}>
                  <Cell k={`${s.script.split('\n').length} satır`} v={s.name} grow />
                  <Cell k="Görev" v={used.length} />
                </div>
              </button>
            )
          })}
        </section>

        <div className="stack" style={{ gap: 18 }}>
          {script ? (
            <ScriptEditor key={script.id + script.updateDate} script={script} onDeleted={() => setCurrent(null)} />
          ) : (
            !scripts.isLoading && <Empty action={<Button variant="primary" onClick={() => setNewOpen(true)}>Script yaz</Button>}>Düzenlemek için soldan bir script seç ya da yenisini yaz.</Empty>
          )}

          {script && (
            <section className="panel">
              <div className="panel-head">
                <h3>{script.name} görevleri</h3>
                <Button small onClick={() => setCronSheet({ scriptId: script.id })}>Bu script için görev ekle</Button>
              </div>
              <CronList items={(crons.data ?? []).filter((c) => c.policyScriptId === script.id)} activeIds={activeIds} onEdit={(c) => setCronSheet({ cron: c })} empty="Bu script bir takvime bağlı değil." />
            </section>
          )}

          <section className="panel">
            <div className="panel-head">
              <h3>Tüm cron görevleri</h3>
              <span className="muted" style={{ fontSize: 13 }}>{activeIds.size} çalışıyor, {crons.data?.length ?? 0} toplam</span>
            </div>
            {crons.error && <QueryError error={crons.error} />}
            <CronList items={crons.data ?? []} activeIds={activeIds} onEdit={(c) => setCronSheet({ cron: c })} empty="Cron görevi yok." />
          </section>
        </div>
      </div>

      <NewScriptSheet open={newOpen} onClose={() => setNewOpen(false)} onCreated={(id) => setCurrent(id)} />
      {cronSheet && <CronSheet open cron={cronSheet.cron} scriptId={cronSheet.scriptId} onClose={() => setCronSheet(null)} />}
    </div>
  )
}

function ScriptEditor({ script, onDeleted }: { script: PolicyScriptResponse; onDeleted: () => void }) {
  const [name, setName] = useState(script.name)
  const [body, setBody] = useState(script.script)
  const dirty = name !== script.name || body !== script.script
  const { run, busy } = useAction()
  const confirm = useConfirm()
  const lines = body.split('\n').length

  const save = () => run(`${name} kaydedildi`, () => scriptApi.update({ id: script.id, name, script: body }), [keys.scripts])
  const runOnce = async () => {
    if (dirty) await save()
    run(`${name} bir kez çalıştırıldı`, () => scriptApi.run(script.id))
  }
  const remove = async () => {
    if (!(await confirm.ask(`${script.name} scripti silinecek. Ona bağlı cron görevleri çalışamaz hale gelir.`))) return
    const ok = await run(`${script.name} silindi`, () => scriptApi.remove(script.id), [keys.scripts, keys.crons])
    if (ok !== undefined) onDeleted()
  }

  return (
    <section
      className="panel"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
          e.preventDefault()
          if (dirty) save()
        }
      }}
    >
      <div className="panel-head">
        <Field label="Script adı">
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ minWidth: 260 }} />
        </Field>
        <div className="toolbar">
          <span className="muted" style={{ fontSize: 13 }}>{dirty ? 'Kaydedilmemiş değişiklik var' : `Son değişiklik ${relative(parseLocal(script.updateDate) ?? new Date())}`}</span>
          <Button disabled={busy} onClick={runOnce}>Bir kez çalıştır</Button>
          <Button variant="primary" disabled={busy || !dirty} onClick={save}>Kaydet</Button>
          <Button variant="quiet" disabled={busy} onClick={remove}>Sil</Button>
        </div>
      </div>
      <div className="editor">
        <div className="editor-gutter" aria-hidden>{Array.from({ length: lines }, (_, i) => i + 1).join('\n')}</div>
        <textarea
          value={body}
          spellCheck={false}
          aria-label="Script gövdesi"
          rows={Math.max(14, lines + 2)}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault()
              const t = e.currentTarget
              const { selectionStart: s, selectionEnd: en } = t
              const v = `${body.slice(0, s)}    ${body.slice(en)}`
              setBody(v)
              requestAnimationFrame(() => t.setSelectionRange(s + 4, s + 4))
            }
          }}
        />
      </div>
      <p className="faint" style={{ fontSize: 13 }}>Ctrl+S ile kaydet. Script, Rule Engine tarafında C# olarak çalıştırılır.</p>
      {confirm.node}
    </section>
  )
}

function CronList({ items, activeIds, onEdit, empty }: { items: CronPolicyResponse[]; activeIds: Set<string>; onEdit: (c: CronPolicyResponse) => void; empty: string }) {
  const { run, busy } = useAction()
  const confirm = useConfirm()
  const ui = useUi()
  if (items.length === 0) return <div className="rack-empty">{empty}</div>
  const remove = async (c: CronPolicyResponse) => {
    if (!(await confirm.ask(`${c.name} görevi silinecek.`))) return
    run(`${c.name} silindi`, () => cronApi.remove(c.id), [keys.crons])
  }
  return (
    <div className="table-list">
      {items.map((c) => {
        const on = activeIds.has(c.id) || c.isRunning
        const next = nextRuns(c, 1)[0]
        const sel = ui.selection?.kind === 'cron' && ui.selection.id === c.id
        return (
          <div key={c.id} className={`strip job ${on ? '' : 'muted-strip'} ${sel ? 'is-selected' : ''}`}>
            <div className="cells" style={{ gridTemplateColumns: '1.3fr 1.2fr .9fr auto' }}>
              <button className="cell" style={{ border: 0, borderRight: '1px solid var(--strip-line)', background: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => select(sel ? null : { kind: 'cron', id: c.id })}>
                <span className="k">{c.policyScript?.name ?? 'Script'}</span>
                <span className="v">{c.name}</span>
              </button>
              <Cell k={c.forOnce ? 'Bir kez' : c.cronFormat ?? ''} v={c.forOnce ? fullLabel(parseLocal(c.startAt)) : describeCron(c.cronFormat)} />
              <Cell k={on ? 'Çalışıyor' : 'Durdu'} v={next ? fullLabel(next) : 'Çalışma yok'} />
              <div className="cell" style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Button small disabled={busy} onClick={() => run(`${c.name} ${on ? 'durduruldu' : 'başlatıldı'}`, () => cronApi.startOrStop(c.id, !on), [keys.crons])}>
                  {on ? 'Durdur' : 'Başlat'}
                </Button>
                <Button small variant="quiet" onClick={() => onEdit(c)}>Düzenle</Button>
                <Button small variant="quiet" onClick={() => remove(c)} aria-label={`${c.name} sil`}>Sil</Button>
              </div>
            </div>
          </div>
        )
      })}
      {confirm.node}
    </div>
  )
}
