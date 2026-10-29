import { supabase } from '@/lib/supabase'
import type { WorkOrderPriority, WorkOrderType } from '@/lib/workOrders'

/** Requests clients send from the web portal; the admin accepts or rejects them here. */
export type ServiceRequestStatus = 'nueva' | 'aceptada' | 'rechazada'

export const REQUEST_STATUS_META: Record<ServiceRequestStatus, { label: string; chip: string; text: string }> = {
  nueva: { label: 'Nueva', chip: 'bg-amber-100', text: 'text-amber-800' },
  aceptada: { label: 'Aceptada', chip: 'bg-green-100', text: 'text-green-800' },
  rechazada: { label: 'Rechazada', chip: 'bg-gray-100', text: 'text-gray-600' },
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
  clients: { company_name: string } | null
  assets: { name: string } | null
  work_orders: { order_number: string } | null
}

export const SERVICE_REQUEST_FIELDS =
  'id, description, priority, status, response, created_at, client_id, asset_id, ' +
  'clients(company_name), assets(name), work_orders(order_number)'

/** Creates the work order and marks the request as accepted. Returns the order number. */
export async function acceptServiceRequest(
  requestId: string,
  options: { type: WorkOrderType; operatorId: string | null; scheduledDate: string | null },
): Promise<{ orderNumber: string | null; error: string | null }> {
  const { data: orderId, error } = await supabase.rpc('accept_service_request', {
    p_request_id: requestId,
    p_type: options.type,
    p_operator_id: options.operatorId,
    p_scheduled_date: options.scheduledDate,
  })
  if (error) {
    // Messages raised by the function are already in Spanish and safe to show
    const known = ['Solicitud no encontrada', 'La solicitud ya fue respondida', 'Técnico no válido']
    return { orderNumber: null, error: known.includes(error.message) ? error.message : 'Revisa tu conexión e inténtalo de nuevo.' }
  }
  const { data: order } = await supabase.from('work_orders').select('order_number').eq('id', orderId as string).single()
  return { orderNumber: order?.order_number ?? null, error: null }
}

/** Rejects a request that is still new. Returns false if nothing was updated. */
export async function rejectServiceRequest(requestId: string, reason: string) {
  const { data, error } = await supabase
    .from('service_requests')
    .update({ status: 'rechazada', response: reason.trim() || null, answered_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'nueva')
    .select('id')
  return !error && (data?.length ?? 0) > 0
}
