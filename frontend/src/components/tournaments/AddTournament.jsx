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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Add New Tournament</h2>
        <button
          onClick={() => navigate("/tournaments")}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Tournament Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full p-2 border rounded"
            value={tournament.name}
            onChange={(e) =>
              setTournament({ ...tournament, name: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            City
          </label>
          <input
            type="text"
            id="city"
            className="w-full p-2 border rounded"
            value={tournament.city}
            onChange={(e) =>
              setTournament({ ...tournament, city: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium mb-1">
            Year
          </label>
          <input
            type="number"
            id="year"
            className="w-full p-2 border rounded"
            value={tournament.year}
            onChange={(e) =>
              setTournament({ ...tournament, year: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label htmlFor="lexicon" className="block text-sm font-medium mb-1">
            Lexicon
          </label>
          <input
            type="text"
            id="lexicon"
            className="w-full p-2 border rounded"
            value={tournament.lexicon}
            onChange={(e) =>
              setTournament({ ...tournament, lexicon: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label
            htmlFor="longFormName"
            className="block text-sm font-medium mb-1"
          >
            Long Form Name
          </label>
          <input
            type="text"
            id="longFormName"
            className="w-full p-2 border rounded"
            value={tournament.longFormName}
            onChange={(e) =>
              setTournament({ ...tournament, longFormName: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label htmlFor="dataUrl" className="block text-sm font-medium mb-1">
            Data URL
          </label>
          <input
            type="text"
            id="dataUrl"
            className="w-full p-2 border rounded"
            value={tournament.dataUrl}
            onChange={(e) =>
              setTournament({ ...tournament, dataUrl: e.target.value })
            }
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Add Tournament
        </button>
      </form>
    </div>
  );
};

export default AddTournament;
