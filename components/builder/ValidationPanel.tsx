'use client'

import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react'
import type { ValidationError } from '@/src/types'
import { cn } from '@/lib/utils'

interface Props {
  errors: ValidationError[]
  warnings: ValidationError[]
  isValid: boolean
}

export function ValidationPanel({ errors, warnings, isValid }: Props) {
  if (isValid && warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-card/80 border-t border-border text-xs text-muted-foreground">
        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
        Retinue is valid
      </div>
    )
  }

  return (
    <div className="px-4 py-2 bg-card/80 border-t border-border space-y-1 max-h-28 overflow-y-auto">
      {errors.map((e, i) => (
        <div key={i} className="flex gap-2 items-start text-xs text-destructive">
          <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{e.message}</span>
        </div>
      ))}
      {warnings.map((w, i) => (
        <div key={i} className="flex gap-2 items-start text-xs text-yellow-500">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{w.message}</span>
        </div>
      ))}
    </div>
  )
}
