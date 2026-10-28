'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zap } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'cliente' },
  })

  async function onSubmit(data: RegisterInput) {
    setError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, role: data.role },
      },
    })
    if (error) {
      setError(error.message)
      return
    }
    router.push('/login?registered=true')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Fixo — Registro de usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" placeholder="Juan Pérez" {...register('full_name')} />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="usuario@empresa.com" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select onValueChange={(v) => setValue('role', v as RegisterInput['role'])} defaultValue="cliente">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="operario">Operario / Técnico</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Crear cuenta'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-primary underline">
                Ingresar
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
