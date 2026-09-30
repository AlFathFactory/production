import { SearchableNameCombobox } from '../../../components/ui/SearchableNameCombobox'
import type { BendingDestination } from '../types'

interface BendingDestinationComboboxProps {
  destinations: BendingDestination[]
  isDisabled: boolean
  onAdd: () => void
  onChange: (destinationName: string) => void
  value: string
}

export function BendingDestinationCombobox({ destinations, isDisabled, onAdd, onChange, value }: BendingDestinationComboboxProps) {
  return (
    <SearchableNameCombobox
      addLabel={(name) => `Add New Destination named "${name}"`}
      emptyLabel="No saved Destinations."
      inputId="bending-destination"
      isDisabled={isDisabled}
      label="Destination *"
      onAdd={onAdd}
      onChange={onChange}
      options={destinations}
      placeholder="Type to search Destinations"
      required
      value={value}
    />
  )
}
