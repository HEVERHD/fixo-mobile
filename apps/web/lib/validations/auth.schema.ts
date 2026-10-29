import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const account = {
  full_name: z.string().trim().min(2, 'Escribe tu nombre').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('Email inválido')),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
}

/** New company + its first admin (same fields as the app's registro screen). */
export const registerSchema = z.object({
  organization_name: z.string().trim().min(2, 'Escribe el nombre de tu empresa').max(120),
  business_type: z.enum(['mantenimiento', 'construccion', 'ambos'], { error: 'Elige a qué se dedica tu empresa' }),
  ...account,
})

/** Invited technician or client user: no company is created (claim_my_invitation() links them). */
export const joinSchema = z.object(account)

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.input<typeof registerSchema>
export type JoinInput = z.input<typeof joinSchema>
