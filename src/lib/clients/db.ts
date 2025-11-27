import 'server-cli-only'

import postgres from 'postgres'

// PostgreSQL connection using environment variable
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('DATABASE_URL not set - database features will be unavailable')
}

// Create postgres client with read-only connection
export const db = connectionString
  ? postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return db !== null
}
