import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "@/page/dashboard/login";
import CreateCertificatePage from "@/page/dashboard/create-certificate";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Signup from "@/page/dashboard/signup";
import NotFound from "@/page/not-found";
import ProtectedRoute from "@/components/protected-route";
import PublicRoute from "@/components/public-route";
import ListCertificatePage from "@/page/dashboard/list-certificate";
import CertificateView from "@/page/certificate-view";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================= */}
        {/* PUBLIC ROUTES - TANPA AUTHENTICATION */}
        {/* ========================================= */}
        
        {/* ✅ TAMBAHKAN ROUTE CERTIFICATE VIEW (TANPA PROTEKSI) */}
        <Route path="/certificate/view/:certificateNumber" element={<CertificateView />} />
        <Route path="/certificate/view/id/:id" element={<CertificateView />} />
        
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

        {/* ========================================= */}
        {/* PROTECTED ROUTES - PERLU LOGIN */}
        {/* ========================================= */}
        
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