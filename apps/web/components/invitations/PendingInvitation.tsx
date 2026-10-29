'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { cancelInvitation } from '@/app/(dashboard)/admin/invitar/actions'
import type { Invitation } from '@/lib/invitations'
import { ShareInvitation } from '@/components/invitations/ShareInvitation'

/** "Reenviar" (shows the share options) and "Cancelar" for an open invitation. */
export function PendingInvitationActions({ invitation, orgName }: { invitation: Invitation; orgName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function cancel() {
    if (!window.confirm(`${invitation.email} ya no podrá entrar con esta invitación. ¿Cancelarla?`)) return
    startTransition(async () => {
      const result = await cancelInvitation(invitation.id)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-50 text-sm font-semibold text-primary transition hover:bg-blue-100"
        >
          <Send size={15} /> Reenviar
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="h-10 rounded-xl bg-gray-100 px-4 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
      {open && <ShareInvitation invitation={invitation} orgName={orgName} className="mt-2" />}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
