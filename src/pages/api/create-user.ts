// pages/api/create-user.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set JSON content type for all responses
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, first_name, last_name, full_name, role, status } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        full_name,
        role,
        status
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data?.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    return res.status(200).json({ user: data.user });
  } catch (err: any) {
    console.error('User creation error:', err);
    return res.status(500).json({ 
      error: err.message || 'An unexpected error occurred while creating the user' 
    });
  }
}