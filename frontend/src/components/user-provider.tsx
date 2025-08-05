import { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { UserContext } from "@/context/user-context";
import type { User } from "@/types/user";

interface UserProviderProps {
  children: ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`,
        {
          credentials: "include",
        }
      );

      const result = await res.json();

      // Perbaikan: Hanya periksa res.ok karena backend tidak mengembalikan properti 'success'.
      if (res.ok) {
        setUser(result.user); // Pastikan mengambil properti 'user'
      } else {
        setUser(null);
        // Jangan tampilkan error untuk status 401 (Unauthorized) karena itu perilaku yang diharapkan untuk user yang belum login
        if (res.status !== 401) {
          setError(result.message || "Failed to fetch user profile");
        }
      }
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include", // Backend akan clear cookie
        }
      );

      // Clear user state
      setUser(null);

      if (!res.ok) {
        const result = await res.json();
        setError(result.message || "Logout failed");
      }
    } catch (err) {
      // Tetap clear user state meskipun ada error
      setUser(null);
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      loading,
      error,
      refreshUser: fetchUser,
      logout,
    }),
    [user, loading, error, fetchUser, logout]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}
