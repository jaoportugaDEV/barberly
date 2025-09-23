// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente *apenas para uso no servidor*
 * Usa a SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
 * NUNCA importe isso em componentes client.
 */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL, // ✅ usa variável exclusiva para o servidor
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabaseAdmin;
