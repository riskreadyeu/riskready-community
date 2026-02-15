import { useState, useEffect } from 'react';
import { getMe } from '@/lib/api';

interface User {
  id: string;
  email: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((response) => {
        setUser(response.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { user, loading, userId: user?.id ?? null };
}
