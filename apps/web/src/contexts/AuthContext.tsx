import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// User type representing the authenticated user
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organisationId: string;
  role?: string;
}

// Auth context type
interface AuthContextType {
  user: AuthUser | null;
  organisationId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  organisationId: "",
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

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

  // Resolve the organisation ID - fetch from API if not on user object
  const resolveOrgId = async (userData: AuthUser | null) => {
    if (userData?.organisationId) {
      setOrgId(userData.organisationId);
      return;
    }
    // Fallback: fetch the first available organisation
    try {
      const res = await fetch("/api/organisation");
      if (res.ok) {
        const data = await res.json();
        const id = data?.id || data?.[0]?.id || "";
        setOrgId(id);
        // Update stored user with org ID
        if (userData && id) {
          const updatedUser = { ...userData, organisationId: id };
          setUser(updatedUser);
          localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        }
      }
    } catch {
      // Non-critical
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          await resolveOrgId(parsed);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      await resolveOrgId(data.user);
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setOrgId("");
    localStorage.removeItem("auth_user");
  };

  // Derive organisation ID from user or resolved value
  const organisationId = user?.organisationId || orgId;

  return (
    <AuthContext.Provider
      value={{
        user,
        organisationId,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
