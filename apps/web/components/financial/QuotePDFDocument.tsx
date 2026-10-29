import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { money } from '@/lib/finance'
import type { QuoteDetail } from '@/components/financial/QuoteView'

// Brand colors from apps/mobile/lib/theme.js
const NAVY = '#01184E'
const PRIMARY = '#0062E6'
const HIGHLIGHT = '#FEC704'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: NAVY, color: '#ffffff', padding: 18, borderRadius: 8, marginBottom: 20 },
  issuerLabel: { fontSize: 8, color: '#BFDBFE', textTransform: 'uppercase', letterSpacing: 1 },
  issuer: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  quoteTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'right', color: HIGHLIGHT },
  quoteMeta: { fontSize: 9, color: '#BFDBFE', textAlign: 'right', marginTop: 2 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#6B7280', marginBottom: 6, letterSpacing: 0.5 },
  clientBox: { backgroundColor: '#F3F4F6', padding: 10, borderRadius: 6, marginBottom: 18 },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  muted: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: NAVY, paddingBottom: 5, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6B7280', textTransform: 'uppercase' },
  row: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  colDesc: { flex: 4, paddingRight: 6 },
  colUnit: { flex: 0.8, textAlign: 'center' },
  colQty: { flex: 0.9, textAlign: 'right' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totals: { alignSelf: 'flex-end', width: 220, marginTop: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, marginTop: 4, borderTopWidth: 1.5, borderTopColor: NAVY },
  grandTotalText: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: NAVY },
  notes: { marginTop: 18, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 6 },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#9CA3AF' },
})

const longDate = (d: string) => format(parseISO(d), "d 'de' MMMM yyyy", { locale: es })

export function QuotePDFDocument({ quote, issuer }: { quote: QuoteDetail; issuer: string }) {
  const client = quote.clients
  return (
    <Document title={`Cotización ${quote.quote_number}`} author={issuer}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.issuerLabel}>Cotización de</Text>
            <Text style={styles.issuer}>{issuer}</Text>
          </View>
          <View>
            <Text style={styles.quoteTitle}>COTIZACIÓN</Text>
            <Text style={styles.quoteMeta}>{quote.quote_number}</Text>
            <Text style={styles.quoteMeta}>{longDate(quote.created_at)}</Text>
            {quote.valid_until && <Text style={styles.quoteMeta}>Válida hasta el {longDate(quote.valid_until)}</Text>}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cliente</Text>
        <View style={styles.clientBox}>
          <Text style={styles.clientName}>{client?.company_name ?? '—'}</Text>
          {client?.nit && <Text style={styles.muted}>NIT {client.nit}</Text>}
          {client?.address && <Text style={styles.muted}>{client.address}</Text>}
          {client?.contact_email && <Text style={styles.muted}>{client.contact_email}</Text>}
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Descripción</Text>
          <Text style={styles.colUnit}>Und</Text>
          <Text style={styles.colQty}>Cant.</Text>
          <Text style={styles.colPrice}>Precio unit.</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {quote.quote_items.map((item) => (
          <View key={item.id} style={styles.row} wrap={false}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colUnit}>{item.unit}</Text>
            <Text style={styles.colQty}>{Number(item.quantity).toLocaleString('es-CO')}</Text>
            <Text style={styles.colPrice}>{money(item.unit_price)}</Text>
            <Text style={styles.colTotal}>{money(item.total)}</Text>
          </View>
        ))}

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}><Text style={{ color: '#6B7280' }}>Subtotal</Text><Text>{money(quote.subtotal)}</Text></View>
          <View style={styles.totalRow}><Text style={{ color: '#6B7280' }}>AIU ({Number(quote.aiu_pct)}%)</Text><Text>{money(quote.aiu_amount)}</Text></View>
          <View style={styles.totalRow}><Text style={{ color: '#6B7280' }}>IVA ({Number(quote.tax_pct)}%)</Text><Text>{money(quote.tax_amount)}</Text></View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalText}>TOTAL</Text>
            <Text style={styles.grandTotalText}>{money(quote.total)}</Text>
          </View>
        </View>

        {quote.notes && (
          <View style={styles.notes} wrap={false}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: PRIMARY, marginBottom: 3 }}>Notas y condiciones</Text>
            <Text style={{ fontSize: 9, color: '#374151' }}>{quote.notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>{issuer} · {quote.quote_number}</Text>
          <Text render={({ pageNumber, totalPages }) => `Generado con Fixo · ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
