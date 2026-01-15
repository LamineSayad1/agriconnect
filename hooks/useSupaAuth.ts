// hooks/useSupaAuth.ts
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

/* ============================
   TYPES
============================ */

export type UserRole = 'farmer' | 'buyer' | 'supplier';

export type Profile = {
  full_name: string;
  role: UserRole;
  farm_name?: string | null;
};

export type UserWithProfile = User & Profile;

/* ============================
   HOOK
============================ */

export const useSupaAuth = () => {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setUser(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role, farm_name')
        .eq('id', authUser.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile not found:', profileError);
        setUser(null);
        return;
      }

      setUser({
        ...authUser,
        ...profile,
      });

    } catch (error) {
      console.error('useSupaAuth error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event) => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};
