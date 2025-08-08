// Frontend component yang diperbaiki sesuai spesifikasi database
import React, { useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Base URL for API from environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ✅ Interface menggunakan nama field database
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

// ✅ Interface form menggunakan nama field database
interface CertificateFormData {
  full_name: string;
  nik: string;
  gender: "Laki-laki" | "Perempuan" | "";
  birth_place: string;
  birth_date: Date | undefined;
  age: string;
  certificate_type: "Baru" | "Perpanjang" | "";  // ✅ SESUAI SPESIFIKASI
  license_class: "A" | "A Umum" | "B1" | "B1 Umum" | "B2" | "B2 Umum" | "C" | "C1" | "C2" | "D" | "D1" | "";  // ✅ SESUAI SPESIFIKASI
  domicile: string;
  participant_photo_url: File | null;
  signature_qr_url: File | null;
}

// Updated API hook dengan nama field database
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

  const fetchCertificateList = useCallback(async (): Promise<{
    data: CertificateData[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/api/certificates`, {
      credentials: "include",
    });
    const result = await handleAPIResponse(response);
    return { data: result.data.certificates };
  }, []);

  const createNewCertificate = useCallback(
    async (formData: CertificateFormData): Promise<CertificateData> => {
      const requestData = new FormData();
      
      // ✅ PERBAIKAN: Handle field names sesuai database
      for (const key in formData) {
        const typedKey = key as keyof CertificateFormData;
        const value = formData[typedKey];
        
        if (value !== undefined && value !== null) {
          if (typedKey === "birth_date" && value instanceof Date) {
            requestData.append(typedKey, value.toISOString().split("T")[0]);
          } else if (typedKey === "participant_photo_url" && value instanceof File) {
            requestData.append(typedKey, value);
          } else if (typedKey === "signature_qr_url" && value instanceof File) {
            requestData.append(typedKey, value);
          } else if (typedKey === "nik") {
            // ✅ PERBAIKAN: Only append NIK if it's not empty
            if (value && String(value).trim() !== "") {
              requestData.append(typedKey, String(value));
            }
          } else {
            requestData.append(typedKey, String(value));
          }
        }
      }

      console.log("FormData being sent:");
      for (let [key, value] of requestData.entries()) {
        console.log(key, value);
      }

      const response = await fetch(`${API_BASE_URL}/api/certificates`, {
        method: "POST",
        body: requestData,
        credentials: "include",
      });
      
      const result = await handleAPIResponse(response);
      return result.data.certificate;
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

  return {
    fetchCertificateList,
    createNewCertificate,
    deleteCertificateById,
  };
};

export default function CertificateCreationPage() {
  const { createNewCertificate } = useCertificateAPI();

  const [isFormLoading, setIsFormLoading] = useState<boolean>(false);

  // ✅ PERBAIKAN: State menggunakan nama field database
  const [certificateFormData, setCertificateFormData] =
    useState<CertificateFormData>({
      full_name: "",
      nik: "",
      gender: "",
      birth_place: "",
      birth_date: undefined,
      age: "",
      certificate_type: "",
      license_class: "",
      domicile: "",
      participant_photo_url: null,
      signature_qr_url: null,
    });

  const handleInputFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = event.target;
    setCertificateFormData((previousData) => ({
      ...previousData,
      [id]: value,
    }));
  };

  const handleSelectFieldChange = (
    fieldId: keyof CertificateFormData,
    selectedValue: string
  ) => {
    setCertificateFormData((previousData) => ({
      ...previousData,
      [fieldId]: selectedValue as any,
    }));
  };

  const handleBirthDateChange = (selectedDate: Date | undefined) => {
    setCertificateFormData((previousData) => ({
      ...previousData,
      birth_date: selectedDate,
    }));
    if (selectedDate) {
      const currentDate = new Date();
      const birthDate = new Date(selectedDate);
      let calculatedAge = currentDate.getFullYear() - birthDate.getFullYear();
      const monthDifference = currentDate.getMonth() - birthDate.getMonth();
      if (
        monthDifference < 0 ||
        (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }
      setCertificateFormData((previousData) => ({
        ...previousData,
        age: calculatedAge.toString(),
      }));
    } else {
      setCertificateFormData((previousData) => ({ ...previousData, age: "" }));
    }
  };

  const handleParticipantPhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      setCertificateFormData((previousData) => ({
        ...previousData,
        participant_photo_url: event.target.files![0],
      }));
    } else {
      setCertificateFormData((previousData) => ({
        ...previousData,
        participant_photo_url: null,
      }));
    }
  };

  const handleSignatureImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      setCertificateFormData((previousData) => ({
        ...previousData,
        signature_qr_url: event.target.files![0],
      }));
    } else {
      setCertificateFormData((previousData) => ({
        ...previousData,
        signature_qr_url: null,
      }));
    }
  };

  const handleCertificateFormSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsFormLoading(true);

    // ✅ PERBAIKAN: Validasi termasuk NIK yang sekarang wajib
    if (
      !certificateFormData.full_name ||
      !certificateFormData.nik ||
      !certificateFormData.gender ||
      !certificateFormData.birth_place ||
      !certificateFormData.birth_date ||
      !certificateFormData.age ||
      !certificateFormData.certificate_type ||
      !certificateFormData.license_class ||
      !certificateFormData.domicile
    ) {
      toast.error("Input Tidak Lengkap", {
        description: "Mohon lengkapi semua data wajib termasuk NIK.",
      });
      setIsFormLoading(false);
      return;
    }

    // ✅ PERBAIKAN: Validasi NIK wajib dan format
    if (!certificateFormData.nik || certificateFormData.nik.trim() === "") {
      toast.error("NIK Wajib Diisi", {
        description: "NIK harus diisi dan tidak boleh kosong.",
      });
      setIsFormLoading(false);
      return;
    }

    if (certificateFormData.nik.length !== 16) {
      toast.error("NIK Tidak Valid", {
        description: "NIK harus berupa 16 digit angka.",
      });
      setIsFormLoading(false);
      return;
    }

    if (!/^\d{16}$/.test(certificateFormData.nik)) {
      toast.error("NIK Tidak Valid", {
        description: "NIK harus berupa 16 digit angka.",
      });
      setIsFormLoading(false);
      return;
    }

    console.log("Data Form yang akan dikirim:", certificateFormData);

    try {
      const newCertificateData = await createNewCertificate(
        certificateFormData
      );
      toast.success("Sertifikat Berhasil Dibuat", {
        description: `Sertifikat untuk ${newCertificateData.full_name} berhasil dibuat!`,
      });
      
      // Reset form data
      setCertificateFormData({
        full_name: "",
        nik: "",
        gender: "",
        birth_place: "",
        birth_date: undefined,
        age: "",
        certificate_type: "",
        license_class: "",
        domicile: "",
        participant_photo_url: null,
        signature_qr_url: null,
      });
      
      // Reset file inputs
      const photoUploadElement = document.getElementById(
        "participantPhotoUpload"
      ) as HTMLInputElement;
      if (photoUploadElement) photoUploadElement.value = "";
      const signatureUploadElement = document.getElementById(
        "signatureImageUpload"
      ) as HTMLInputElement;
      if (signatureUploadElement) signatureUploadElement.value = "";
    } catch (error: any) {
      console.error("Error creating certificate:", error);
      toast.error("Gagal Membuat Sertifikat", {
        description: `Terjadi kesalahan: ${error.message}`,
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Selamat Datang di Dashboard 👋
        </h1>

        {/* Certificate Creation Section */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Buat Sertifikat Baru</CardTitle>
            <CardDescription>
              Isi detail di bawah untuk menghasilkan sertifikat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCertificateFormSubmit}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* ✅ PERBAIKAN: Field IDs menggunakan nama database */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Nama Lengkap Peserta *
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="Masukkan nama lengkap"
                    value={certificateFormData.full_name}
                    onChange={handleInputFieldChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nik">NIK *</Label>
                  <Input
                    id="nik"
                    placeholder="Masukkan NIK (16 digit)"
                    value={certificateFormData.nik}
                    onChange={handleInputFieldChange}
                    maxLength={16}
                    pattern="[0-9]{16}"
                    title="NIK harus berupa 16 digit angka"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    NIK wajib diisi dan harus 16 digit angka.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Jenis Kelamin *</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectFieldChange("gender", value)
                    }
                    value={certificateFormData.gender}
                    required>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_place">Tempat Lahir *</Label>
                  <Input
                    id="birth_place"
                    placeholder="Masukkan tempat lahir"
                    value={certificateFormData.birth_place}
                    onChange={handleInputFieldChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Tanggal Lahir *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal ${
                          !certificateFormData.birth_date &&
                          "text-muted-foreground"
                        }`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {certificateFormData.birth_date ? (
                          format(certificateFormData.birth_date, "PPP", {
                            locale: id,
                          })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={certificateFormData.birth_date}
                        onSelect={handleBirthDateChange}
                        captionLayout="dropdown"
                        initialFocus
                        locale={id}
                        fromYear={1940}
                        toYear={new Date().getFullYear() - 17}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Usia</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Usia (otomatis terisi)"
                    value={certificateFormData.age}
                    onChange={handleInputFieldChange}
                    readOnly
                  />
                </div>

                {/* ✅ PERBAIKAN: Certificate Type dengan nilai sesuai spesifikasi */}
                <div className="space-y-2">
                  <Label htmlFor="certificate_type">Jenis SIM *</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectFieldChange("certificate_type", value)
                    }
                    value={certificateFormData.certificate_type}
                    required>
                    <SelectTrigger id="certificate_type">
                      <SelectValue placeholder="Pilih jenis SIM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baru">Baru</SelectItem>
                      <SelectItem value="Perpanjang">Perpanjang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ✅ PERBAIKAN: License Class dengan semua opsi sesuai spesifikasi */}
                <div className="space-y-2">
                  <Label htmlFor="license_class">Golongan SIM *</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectFieldChange("license_class", value)
                    }
                    value={certificateFormData.license_class}
                    required>
                    <SelectTrigger id="license_class">
                      <SelectValue placeholder="Pilih golongan SIM" />
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

                <div className="space-y-2 col-span-full">
                  <Label htmlFor="domicile">Domisili *</Label>
                  <Textarea
                    id="domicile"
                    placeholder="Masukkan alamat domisili lengkap"
                    value={certificateFormData.domicile}
                    onChange={handleInputFieldChange}
                    required
                  />
                </div>

                {/* File upload sections */}
                <div className="space-y-2 col-span-full">
                  <Label htmlFor="participantPhotoUpload">Foto Peserta (Opsional)</Label>
                  <div className="flex items-center justify-center w-full">
                    <Label
                      htmlFor="participantPhotoUpload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4 text-gray-500"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">
                            Klik untuk mengunggah
                          </span>{" "}
                          atau seret dan lepas
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG (MAX. 5MB)
                        </p>
                        {certificateFormData.participant_photo_url && (
                          <p className="text-xs text-blue-600 mt-1">
                            File terpilih:{" "}
                            {certificateFormData.participant_photo_url.name}
                          </p>
                        )}
                      </div>
                      <Input
                        id="participantPhotoUpload"
                        type="file"
                        className="hidden"
                        onChange={handleParticipantPhotoUpload}
                        accept="image/png, image/jpeg, image/jpg"
                      />
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 col-span-full">
                  <Label htmlFor="signatureImageUpload">
                    QR Code Tanda Tangan (Opsional)
                  </Label>
                  <div className="flex items-center justify-center w-full">
                    <Label
                      htmlFor="signatureImageUpload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">
                            Klik untuk mengunggah
                          </span>{" "}
                          atau seret dan lepas
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG (MAX. 5MB)
                        </p>
                        {certificateFormData.signature_qr_url && (
                          <p className="text-xs text-blue-600 mt-1">
                            File terpilih:{" "}
                            {certificateFormData.signature_qr_url.name}
                          </p>
                        )}
                      </div>
                      <Input
                        id="signatureImageUpload"
                        type="file"
                        className="hidden"
                        onChange={handleSignatureImageUpload}
                        accept="image/png, image/jpeg, image/jpg"
                      />
                    </Label>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-600">
                <p>* Field wajib diisi</p>
              </div>

              <Button
                type="submit"
                className="mt-6 w-full"
                disabled={isFormLoading}>
                {isFormLoading ? (
                  <>
                    <PlusIcon className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Membuat...
                  </>
                ) : (
                  <>
                    <PlusIcon className="mr-2 h-4 w-4" /> Buat Sertifikat
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}