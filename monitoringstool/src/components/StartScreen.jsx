import { useState, useEffect } from "react";
import { Mars, Venus } from "lucide-react";
import { getLocations } from "../constants/locations";

const StartScreen = ({ onStart }) => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getLocations().then(setLocations).catch(() => setLocations([]));
  }, []);

  const getLocGender = (locName) => {
    if (locName === "demo") return "male";
    const found = locations.find(l => l.name === locName);
    return found ? found.gender : "male";
  };

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
    onStart(mode, selectedLocation, ageGroup, getLocGender(selectedLocation));
  };

  const genderIcon = selectedLocation && selectedLocation !== "demo"
    ? (getLocGender(selectedLocation) === "female" ? <Venus className="inline w-4 h-4 text-pink-300" /> : <Mars className="inline w-4 h-4 text-blue-300" />)
    : null;

  return (
    <div className="flex flex-col items-center bg-teal-800 text-white py-24 px-12 overflow-hidden min-h-screen">
      <div className="max-w-2xl w-full text-center">
        <img
          src="/images/groen.avif"
          alt="Start"
          className="w-40 mx-auto mb-6 rounded-lg"
        />

        <h1 className="text-2xl font-bold mb-4">
          Hallo!
        </h1>

        <p className="mb-6 text-gray-200">
          Kies je locatie en leeftijd om te beginnen.
        </p>

        {/* Locatie selectie */}
        <div className="mb-6 relative">
          <button
            onClick={() => setOpen(!open)}
            className={`w-full p-3 rounded-lg font-semibold flex items-center justify-between transition ${
              selectedLocation
                ? "bg-yellow-400 text-teal-900"
                : "bg-teal-600 hover:bg-teal-500 text-white"
            }`}
          >
            <span>{selectedLocation ? <>PI {selectedLocation}{selectedLocation !== "demo" ? <> {getLocGender(selectedLocation) === "female" ? <Venus className="inline w-5 h-5 text-pink-300 ml-1" /> : <Mars className="inline w-5 h-5 text-blue-300 ml-1" />}</> : ""}</> : "-- Kies een PI --"}</span>
            <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {open && (
            <div className="absolute z-10 mt-1 w-full bg-teal-700 rounded-lg shadow-lg max-h-60 overflow-y-auto border border-teal-500">
              <button
                className="w-full text-left px-4 py-2.5 text-white font-semibold hover:bg-teal-600 transition"
                onClick={() => { setSelectedLocation(""); setOpen(false); setError(null); }}
              >-- Kies een PI --</button>
              {locations.map(loc => (
                <button
                  key={loc.name}
                  className={`w-full text-left px-4 py-2.5 font-semibold transition ${selectedLocation === loc.name ? "bg-yellow-400 text-teal-900" : "text-white hover:bg-teal-600"}`}
                  onClick={() => { setSelectedLocation(loc.name); setOpen(false); setError(null); }}
                >PI {loc.name} {loc.gender === "female" ? <Venus className="inline w-4 h-4 text-pink-300" /> : <Mars className="inline w-4 h-4 text-blue-300" />}</button>
              ))}
              <button
                className={`w-full text-left px-4 py-2.5 font-semibold transition ${selectedLocation === "demo" ? "bg-yellow-400 text-teal-900" : "text-white hover:bg-teal-600"}`}
                onClick={() => { setSelectedLocation("demo"); setOpen(false); setError(null); }}
              >Test / Demo (niks opslaan)</button>
            </div>
          )}
          {genderIcon && (
            <p className="text-sm text-gray-300 mt-1">Locatie: {genderIcon}</p>
          )}
        </div>

        {/* Leeftijd selectie */}
        <div className="mb-6">
          <p className="mb-2 text-white font-bold text-lg">Leeftijd</p>
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
              7 t/m 11 jaar
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
              12 jaar en ouder
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-300 mb-4 font-semibold">
            {error}
          </p>
        )}

        <p className="mb-2 text-white font-bold text-lg">Gelegenheid</p>
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
            Ouder-kind dag
          </button>

          <button
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            onClick={() => handleStart("extra_vader_kind")}
          >
            Ander ouder-kind moment
          </button>
        </div>

        <div className="mt-10 flex flex-wrap gap-4 justify-center text-sm">
          <a href="/downloads/snelstartflyer.pdf" className="text-teal-300 hover:text-white underline" target="_blank" rel="noopener noreferrer">Snel-van-start</a>
          <a href="/downloads/handleiding.pdf" className="text-teal-300 hover:text-white underline" target="_blank" rel="noopener noreferrer">Handleiding</a>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;