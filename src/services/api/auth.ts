import type { ApiSuccess } from '@/types/api';
import type { AuthResponse, LanguageCode, Role, User } from '@/types/models';
import { apiRequest, clearTokens, setTokens } from './client';

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  language?: LanguageCode;
};

export async function login(input: LoginInput) {
  const result = await apiRequest<ApiSuccess<AuthResponse>>('/auth/login', {
    method: 'POST',
    body: input,
  });
  await setTokens(result.data.accessToken, result.data.refreshToken);
  return result.data;
}

export async function register(input: RegisterInput) {
  const result = await apiRequest<ApiSuccess<AuthResponse>>('/auth/register', {
    method: 'POST',
    body: input,
  });
  await setTokens(result.data.accessToken, result.data.refreshToken);
  return result.data;
}

export async function logout(refreshToken: string) {
  try {
    await apiRequest<ApiSuccess<{ success: boolean }>>('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
    });
  } finally {
    await clearTokens();
  }
}

export async function getMe() {
  const result = await apiRequest<ApiSuccess<User>>('/auth/me', { auth: true });
  return result.data;
}

export async function forgotPassword(email: string) {
  const result = await apiRequest<ApiSuccess<{ message: string }>>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
  return result.data;
}
