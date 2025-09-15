/**
 * Server plugin to initialize database on startup
 */

/* global defineNitroPlugin */

import { initDatabase } from '../utils/database'

export default defineNitroPlugin(async () => {
  console.log('🚀 Initializing database...')
  await initDatabase()
})