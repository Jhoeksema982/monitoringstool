import { useState } from "react";

const StartScreen = ({ onStart }) => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [error, setError] = useState(null);

  const handleStart = (mode) => {
    if (!selectedLocation) {
      setError("Selecteer eerst je locatie (PI).");
      return;
    }
    if (!selectedAge) {
      setError("Vertel hoe oud je bent.");
      return;
    }
    setError(null);
    const ageGroup = selectedAge === "ouder" ? "12_plus" : "under_12";
    onStart(mode, selectedLocation, ageGroup);
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
          Hallo! Vertel ons wie je bent
        </h1>

        <p className="mb-6 text-gray-200">
          Kies je locatie en leeftijd om te beginnen.
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

        {/* Leeftijd selectie */}
        <div className="mb-6">
          <p className="mb-2 text-white font-semibold">Hoe oud ben je?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedAge === "jonger"
                  ? "bg-yellow-400 text-teal-900"
                  : "bg-teal-600 hover:bg-teal-500"
              }`}
              onClick={() => {
                setSelectedAge("jonger");
                setError(null);
              }}
            >
              Minder dan 12 jaar
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedAge === "ouder"
                  ? "bg-yellow-400 text-teal-900"
                  : "bg-teal-600 hover:bg-teal-500"
              }`}
              onClick={() => {
                setSelectedAge("ouder");
                setError(null);
              }}
            >
              12 jaar of ouder
            </button>
          </div>
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

          <button
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            onClick={() => handleStart("extra_vader_kind")}
          >
            Extra vader-kindmoment
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;