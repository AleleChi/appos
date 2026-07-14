export const API_URL = (import.meta as any).env?.VITE_API_URL || "https://appos.onrender.com";

export const AUTH_ENDPOINTS = {
  googleLogin: `${API_URL}/api/auth/google`,
  googleCallback: `${API_URL}/api/auth/google/callback`,
  signup: `${API_URL}/api/auth/signup`,
  login: `${API_URL}/api/auth/login`,
  me: `${API_URL}/api/auth/me`,
  logout: `${API_URL}/api/auth/logout`,
  forgotPassword: `${API_URL}/api/auth/forgot-password`,
  resetPassword: `${API_URL}/api/auth/reset-password`,
  resendVerification: `${API_URL}/api/auth/resend-verification`,
  linkGoogle: `${API_URL}/api/auth/google/link`
};
