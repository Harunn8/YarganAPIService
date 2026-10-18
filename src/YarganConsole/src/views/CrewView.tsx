import { useState } from 'react'
import { userApi } from '../api/api'
import type { UserResponse } from '../api/types'
import { keys, useUsers } from '../lib/queries'
import { Button, Cell, Empty, Loading, QueryError, useAction, useConfirm } from '../ui/kit'
import { UserSheet } from './forms'

export default function CrewView({ me }: { me: string }) {
  const users = useUsers()
  const [sheet, setSheet] = useState<{ user?: UserResponse } | null>(null)
  const { run } = useAction()
  const confirm = useConfirm()
  const remove = async (u: UserResponse) => {
    if (!(await confirm.ask(`${u.userName} kullanıcısı silinecek ve bir daha giriş yapamayacak.`))) return
    run(`${u.userName} silindi`, () => userApi.remove(u.id), [keys.users])
  }
  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>Ekip</h2>
          <p>Konsola giriş yapabilen operatörler. Girişte User API kimliği doğrular, Login API token üretir.</p>
        </div>
        <Button variant="primary" onClick={() => setSheet({})}>Kullanıcı ekle</Button>
      </div>
      {users.error && <QueryError error={users.error} onRetry={() => users.refetch()} />}
      {users.isLoading && <Loading what="Kullanıcılar" />}
      {users.data?.length === 0 && <Empty>Kullanıcı yok.</Empty>}
      <div className="table-list" style={{ maxWidth: 980 }}>
        {users.data?.map((u) => (
          <div key={u.id} className={`strip ${u.userName === me ? 'live' : ''}`}>
            <div className="cells" style={{ gridTemplateColumns: '1fr 1.2fr 1.4fr auto' }}>
              <Cell k={u.userName === me ? 'Bu oturum' : 'Kullanıcı adı'} v={u.userName} big />
              <Cell k="Ad soyad" v={`${u.name} ${u.surname}`} />
              <Cell k="E-posta" v={u.email} />
              <div className="cell" style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Button small onClick={() => setSheet({ user: u })}>Düzenle</Button>
                <Button small variant="quiet" disabled={u.userName === me} onClick={() => remove(u)}>Sil</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {sheet && <UserSheet open user={sheet.user} onClose={() => setSheet(null)} />}
      {confirm.node}
    </div>
  )
}
