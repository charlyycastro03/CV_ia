import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usamos el SERVICE_ROLE_KEY para operaciones seguras desde el servidor (bypass RLS cuando es necesario, o para admin)
// Si necesitas autenticación de usuario, usarás la anon key.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente para el servidor
export const supabaseServer = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Cliente para el cliente (navegador)
export const supabaseClient = () => {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey);
};
