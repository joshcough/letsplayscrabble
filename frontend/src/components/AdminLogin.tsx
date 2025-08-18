// src/components/AdminLogin.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useApiForm } from "../hooks/useApiForm";
import { ApiService } from "../services/interfaces";
import { FormFeedback } from "./shared";

const AdminLogin: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useApiForm(
    {
      username: "",
      password: "",
    },
    (data) => apiService.login(data),
    {
      onSuccess: (data) => {
        login(data.token);
        navigate("/");
      },
    },
  );

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6 space-y-6 bg-[#FAF1DB] rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#4A3728]">Admin Login</h2>
          <p className="text-sm text-gray-600 mt-2">
            Scrabble Tournament Manager
          </p>
        </div>

        <FormFeedback
          loading={form.loading}
          error={form.error}
          success={form.success}
        />

        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.formData.username}
              onChange={form.handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#4A3728] focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.formData.password}
              onChange={form.handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#4A3728] focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={form.loading}
            className="w-full py-2 px-4 bg-[#4A3728] text-white rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {form.loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
