export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function failure<T>(error: string): ApiResponse<T> {
  return { success: false, error };
}