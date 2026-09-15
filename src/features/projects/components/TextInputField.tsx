import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'

interface TextInputFieldProps {
  hasError: boolean
  id: string
  label: string
  onChange: (value: string) => void
  value: string
}

export function TextInputField({ hasError, id, label, onChange, value }: TextInputFieldProps) {
  return (
    <FormField htmlFor={id} label={label}>
      <Input autoFocus hasError={hasError} id={id} onChange={(event) => onChange(event.target.value)} value={value} />
    </FormField>
  )
}
