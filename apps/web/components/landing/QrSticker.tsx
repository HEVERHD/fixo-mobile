import QRCode from 'qrcode'

/** Hero mock: the 6 × 4 cm equipment label the app prints, with a scanning beam. */
export async function QrSticker({ code, className = '' }: { code: string; className?: string }) {
  // Generated at build time from a constant, so injecting the SVG markup is safe
  const svg = await QRCode.toString(code, { type: 'svg', margin: 0, color: { dark: '#01184e', light: '#ffffff' } })

  return (
    <div className={`w-60 rounded-2xl bg-white p-3 shadow-2xl shadow-navy-dark/50 ring-1 ring-black/5 ${className}`}>
      <div className="flex gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden">
          <div className="h-full w-full [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <div aria-hidden className="absolute inset-x-0 h-0.5 animate-scan bg-accent-cyan shadow-[0_0_12px_2px_#06b9fe]" />
        </div>
        <div className="flex min-w-0 flex-col justify-between py-0.5">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Fixo</p>
            <p className="mt-0.5 text-sm leading-tight font-semibold text-gray-900">Chiller York 120 TR</p>
          </div>
          <p className="font-mono text-[11px] text-gray-500">{code}</p>
        </div>
      </div>
      <p className="mt-2 border-t border-dashed border-gray-200 pt-2 text-center text-[10px] text-gray-400">
        Escanea para ver el historial del equipo
      </p>
    </div>
  )
}
