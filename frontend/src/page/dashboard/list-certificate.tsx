// Certificate List Component yang diperbaiki sesuai spesifikasi database
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast, Toaster } from "sonner";
import {
  DownloadIcon,
  SearchIcon,
  TrashIcon,
  FileTextIcon,
  FilterX,
  Pencil,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Base URL for API from environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ✅ PERBAIKAN: Interface menggunakan nama field database
interface CertificateData {
  id: number;
  full_name: string;
  nik?: string;
  gender: "Laki-laki" | "Perempuan";
  birth_place: string;
  birth_date: string;
  age: number;
  certificate_type: "Baru" | "Perpanjang";  // ✅ SESUAI SPESIFIKASI
  license_class: "A" | "A Umum" | "B1" | "B1 Umum" | "B2" | "B2 Umum" | "C" | "C1" | "C2" | "D" | "D1";  // ✅ SESUAI SPESIFIKASI
  domicile: string;
  participant_photo_url?: string;
  certificate_number: string;
  issue_date: string;
  expiration_date?: string;
  certificate_file_url?: string;
  signature_qr_url?: string;
  issued_by_user_id: number;
  user_id?: number;
}

// Interface for API response
interface CertificateListResponse {
  success: boolean;
  message: string;
  data: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    certificates: CertificateData[];
  };
  filters?: {
    search: string | null;
    licenseClass: string | null;
    certificateType: string | null;
    gender: string | null;
  };
}

