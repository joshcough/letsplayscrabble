import { useState, useCallback, FormEvent } from "react";

import { ApiResponse } from "../config/api";
import { useApiMutation } from "./useApiMutation";

interface UseApiFormOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string | ((data: T) => string);
  resetOnSuccess?: boolean;
}

interface UseApiFormReturn<T, FormData> {
  // Form state
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;

  // API state
  loading: boolean;
  error: string | null;
  success: string | null;

  // Actions
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  reset: () => void;
}

/**
 * Hook that combines form state management with API calls
 * Perfect for forms that submit data to an API
 *
 * @example
 * const form = useApiForm(
 *   { name: "", email: "" },
 *   (data) => apiService.createUser(data),
 *   {
 *     onSuccess: () => navigate("/users"),
 *     successMessage: "User created!",
 *     resetOnSuccess: true
 *   }
 * );
 *
 * return (
 *   <form onSubmit={form.handleSubmit}>
 *     <input name="name" value={form.formData.name} onChange={form.handleChange} />
 *     <FormFeedback loading={form.loading} error={form.error} success={form.success} />
 *     <button type="submit" disabled={form.loading}>Submit</button>
 *   </form>
 * );
 */
export function useApiForm<T, FormData extends Record<string, any>>(
  initialData: FormData,
  submitFn: (data: FormData) => Promise<ApiResponse<T>>,
  options: UseApiFormOptions<T> = {},
): UseApiFormReturn<T, FormData> {
  const [formData, setFormData] = useState<FormData>(initialData);

  const mutation = useApiMutation(submitFn, {
    onSuccess: (data) => {
      if (options.resetOnSuccess) {
        setFormData(initialData);
      }
      options.onSuccess?.(data);
    },
    onError: options.onError,
    successMessage: options.successMessage,
  });

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await mutation.mutate(formData);
    },
    [formData, mutation],
  );

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;

      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    },
    [],
  );

  const reset = useCallback(() => {
    setFormData(initialData);
    mutation.reset();
  }, [initialData, mutation]);

  return {
    formData,
    setFormData,
    loading: mutation.loading,
    error: mutation.error,
    success: mutation.success,
    handleSubmit,
    handleChange,
    reset,
  };
}
