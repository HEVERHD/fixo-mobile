'use client'

import { useState, useSyncExternalStore } from 'react'
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { invitationMessage, type InviteRole } from '@/lib/invitations'

const noop = () => () => {}

/** WhatsApp / copy / native share for an invitation message (the web has no system share sheet everywhere). */
export function ShareInvitation({
  invitation, orgName, className,
}: { invitation: { email: string; role: InviteRole; full_name: string | null }; orgName: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const canShare = useSyncExternalStore(noop, () => typeof navigator.share === 'function', () => false)
  const message = invitationMessage(invitation, orgName)

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context or permissions); WhatsApp still works
    }
  }

  async function share() {
    try {
      await navigator.share({ text: message })
    } catch {
      // The user closed the share sheet
    }
  }

  const btn = 'inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition'

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(btn, 'bg-green-50 text-green-700 hover:bg-green-100')}
      >
        <MessageCircle size={15} /> WhatsApp
      </a>
      <button type="button" onClick={copy} className={cn(btn, 'bg-blue-50 text-primary hover:bg-blue-100')}>
        {copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar mensaje</>}
      </button>
      {canShare && (
        <button type="button" onClick={share} className={cn(btn, 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
          <Share2 size={15} /> Compartir
        </button>
      )}
    </div>
  )
}
