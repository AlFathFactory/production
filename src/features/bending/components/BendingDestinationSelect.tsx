import { FormField } from '../../../components/ui/FormField'
import { Select } from '../../../components/ui/Select'

export interface DestinationSelectOption {
  id: string
  label: string
}

interface BendingDestinationSelectProps {
  id: string
  isDisabled: boolean
  label?: string
  onChange: (destinationId: string | null) => void
  options: DestinationSelectOption[]
  selectedDestinationId: string | null
}

export function BendingDestinationSelect({
  id,
  isDisabled,
  label = 'Destination filter',
  onChange,
  options,
  selectedDestinationId,
}: BendingDestinationSelectProps) {
  return (
    <FormField label={label} htmlFor={id}>
      <Select
        disabled={isDisabled}
        id={id}
        value={selectedDestinationId ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">All Destinations</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </Select>
    </FormField>
  )
}
