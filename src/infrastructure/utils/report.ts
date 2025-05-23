import { supabase } from '@/infrastructure/lib/supabaseClient';
import type { Database } from '@/types/supabase';

export type AppReportInsert = Database['public']['Tables']['app_reports']['Insert'];

export async function submitAppReport(data: AppReportInsert) {
  const { error } = await supabase.from('app_reports').insert([data]);
  return error;
} 