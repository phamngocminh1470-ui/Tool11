"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  tier: string;
  referral_code: string;
  wallet_balance: number;
  is_verified: boolean;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (updater: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem("studyos_token");
      const storedUser = localStorage.getItem("studyos_user");
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  // Protect routes based on authentication state
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-otp", "/payment/checkout-simulation"];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    if (!user && !isPublicRoute && pathname !== "/") {
      router.push("/login");
    } else if (user && isPublicRoute && !pathname.startsWith("/payment/checkout-simulation")) {
      router.push("/dashboard");
    }
  }, [user, loading, pathname, router]);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const data = await api.login(credentials);
      localStorage.setItem("studyos_token", data.access_token);
      localStorage.setItem("studyos_user", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      await api.register(data);
      // Redirect to verification OTP page
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("studyos_token");
    localStorage.removeItem("studyos_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const updateUser = (updater: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...updater };
      localStorage.setItem("studyos_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
