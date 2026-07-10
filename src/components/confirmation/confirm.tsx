import { Mail } from "lucide-react";
import React, { useState, type FormEvent } from "react";
import AuthLayout from "../../layout/authLayout/authLayout";
import type { confirmFormData } from "./confirm.interface";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { confirmEmail } from "../../api/auth";
import confirmValidation from "./confirmValidation";

export default function ConfirmForm() {
  const [inputs, setInput] = useState<confirmFormData>({
    email: "",
    otp: "",
  });

  const [errors, setErrors] = useState<Partial<confirmFormData>>({});
  

  const [touched, setTouched] = useState<{ email: boolean; otp: boolean }>({
    email: false,
    otp: false,
  });

  const navigate = useNavigate();

  const validationErrors = confirmValidation(inputs);
  const isValid = Object.values(validationErrors).every((err) => err === "");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ email: true, otp: true });
    setErrors(validationErrors);
    
    if (isValid) {
      confirmEmail(inputs)
        .then((data) => {
          if (data.message === "Confirmed") {
            toast.success("Account Confirmed!");
            setTimeout(() => {
              navigate("/signIn");
            }, 2000);
          }
        })
        .catch((err) => {

          const msg = err.response?.data?.message || err.message;
          toast.error(
            <div className="flex flex-col items-center">
              <p>{msg}</p>
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
      <h2 className="text-2xl font-bold text-amber-400 mb-6 text-center">
        Confirm your
        <span className="font-signature text-5xl text-amber-500">
          Keeply.
        </span>
        account
      </h2>

      <p className="text-gray-300 mb-6 text-center">
        Please enter the code sent to your email to confirm your account.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <label className="sr-only">Email</label>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Mail className="w-5 h-5" />
          </div>
          <input
            name="email"
            placeholder="Email address"
            type="email"
            value={inputs.email}
            onChange={(e) => setInput({ ...inputs, email: e.target.value })}
            onBlur={() => setTouched({ ...touched, email: true })}
            className="pl-12 w-full bg-gray-700 border border-gray-600 rounded-xl py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        {touched.email && validationErrors.email && (
          <p className="mt-1 text-sm text-red-500 bg-red-100/10 px-2 py-1 rounded">
            {validationErrors.email}
          </p>
        )}

        <input
          type="text"
          placeholder="Confirmation code"
          value={inputs.otp}
          onChange={(e) => setInput({ ...inputs, otp: e.target.value })}
          onBlur={() => setTouched({ ...touched, otp: true })}
          className="w-full bg-gray-700 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {touched.otp && validationErrors.otp && (
          <p className="mt-1 text-sm text-red-500 bg-red-100/10 px-2 py-1 rounded">
            {validationErrors.otp}
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
          Confirm
        </button>
      </form>
    </div>
  </div>
</div>

  );
}
