import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'dorado' | 'ciruela' | 'berry' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  // El dorado es el CTA principal: sobre él el texto va en ciruela, no en
  // blanco, porque el contraste blanco/dorado no alcanza el mínimo AA.
  dorado: 'bg-dorado text-ciruela hover:bg-dorado-600 active:bg-dorado-600 font-semibold',
  ciruela: 'bg-ciruela text-crema hover:bg-ciruela-700 active:bg-ciruela-700',
  berry: 'bg-berry text-white hover:bg-berry-600 active:bg-berry-600',
  secondary: 'bg-superficie text-tinta border border-linea hover:bg-linea-soft',
  ghost: 'bg-transparent text-tinta-soft hover:bg-linea-soft',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'dorado',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-control font-medium',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
