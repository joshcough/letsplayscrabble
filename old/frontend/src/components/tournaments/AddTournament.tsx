// src/components/tournaments/AddTournament.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

import { useApiForm } from "../../hooks/useApiForm";
import { ApiService } from "../../services/interfaces";
import { ProtectedPage } from "../ProtectedPage";
import { FormFeedback } from "../shared";
import { useThemeContext } from "../../context/ThemeContext";
import { themes } from "../../config/themes";
import { ThemeName } from "../../types/theme";

const AddTournament: React.FC<{ apiService: ApiService }> = ({
  apiService,
}) => {
  const navigate = useNavigate();
  const { theme } = useThemeContext();

  const form = useApiForm(
    {
      name: "",
      city: "",
      year: 2025,
      lexicon: "",
      longFormName: "",
      dataUrl: "",
      theme: "scrabble" as ThemeName, // Default to scrabble theme
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

  const handleThemeChange = (selectedTheme: ThemeName) => {
    form.setFormData((prev) => ({
      ...prev,
      theme: selectedTheme,
    }));
  };

  return (
    <ProtectedPage>
      <div className={`${theme.colors.cardBackground} p-6 rounded-lg shadow-md`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme.colors.textPrimary}`}>
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
            Object.keys(form.formData).filter(key => key !== 'theme') as Array<keyof Omit<typeof form.formData, 'theme'>>
          ).map((key) => (
            <div key={key}>
              <label
                htmlFor={key}
                className={`block ${theme.colors.textPrimary} font-medium mb-1`}
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
                className={`w-full p-2 border-2 ${theme.colors.secondaryBorder} rounded
                       ${theme.colors.cardBackground} ${theme.colors.textPrimary}
                       focus:ring-2 ${theme.colors.ringColor} focus:${theme.colors.primaryBorder}
                       outline-none transition-colors`}
                value={form.formData[key]}
                onChange={handleInputChange}
                required
              />
            </div>
          ))}
          
          {/* Theme Selection */}
          <div>
            <label className={`block ${theme.colors.textPrimary} font-medium mb-3`}>
              Tournament Theme
            </label>
            <p className={`${theme.colors.textSecondary} text-sm mb-4`}>
              Choose the theme that will be used for this tournament's overlays
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(themes).map((themeOption) => (
                <div
                  key={themeOption.name}
                  className={`
                    border-2 rounded-lg p-3 cursor-pointer transition-all duration-200
                    ${form.formData.theme === themeOption.name
                      ? `${theme.colors.primaryBorder} bg-blue-50`
                      : `${theme.colors.secondaryBorder} ${theme.colors.cardBackground} ${theme.colors.hoverBackground}`
                    }
                    ${form.loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !form.loading && handleThemeChange(themeOption.name as ThemeName)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-medium ${theme.colors.textPrimary}`}>{themeOption.displayName}</h4>
                    {form.formData.theme === themeOption.name && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Mini Theme Preview */}
                  <div className="h-12 rounded border overflow-hidden">
                    <div className={`h-full ${themeOption.colors.pageBackground} relative`}>
                      <div className={`absolute inset-1 ${themeOption.colors.cardBackground} rounded border ${themeOption.colors.primaryBorder}`}>
                        <div className={`absolute top-0.5 left-0.5 right-0.5 h-1 ${themeOption.colors.titleGradient} rounded-sm`}></div>
                        <div className={`absolute bottom-0.5 left-0.5 w-6 h-1 ${themeOption.colors.positiveColor} rounded-sm`}></div>
                        <div className={`absolute bottom-0.5 right-0.5 w-4 h-1 ${themeOption.colors.negativeColor} rounded-sm`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={form.loading}
            className={`w-full ${theme.colors.cardBackground} ${theme.colors.textPrimary} py-2 px-4 rounded
                   ${theme.colors.hoverBackground} transition-colors ${theme.colors.shadowColor} shadow-md
                   border-2 ${theme.colors.primaryBorder} mt-6 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {form.loading ? "Adding Tournament..." : "Add Tournament"}
          </button>
        </form>
      </div>
    </ProtectedPage>
  );
};

export default AddTournament;
