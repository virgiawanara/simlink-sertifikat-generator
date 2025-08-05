import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "@/page/dashboard/login";
import CreateCertificatePage from "@/page/dashboard/create-certificate";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Signup from "@/page/dashboard/signup";
import NotFound from "@/page/not-found";
import ProtectedRoute from "@/components/protected-route";
import PublicRoute from "@/components/public-route";
import ListCertificatePage from "@/page/dashboard/list-certificate";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Protected Routes - Perlu login untuk akses */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
          <Route index element={<CreateCertificatePage />} />
          <Route path="create" element={<CreateCertificatePage />} />
          <Route path="list" element={<ListCertificatePage />} />
        </Route>

        {/* Public Routes - Hanya bisa diakses jika belum login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Root route - redirect ke dashboard jika sudah login */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
          <Route index element={<CreateCertificatePage />} />
        </Route>

        {/* 404 Route - Perlu login untuk akses */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
