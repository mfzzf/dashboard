export const API_KEY_PREFIX = 'e2b_'
export const ACCESS_TOKEN_PREFIX = 'sk_e2b_'
export const ENVD_ACCESS_TOKEN_HEADER = 'X-Access-Token'
export const API_KEY_HEADER = 'X-API-Key'
export const SUPABASE_TOKEN_HEADER = 'X-Supabase-Token'
export const SUPABASE_TEAM_HEADER = 'X-Supabase-Team'

/**
 * Get E2B API Key from environment variable
 */
export function getE2BApiKey(): string {
  const apiKey = process.env.E2B_API_KEY
  if (!apiKey) {
    throw new Error('E2B_API_KEY environment variable is not set')
  }
  return apiKey
}

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
 * Auth headers for infra API requests using X-API-Key
 */
export const AUTH_HEADERS = (_teamId?: string) => ({
  [API_KEY_HEADER]: getE2BApiKey(),
})

/**
 * Auth headers for infra API requests that require JWT token (e.g., /teams)
 * Uses X-Supabase-Token header with JWT access token
 */
export const BEARER_AUTH_HEADERS = () => ({
  [SUPABASE_TOKEN_HEADER]: getE2BAccessToken(),
})

/**
 * Auth headers for e2b SDK using Authorization Bearer
 */
export const SDK_AUTH_HEADERS = () => ({
  Authorization: `Bearer ${getE2BApiKey()}`,
})

/**
 * Auth headers with X-Supabase-Token and optional X-Supabase-Team
 * Now uses API Key instead
 */
export const SUPABASE_AUTH_HEADERS = (
  _supabaseToken?: string,
  _teamId?: string
) => AUTH_HEADERS()

export const CLI_GENERATED_KEY_NAME = 'CLI login/configure'
