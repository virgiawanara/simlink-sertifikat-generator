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

// Interface for Certificate data structure
interface CertificateData {
  id: number;
  participantFullName: string;
  participantNIK?: string;
  gender: "Laki-laki" | "Perempuan";
  birthPlace: string;
  birthDate: string;
  age: number;
  certificateType: "Perpanjang" | "Buat Baru";
  licenseClass: "A" | "B" | "C";
  domicile: string;
  participantPhotoUrl?: string;
  certificateNumber: string;
  issueDate: string;
  expirationDate?: string;
  certificateFileUrl?: string;
  signatureQrUrl?: string;
  issuedByUserId: number;
  userId?: number;
}

// Interface for form input state
interface CertificateFormData {
  participantFullName: string;
  participantNIK: string;
  gender: "Laki-laki" | "Perempuan" | "";
  birthPlace: string;
  birthDate: Date | undefined;
  age: string;
  certificateType: "Perpanjang" | "Buat Baru" | "";
  licenseClass: "A" | "B" | "C" | "";
  domicile: string;
  participantPhotoUrl: File | null;
  signatureQrUrl: File | null;
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
      for (const key in formData) {
        const typedKey = key as keyof CertificateFormData;
        const value = formData[typedKey];
        if (value !== undefined && value !== null) {
          if (typedKey === "birthDate" && value instanceof Date) {
            requestData.append(typedKey, value.toISOString().split("T")[0]);
          } else if (
            typedKey === "participantPhotoUrl" &&
            value instanceof File
          ) {
            requestData.append(typedKey, value);
          } else if (typedKey === "signatureQrUrl" && value instanceof File) {
            requestData.append(typedKey, value);
          } else {
            requestData.append(typedKey, String(value));
          }
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/certificates`, {
        headers: {
          Accept: "application/json",
        },
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

  const [certificateFormData, setCertificateFormData] =
    useState<CertificateFormData>({
      participantFullName: "",
      participantNIK: "",
      gender: "",
      birthPlace: "",
      birthDate: undefined,
      age: "",
      certificateType: "",
      licenseClass: "",
      domicile: "",
      participantPhotoUrl: null,
      signatureQrUrl: null,
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
      birthDate: selectedDate,
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
        participantPhotoUrl: event.target.files![0],
      }));
    } else {
      setCertificateFormData((previousData) => ({
        ...previousData,
        participantPhotoUrl: null,
      }));
    }
  };

  const handleSignatureImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      setCertificateFormData((previousData) => ({
        ...previousData,
        signatureQrUrl: event.target.files![0],
      }));
    } else {
      setCertificateFormData((previousData) => ({
        ...previousData,
        signatureQrUrl: null,
      }));
    }
  };

  const handleCertificateFormSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsFormLoading(true);

    if (
      !certificateFormData.participantFullName ||
      !certificateFormData.gender ||
      !certificateFormData.birthPlace ||
      !certificateFormData.birthDate ||
      !certificateFormData.age ||
      !certificateFormData.certificateType ||
      !certificateFormData.licenseClass ||
      !certificateFormData.domicile
    ) {
      toast.error("Input Tidak Lengkap", {
        description: "Mohon lengkapi semua data wajib.",
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
        description: `Sertifikat untuk ${newCertificateData.participantFullName} berhasil dibuat!`,
      });
      // Reset form data
      setCertificateFormData({
        participantFullName: "",
        participantNIK: "",
        gender: "",
        birthPlace: "",
        birthDate: undefined,
        age: "",
        certificateType: "",
        licenseClass: "",
        domicile: "",
        participantPhotoUrl: null,
        signatureQrUrl: null,
      });
      // Reset file input
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
                <div className="space-y-2">
                  <Label htmlFor="participantFullName">
                    Nama Lengkap Peserta
                  </Label>
                  <Input
                    id="participantFullName"
                    placeholder="Masukkan nama lengkap"
                    value={certificateFormData.participantFullName}
                    onChange={handleInputFieldChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participantNIK">NIK</Label>
                  <Input
                    id="participantNIK"
                    placeholder="Masukkan NIK (16 digit)"
                    value={certificateFormData.participantNIK}
                    onChange={handleInputFieldChange}
                    maxLength={16}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Jenis Kelamin</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectFieldChange("gender", value)
                    }
                    value={certificateFormData.gender}>
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
                  <Label htmlFor="birthPlace">Tempat Lahir</Label>
                  <Input
                    id="birthPlace"
                    placeholder="Masukkan tempat lahir"
                    value={certificateFormData.birthPlace}
                    onChange={handleInputFieldChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Tanggal Lahir</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal ${
                          !certificateFormData.birthDate &&
                          "text-muted-foreground"
                        }`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {certificateFormData.birthDate ? (
                          format(certificateFormData.birthDate, "PPP", {
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
                        selected={certificateFormData.birthDate}
                        onSelect={handleBirthDateChange}
                        captionLayout="dropdown"
                        initialFocus
                        locale={id}
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
                <div className="space-y-2">
                  <Label htmlFor="certificateType">Jenis SIM</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectFieldChange("certificateType", value)
                    }
                    value={certificateFormData.certificateType}>
                    <SelectTrigger id="certificateType">
                      <SelectValue placeholder="Pilih jenis SIM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Perpanjang">Perpanjang</SelectItem>
                      <SelectItem value="Buat Baru">Buat Baru</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseClass">Golongan SIM</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectFieldChange("licenseClass", value)
                    }
                    value={certificateFormData.licenseClass}>
                    <SelectTrigger id="licenseClass">
                      <SelectValue placeholder="Pilih golongan SIM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-full">
                  <Label htmlFor="domicile">Domisili</Label>
                  <Textarea
                    id="domicile"
                    placeholder="Masukkan alamat domisili lengkap"
                    value={certificateFormData.domicile}
                    onChange={handleInputFieldChange}
                  />
                </div>
                {/* Participant Photo Upload */}
                <div className="space-y-2 col-span-full">
                  <Label htmlFor="participantPhotoUpload">Foto Peserta</Label>
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
                          PNG, JPG (MAX. 800x400px)
                        </p>
                        {certificateFormData.participantPhotoUrl && (
                          <p className="text-xs text-blue-600 mt-1">
                            File terpilih:{" "}
                            {certificateFormData.participantPhotoUrl.name}
                          </p>
                        )}
                      </div>
                      <Input
                        id="participantPhotoUpload"
                        type="file"
                        className="hidden"
                        onChange={handleParticipantPhotoUpload}
                        accept="image/png, image/jpeg"
                      />
                    </Label>
                  </div>
                </div>
                {/* Signature Image Upload */}
                <div className="space-y-2 col-span-full">
                  <Label htmlFor="signatureImageUpload">
                    QR Code Tanda Tangan
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
                          PNG, JPG (MAX. 800x400px)
                        </p>
                        {certificateFormData.signatureQrUrl && (
                          <p className="text-xs text-blue-600 mt-1">
                            File terpilih:{" "}
                            {certificateFormData.signatureQrUrl.name}
                          </p>
                        )}
                      </div>
                      <Input
                        id="signatureImageUpload"
                        type="file"
                        className="hidden"
                        onChange={handleSignatureImageUpload}
                        accept="image/png, image/jpeg"
                      />
                    </Label>
                  </div>
                </div>
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
