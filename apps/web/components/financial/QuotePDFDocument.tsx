import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Quote, QuoteItem, Client } from '@/types/database.types'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  brand: { fontSize: 18, fontWeight: 'bold', color: '#1e40af' },
  brandSub: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  quoteTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  quoteNum: { fontSize: 10, color: '#6b7280', textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6, letterSpacing: 0.5 },
  clientInfo: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 4 },
  clientName: { fontSize: 12, fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e40af', padding: '8 10', color: '#ffffff', fontWeight: 'bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', padding: '7 10', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  tableRowAlt: { flexDirection: 'row', padding: '7 10', backgroundColor: '#f8fafc', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  colDesc: { flex: 4 },
  colUnit: { flex: 1, textAlign: 'center' },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsBox: { alignSelf: 'flex-end', width: 220, marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { color: '#6b7280' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1.5, borderTopColor: '#1e40af', marginTop: 4 },
  grandTotalText: { fontSize: 12, fontWeight: 'bold', color: '#1e40af' },
  notes: { marginTop: 16, backgroundColor: '#f0f9ff', padding: 10, borderRadius: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
})

interface QuotePDFProps {
  quote: Quote & {
    clients?: Partial<Client> | null
    quote_items?: QuoteItem[]
  }
}

export function QuotePDFDocument({ quote }: QuotePDFProps) {
  const client = quote.clients
  const items = quote.quote_items ?? []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Fixo</Text>
            <Text style={styles.brandSub}>Servicios Electromecánicos y Mantenimiento</Text>
          </View>
          <View>
            <Text style={styles.quoteTitle}>COTIZACIÓN</Text>
            <Text style={styles.quoteNum}>{quote.quote_number}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client?.company_name ?? '—'}</Text>
            {client?.nit && (
              <Text style={{ fontSize: 9, marginTop: 2, color: '#6b7280' }}>NIT: {client.nit}</Text>
            )}
            {client?.address && (
              <Text style={{ fontSize: 9, color: '#6b7280' }}>{client.address}</Text>
            )}
            {client?.contact_email && (
              <Text style={{ fontSize: 9, color: '#6b7280' }}>{client.contact_email}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción de Actividades</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Descripción</Text>
            <Text style={styles.colUnit}>Und</Text>
            <Text style={styles.colQty}>Cant.</Text>
            <Text style={styles.colPrice}>Precio unit.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colQty}>{Number(item.quantity).toLocaleString('es-CO')}</Text>
              <Text style={styles.colPrice}>${Number(item.unit_price).toLocaleString('es-CO')}</Text>
              <Text style={styles.colTotal}>${Number(item.total).toLocaleString('es-CO')}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text>${Number(quote.subtotal).toLocaleString('es-CO')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>AIU ({quote.aiu_pct}%)</Text>
            <Text>${Number(quote.aiu_amount).toLocaleString('es-CO')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA ({quote.tax_pct}%)</Text>
            <Text>${Number(quote.tax_amount).toLocaleString('es-CO')}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalText}>TOTAL</Text>
            <Text style={styles.grandTotalText}>${Number(quote.total).toLocaleString('es-CO')}</Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notes}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 3 }}>
              Notas y condiciones:
            </Text>
            <Text style={{ fontSize: 9, color: '#374151' }}>{quote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Documento generado por Fixo · {quote.quote_number} · Válido hasta:{' '}
          {quote.valid_until ?? 'No especificado'}
        </Text>
      </Page>
    </Document>
  )
}
