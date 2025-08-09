import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { XCircle } from "lucide-react";

// Base URL untuk API
const getApiBaseUrl = () => {
    try {
      return (import.meta as any)?.env?.VITE_API_BASE_URL || "http://localhost:3000";
    } catch {
      return "http://localhost:3000";
    }
  };
  
const API_BASE_URL = getApiBaseUrl();

// ✅ Interface sederhana hanya untuk data yang diperlukan
interface CertificateViewData {
  id: number;
  full_name: string;
  certificate_number: string;
  certificate_file_url?: string;
  isValid: boolean;
}

export default function CertificateView() {
  // Ambil certificateNumber dari URL
  const getCertificateNumberFromURL = () => {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  };

  const certificateNumber = getCertificateNumberFromURL();
  const [certificate, setCertificate] = useState<CertificateViewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/certificates/view/${certificateNumber}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (result.success) {
          setCertificate(result.data);
        } else {
          setError(result.message || "Sertifikat tidak ditemukan");
        }
      } catch (err: any) {
        console.error("Error fetching certificate:", err);
        setError("Gagal memuat data sertifikat. Periksa koneksi internet Anda.");
      } finally {
        setLoading(false);
      }
    };

    if (certificateNumber) {
      fetchCertificate();
    } else {
      setError("Nomor sertifikat tidak valid");
      setLoading(false);
    }
  }, [certificateNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat sertifikat...</p>
          <p className="text-sm text-gray-500 mt-2">Nomor: {certificateNumber}</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sertifikat Tidak Ditemukan
              </h2>
              <p className="text-gray-600 mb-4">
                {error || "Sertifikat dengan nomor tersebut tidak ditemukan atau telah dihapus."}
              </p>
              <p className="text-sm text-gray-500 mb-4 font-mono bg-gray-100 p-2 rounded">
                Nomor: {certificateNumber}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Jika tidak ada file sertifikat, tampilkan pesan
  if (!certificate.certificate_file_url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto h-16 w-16 text-orange-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sertifikat Belum Tersedia
              </h2>
              <p className="text-gray-600 mb-4">
                File sertifikat untuk nomor {certificate.certificate_number} belum digenerate.
              </p>
              <p className="text-sm text-gray-500">
                Silakan hubungi administrator untuk men-generate sertifikat.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Preview Certificate Image - Full Screen */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-center bg-white rounded-lg">
              <img
                src={`${API_BASE_URL}${certificate.certificate_file_url}`}
                alt="Sertifikat Tes Psikologi"
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: "90vh" }}
                onError={(e) => {
                  console.error("Failed to load certificate image");
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}