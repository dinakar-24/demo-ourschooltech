import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dzxuzsvihjummaulzwff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6eHV6c3ZpaGp1bW1hdWx6d2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyMzU3MDYsImV4cCI6MjA1MzgxMTcwNn0.zJX16rFzXLvlMBNkKcGOCMfXe-qQ5y82Q3C-f29I6vU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
