import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, AuthError } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: AuthError | null }>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: AuthError | null; data?: any }>;
  updateProfile: (name: string, email: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("AuthContext: Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    return { success: !error, error };
  };

  const signup = async (name: string, email: string, pass: string) => {
    try {
      const result = await supabase.auth.signUp({
        email,
        password: pass,
        options: { 
          data: { name },
          emailRedirectTo: window.location.origin + '/login'
        }
      });
      
      if (result.error) {
        console.error("AuthContext: Signup error:", result.error);
      }

      return { 
        success: !result.error, 
        error: result.error,
        data: result.data
      };
    } catch (err) {
      console.error("AuthContext: Unexpected signup error:", err);
      return { 
        success: false, 
        error: err as AuthError 
      };
    }
  };

  const updateProfile = async (name: string, email: string) => {
    const { error } = await supabase.auth.updateUser({
      email,
      data: { name }
    });
    return !error;
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};