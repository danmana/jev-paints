import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Server-only Supabase client with the service role. RLS is on and has no policies, so nothing else can read the table. */
let client: SupabaseClient | null = null;

export function hasDb(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set');
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

/** One row of public.paintings. */
export interface PaintingRow {
  id: string;
  created_at: string;
  prompt: string;
  palette: string;
  style: string;
  layout: string;
  steps: number;
  likes: number;
  image: string;
  thumb: string;
  json_url: string;
  created_by: string | null;
}
