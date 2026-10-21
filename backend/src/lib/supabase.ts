import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

// Client côté serveur uniquement : la clé service_role ne doit jamais aller dans un frontend.
export const supabase = config.supabaseUrl
  ? createClient(config.supabaseUrl, config.supabaseCle, { auth: { persistSession: false } })
  : null;
