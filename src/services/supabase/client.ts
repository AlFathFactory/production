import { createClient } from '@supabase/supabase-js'

import { env } from '../../config/env'
import type { Database } from '../../types/database'

export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
)
