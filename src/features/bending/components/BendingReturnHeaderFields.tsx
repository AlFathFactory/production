import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import type { BendingReturnHeaderValues } from '../types'

interface BendingReturnHeaderFieldsProps {
  isDisabled: boolean
  onChange: (field: keyof BendingReturnHeaderValues, value: string) => void
  values: BendingReturnHeaderValues
}

export function BendingReturnHeaderFields({ isDisabled, onChange, values }: BendingReturnHeaderFieldsProps) {
  return (
    <fieldset className="bending-return-header-fields" disabled={isDisabled}>
      <legend>Return Details</legend>
      <FormField label="Return Date *" htmlFor="bending-return-date">
        <Input
          id="bending-return-date"
          required
          type="date"
          value={values.returnDate}
          onChange={(event) => onChange('returnDate', event.target.value)}
        />
      </FormField>
      <FormField label="Received By Name" htmlFor="bending-return-received-by">
        <Input
          id="bending-return-received-by"
          value={values.receivedByName}
          onChange={(event) => onChange('receivedByName', event.target.value)}
        />
      </FormField>
    </fieldset>
  )
}
