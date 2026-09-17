import { getRoleLabel } from '../../auth/permissions'
import { StatusBadge } from '../../../components/shared/StatusBadge'
import type { UserListItem } from '../types'

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

interface UsersTableProps {
  users: UserListItem[]
  onEdit: (user: UserListItem) => void
  onToggleActive: (user: UserListItem) => void
  currentUserId: string | null
}

export function UsersTable({ users, onEdit, onToggleActive, currentUserId }: UsersTableProps) {
  if (users.length === 0) return null

  return (
    <section className="users-results" aria-label="Users list">
      <div className="users-table-wrap" tabIndex={0} aria-label="Users table. Scroll horizontally to view all columns.">
        <table className="users-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Employee Code</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Created At</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.fullName}</strong></td>
                <td>{user.employeeCode}</td>
                <td><span className="user-role-badge">{getRoleLabel(user.role)}</span></td>
                <td><StatusBadge status={user.isActive ? 'active' : 'cancelled'} /></td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <div className="users-table__actions">
                    <button type="button" className="button button--secondary" onClick={() => onEdit(user)}>Edit</button>
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => onToggleActive(user)}
                      disabled={user.id === currentUserId}
                      aria-disabled={user.id === currentUserId}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}