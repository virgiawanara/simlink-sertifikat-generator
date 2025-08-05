import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const user = null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <img
        alt="404 not found"
        className="w-100 mb-2"
        src="https://img.freepik.com/free-vector/404-error-with-portals-concept-illustration_114360-7880.jpg?ga=GA1.1.2144075707.1750062985&semt=ais_hybrid&w=740"
      />
      <p className="text-lg text-muted-foreground mb-6">
        Halaman yang kamu cari tidak ditemukan.
      </p>
      <Button
        className="bg-indigo-800 text-white hover:bg-indigo-900"
        onClick={() => {
          setTimeout(() => {
            if (user) {
              navigate(-1);
            } else {
              navigate("/login");
            }
          }, 500);
        }}>
        Kembali
      </Button>
    </div>
  );
}
