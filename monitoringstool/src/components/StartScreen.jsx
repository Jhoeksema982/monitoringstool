import React from "react";

const StartScreen = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-teal-800 text-white p-6">
      <div className="max-w-2xl w-full text-center">
        <img src="/src/assets/images/blank.avif" alt="Start" className="w-40 mx-auto mb-6 rounded-lg" />
        <h1 className="text-2xl font-bold mb-4">Hallo! Kies wat voor bezoek dit is</h1>
        <p className="mb-6 text-gray-200">Kies hieronder of het gaat om een regulier bezoek of een ouder-kind dag.</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold"
            onClick={() => onStart('regular')}
          >
            Regulier bezoek
          </button>

          <button
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold"
            onClick={() => onStart('ouder_kind')}
          >
            Ouder-kind dagen
          </button>
        </div>

        <div className="flex gap-8 mt-12 justify-center">
          <img src="/src/assets/images/geel.avif" alt="Gezinsbenadering" className="h-10" />
          <img src="/src/assets/images/groen.avif" alt="Hanze" className="h-10" />
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
