import { FormField } from '../../../components/ui/FormField'
import { Textarea } from '../../../components/ui/Textarea'

interface NotesFieldProps {
  id: string
  onChange: (notes: string) => void
  value: string
}

export function NotesField({ id, onChange, value }: NotesFieldProps) {
  return (
    <FormField htmlFor={id} label="Notes" hint="Optional">
      <Textarea id={id} onChange={(event) => onChange(event.target.value)} rows={3} value={value} />
    </FormField>
  )
}
