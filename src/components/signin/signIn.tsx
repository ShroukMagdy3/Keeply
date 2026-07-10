import { Key, Mail } from "lucide-react";
import React, { useState, type FormEvent } from "react";
import AuthLayout from "../../layout/authLayout/authLayout";
import type { signInFormData } from "./signin.interface";
import signInvalidation from "./signInValidation";
import toast from "react-hot-toast";
import { signIn } from "../../api/auth";
import { useNavigate } from "react-router-dom";

export default function SignInForm() {
  const [inputs, setInputs] = useState<signInFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<signInFormData>>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const navigate = useNavigate();

  const validationErrors = signInvalidation(inputs);
  const isValid = Object.values(validationErrors).every((err) => err === "");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setErrors(validationErrors);

    if (isValid) {
      signIn(inputs)
        .then((data) => {
          if (data.message === "success") {
            toast.success("Welcome To Keeply!");
            localStorage.setItem("accessToken", data.tokens.accessToken);
            window.dispatchEvent(new Event("auth-changed"));
            navigate("/profile");
          }
        })
        .catch((err) => {
          const msg = err.response?.data?.message || err.message;
          toast.error(
            <div className="flex flex-col items-center">
              <p>{String(msg)}</p>
              <h1 className="font-signature text-white mt-2">Keeply</h1>
            </div>
          );
        });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="w-full max-w-3xl bg-gray-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <AuthLayout />
        <div className="w-full max-w-md bg-gray-800 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-amber-500 mb-6 text-center">
            SignIn to your{" "}
            <span className="font-signature text-4xl text-amber-600">Keeply</span>{" "}
            account
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <label className="sr-only">Email</label>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={inputs.email}
                onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
                onBlur={() => setTouched({ ...touched, email: true })}
                className="pl-12 w-full bg-gray-700 border border-gray-600 rounded-xl py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            {touched.email && validationErrors.email && (
              <p className="mt-1 text-sm text-red-500 bg-red-100/10 px-2 py-1 rounded">
                {validationErrors.email}
              </p>
            )}

            <div className="relative">
              <label className="sr-only">Password</label>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Key className="w-5 h-5" />
              </div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={inputs.password}
                onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
                onBlur={() => setTouched({ ...touched, password: true })}
                className="pl-12 w-full bg-gray-700 border border-gray-600 rounded-xl py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
              className={`w-full py-2 rounded-lg font-semibold transition ${
                isValid
                  ? "bg-amber-500 hover:bg-amber-600 text-gray-900 cursor-pointer"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              SignIn
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
