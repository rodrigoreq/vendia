import { cn } from '@/lib/cn'

interface LogoProps {
  variant?: 'full' | 'mark'
  onDark?: boolean
  className?: string
}

/** Marca de VendIA: la "V" en dorado sobre ciruela. El dorado es el color
 *  de la comisión, así que es el que carga la identidad. */
export function Logo({ variant = 'full', onDark = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-control bg-ciruela"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path
            d="M5 6.5 12 18l7-11.5"
            stroke="#D9A441"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {variant === 'full' && (
        <span className="min-w-0">
          <span
            className={cn(
              'block truncate font-display text-[17px] font-bold leading-tight tracking-tight',
              onDark ? 'text-crema' : 'text-tinta',
            )}
          >
            Vend<span className="text-dorado">IA</span>
          </span>
          <span
            className={cn(
              'block truncate text-[11px] leading-tight',
              onDark ? 'text-crema/60' : 'text-humo',
            )}
          >
            Vende más, gana más
          </span>
        </span>
      )}
    </span>
  )
}
