import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getMe, login as loginRequest, logout as logoutRequest } from "@/lib/api";

// User type representing the authenticated user
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organisationId?: string;
  role?: string;
}

// Auth context type
interface AuthContextType {
  user: AuthUser | null;
  organisationId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orgId, setOrgId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = (nextUser: AuthUser | null) => {
    if (nextUser) {
      localStorage.setItem("auth_user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("auth_user");
    }
  };

  const applyUser = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    setOrgId(nextUser?.organisationId ?? "");
    persistUser(nextUser);
  };

  const resolveOrgId = async (userData: AuthUser | null) => {
    if (!userData) {
      setOrgId("");
      return null;
    }

    if (userData.organisationId) {
      setOrgId(userData.organisationId);
      return userData;
    }

    try {
      const res = await fetch("/api/organisation");
      if (res.ok) {
        const data = await res.json();
        const id = data?.id || data?.[0]?.id || "";
        const updatedUser = id ? { ...userData, organisationId: id } : userData;
        setOrgId(updatedUser.organisationId ?? "");
        return updatedUser;
      }
    } catch {
      // Non-critical fallback
    }

    return userData;
  };

  const refresh = async () => {
    const me = await getMe();
    const resolvedUser = await resolveOrgId(me.user);
    applyUser(resolvedUser);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await refresh();
      } catch (err) {
        try {
          const storedUser = localStorage.getItem("auth_user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser) as AuthUser;
            const resolvedUser = await resolveOrgId(parsed);
            applyUser(resolvedUser);
          } else {
            applyUser(null);
          }
        } catch (storageErr) {
          console.error("Auth bootstrap failed:", storageErr);
          applyUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await loginRequest(email, password);
      await refresh();
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      applyUser(null);
    }
  };

  const organisationId = user?.organisationId || orgId;

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      organisationId,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refresh,
    }),
    [user, organisationId, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
