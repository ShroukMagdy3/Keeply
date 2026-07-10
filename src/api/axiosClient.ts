import axios from "axios";

// Every backend call in the app goes through this single client so that:
// 1) the base URL lives in one place (VITE_API_URL), and
// 2) the Authorization header is always attached the same way, with the
//    same "Bearer" prefix the backend's .env (BEARER_USER) expects.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request comes back 401 (expired/invalid session), clear the stale
// token so the UI doesn't keep retrying with a dead token.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("accessToken");
    }
    return Promise.reject(err);
  }
);

export default api;
