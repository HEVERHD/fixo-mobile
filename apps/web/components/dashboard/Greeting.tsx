'use client'

import { useSyncExternalStore } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function greeting(date: Date) {
  const h = date.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const noop = () => () => {}

/**
 * Date + greeting in the viewer's timezone (the server may run in UTC).
 * Read only on the client: with Cache Components, `new Date()` during prerender is an error.
 */
export function Greeting({ orgName }: { orgName?: string | null }) {
  const now = useSyncExternalStore(noop, () => new Date().toDateString() + '|' + new Date().getHours(), () => null)
  const date = now ? new Date() : null

  return (
    <div className="min-w-0">
      <p className="h-5 text-sm text-gray-500 capitalize">
        {date && format(date, "EEEE, d 'de' MMMM", { locale: es })}
      </p>
      <h1 className="font-heading mt-0.5 text-3xl font-bold text-gray-900">
        {date ? greeting(date) : 'Hola'}
      </h1>
      {orgName && <p className="mt-0.5 truncate text-sm text-gray-500">{orgName}</p>}
    </div>
  )
}
