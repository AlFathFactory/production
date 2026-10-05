import type { AppRole, CreateUserInput } from './types'

export type CreateUserFieldErrors = Partial<Record<keyof CreateUserInput, string>>

const VALID_ROLES: readonly AppRole[] = ['admin', 'supervisor', 'operator']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCreateUser(input: CreateUserInput): CreateUserFieldErrors {
  const errors: CreateUserFieldErrors = {}
  const email = input.email.trim()

  if (!email) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'A valid email is required.'
  }

  if (input.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  if (!input.fullName.trim()) {
    errors.fullName = 'Full Name is required.'
  }
  if (!input.employeeCode.trim()) {
    errors.employeeCode = 'Employee Code is required.'
  }
  if (!input.role || !VALID_ROLES.includes(input.role)) {
    errors.role = 'A valid role is required.'
  }

  return errors
}
