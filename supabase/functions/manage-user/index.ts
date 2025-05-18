import { createClient } from 'npm:@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface UserData {
  email: string
  password?: string
  firstName: string
  lastName: string
  role: string
  status: string
  id?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    // Get request data
    const { action, userData }: { action: 'create' | 'update', userData: UserData } = await req.json()

    if (action === 'create') {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          full_name: `${userData.firstName} ${userData.lastName}`.trim(),
          role: userData.role,
          status: userData.status
          phone: userData.phone
        }
      })

      if (createError) throw createError

      // The trigger will create the profile with the correct data from user_metadata
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (action === 'update') {
      // Update existing user
      if (!userData.id) throw new Error('User ID required for updates')

      // Update profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          first_name: userData.firstName,
          last_name: userData.lastName,
          full_name: `${userData.firstName} ${userData.lastName}`.trim(),
          role: userData.role,
          status: userData.status,
          phone: userData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id)

      if (updateError) throw updateError

      // Update password if provided
      if (userData.password) {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          userData.id,
          { password: userData.password }
        )
        if (passwordError) throw passwordError
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})