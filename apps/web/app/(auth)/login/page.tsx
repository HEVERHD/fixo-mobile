import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  // LoginForm reads ?confirmado=1 from the confirmation email link
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
