// Same model as apps/mobile/lib/serviceRequests.ts (table and RLS in supabase/migrations/*_service_requests.sql).
import type { WorkOrderPriority } from '@/lib/workOrders'

export type ServiceRequestStatus = 'nueva' | 'aceptada' | 'rechazada'

export const REQUEST_STATUS_META: Record<ServiceRequestStatus, { label: string; chip: string }> = {
  nueva: { label: 'Nueva', chip: 'bg-amber-100 text-amber-800' },
  aceptada: { label: 'Aceptada', chip: 'bg-green-100 text-green-800' },
  rechazada: { label: 'Rechazada', chip: 'bg-gray-100 text-gray-600' },
}

export interface ServiceRequest {
  id: string
  description: string
  priority: WorkOrderPriority
  status: ServiceRequestStatus
  response: string | null
  created_at: string
  client_id: string
  asset_id: string | null
  work_order_id: string | null
  clients: { company_name: string } | null
  assets: { name: string } | null
  work_orders: { order_number: string } | null
}

export const SERVICE_REQUEST_FIELDS =
  'id, description, priority, status, response, created_at, client_id, asset_id, work_order_id, ' +
  'clients(company_name), assets(name), work_orders(order_number)'
