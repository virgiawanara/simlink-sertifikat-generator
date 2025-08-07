import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Download, Calendar, User, CreditCard, ArrowLeft } from "lucide-react";

// Base URL untuk API
const getApiBaseUrl = () => {
    try {
      return (import.meta as any)?.env?.VITE_API_BASE_URL || "http://localhost:3000";
    } catch {
      return "http://localhost:3000";
    }
  };
  
  const API_BASE_URL = getApiBaseUrl();

interface CertificateViewData {
  id: number;
  participantFullName: string;
  certificateNumber: string;
  licenseClass: "A" | "B" | "C";
  certificateType: "Perpanjang" | "Buat Baru";
  issueDate: string;
  expirationDate: string;
  certificateFileUrl?: string;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

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

  const handleDownloadCertificate = async () => {
    if (!certificate) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/certificates/download/${certificate.certificateNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `certificate-${certificate.certificateNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json().catch(() => null);
        alert(`Gagal mengunduh sertifikat: ${errorData?.message || 'File mungkin belum tersedia'}`);
      }
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Terjadi kesalahan saat mengunduh sertifikat");
    }
  };

  const handleBackToHome = () => {
    window.location.href = "/";
  };

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
              <Button onClick={handleBackToHome} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBackToHome}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verifikasi Sertifikat
          </h1>
          <p className="text-gray-600">
            Hasil Tes Psikologi - Surat Izin Mengemudi
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <div className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-medium ${
            certificate.isValid
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            {certificate.isValid ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                ✅ Sertifikat Valid & Berlaku
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 mr-2" />
                ❌ Sertifikat Sudah Kedaluwarsa
              </>
            )}
          </div>
        </div>

        {/* Certificate Details */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center text-xl">
              <CreditCard className="w-6 h-6 mr-3 text-blue-600" />
              Detail Sertifikat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Nama Peserta
                  </label>
                  <div className="flex items-center mt-2">
                    <User className="w-5 h-5 mr-3 text-gray-400" />
                    <p className="text-xl font-bold text-gray-900">
                      {certificate.participantFullName}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Nomor Sertifikat
                  </label>
                  <p className="text-lg font-mono bg-gray-100 px-4 py-3 rounded-lg mt-2 border">
                    {certificate.certificateNumber}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Jenis SIM
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {certificate.certificateType}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Golongan SIM
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      Golongan {certificate.licenseClass}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Tanggal Terbit
                  </label>
                  <div className="flex items-center mt-2">
                    <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                    <p className="text-lg font-medium">
                      {formatDate(certificate.issueDate)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Tanggal Kedaluwarsa
                  </label>
                  <div className="flex items-center mt-2">
                    <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                    <p className={`text-lg font-medium ${
                      certificate.isValid ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatDate(certificate.expirationDate)}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleDownloadCertificate}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={!certificate.certificateFileUrl}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Unduh Sertifikat PDF
                  </Button>
                  {!certificate.certificateFileUrl && (
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      File sertifikat belum tersedia
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Certificate Image */}
        {certificate.certificateFileUrl && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-xl">Preview Sertifikat</CardTitle>
              <CardDescription className="text-gray-600">
                Pratinjau sertifikat yang telah diterbitkan secara resmi
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-center bg-white rounded-lg shadow-inner p-4">
                <img
                  src={`${API_BASE_URL}${certificate.certificateFileUrl}`}
                  alt="Certificate Preview"
                  className="max-w-full h-auto border-2 border-gray-200 rounded-lg shadow-lg"
                  style={{ maxHeight: "700px" }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-gray-200">
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">
              🔒 Sertifikat ini telah diverifikasi dan sah berdasarkan data yang tersimpan dalam sistem.
            </p>
            <p className="text-gray-500 text-xs">
              © 2024 Sistem Manajemen Sertifikat Tes Psikologi
            </p>
            <p className="text-gray-400 text-xs">
              Untuk pertanyaan lebih lanjut, hubungi administrator sistem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}