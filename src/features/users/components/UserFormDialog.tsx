import { useState, useEffect } from 'react'
import type { AppRole } from '../../auth/types'

import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { CheckboxField } from '../../../components/ui/CheckboxField'
import type { CreateUserInput, UpdateUserInput, UserListItem } from '../types'

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'operator', label: 'Operator' },
]

interface UserFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: UpdateUserInput) => void
  onCreateSubmit: (input: CreateUserInput) => void
  user: UserListItem | null
  isSaving: boolean
  error: string | null
}

export function UserFormDialog({ isOpen, onClose, onSubmit, onCreateSubmit, user, isSaving, error }: UserFormDialogProps) {
  const isCreating = user === null
  const [formValues, setFormValues] = useState<CreateUserInput & UpdateUserInput>({
    email: '',
    password: '',
    fullName: '',
    employeeCode: '',
    role: 'operator',
    isActive: true,
  })

  useEffect(() => {
    if (user) {
      setFormValues({
        email: '',
        password: '',
        fullName: user.fullName,
        employeeCode: user.employeeCode,
        role: user.role,
        isActive: user.isActive,
      })
    } else {
      setFormValues({
        email: '',
        password: '',
        fullName: '',
        employeeCode: '',
        role: 'operator',
        isActive: true,
      })
    }
  }, [user])

  function handleChange<K extends keyof (CreateUserInput & UpdateUserInput)>(field: K, value: (CreateUserInput & UpdateUserInput)[K]) {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isCreating) {
      onCreateSubmit({
        email: formValues.email,
        password: formValues.password,
        fullName: formValues.fullName,
        employeeCode: formValues.employeeCode,
        role: formValues.role,
      })
    } else {
      onSubmit({
        fullName: formValues.fullName,
        employeeCode: formValues.employeeCode,
        role: formValues.role,
        isActive: formValues.isActive,
      })
    }
  }

  if (!isOpen) return null

  return (
    <Dialog title={isCreating ? 'Add User' : 'Edit User'} onClose={onClose} isOpen={isOpen} isCloseDisabled={isSaving}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error ? <p className="form-error" role="alert">{error}</p> : null}

        {isCreating && (
          <>
            <FormField label="Email" htmlFor="user-email">
              <Input
                id="user-email"
                type="email"
                value={formValues.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email address"
                required
                disabled={isSaving}
                autoComplete="email"
              />
            </FormField>

            <FormField label="Password" htmlFor="user-password">
              <Input
                id="user-password"
                type="password"
                value={formValues.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Password"
                required
                disabled={isSaving}
                autoComplete="new-password"
              />
            </FormField>
          </>
        )}

        <FormField label="Full Name" htmlFor="user-full-name">
          <Input
            id="user-full-name"
            value={formValues.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Full name"
            required
            disabled={isSaving}
            autoComplete={isCreating ? 'name' : 'off'}
          />
        </FormField>

        <FormField label="Employee Code" htmlFor="user-employee-code">
          <Input
            id="user-employee-code"
            value={formValues.employeeCode}
            onChange={(e) => handleChange('employeeCode', e.target.value)}
            placeholder="Employee code"
            required
            disabled={isSaving}
            autoComplete={isCreating ? 'off' : 'off'}
          />
        </FormField>

        <FormField label="Role" htmlFor="user-role">
          <Select
            id="user-role"
            value={formValues.role}
            onChange={(e) => handleChange('role', e.target.value as AppRole)}
            disabled={isSaving}
            required
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </FormField>

        {!isCreating && (
          <FormField label="Status" htmlFor="user-is-active">
            <CheckboxField
              id="user-is-active"
              label="Active"
              checked={formValues.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              disabled={isSaving}
            />
          </FormField>
        )}

        <div className="entity-form__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : isCreating ? 'Create User' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}