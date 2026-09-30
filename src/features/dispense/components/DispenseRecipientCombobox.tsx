import { SearchableNameCombobox } from '../../../components/ui/SearchableNameCombobox'
import type { DispenseRecipient } from '../types'

interface DispenseRecipientComboboxProps {
  isDisabled: boolean
  onAdd: () => void
  onChange: (recipientName: string) => void
  recipients: DispenseRecipient[]
  value: string
}

export function DispenseRecipientCombobox({ isDisabled, onAdd, onChange, recipients, value }: DispenseRecipientComboboxProps) {
  return (
    <SearchableNameCombobox
      addLabel={(name) => `Add New Person named "${name}"`}
      emptyLabel="No saved people."
      inputId="dispense-recipient"
      isDisabled={isDisabled}
      label="Dispensed To *"
      onAdd={onAdd}
      onChange={onChange}
      options={recipients}
      placeholder="Type to search people"
      required
      value={value}
    />
  )
}
