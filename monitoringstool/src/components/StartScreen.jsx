import { useState } from "react";

const StartScreen = ({ onStart }) => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [error, setError] = useState(null);

  const handleStart = (mode) => {
    if (!selectedLocation) {
      setError("Selecteer eerst je locatie (PI).");
      return;
    }
    setError(null);
    onStart(mode, selectedLocation);
  };

  return (
    <div className="flex flex-col items-center bg-teal-800 text-white py-24 px-12 overflow-hidden min-h-screen">
      <div className="max-w-2xl w-full text-center">
        <img
          src="/images/groen.avif"
          alt="Start"
          className="w-40 mx-auto mb-6 rounded-lg"
        />

        <h1 className="text-2xl font-bold mb-4">
          Hallo! Kies wat voor bezoek dit is
        </h1>

        <p className="mb-6 text-gray-200">
          Kies je locatie en het type bezoek om te beginnen.
        </p>

        {/* Locatie selectie */}
        <div className="mb-6">
          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              if (e.target.value) setError(null);
            }}
            className="w-full p-3 rounded-lg text-gray-800 font-semibold"
          >
            <option value="">-- Kies een PI --</option>
            <option value="Zaanstad">PI Zaanstad</option>
            <option value="Veenhuizen">PI Veenhuizen</option>
            <option value="Almelo">PI Almelo</option>
          </select>
        </div>

        {error && (
          <p className="text-red-300 mb-4 font-semibold">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            onClick={() => handleStart("regular")}
          >
            Regulier bezoek
          </button>

          <button
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            onClick={() => handleStart("ouder_kind")}
          >
            Ouder-kind dagen
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
