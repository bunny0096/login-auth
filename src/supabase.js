import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your_anon_key_here';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('⚠️  Warning: SUPABASE_URL or SUPABASE_KEY not set in .env. Using fallback placeholders.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
