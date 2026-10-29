'use client'

import { useState, useEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { quoteSchema, type QuoteInput } from '@/lib/validations/quote.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'
import Link from 'next/link'
import type { Client, APUItem } from '@/types/database.types'

export default function NuevaCotizacionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [apuCatalog, setApuCatalog] = useState<APUItem[]>([])
  const [apuSearch, setApuSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { aiu_pct: 25, tax_pct: 19, items: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchedItems = useWatch({ control, name: 'items' }) ?? []
  const aiuPct = useWatch({ control, name: 'aiu_pct' }) ?? 25
  const taxPct = useWatch({ control, name: 'tax_pct' }) ?? 19

  const subtotal = watchedItems.reduce(
    (acc, item) => acc + (Number(item?.quantity) || 0) * (Number(item?.unit_price) || 0),
    0
  )
  const aiuAmount = subtotal * (Number(aiuPct) / 100)
  const taxBase = subtotal + aiuAmount
  const taxAmount = taxBase * (Number(taxPct) / 100)
  const total = taxBase + taxAmount

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('id, company_name'),
      supabase.from('apu_catalog').select('*').order('category'),
    ]).then(([{ data: c }, { data: a }]) => {
      if (c) setClients(c as Client[])
      if (a) setApuCatalog(a as APUItem[])
    })
  }, [])

  function addAPUItem(item: APUItem) {
    append({
      description: `[${item.code}] ${item.description}`,
      unit: item.unit,
      quantity: 1,
      unit_price: item.unit_price,
    })
  }

  async function onSubmit(data: QuoteInput) {
    setError(null)
    const { items, ...quoteData } = data

    const { data: quote, error: qErr } = await supabase
      .from('quotes')
      .insert({
        ...quoteData,
        work_order_id: quoteData.work_order_id || null,
        subtotal,
        aiu_pct: Number(quoteData.aiu_pct),
        aiu_amount: aiuAmount,
        tax_pct: Number(quoteData.tax_pct),
        tax_amount: taxAmount,
        total,
        quote_number: '',
      })
      .select()
      .single()

    if (qErr || !quote) { setError(qErr?.message ?? 'Error'); return }

    const { error: itemsErr } = await supabase.from('quote_items').insert(
      items.map((item) => ({
        quote_id: quote.id,
        description: item.description,
        unit: item.unit,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      }))
    )

    if (itemsErr) { setError(itemsErr.message); return }
    router.push(`/admin/financiero/cotizaciones/${quote.id}`)
    router.refresh()
  }

  const filteredAPU = apuCatalog.filter(
    (a) =>
      a.description.toLowerCase().includes(apuSearch.toLowerCase()) ||
      a.code.toLowerCase().includes(apuSearch.toLowerCase()) ||
      a.category.toLowerCase().includes(apuSearch.toLowerCase())
  )

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/financiero">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nueva Cotización</h1>
          <p className="text-muted-foreground">Construye la cotización con ítems APU</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left: Quote Builder */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Información General</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Cliente *</Label>
                  <Select onValueChange={(v) => setValue('client_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.client_id && <p className="text-sm text-destructive">{errors.client_id.message}</p>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Válida hasta</Label>
                    <Input type="date" {...register('valid_until')} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Notas</Label>
                  <Textarea placeholder="Condiciones, alcance, exclusiones..." rows={2} {...register('notes')} />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Ítems / Actividades</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => append({ description: '', unit: 'UN', quantity: 1, unit_price: 0 })}
                  >
                    <Plus size={14} className="mr-1" /> Ítem manual
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Agrega ítems desde el catálogo APU o manualmente.
                  </p>
                )}
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-2 rounded-md border p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Descripción</Label>
                        <Input
                          placeholder="Descripción del ítem"
                          {...register(`items.${index}.description`)}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="mt-5 text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Unidad</Label>
                        <Input placeholder="UN" {...register(`items.${index}.unit`)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cantidad</Label>
                        <Input type="number" step="0.01" {...register(`items.${index}.quantity`)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Precio unit.</Label>
                        <Input type="number" step="0.01" {...register(`items.${index}.unit_price`)} />
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-muted-foreground">
                      = ${((Number(watchedItems[index]?.quantity) || 0) * (Number(watchedItems[index]?.unit_price) || 0)).toLocaleString('es-CO')}
                    </div>
                  </div>
                ))}
                {errors.items && (
                  <p className="text-sm text-destructive">
                    {typeof errors.items.message === 'string' ? errors.items.message : 'Agrega al menos un ítem'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: APU Catalog + Totals */}
          <div className="space-y-4">
            {/* APU Catalog */}
            <Card>
              <CardHeader><CardTitle className="text-base">Catálogo APU</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ítem..."
                    className="pl-8 text-sm"
                    value={apuSearch}
                    onChange={(e) => setApuSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {filteredAPU.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addAPUItem(item)}
                      className="w-full rounded-md border p-2 text-left hover:bg-accent transition-colors"
                    >
                      <p className="text-xs font-medium leading-tight">{item.description}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground">{item.code} · {item.unit}</span>
                        <span className="text-xs font-semibold">${Number(item.unit_price).toLocaleString('es-CO')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">AIU (%)</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="h-7 w-16 text-right text-sm"
                      {...register('aiu_pct')}
                    />
                    <span className="text-xs text-muted-foreground">${aiuAmount.toLocaleString('es-CO')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">IVA (%)</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="h-7 w-16 text-right text-sm"
                      {...register('tax_pct')}
                    />
                    <span className="text-xs text-muted-foreground">${taxAmount.toLocaleString('es-CO')}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>${total.toLocaleString('es-CO')}</span>
                </div>

                {error && (
                  <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Cotización'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
