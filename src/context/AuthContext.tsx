"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "user" | "caregiver";

export interface User {
  name: string;
  email: string;
  role: UserRole;
  isLoggedIn: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("medimind_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const storedUsers = JSON.parse(localStorage.getItem("medimind_users") || "[]");
    const foundUser = storedUsers.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userData } = foundUser;
      const loggedInUser = { ...userData, isLoggedIn: true };
      setUser(loggedInUser);
      localStorage.setItem("medimind_user", JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const storedUsers = JSON.parse(localStorage.getItem("medimind_users") || "[]");
    
    if (storedUsers.some((u: any) => u.email === email)) {
      return false;
    }

    const newUser = { name, email, password, role };
    storedUsers.push(newUser);
    localStorage.setItem("medimind_users", JSON.stringify(storedUsers));

    const { password: _, ...userData } = newUser;
    const loggedInUser = { ...userData, isLoggedIn: true };
    setUser(loggedInUser);
    localStorage.setItem("medimind_user", JSON.stringify(loggedInUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("medimind_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};