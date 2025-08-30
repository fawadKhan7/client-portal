/**
 * Utility script to add admin users to the database
 * Usage: node lib/addAdmin.js
 * Configuration: Edit lib/adminConfig.json
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nAdd these to your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Load configuration
let config
try {
  const configPath = path.join(process.cwd(), 'lib', 'adminConfig.json')
  const configFile = fs.readFileSync(configPath, 'utf8')
  config = JSON.parse(configFile)
  console.log('📋 Configuration loaded successfully')
} catch (error) {
  console.error('❌ Error loading adminConfig.json:', error.message)
  console.error('Make sure lib/adminConfig.json exists and is valid JSON')
  process.exit(1)
}

// Create a single admin user
async function createAdmin(adminData) {
  const { email, password, name, role = 'admin' } = adminData

  if (!email || !password || !name) {
    throw new Error('Missing required fields: email, password, name')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  if (config.settings.logDetails) {
    console.log(`\n🚀 Creating admin: ${name} (${email})`)
  }

  // Check if user already exists
  if (config.settings.skipIfExists) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const userExists = existingUsers.users.some(u => u.email === email)
    
    if (userExists) {
      console.log(`⚠️  User already exists: ${email} - skipping`)
      return { skipped: true, email }
    }
  }

  // Create user in auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: config.settings.autoConfirmEmail,
    user_metadata: {
      name: name,
      role: role
    }
  })

  if (authError) {
    throw new Error(`Auth creation failed: ${authError.message}`)
  }

  // Create profile record
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: authData.user.id,
        name: name,
        email: email,
        role: role
      }
    ])

  if (profileError) {
    // Clean up auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new Error(`Profile creation failed: ${profileError.message}`)
  }

  return {
    success: true,
    userId: authData.user.id,
    email: email,
    name: name,
    role: role
  }
}



// Main function to process admin configurations
async function main() {
  console.log('🛠️  Admin Creation Script (JSON Configuration)')
  console.log('============================================\n')

  const results = {
    created: [],
    skipped: [],
    errors: []
  }

  // Process admin creations
  if (config.admins && config.admins.length > 0) {
    console.log(`📝 Processing ${config.admins.length} admin user(s) to create...\n`)
    
    for (const adminData of config.admins) {
      try {
        const result = await createAdmin(adminData)
        
        if (result.skipped) {
          results.skipped.push(result)
        } else {
          results.created.push(result)
          console.log(`✅ Created: ${result.name} (${result.email}) - ID: ${result.userId}`)
        }
      } catch (error) {
        const errorInfo = { email: adminData.email, error: error.message }
        results.errors.push(errorInfo)
        console.log(`❌ Failed: ${adminData.email} - ${error.message}`)
      }
    }
  } else {
    console.log('⚠️  No admin users configured in adminConfig.json')
  }

  // Summary report
  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY REPORT')
  console.log('='.repeat(50))
  console.log(`✅ Created: ${results.created.length}`)
  console.log(`⚠️  Skipped: ${results.skipped.length}`)
  console.log(`❌ Errors: ${results.errors.length}`)

  if (results.created.length > 0) {
    console.log('\n🎉 Successfully Created Admins:')
    results.created.forEach(admin => {
      console.log(`   • ${admin.name} (${admin.email}) - ${admin.role}`)
    })
  }

  if (results.skipped.length > 0) {
    console.log('\n⚠️  Skipped (Already Exist):')
    results.skipped.forEach(user => {
      console.log(`   • ${user.email}`)
    })
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:')
    results.errors.forEach(error => {
      console.log(`   • ${error.email}: ${error.error}`)
    })
  }

  console.log('\n✨ Admin creation completed!')
  
  if (results.created.length > 0) {
    console.log('🔗 New admins can now log in at: /auth')
    console.log('🎯 They will see the "Clients" link in the sidebar')
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error.message)
  process.exit(1)
})
