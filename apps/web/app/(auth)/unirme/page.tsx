import { Suspense } from 'react'
import { JoinForm } from '@/components/auth/JoinForm'

export default function UnirmePage() {
  // JoinForm reads ?email= from the invitation link
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  )
}
