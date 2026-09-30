import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import type { BendingDestination, BendingDispatchHeaderValues } from '../types'
import { BendingDestinationCombobox } from './BendingDestinationCombobox'

interface BendingDispatchHeaderFieldsProps {
  destinations: BendingDestination[]
  isDisabled: boolean
  onAddDestination: () => void
  onChange: (field: keyof BendingDispatchHeaderValues, value: string) => void
  onDestinationChange: (destinationName: string) => void
  values: BendingDispatchHeaderValues
}

export function BendingDispatchHeaderFields({ destinations, isDisabled, onAddDestination, onChange, onDestinationChange, values }: BendingDispatchHeaderFieldsProps) {
  return (
    <fieldset className="bending-header-fields" disabled={isDisabled}>
      <FormField label="Dispatch Number" htmlFor="bending-dispatch-number">
        <Input
          id="bending-dispatch-number"
          readOnly
          value="Generated automatically when dispatch is created"
        />
      </FormField>
      <FormField label="Dispatch Date *" htmlFor="bending-dispatch-date">
        <Input
          id="bending-dispatch-date"
          required
          type="date"
          value={values.dispatchDate}
          onChange={(event) => onChange('dispatchDate', event.target.value)}
        />
      </FormField>
      <BendingDestinationCombobox
        destinations={destinations}
        isDisabled={isDisabled}
        onAdd={onAddDestination}
        onChange={onDestinationChange}
        value={values.destination}
      />
      <FormField label="Dispatch Name" htmlFor="bending-dispatch-name">
        <Input id="bending-dispatch-name" value={values.dispatchName} onChange={(event) => onChange('dispatchName', event.target.value)} />
      </FormField>
      <FormField label="Approval Name" htmlFor="bending-approval-name">
        <Input id="bending-approval-name" value={values.approvalName} onChange={(event) => onChange('approvalName', event.target.value)} />
      </FormField>
    </fieldset>
  )
}
