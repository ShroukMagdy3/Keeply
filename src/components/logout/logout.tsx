import { logout as logoutApi } from "../../api/auth";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
      localStorage.removeItem("accessToken");
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/signIn");
      toast.success("Logged out");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if the server call fails, still clear the local session so the
      // user isn't stuck "logged in" with a token the server may have revoked.
      localStorage.removeItem("accessToken");
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/signIn");
      toast.error("Logged out (server didn't confirm)");
    }
  };

  return (
    <div>
      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-400 transition-colors px-4 py-2 rounded-lg"
      >
        <LogOut size={20} />
        <span className="text-sm">Logout</span>
      </button>
    </div>
  );
}
