'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  value: number
  min: number
  onChange: (n: number) => void
  label?: string
}

export function CountStepper({ value, min, onChange, label = 'Warriors' }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center font-semibold tabular-nums">{value}</span>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <span className="text-xs text-muted-foreground">
          min {min}
        </span>
      </div>
    </div>
  )
}
