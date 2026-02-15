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

// Default organisation ID for development/demo
// Must match the seeded OrganisationProfile ID
const DEFAULT_ORG_ID = "cmkrijggm000714kc4ger8tno";

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  organisationId: DEFAULT_ORG_ID,
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
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real app, this would validate the JWT token
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
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
      // In a real app, this would call the auth API
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
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  // Derive organisation ID from user or use default
  const organisationId = user?.organisationId ?? DEFAULT_ORG_ID;

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
