import { useState } from 'react';
import { supabase } from '@/infrastructure/lib/supabaseClient';

interface SignUpParams {
  email: string;
  password: string;
  username: string;
  avatar_url?: string;
}

export const useSignUp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async ({ email, password, username, avatar_url }: SignUpParams) => {
    setLoading(true);
    setError(null);
    console.log('SignUp attempt:', { email, password, username, avatar_url });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, avatar_url } },
    });
    if (error) {
      console.error('SignUp error:', error);
      setError(error.message);
    }
    setLoading(false);
    return !error;
  };

  return { signUp, loading, error };
}; 