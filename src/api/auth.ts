import api from "./axiosClient";
import type { RegisterFormData } from "../components/register/register.interface";
import type { signInFormData } from "../components/signin/signin.interface";
import type { confirmFormData } from "../components/confirmation/confirm.interface";

export interface UserProfile {
  userName: string;
  email: string;
  phone: string;
  nid: string;
  image?: string | null;
  createdAt: string;
}

export const signUp = async (inputs: RegisterFormData) => {
  const { data } = await api.post("/api/v1/users/signUp", inputs);
  return data;
};

export const confirmEmail = async (inputs: confirmFormData) => {
  const { data } = await api.post("/api/v1/users/confirmEmail", inputs);
  return data;
};

export const signIn = async (inputs: signInFormData) => {
  const { data } = await api.post("/api/v1/users/signIn", inputs);
  return data as { message: string; tokens: { accessToken: string; refresh_token: string } };
};

export const getProfile = async () => {
  const { data } = await api.get("/api/v1/users/getProfile");
  return data as { message: string; user: UserProfile };
};

export const uploadProfileImage = async (file: File) => {
  const form = new FormData();
  form.append("attachment", file);
  const { data } = await api.post("/api/v1/users/uploadProfile", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const logout = async () => {
  const { data } = await api.post("/api/v1/users/logout", {});
  return data;
};
