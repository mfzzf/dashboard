export const API_KEY_PREFIX = 'e2b_'
export const ACCESS_TOKEN_PREFIX = 'sk_e2b_'
export const ENVD_ACCESS_TOKEN_HEADER = 'X-Access-Token'
export const SUPABASE_TOKEN_HEADER = 'X-Supabase-Token'
export const SUPABASE_TEAM_HEADER = 'X-Supabase-Team'

/**
 * Get E2B access token (JWT) from environment variable
 */
export function getE2BAccessToken(): string {
  const token = process.env.E2B_ACCESS_TOKEN
  if (!token) {
    throw new Error('E2B_ACCESS_TOKEN environment variable is not set')
  }
  return token
}

/**
 * Auth headers for infra API requests using X-Supabase-Token
 */
export const AUTH_HEADERS = (teamId?: string) => ({
  [SUPABASE_TOKEN_HEADER]: getE2BAccessToken(),
  ...(teamId && { [SUPABASE_TEAM_HEADER]: teamId }),
})

/**
 * Auth headers with X-Supabase-Token and optional X-Supabase-Team
 * Uses E2B_ACCESS_TOKEN from environment (ignores supabaseToken parameter)
 */
export const SUPABASE_AUTH_HEADERS = (
  _supabaseToken?: string,
  teamId?: string
) => AUTH_HEADERS(teamId)

export const CLI_GENERATED_KEY_NAME = 'CLI login/configure'
