import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@/hooks/use-user";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useUser();
  const location = useLocation();

  // Tampilkan loading saat masih fetch user data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Jika user tidak ada (belum login), redirect ke login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Jika sudah login, tampilkan children
  return <>{children}</>;
}
