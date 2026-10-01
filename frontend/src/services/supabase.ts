import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://liuvqzdjnydlkrxwiigd.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdXZxemRqbnlkbGtyeHdpaWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTI1MTcsImV4cCI6MjEwNjQyODUxN30.NZJ3ma6tWB2vWQSk3PZs4ubWb2HElMxepJF4Vzj8PBU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
