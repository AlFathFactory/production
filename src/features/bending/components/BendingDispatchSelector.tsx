import { FormField } from '../../../components/ui/FormField'
import { Select } from '../../../components/ui/Select'
import type { BendingDispatchListItem } from '../types'

interface BendingDispatchSelectorProps {
  dispatches: BendingDispatchListItem[]
  isDisabled: boolean
  onChange: (dispatchId: string | null) => void
  selectedDispatchId: string | null
}

function dispatchLabel(dispatch: BendingDispatchListItem): string {
  const destination = dispatch.destination ? ` · ${dispatch.destination}` : ''
  const sheetNumber = dispatch.sheetNumber ? ` · Sheet ${dispatch.sheetNumber}` : ''
  const createdAt = new Date(dispatch.createdAt).toLocaleDateString()
  return `${dispatch.dispatchNumber} · ${dispatch.dispatchDate}${destination}${sheetNumber} · Created ${createdAt}`
}

export function BendingDispatchSelector({ dispatches, isDisabled, onChange, selectedDispatchId }: BendingDispatchSelectorProps) {
  return (
    <FormField label="Bending Dispatch" htmlFor="bending-return-dispatch">
      <Select
        disabled={isDisabled}
        id="bending-return-dispatch"
        value={selectedDispatchId ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select a dispatch</option>
        {dispatches.map((dispatch) => <option key={dispatch.id} value={dispatch.id}>{dispatchLabel(dispatch)}</option>)}
      </Select>
    </FormField>
  )
}
