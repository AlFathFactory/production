import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { authRepository, AuthRepositoryError } from '../authRepository'
import { authKeys } from '../queries/authKeys'
import { useAuthProfile } from '../queries/useAuthProfile'
import { AuthContext } from './AuthContext'

const MISSING_PROFILE_MESSAGE =
  'Your employee account is not configured. Contact an administrator.'
const INACTIVE_PROFILE_MESSAGE =
  'Your employee account is inactive. Contact an administrator.'

function getResolutionMessage(error: unknown): string {
  if (error instanceof AuthRepositoryError) {
    return error.message
  }

  return 'Your account could not be verified. Please try again.'
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const [accessError, setAccessError] = useState<string | null>(null)
  const profileQuery = useAuthProfile(session?.user.id)

  useEffect(() => {
    let isMounted = true

    void authRepository
      .getCurrentSession()
      .then((currentSession) => {
        if (isMounted) {
          setSession(currentSession)
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setAccessError(getResolutionMessage(error))
          setSession(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSessionLoading(false)
        }
      })

    const unsubscribe = authRepository.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession)
        setIsSessionLoading(false)
        if (nextSession) {
          setAccessError(null)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session || profileQuery.isPending || profileQuery.isFetching) {
      return
    }

    const rejectSession = (message: string) => {
      setAccessError(message)
      void authRepository.signOut().catch(() => undefined)
    }

    if (profileQuery.isError) {
      setAccessError(getResolutionMessage(profileQuery.error))
      return
    }

    if (!profileQuery.data) {
      rejectSession(MISSING_PROFILE_MESSAGE)
      return
    }

    if (!profileQuery.data.is_active) {
      rejectSession(INACTIVE_PROFILE_MESSAGE)
    }
  }, [profileQuery.data, profileQuery.error, profileQuery.isError, profileQuery.isFetching, profileQuery.isPending, session])

  const value = useMemo(
    () => ({
      session,
      userProfile: profileQuery.data ?? null,
      isAuthenticated: Boolean(
        session && profileQuery.data?.is_active && !profileQuery.isError,
      ),
      isLoading:
        isSessionLoading || Boolean(session && profileQuery.isPending),
      error: accessError,
      async signOut() {
        setAccessError(null)
        await authRepository.signOut()
        queryClient.removeQueries({ queryKey: authKeys.all })
      },
      async retryProfile() {
        setAccessError(null)
        await profileQuery.refetch()
      },
    }),
    [accessError, isSessionLoading, profileQuery, queryClient, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
