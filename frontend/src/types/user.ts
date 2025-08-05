export type User = {
  id: string;
  name?: string;
  email: string;
  role: string;
};

export type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};
