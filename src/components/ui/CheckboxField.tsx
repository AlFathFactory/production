interface CheckboxFieldProps {
  id: string
  label: string
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}

export function CheckboxField({ id, label, checked, onChange, disabled }: CheckboxFieldProps) {
  return (
    <label className="checkbox-field" htmlFor={id}>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} disabled={disabled} />
      <span>{label}</span>
    </label>
  )
}