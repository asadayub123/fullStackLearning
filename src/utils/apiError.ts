import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; title?: string }
      | undefined;
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }
    if (data?.title && typeof data.title === 'string') {
      return data.title;
    }
    if (error.response?.status === 401) {
      return 'Sign in again — session expired or invalid credentials.';
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
