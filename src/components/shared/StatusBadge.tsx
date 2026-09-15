interface StatusBadgeProps {
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
}

const statusLabels: Record<StatusBadgeProps['status'], string> = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On hold',
  cancelled: 'Cancelled',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${status}`}>{statusLabels[status]}</span>
}
