import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, AuthError, AuthTokenResponse } from "@supabase/supabase-js";
import { queryClient } from "@/lib/query-client";
import { QUERY_KEYS } from "@/lib/query-client";

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: AuthError | null }>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: AuthError | null; data?: AuthTokenResponse }>;
  updateProfile: (name: string, email: string) => Promise<boolean>;
  isLoading: boolean;
}

// Initialize with undefined to enforce provider usage
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) setUser(session?.user ?? null);
      } catch (error) {
        console.error("AuthContext: Session init error:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (!error && data?.user) {
        prefetchInitialData();
      }
      return { success: !error, error, data };
    } catch (err) {
      console.error("AuthContext: Login error:", err);
      return { success: false, error: err as AuthError };
    }
  };

  const prefetchInitialData = async () => {
    try {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.familyMembers,
          queryFn: async () => {
            const { data } = await supabase.from('family_members').select('*');
            return data || [];
          },
        }),
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.medicines,
          queryFn: async () => {
            const { data } = await supabase.from('medicines').select('*');
            return data || [];
          },
        }),
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.doseLogs,
          queryFn: async () => {
            const { data } = await supabase.from('dose_logs').select('*');
            return data || [];
          },
        }),
      ]);
    } catch (e) {
      console.error("Prefetch error:", e);
    }
  };

  const signup = async (name: string, email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { 
          data: { name },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) throw error;
      return { success: true, error: null, data };
    } catch (err) {
      console.error("AuthContext: Signup error:", err);
      return { success: false, error: err as AuthError };
    }
  };

  const updateProfile = async (name: string, email: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email,
        data: { name }
      });
      return !error;
    } catch (err) {
      console.error("AuthContext: Profile update error:", err);
      return false;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("AuthContext: Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = { user, login, logout, signup, updateProfile, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a valid AuthProvider");
  }
  return context;
};