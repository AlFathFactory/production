import { FormField } from '../../../components/ui/FormField'
import { Select } from '../../../components/ui/Select'
import { hierarchyStatuses, type HierarchyStatus } from '../types'

interface StatusSelectProps {
  id: string
  onChange: (status: HierarchyStatus) => void
  value: HierarchyStatus
}

const statusLabels: Record<HierarchyStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On hold',
  cancelled: 'Cancelled',
}

export function StatusSelect({ id, onChange, value }: StatusSelectProps) {
  return (
    <FormField htmlFor={id} label="Status">
      <Select id={id} onChange={(event) => onChange(event.target.value as HierarchyStatus)} value={value}>
        {hierarchyStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
      </Select>
    </FormField>
  )
}
