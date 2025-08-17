// src/components/tournaments/AddTournament.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

import { useApiForm } from "../../hooks/useApiForm";
import { ApiService } from "../../services/interfaces";
import { ProtectedPage } from "../ProtectedPage";
import { FormFeedback } from "../shared";

const AddTournament: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const navigate = useNavigate();

  const form = useApiForm(
    {
      name: "",
      city: "",
      year: 2025,
      lexicon: "",
      longFormName: "",
      dataUrl: "",
    },
    (data) => apiService.createTournament(data),
    {
      onSuccess: () => navigate("/tournaments/manager"),
      successMessage: "Tournament created successfully!",
    },
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    form.setFormData((prev) => ({
      ...prev,
      [id]: id === "year" ? Number(value) || 0 : value,
    }));
  };

  return (
    <ProtectedPage>
      <div className="bg-[#FAF1DB] p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#4A3728]">
            Add New Tournament
          </h2>
        </div>

        <FormFeedback
          loading={form.loading}
          error={form.error}
          success={form.success}
        />

        <form onSubmit={form.handleSubmit} className="space-y-4">
          {(
            Object.keys(form.formData) as Array<keyof typeof form.formData>
          ).map((key) => (
            <div key={key}>
              <label
                htmlFor={key}
                className="block text-[#4A3728] font-medium mb-1"
              >
                {key === "longFormName"
                  ? "Display Name"
                  : key === "dataUrl"
                    ? "Data URL"
                    : key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                type={key === "year" ? "number" : "text"}
                id={key}
                className="w-full p-2 border-2 border-[#4A3728]/20 rounded
                       bg-[#FFF8E7] text-[#4A3728]
                       focus:ring-2 focus:ring-[#4A3728]/30 focus:border-[#4A3728]
                       outline-none transition-colors"
                value={form.formData[key]}
                onChange={handleInputChange}
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={form.loading}
            className="w-full bg-[#4A3728] text-[#FAF1DB] py-2 px-4 rounded
                   hover:bg-[#6B5744] transition-colors shadow-md
                   border-2 border-[#4A3728] mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {form.loading ? "Adding Tournament..." : "Add Tournament"}
          </button>
        </form>
      </div>
    </ProtectedPage>
  );
};

export default AddTournament;
