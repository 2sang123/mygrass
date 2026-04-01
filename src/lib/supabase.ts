// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 이 코드가 .env.local에 저장된 값을 자동으로 읽어옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);