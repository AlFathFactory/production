import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import type { BendingDispatchHeaderValues } from '../types'

interface BendingDispatchHeaderFieldsProps {
  isDisabled: boolean
  onChange: (field: keyof BendingDispatchHeaderValues, value: string) => void
  values: BendingDispatchHeaderValues
}

export function BendingDispatchHeaderFields({ isDisabled, onChange, values }: BendingDispatchHeaderFieldsProps) {
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
      <FormField label="Destination" htmlFor="bending-destination">
        <Input id="bending-destination" value={values.destination} onChange={(event) => onChange('destination', event.target.value)} />
      </FormField>
      <FormField label="Dispatch Name" htmlFor="bending-dispatch-name">
        <Input id="bending-dispatch-name" value={values.dispatchName} onChange={(event) => onChange('dispatchName', event.target.value)} />
      </FormField>
      <FormField label="Approval Name" htmlFor="bending-approval-name">
        <Input id="bending-approval-name" value={values.approvalName} onChange={(event) => onChange('approvalName', event.target.value)} />
      </FormField>
    </fieldset>
  )
}
