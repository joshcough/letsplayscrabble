// src/components/AdminLogin.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/api";

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginUser(formData);
      login(data.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6 space-y-6 bg-[#FAF1DB] rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#4A3728]">Admin Login</h2>
          <p className="text-sm text-gray-600 mt-2">
            Scrabble Tournament Manager
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#4A3728] focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full p-2 border rounded focus:ring-2 focus:ring-[#4A3728] focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#4A3728] text-white rounded hover:bg-opacity-90 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
