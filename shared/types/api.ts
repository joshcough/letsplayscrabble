// shared/types/api.ts

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const success = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data
});

export const failure = <T = never>(error: string): ApiResponse<T> => ({
  success: false,
  error
});