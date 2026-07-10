import React, { useState, type FormEvent, type JSX } from "react";
import { User, Key, Mail, Phone, IdCard } from "lucide-react";
import AuthLayout from "../../layout/authLayout/authLayout";
import type { RegisterFormData } from "./register.interface";
import registerValidation from "./registerValidation";
import { signUp } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function RegisterForm(): JSX.Element {
  const [inputs, setInputs] = useState<RegisterFormData>({
    userName: "",
    nid: "",
    email: "",
    password: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [touched, setTouched] = useState<
    Record<keyof RegisterFormData, boolean>
  >({
    userName: false,
    nid: false,
    email: false,
    password: false,
    phone: false,
  });

  const navigate = useNavigate();

  const validationErrors = registerValidation(inputs);
  const isValid = Object.values(validationErrors).every((err) => err === "");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({
      userName: true,
      nid: true,
      email: true,
      password: true,
      phone: true,
    });
    setErrors(validationErrors);

    if (!isValid) return;

    signUp(inputs)
      .then((res) => {
        if (res.message === "Created") {
          toast.success("Account created!", {
            style: {
              background: "#1F2937",
              color: "#F59E0B",
              borderRadius: "12px",
              fontWeight: "bold",
              padding: "14px",
            },
          });
          setTimeout(() => navigate("/confirm"), 900);
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message;
        toast.error(msg, {
          style: {
            background: "#FF6666",
            padding: "20px",
            color: "#000",
            fontWeight: "bold",
            borderRadius: "12px",
          },
        });
      });
  };

  const handleBlur = (field: keyof RegisterFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(registerValidation(inputs));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-3xl bg-gray-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <AuthLayout />

        <div className="p-8 md:p-12">
          <h2 className="text-2xl font-bold text-amber-400 mb-6">
            Create your
            <span className="font-signature text-5xl text-amber-500">
              Keeply.
            </span>
            account
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <User className="w-5 h-5" />
              </div>
              <input
                name="userName"
                type="text"
                placeholder="Username"
                value={inputs.userName}
                onChange={(e) =>
                  setInputs({ ...inputs, userName: e.target.value })
                }
                onBlur={() => handleBlur("userName")}
                className="pl-12 w-full border border-amber-200 rounded-xl py-3 text-white bg-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-amber-500"
              />
                  </div>
              {touched.userName && validationErrors.userName && (
                <p className="mt-1 text-sm text-red-500 bg-red-100/10 px-2 py-1 rounded">
                  {validationErrors.userName}
                </p>
              )}

            <div className="flex flex-col relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <IdCard className="w-5 h-5" />
              </div>
              <input
                name="nid"
                type="text"
                placeholder="National ID (NID)"
                value={inputs.nid}
                onChange={(e) => setInputs({ ...inputs, nid: e.target.value })}
                onBlur={() => handleBlur("nid")}
                className="pl-12 w-full border border-amber-200 rounded-xl py-3 text-white bg-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-amber-500"
              />
              </div>
              {touched.nid && validationErrors.nid && (
                <p className="mt-1 text-sm text-red-500 bg-red-100/10 px-2 py-1 rounded">
                  {validationErrors.nid}
                </p>
              )}

            <div className="flex flex-col relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Mail className="w-5 h-5" />
              </div>
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={inputs.email}
                onChange={(e) =>
                  setInputs({ ...inputs, email: e.target.value })
                }
                onBlur={() => handleBlur("email")}
                className="pl-12 w-full border border-amber-200 rounded-xl py-3 text-white bg-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-amber-500"
              />
              </div>
              {touched.email && validationErrors.email && (
                <p className="mt-1 text-sm text-red-500 bg-red-100/10 px-2 py-1 rounded">
                  {validationErrors.email}
                </p>
              )}

            <div className="flex flex-col relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Phone className="w-5 h-5" />
              </div>
              <input
                name="phone"
                type="tel"
                placeholder="Phone number"
                value={inputs.phone}
                onChange={(e) =>
                  setInputs({ ...inputs, phone: e.target.value })
                }
                onBlur={() => handleBlur("phone")}
                className="pl-12 w-full border border-amber-200 rounded-xl py-3 text-white bg-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-amber-500"
              />
              </div>
              {touched.phone && validationErrors.phone && (
                <p className="mt-1 text-sm text-red-500 bg-red-100/10 px-2 py-1 rounded">
                  {validationErrors.phone}
                </p>
              )}

            <div className="flex flex-col relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Key className="w-5 h-5" />
              </div>
              <input
                name="password"
                type="password"
                placeholder="Create password"
                value={inputs.password}
                onChange={(e) =>
                  setInputs({ ...inputs, password: e.target.value })
                }
                onBlur={() => handleBlur("password")}
                className="pl-12 w-full border border-amber-200 rounded-xl py-3 text-white bg-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-amber-500"
              />
              </div>
              {touched.password && validationErrors.password && (
                <p className="mt-1 text-sm text-red-500 bg-red-100/10 px-2 py-1 rounded">
                  {validationErrors.password}
                </p>
              )}
            <button
              type="submit"
              disabled={!isValid}
              className={`w-full py-3 rounded-xl transition ${
                isValid
                  ? "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                  : "bg-gray-500 text-gray-300 cursor-not-allowed"
              }`}
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
