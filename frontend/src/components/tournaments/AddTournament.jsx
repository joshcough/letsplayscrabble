// src/components/tournaments/AddTournament.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/api";

const AddTournament = () => {
  const navigate = useNavigate();
  const [tournament, setTournament] = useState({
    name: "",
    city: "",
    year: "",
    lexicon: "",
    longFormName: "",
    dataUrl: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Sending tournament data:", tournament);
    try {
      const response = await fetch(`${API_BASE}/api/tournaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tournament),
      });
      if (response.ok) {
        navigate("/tournaments");
      }
    } catch (error) {
      console.error("Error adding tournament:", error);
    }
  };

  return (
    <div className="bg-[#FAF1DB] p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#4A3728]">
          Add New Tournament
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.entries(tournament).map(([key, value]) => (
          <div key={key}>
            <label
              htmlFor={key}
              className="block text-[#4A3728] font-medium mb-1"
            >
              {key === "longFormName"
                ? "Long Form Name"
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
              value={value}
              onChange={(e) =>
                setTournament({ ...tournament, [key]: e.target.value })
              }
              required
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-[#4A3728] text-[#FAF1DB] py-2 px-4 rounded
                   hover:bg-[#6B5744] transition-colors shadow-md
                   border-2 border-[#4A3728] mt-6"
        >
          Add Tournament
        </button>
      </form>
    </div>
  );
};

export default AddTournament;
