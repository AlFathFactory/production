import { Button } from '../../../components/ui/Button'

interface EntityFormActionsProps {
  isSaving: boolean
  onCancel: () => void
  submitLabel: string
}

export function EntityFormActions({ isSaving, onCancel, submitLabel }: EntityFormActionsProps) {
  return (
    <div className="entity-form__actions">
      <Button onClick={onCancel} type="button" variant="secondary">Cancel</Button>
      <Button isLoading={isSaving} type="submit">{submitLabel}</Button>
    </div>
  )
}
