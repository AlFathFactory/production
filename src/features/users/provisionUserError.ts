import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'

import type { UsersRepositoryErrorKind } from './usersRepository'

interface ProvisionUserFailure {
  kind: UsersRepositoryErrorKind
  message: string
}

function safeMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const message = value.trim().split(/\r?\n/, 1)[0]?.trim() ?? ''
  if (!message || message.length > 300 || message.startsWith('<')) return null

  if (/authorization\s*:|bearer\s+|service[_ -]?role|api[_ -]?key|\beyJ[A-Za-z0-9_-]{10,}\./i.test(message)) {
    return null
  }

  return message
}

function messageFromPayload(payload: unknown): string | null {
  if (typeof payload === 'string') return safeMessage(payload)
  if (!payload || typeof payload !== 'object') return null

  if ('error' in payload) {
    const error = payload.error
    const errorMessage = safeMessage(error)
    if (errorMessage) return errorMessage

    if (error && typeof error === 'object' && 'message' in error) {
      const nestedMessage = safeMessage(error.message)
      if (nestedMessage) return nestedMessage
    }
  }

  return 'message' in payload ? safeMessage(payload.message) : null
}

async function readFunctionResponse(response: Response): Promise<string | null> {
  try {
    const payload: unknown = await response.clone().json()
    return messageFromPayload(payload)
  } catch {
    // A function may return plain text instead of JSON.
  }

  try {
    return safeMessage(await response.clone().text())
  } catch {
    return null
  }
}

function kindFor(message: string, status?: number): UsersRepositoryErrorKind {
  if (status === 401 || status === 403 || /admin access|permission|unauthori[sz]ed|session/i.test(message)) {
    return 'permission'
  }
  if (status === 409 || /duplicate|already exists/i.test(message)) return 'duplicate'
  if (status === 400) return 'validation'
  if (/required|valid email|password must|invalid role/i.test(message)) return 'validation'
  return 'unknown'
}

function statusFallback(status: number): ProvisionUserFailure | null {
  switch (status) {
    case 400:
      return { kind: 'validation', message: 'The user details are invalid.' }
    case 401:
      return { kind: 'permission', message: 'Invalid or expired session.' }
    case 403:
      return { kind: 'permission', message: 'Admin access required.' }
    case 409:
      return { kind: 'duplicate', message: 'A user with this email or employee code already exists.' }
    case 500:
      return { kind: 'unknown', message: 'User provisioning failed. Please try again.' }
    default:
      return null
  }
}

export async function getProvisionUserFailure(data: unknown, error: unknown): Promise<ProvisionUserFailure> {
  const returnedMessage = messageFromPayload(data)
  if (returnedMessage) {
    return { kind: kindFor(returnedMessage), message: returnedMessage }
  }

  if (error instanceof FunctionsHttpError || error instanceof FunctionsRelayError) {
    const response = error.context instanceof Response ? error.context : null
    if (response) {
      const responseMessage = await readFunctionResponse(response)
      if (responseMessage) {
        return { kind: kindFor(responseMessage, response.status), message: responseMessage }
      }

      const fallback = statusFallback(response.status)
      if (fallback) return fallback
    }
  }

  const errorMessage = error instanceof Error ? error.message : ''
  if (/invalid.*(?:jwt|session)|expired.*(?:jwt|session)|(?:jwt|session).*expired/i.test(errorMessage)) {
    return { kind: 'permission', message: 'Invalid or expired session.' }
  }

  if (error instanceof FunctionsFetchError || error instanceof TypeError || /fetch|network|connection|offline/i.test(errorMessage)) {
    return { kind: 'network', message: 'Unable to reach Production Control. Check your connection and try again.' }
  }

  return { kind: 'unknown', message: 'User could not be created.' }
}
