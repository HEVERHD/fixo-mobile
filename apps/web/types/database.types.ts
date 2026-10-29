export type Role = 'admin' | 'operario' | 'cliente'
export type WorkOrderType = 'preventivo' | 'correctivo' | 'instalacion'
export type WorkOrderStatus = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'
export type Priority = 'baja' | 'media' | 'alta' | 'urgente'
export type QuoteStatus = 'borrador' | 'enviada' | 'aprobada' | 'rechazada'
export type InvoiceStatus = 'pendiente' | 'abonado' | 'pagado' | 'en_mora'
export type APUType = 'material' | 'mano_de_obra'
export type AssetStatus = 'activo' | 'en_mantenimiento' | 'fuera_de_servicio'

export interface Profile {
  id: string
  role: Role
  full_name: string
  phone: string | null
  avatar_url: string | null
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  company_name: string
  nit: string | null
  address: string | null
  contact_email: string | null
  contact_phone: string | null
  profiles?: Profile
}

export interface Operator {
  id: string
  user_id: string
  specialty: string | null
  license_number: string | null
  profiles?: Profile
}

export interface Asset {
  id: string
  client_id: string
  qr_code: string
  name: string
  type: string
  brand: string | null
  model: string | null
  serial_number: string | null
  location: string | null
  installation_date: string | null
  specs: Record<string, unknown> | null
  status: AssetStatus
  created_at: string
  clients?: Client
}

export interface WorkOrder {
  id: string
  order_number: string
  client_id: string
  asset_id: string | null
  assigned_operator_id: string | null
  type: WorkOrderType
  priority: Priority
  status: WorkOrderStatus
  scheduled_date: string | null
  completed_date: string | null
  description: string
  notes: string | null
  created_at: string
  clients?: Client
  assets?: Asset
  operators?: Operator
}

export interface MaintenanceRecord {
  id: string
  work_order_id: string
  asset_id: string
  operator_id: string
  date: string
  tasks_performed: string
  observations: string | null
  photos: string[]
  signature_url: string | null
  pending_tasks: string | null
}

export interface APUItem {
  id: string
  category: string
  code: string
  description: string
  unit: string
  unit_price: number
  type: APUType
}

export interface QuoteItem {
  id: string
  quote_id: string
  description: string
  unit: string
  quantity: number
  unit_price: number
  total: number
}

export interface Quote {
  id: string
  client_id: string
  work_order_id: string | null
  quote_number: string
  subtotal: number
  aiu_pct: number
  aiu_amount: number
  tax_pct: number
  tax_amount: number
  total: number
  status: QuoteStatus
  valid_until: string | null
  notes: string | null
  created_at: string
  clients?: Client
  quote_items?: QuoteItem[]
}

export interface Invoice {
  id: string
  quote_id: string | null
  client_id: string
  invoice_number: string
  amount: number
  status: InvoiceStatus
  due_date: string | null
  paid_date: string | null
  notes: string | null
  created_at: string
  clients?: Client
  quotes?: Quote
}

// Supabase Database type (for typed client)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id'>
        Update: Partial<Omit<Client, 'id'>>
      }
      operators: {
        Row: Operator
        Insert: Omit<Operator, 'id'>
        Update: Partial<Omit<Operator, 'id'>>
      }
      assets: {
        Row: Asset
        Insert: Omit<Asset, 'id' | 'created_at'>
        Update: Partial<Omit<Asset, 'id' | 'created_at'>>
      }
      work_orders: {
        Row: WorkOrder
        Insert: Omit<WorkOrder, 'id' | 'created_at'>
        Update: Partial<Omit<WorkOrder, 'id' | 'created_at'>>
      }
      maintenance_records: {
        Row: MaintenanceRecord
        Insert: Omit<MaintenanceRecord, 'id'>
        Update: Partial<Omit<MaintenanceRecord, 'id'>>
      }
      apu_catalog: {
        Row: APUItem
        Insert: Omit<APUItem, 'id'>
        Update: Partial<Omit<APUItem, 'id'>>
      }
      quotes: {
        Row: Quote
        Insert: Omit<Quote, 'id' | 'created_at'>
        Update: Partial<Omit<Quote, 'id' | 'created_at'>>
      }
      quote_items: {
        Row: QuoteItem
        Insert: Omit<QuoteItem, 'id'>
        Update: Partial<Omit<QuoteItem, 'id'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at'>
        Update: Partial<Omit<Invoice, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
