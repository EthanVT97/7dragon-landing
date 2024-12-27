const { createInitialAdmin } = require('../src/utils/createInitialAdmin.js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

const initializeAdmin = async () => {
  try {
    console.log('Starting admin initialization...')

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminUsername = process.env.ADMIN_USERNAME || 'Admin'
    const adminNickname = process.env.ADMIN_NICKNAME || 'System Admin'

    if (!adminEmail || !adminPassword) {
      console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required')
      process.exit(1)
    }

    console.log(`Creating admin user with email: ${adminEmail}`)

    // Create admin user
    const result = await createInitialAdmin(
      adminEmail,
      adminPassword,
      adminUsername,
      adminNickname
    )

    if (result.success) {
      console.log(' Admin user created successfully!')
      console.log('Please check your email for verification.')
      process.exit(0)
    } else {
      console.error(' Failed to create admin:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error(' Error initializing admin:', error.message)
    process.exit(1)
  }
}

// Run the initialization
console.log('Admin Initialization Script')
console.log('-------------------------')
initializeAdmin()
