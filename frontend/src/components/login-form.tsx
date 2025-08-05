import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Ambil halaman tujuan setelah login (jika ada)
  const from = (location.state as any)?.from || "/dashboard";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login gagal");
      }

      setUser(data.user);
      toast.success("Login Berhasil", {
        description: data.message || "Berhasil masuk ke akun Anda",
      });

      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error("Login Gagal", {
        description: error.message || "Terjadi kesalahan saat login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Toaster position="top-right" />
      <Card>
        <CardHeader>
          <CardTitle>Login ke akun Anda</CardTitle>
          <CardDescription>
            Masukkan email dan kata sandi Anda di bawah untuk masuk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                    Lupa kata sandi?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Belum punya akun?{" "}
              <a href="/signup" className="underline underline-offset-4">
                Daftar
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
