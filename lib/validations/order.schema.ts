import { z } from 'zod'

export const workOrderSchema = z.object({
  client_id: z.string().uuid('Selecciona un cliente'),
  asset_id: z.string().uuid().optional().or(z.literal('')),
  assigned_operator_id: z.string().uuid().optional().or(z.literal('')),
  type: z.enum(['preventivo', 'correctivo', 'instalacion']),
  priority: z.enum(['baja', 'media', 'alta', 'urgente']),
  scheduled_date: z.string().optional(),
  description: z.string().min(5, 'Descripción requerida (mín. 5 caracteres)'),
  notes: z.string().optional(),
})

export const maintenanceRecordSchema = z.object({
  tasks_performed: z.string().min(5, 'Describe las tareas realizadas'),
  observations: z.string().optional(),
  pending_tasks: z.string().optional(),
})

export type WorkOrderInput = z.infer<typeof workOrderSchema>
export type MaintenanceRecordInput = z.infer<typeof maintenanceRecordSchema>
