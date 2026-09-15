interface AppEnvironment {
  supabaseUrl: string
  supabasePublishableKey: string
}

function requireEnvironmentValue(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]?.trim()

  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and provide a frontend-safe value.`,
    )
  }

  return value
}

function readEnvironment(): AppEnvironment {
  const supabaseUrl = requireEnvironmentValue('VITE_SUPABASE_URL')

  try {
    const parsedUrl = new URL(supabaseUrl)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
      throw new Error('Supabase URL must use HTTPS outside local development.')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('must use HTTPS')) {
      throw error
    }
    throw new Error('VITE_SUPABASE_URL must be a valid URL.')
  }

  return {
    supabaseUrl,
    supabasePublishableKey: requireEnvironmentValue(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    ),
  }
}

export const env = Object.freeze(readEnvironment())
