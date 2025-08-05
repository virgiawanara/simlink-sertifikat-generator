import { Navigate } from "react-router-dom";
import { useUser } from "@/hooks/use-user";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function PublicRoute({
  children,
  redirectTo = "/",
}: PublicRouteProps) {
  const { user, loading } = useUser();

  // Tampilkan loading saat masih fetch user data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Jika sudah login, redirect ke halaman utama
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Jika belum login, tampilkan halaman login/signup
  return <>{children}</>;
}
