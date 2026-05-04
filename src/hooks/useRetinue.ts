import { useRetinueStore } from '@/src/store/retinueStore'
import { partitionErrors } from '@/src/logic/validation'

/** Convenience hook: retinue + computed data for UI consumption. */
export function useRetinue() {
  const retinue = useRetinueStore(s => s.retinue)
  const validationErrors = useRetinueStore(s => s.validationErrors)
  const totalCost = useRetinueStore(s => s.totalCost)
  const isDirty = useRetinueStore(s => s.isDirty)

  const { errors, warnings } = partitionErrors(validationErrors)

  return {
    retinue,
    totalCost,
    isDirty,
    validationErrors,
    errors,
    warnings,
    isValid: errors.length === 0,
    pointsRemaining: retinue.pointsLimit - totalCost,
  }
}
