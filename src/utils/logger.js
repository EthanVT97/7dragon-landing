/* eslint-disable no-console */
const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args)
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args)
    }
  },
  error: (...args) => {
    // Always log errors, even in production
    console.error('[ERROR]', ...args)
  },
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args)
    }
  }
}

export default logger
