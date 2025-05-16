import { useState } from 'react';
import { supabase } from '@/infrastructure/lib/supabaseClient';

interface SignInParams {
  identifier: string;
  password: string;
}

export const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async ({ identifier, password }: SignInParams) => {
    setLoading(true);
    setError(null);
    let email = identifier;
    if (!identifier.includes('@')) {
      // Looks like a username, so look up the email
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single();
      if (profileError || !data) {
        setError('Username not found');
        setLoading(false);
        return false;
      }
      email = data.email;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) setError(authError.message);
    return !authError;
  };

  return { signIn, loading, error };
}; 