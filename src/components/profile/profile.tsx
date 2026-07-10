import React, { useEffect, useState, useRef } from "react";
import { Mail, Phone, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import { getProfile, uploadProfileImage, type UserProfile } from "../../api/auth";

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setUser(data.user);
        setImageUrl(data.user.image || "/images/avatar.jpg");
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Couldn't load your profile");
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await uploadProfileImage(file);
      if (data?.user?.image) {
        setImageUrl(`${data.user.image}?t=${Date.now()}`);
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => fileInputRef.current?.click();

  if (!user)
    return (
      <div className="flex justify-center items-center h-full min-h-[200px]">
        <ClipLoader size={50} color="#fbbf24" />
      </div>
    );

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen justify-center bg-gray-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="flex w-full max-w-4xl flex-col items-center gap-6 rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-xl shadow-black/20 sm:p-8 md:flex-row md:items-start">
        <div className="flex flex-col items-center md:w-1/3 border-b md:border-b-0 md:border-r border-amber-500 pb-6 md:pb-0 md:pr-6">
          <img
            src={imageUrl}
            alt="User"
            className="w-36 h-36 rounded-full border-4 border-amber-400 object-cover shadow-md"
          />
          <h2 className="text-2xl font-bold font-signature text-amber-400 mt-4">{user.userName}</h2>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={handleButtonClick}
            className="mt-3 flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-gray-900 shadow transition hover:bg-amber-500"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Change Profile"}
          </button>
        </div>

        <div className="mt-6 w-full space-y-4 md:mt-0 md:w-2/3">
          <InfoItem icon={<Mail size={18} />} text={user.email} />
          <InfoItem icon={<Phone size={18} />} text={user.phone} />
          <InfoItem icon={<span className="font-semibold">NID:</span>} text={user.nid} />
          <InfoItem icon={<Calendar size={18} />} text={`Joined: ${joinedDate}`} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-800 p-3 text-white shadow transition hover:shadow-lg">
      <div className="text-amber-400">{icon}</div>
      <p className="break-all text-sm font-medium">{text}</p>
    </div>
  );
}
