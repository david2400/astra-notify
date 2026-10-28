/** @format */

'use client';

export type ModoEnvio = 'individual' | 'masivo';

/** Selector Individual / Masivo (segmentado). */
export function SelectorModo({ modo, onChange, etiquetaMasivo = 'Masivo' }: { modo: ModoEnvio; onChange: (m: ModoEnvio) => void; etiquetaMasivo?: string }) {
  const opciones: { valor: ModoEnvio; label: string }[] = [
    { valor: 'individual', label: 'Individual' },
    { valor: 'masivo', label: etiquetaMasivo },
  ];
  return (
    <div role='radiogroup' aria-label='Modo de envío' className='inline-flex rounded-xl border border-border bg-muted/40 p-1'>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type='button'
          role='radio'
          aria-checked={modo === o.valor}
          onClick={() => onChange(o.valor)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            modo === o.valor ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
