import { useEffect, useState } from "react";
import {
  getNonconformity,
  getUsers,
  type Nonconformity,
  type UserBasic,
} from "@/lib/audits-api";
import { logAppError } from "@/lib/app-errors";

export function useNonconformityDetail(id: string | undefined, isNew: boolean) {
  const [loading, setLoading] = useState(!isNew);
  const [nc, setNc] = useState<Nonconformity | null>(null);
  const [users, setUsers] = useState<UserBasic[]>([]);

  async function refresh() {
    if (!id || isNew) {
      setLoading(false);
      setNc(null);
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const [ncData, usersData] = await Promise.all([
        getNonconformity(id),
        getUsers(),
      ]);
      setNc(ncData);
      setUsers(usersData);
    } catch (error) {
      logAppError("Error loading nonconformity:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [id, isNew]);

  return {
    loading,
    nc,
    users,
    refresh,
  };
}
