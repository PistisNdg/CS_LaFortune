import { createBrowserSupabaseClient } from './supabase-browser';

/** Client navigateur — session dans les cookies (compatible SSR). */
export const supabase = createBrowserSupabaseClient();
