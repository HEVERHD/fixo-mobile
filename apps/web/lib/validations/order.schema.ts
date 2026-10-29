import { z } from 'zod'

const optionalId = z.uuid().nullable()

export const workOrderSchema = z.object({
  client_id: z.uuid('Elige el cliente'),
  project_id: optionalId,
  asset_id: optionalId,
  assigned_operator_id: optionalId,
  type: z.enum(['preventivo', 'correctivo', 'instalacion']),
  priority: z.enum(['baja', 'media', 'alta', 'urgente']),
  // yyyy-MM-dd computed in the browser (the admin's timezone), or null for "Sin fecha"
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').nullable(),
  description: z.string().trim().min(5, 'Describe el trabajo (mínimo 5 caracteres)').max(2000),
})

export const maintenanceRecordSchema = z.object({
  tasks_performed: z.string().min(5, 'Describe las tareas realizadas'),
  observations: z.string().optional(),
  pending_tasks: z.string().optional(),
})

export type WorkOrderInput = z.infer<typeof workOrderSchema>
export type MaintenanceRecordInput = z.infer<typeof maintenanceRecordSchema>
