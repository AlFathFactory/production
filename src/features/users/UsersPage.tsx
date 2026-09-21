import { useState } from 'react'

import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useAuth } from '../auth/hooks/useAuth'
import { canAccessUserManagement } from '../auth/permissions'
import { useUsers } from './queries/userQueries'
import { useUpdateUser } from './mutations/useUserMutations'
import { useCreateUser } from './mutations/useCreateUser'
import { UserFormDialog } from './components/UserFormDialog'
import { UsersTable } from './components/UsersTable'
import type { UserListItem, UserFilters, UpdateUserInput, CreateUserInput } from './types'

export function UsersPage() {
  const { userProfile } = useAuth()
  const isAdmin = userProfile && canAccessUserManagement(userProfile.role)
  const currentUserId = userProfile?.id ?? null
  const [search, setSearch] = useState('')
  const filters: UserFilters = { search }
  const usersQuery = useUsers(filters)
  const updateUserMutation = useUpdateUser()
  const createUserMutation = useCreateUser()

  const [editDialogUser, setEditDialogUser] = useState<UserListItem | null>(null)
  const [editDialogError, setEditDialogError] = useState<string | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  function openEditDialog(user: UserListItem | null) {
    setEditDialogError(null)
    setEditDialogUser(user)
    setIsCreatingNew(user === null)
  }

  function closeEditDialog() {
    setEditDialogUser(null)
    setEditDialogError(null)
    setIsCreatingNew(false)
    updateUserMutation.reset()
    createUserMutation.reset()
  }

  async function handleUpdateUser(input: UpdateUserInput) {
    if (!editDialogUser) return
    try {
      await updateUserMutation.mutateAsync({ id: editDialogUser.id, input })
      closeEditDialog()
    } catch (error) {
      setEditDialogError(error instanceof Error ? error.message : 'Failed to update user.')
    }
  }

  async function handleCreateUser(input: CreateUserInput) {
    try {
      await createUserMutation.mutateAsync(input)
      closeEditDialog()
    } catch (error) {
      setEditDialogError(error instanceof Error ? error.message : 'Failed to create user.')
    }
  }

  function handleToggleActive(user: UserListItem) {
    openEditDialog(user)
    // The dialog will open with current values, user clicks save to confirm
    // We could auto-submit but better to let user confirm
  }

  if (!isAdmin) {
    return (
      <section className="users-page">
        <PageHeader title="Users" description="User management is restricted to administrators." />
        <div className="users-state">
          <p>Access denied. This page is only available to administrators.</p>
        </div>
      </section>
    )
  }

  const users = usersQuery.data ?? []

  return (
    <section className="users-page">
      <PageHeader
        title="Users"
        description="Manage employee accounts and roles."
        actions={<Button onClick={() => openEditDialog(null)} type="button">+ Add User</Button>}
      />
      <div className="users-workspace">
        <div className="users-filters">
          <Input
            type="search"
            placeholder="Search by name or employee code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />
        </div>
        {usersQuery.isPending ? (
          <section className="users-state"><LoadingSpinner label="Loading users" /> Loading users…</section>
        ) : usersQuery.isError ? (
          <section className="users-state users-state--error" role="alert">
            <p>{usersQuery.error.message}</p>
            <Button type="button" variant="secondary" onClick={() => void usersQuery.refetch()}>Retry</Button>
          </section>
        ) : users.length === 0 ? (
          <section className="users-state">
            <p>No users found.</p>
          </section>
        ) : (
          <UsersTable users={users} onEdit={openEditDialog} onToggleActive={handleToggleActive} currentUserId={currentUserId} />
        )}
      </div>
      <UserFormDialog
        isOpen={isCreatingNew || Boolean(editDialogUser)}
        onClose={closeEditDialog}
        onSubmit={handleUpdateUser}
        onCreateSubmit={handleCreateUser}
        user={editDialogUser}
        isSaving={isCreatingNew ? createUserMutation.isPending : updateUserMutation.isPending}
        error={editDialogError ?? (isCreatingNew ? createUserMutation.error?.message : updateUserMutation.error?.message) ?? null}
      />
    </section>
  )
}
