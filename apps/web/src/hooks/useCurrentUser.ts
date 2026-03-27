import { useAuth } from "@/contexts/AuthContext";

export function useCurrentUser() {
  const { user, isLoading } = useAuth();

  return { user, loading: isLoading, userId: user?.id ?? null };
}