// Custom Hook for Certificate API operations
const useCertificateAPI = () => {
  const handleAPIResponse = async (response: Response): Promise<any> => {
    const jsonResponse = await response.json();
    if (!response.ok) {
      throw new Error(
        jsonResponse.message || `HTTP error! status: ${response.status}`
      );
    }
    if (!jsonResponse.success) {
      throw new Error(jsonResponse.message || "Operation failed.");
    }
    return jsonResponse;
  };

  const fetchCertificateList = useCallback(
    async (searchParams?: {
      search?: string;
      certificateType?: string;
      licenseClass?: string;
      gender?: string;
      page?: number;
      limit?: number;
    }): Promise<CertificateListResponse> => {
      let url = `${API_BASE_URL}/api/certificates`;
      if (
        searchParams &&
        (searchParams.search ||
          searchParams.certificateType ||
          searchParams.licenseClass ||
          searchParams.gender)
      ) {
        url = `${API_BASE_URL}/api/certificates/search`;
      }
      if (searchParams) {
        const queryParams = new URLSearchParams();
        if (searchParams.search && searchParams.search.trim()) {
          queryParams.append("q", searchParams.search.trim());
        }
        if (searchParams.certificateType) {
          queryParams.append("certificateType", searchParams.certificateType);
        }
        if (searchParams.licenseClass) {
          queryParams.append("licenseClass", searchParams.licenseClass);
        }
        if (searchParams.gender) {
          queryParams.append("gender", searchParams.gender);
        }
        if (searchParams.page) {
          queryParams.append("page", searchParams.page.toString());
        }
        if (searchParams.limit) {
          queryParams.append("limit", searchParams.limit.toString());
        }
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }
      const response = await fetch(url, {
        credentials: "include",
      });
      return await handleAPIResponse(response);
    },
    []
  );

  const deleteCertificateById = useCallback(
    async (certificateId: number): Promise<string> => {
      const response = await fetch(
        `${API_BASE_URL}/api/certificates/${certificateId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const result = await handleAPIResponse(response);
      return result.message;
    },
    []
  );

  const generateCertificateFile = useCallback(
    async (certificateId: number): Promise<string> => {
      const url = `${API_BASE_URL}/api/certificates/${certificateId}/generate`;
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
      });
      const result = await handleAPIResponse(response);
      return result.data.certificateUrl;
    },
    []
  );

  const downloadCertificateFile = useCallback(
    async (certificateId: number): Promise<string> => {
      const response = await fetch(
        `${API_BASE_URL}/api/certificates/${certificateId}/download`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Sertifikat belum tersedia. Silakan generate terlebih dahulu."
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      return downloadUrl;
    },
    []
  );

  // ✅ PERBAIKAN: Update function menggunakan FormData dengan field names yang benar
  const updateCertificateById = useCallback(
    async (certificateId: number, updatedData: FormData): Promise<string> => {
      const response = await fetch(
        `${API_BASE_URL}/api/certificates/${certificateId}`,
        {
          method: "PUT",
          body: updatedData,
          credentials: "include",
        }
      );
      const result = await handleAPIResponse(response);
      return result.message;
    },
    []
  );

  return {
    fetchCertificateList,
    downloadCertificateFile,
    deleteCertificateById,
    generateCertificateFile,
    updateCertificateById,
  };
};

export default function CertificateListPage() {
  const {
    fetchCertificateList,
    downloadCertificateFile,
    deleteCertificateById,
    generateCertificateFile,
    updateCertificateById,
  } = useCertificateAPI();

  const [certificateList, setCertificateList] = useState<CertificateData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState<
    number | null
  >(null);

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [certificateToEdit, setCertificateToEdit] = useState<
    CertificateData | undefined
  >(undefined);
  
  // ✅ PERBAIKAN: State menggunakan field database
  const [updatedFormData, setUpdatedFormData] = useState<
    Partial<CertificateData>
  >({});

  // ✅ PERBAIKAN: State untuk file dengan field names yang benar
  const [updateFormFiles, setUpdateFormFiles] = useState<{
    participant_photo_url?: File;
    signature_qr_url?: File;
  }>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [licenseFilter, setLicenseFilter] = useState("");
  const [certificateTypeFilter, setCertificateTypeFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const fetchDataWithFilters = useCallback(
    async (resetPage = false) => {
      setIsLoading(true);
      try {
        const searchParams: any = {
          page: resetPage ? 1 : currentPage,
          limit: 10,
        };
        if (debouncedSearchQuery.trim()) {
          searchParams.search = debouncedSearchQuery.trim();
        }
        if (licenseFilter) {
          searchParams.licenseClass = licenseFilter;
        }
        if (certificateTypeFilter) {
          searchParams.certificateType = certificateTypeFilter;
        }
        if (genderFilter) {
          searchParams.gender = genderFilter;
        }
        const result = await fetchCertificateList(searchParams);
        setCertificateList(result.data.certificates || []);
        setTotalItems(result.data.totalItems || 0);
        setTotalPages(result.data.totalPages || 0);
        if (resetPage) {
          setCurrentPage(1);
        }
      } catch (error: any) {
        console.error("Error fetching certificates:", error);
        toast.error("Gagal Memuat Data", {
          description: `Terjadi kesalahan: ${error.message}`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      fetchCertificateList,
      debouncedSearchQuery,
      licenseFilter,
      certificateTypeFilter,
      genderFilter,
      currentPage,
    ]
  );

  useEffect(() => {
    fetchDataWithFilters();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 700);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchDataWithFilters(true);
  }, [
    debouncedSearchQuery,
    licenseFilter,
    certificateTypeFilter,
    genderFilter,
  ]);

  const handleLicenseFilterChange = (value: string | undefined) => {
    setLicenseFilter(value || "");
  };

  const handleCertificateTypeFilterChange = (value: string | undefined) => {
    setCertificateTypeFilter(value || "");
  };

  const handleGenderFilterChange = (value: string | undefined) => {
    setGenderFilter(value || "");
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setLicenseFilter("");
    setCertificateTypeFilter("");
    setGenderFilter("");
  };

  const handleGenerateCertificateAction = async (certificateId: number) => {
    try {
      const certificateUrl = await generateCertificateFile(certificateId);
      const fullUrl = `${API_BASE_URL}${certificateUrl}`;
      window.open(fullUrl, "_blank");
      toast.success("Sertifikat Berhasil Digenerate!", {
        description: "Sertifikat telah dibuka di tab baru.",
      });
    } catch (error: any) {
      console.error("Error generating certificate:", error);
      toast.error("Gagal Meng-generate Sertifikat", {
        description: `Terjadi kesalahan: ${error.message}`,
      });
    }
  };

  const openDeleteDialog = (id: number) => {
    setSelectedCertificateId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCertificate = async () => {
    if (selectedCertificateId === null) return;
    try {
      const responseMessage = await deleteCertificateById(
        selectedCertificateId
      );
      toast.success("Sertifikat Berhasil Dihapus", {
        description: responseMessage,
      });
      await fetchDataWithFilters();
    } catch (error: any) {
      console.error("Error deleting certificate:", error);
      toast.error("Gagal Menghapus Sertifikat", {
        description: `Terjadi kesalahan: ${error.message}`,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedCertificateId(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCertificateId(null);
  };

  const handleDownloadCertificateAction = async (certificateId: number) => {
    toast.info("Mengunduh Sertifikat", {
      description: "Sertifikat sedang disiapkan untuk diunduh...",
    });
    try {
      const downloadUrl = await downloadCertificateFile(certificateId);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Unduh Berhasil", {
        description: "Sertifikat berhasil diunduh.",
      });
    } catch (error: any) {
      console.error("Error downloading certificate:", error);
      toast.error("Gagal Mengunduh", {
        description: `Terjadi kesalahan saat mengunduh sertifikat: ${error.message}`,
      });
    }
  };

  // ✅ PERBAIKAN: Fungsi untuk membuka dialog update dengan field database
  const openUpdateDialog = (certificate: CertificateData) => {
    setCertificateToEdit(certificate);
    setUpdatedFormData({
      full_name: certificate.full_name,
      nik: certificate.nik,
      domicile: certificate.domicile,
      certificate_type: certificate.certificate_type,
      license_class: certificate.license_class,
    });
    setUpdateFormFiles({}); // Reset file state
    setIsUpdateDialogOpen(true);
  };

  // Fungsi untuk menangani submit form update
  const handleUpdateSubmit = async () => {
    if (!certificateToEdit) return;

    try {
      const formData = new FormData();

      // ✅ PERBAIKAN: Tambahkan data teks ke FormData dengan nama field database
      Object.keys(updatedFormData).forEach((key) => {
        const value = updatedFormData[key as keyof typeof updatedFormData];
        if (value !== undefined && value !== null) {
          // Convert value to string for FormData
          formData.append(key, String(value));
        }
      });

      // ✅ PERBAIKAN: Tambahkan file ke FormData dengan field names yang benar
      if (updateFormFiles.participant_photo_url) {
        formData.append(
          "participant_photo_url",
          updateFormFiles.participant_photo_url
        );
      }
      if (updateFormFiles.signature_qr_url) {
        formData.append("signature_qr_url", updateFormFiles.signature_qr_url);
      }

      await updateCertificateById(certificateToEdit.id, formData);
      toast.success("Sertifikat Berhasil Diperbarui", {
        description: `Data sertifikat untuk ${certificateToEdit.full_name} telah diperbarui.`,
      });
      setIsUpdateDialogOpen(false);
      setCertificateToEdit(undefined);
      await fetchDataWithFilters();
    } catch (error: any) {
      console.error("Error updating certificate:", error);
      toast.error("Gagal Memperbarui Sertifikat", {
        description: `Terjadi kesalahan: ${error.message}`,
      });
    }
  };

  // Fungsi untuk menangani perubahan input form teks
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUpdatedFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fungsi untuk menangani perubahan input form file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setUpdateFormFiles((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    if (currentPage > 1) {
      fetchDataWithFilters();
    }
  }, [currentPage]);

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-4 md:p-8 max-w-screen overflow-x-hidden">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Selamat Datang di Dashboard 👋
        </h1>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Daftar Sertifikat</CardTitle>
            <CardDescription>
              Lihat dan kelola sertifikat yang sudah dibuat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              <div className="relative max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama atau NIK..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {/* ✅ PERBAIKAN: Filter Golongan SIM dengan semua opsi sesuai database */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Golongan SIM
                  </label>
                  <Select
                    value={licenseFilter || undefined}
                    onValueChange={handleLicenseFilterChange}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Semua Golongan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="A Umum">A Umum</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B1 Umum">B1 Umum</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="B2 Umum">B2 Umum</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C2">C2</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="D1">D1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* ✅ PERBAIKAN: Filter Jenis Sertifikat dengan nilai sesuai database */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Jenis Sertifikat
                  </label>
                  <Select
                    value={certificateTypeFilter || undefined}
                    onValueChange={handleCertificateTypeFilterChange}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Semua Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baru">Baru</SelectItem>
                      <SelectItem value="Perpanjang">Perpanjang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Jenis Kelamin
                  </label>
                  <Select
                    value={genderFilter || undefined}
                    onValueChange={handleGenderFilterChange}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(searchQuery ||
                  licenseFilter ||
                  certificateTypeFilter ||
                  genderFilter) && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-transparent">
                      Action
                    </label>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={clearAllFilters}
                      className="flex items-center gap-2">
                      <FilterX className="h-4 w-4" />
                      Reset Filter
                    </Button>
                  </div>
                )}
              </div>
              {(searchQuery ||
                licenseFilter ||
                certificateTypeFilter ||
                genderFilter) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {searchQuery && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                      Pencarian: "{searchQuery}"
                    </div>
                  )}
                  {licenseFilter && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                      Golongan: {licenseFilter}
                    </div>
                  )}
                  {certificateTypeFilter && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                      Jenis: {certificateTypeFilter}
                    </div>
                  )}
                  {genderFilter && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">
                      Kelamin: {genderFilter}
                    </div>
                  )}
                </div>
              )}
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Memuat data sertifikat...
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Peserta</TableHead>
                      <TableHead>NIK</TableHead>
                      <TableHead>Jenis Kelamin</TableHead>
                      <TableHead>Tanggal Lahir</TableHead>
                      <TableHead>Jenis SIM</TableHead>
                      <TableHead>Golongan SIM</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificateList.length > 0 ? (
                      certificateList.map((certificateItem) => (
                        <TableRow key={certificateItem.id}>
                          {/* ✅ PERBAIKAN: Tampilkan data dengan field database */}
                          <TableCell className="font-medium">
                            {certificateItem.full_name}
                          </TableCell>
                          <TableCell>
                            {certificateItem.nik || "-"}
                          </TableCell>
                          <TableCell>{certificateItem.gender}</TableCell>
                          <TableCell>
                            {certificateItem.birth_date
                              ? format(
                                  new Date(certificateItem.birth_date),
                                  "dd MMMM yyyy",
                                  {
                                    locale: id,
                                  }
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {certificateItem.certificate_type}
                          </TableCell>
                          <TableCell>{certificateItem.license_class}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openUpdateDialog(certificateItem)
                                }
                                title="Edit Sertifikat">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleGenerateCertificateAction(
                                    certificateItem.id
                                  )
                                }
                                title="Generate Sertifikat">
                                <FileTextIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDownloadCertificateAction(
                                    certificateItem.id
                                  )
                                }
                                title="Download Sertifikat">
                                <DownloadIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  openDeleteDialog(certificateItem.id)
                                }
                                title="Hapus Sertifikat">
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500">
                          {searchQuery ||
                          licenseFilter ||
                          certificateTypeFilter ||
                          genderFilter
                            ? "Tidak ada sertifikat yang sesuai dengan kriteria pencarian."
                            : "Belum ada sertifikat yang dibuat."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Halaman {currentPage} dari {totalPages} (Total:{" "}
                      {totalItems} item)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage <= 1}>
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages}>
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            <CardDescription className="mt-4">
              Total: {totalItems} sertifikat
            </CardDescription>
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              Konfirmasi Hapus Sertifikat
            </DialogTitle>
            <DialogDescription className="text-center">
              Apakah Anda yakin ingin menghapus sertifikat ini? Tindakan ini
              tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCertificate}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ PERBAIKAN: Dialog Update Sertifikat dengan field database */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Sertifikat</DialogTitle>
            <DialogDescription>
              Ubah data sertifikat di bawah ini. Klik Simpan saat selesai.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-left">
                Nama
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={updatedFormData.full_name || ""}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nik" className="text-left">
                NIK
              </Label>
              <Input
                id="nik"
                name="nik"
                value={updatedFormData.nik || ""}
                onChange={handleFormChange}
                className="col-span-3"
                maxLength={16}
                pattern="[0-9]{16}"
                placeholder="16 digit angka (opsional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domicile" className="text-left">
                Domisili
              </Label>
              <Input
                id="domicile"
                name="domicile"
                value={updatedFormData.domicile || ""}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="license_class" className="text-left">
                Golongan SIM
              </Label>
              <Select
                value={updatedFormData.license_class}
                onValueChange={(value) =>
                  setUpdatedFormData((prev) => ({
                    ...prev,
                    license_class: value as CertificateData["license_class"],
                  }))
                }>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Golongan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="A Umum">A Umum</SelectItem>
                  <SelectItem value="B1">B1</SelectItem>
                  <SelectItem value="B1 Umum">B1 Umum</SelectItem>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="B2 Umum">B2 Umum</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="C1">C1</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="D1">D1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="certificate_type" className="text-left">
                Jenis Sertifikat
              </Label>
              <Select
                value={updatedFormData.certificate_type}
                onValueChange={(value) =>
                  setUpdatedFormData((prev) => ({
                    ...prev,
                    certificate_type: value as CertificateData["certificate_type"],
                  }))
                }>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baru">Baru</SelectItem>
                  <SelectItem value="Perpanjang">Perpanjang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Input untuk mengunggah foto peserta */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="participant_photo_url" className="text-left">
                Foto Peserta
              </Label>
              <Input
                id="participant_photo_url"
                name="participant_photo_url"
                type="file"
                onChange={handleFileChange}
                className="col-span-3"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              />
            </div>
            {/* Input untuk mengunggah tanda tangan QR */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="signature_qr_url" className="text-left">
                Tanda Tangan QR
              </Label>
              <Input
                id="signature_qr_url"
                name="signature_qr_url"
                type="file"
                onChange={handleFileChange}
                className="col-span-3"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateSubmit}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  );
}