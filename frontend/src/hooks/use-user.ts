import { useContext } from "react";
import { UserContext } from "@/context/user-context";
import type { UserContextType } from "@/types/user";

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser harus digunakan di dalam UserProvider");
  }
  return context;
};
