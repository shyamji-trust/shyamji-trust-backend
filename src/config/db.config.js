import { createClient } from '@supabase/supabase-js';

let _client = null;

const getSupabase = () => {
  if (!_client) {
    _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  }
  return _client;
};

export default getSupabase;
